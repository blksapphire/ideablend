// End-to-end API smoke test. Requires a running API pointed at a throwaway
// database (NODE_ENV=test so password-reset links are returned for checking):
//   SMOKE_BASE=http://127.0.0.1:4100/api node scripts/smoke.mjs
// Exits non-zero on the first suite with failures. Not part of `npm test`
// because it needs a live server and a real database.
import assert from 'node:assert/strict';

const BASE = process.env.SMOKE_BASE || 'http://127.0.0.1:4100/api';
const stamp = Date.now();
const A = { email: `alice+${stamp}@test.local`, password: 'password123' };
const B = { email: `bob+${stamp}@test.local`, password: 'password123' };

async function req(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data, headers: res.headers };
}

const results = [];
function ok(name, fn) {
  return Promise.resolve().then(fn).then(() => results.push(['PASS', name])).catch(err => {
    results.push(['FAIL', name + ' :: ' + err.message]);
  });
}

let aToken, bToken, projectId, roleId, appId, resetToken;

await ok('health responds', async () => {
  const r = await req('GET', '/health');
  assert.equal(r.status, 200);
  assert.equal(r.data.ok, true);
  assert.ok(r.headers.get('ratelimit'), 'rate limit header present');
});

await ok('register two users', async () => {
  const a = await req('POST', '/auth/register', { body: A });
  assert.equal(a.status, 200, JSON.stringify(a.data));
  aToken = a.data.token;
  const b = await req('POST', '/auth/register', { body: B });
  assert.equal(b.status, 200, JSON.stringify(b.data));
  bToken = b.data.token;
});

await ok('register rejects javascript url', async () => {
  const r = await req('POST', '/auth/register', { body: { email: `x+${stamp}@test.local`, password: 'password123', githubUrl: 'javascript:alert(1)' } });
  assert.equal(r.status, 400);
});

await ok('email is normalized (uppercase login works)', async () => {
  const r = await req('POST', '/auth/login', { body: { email: A.email.toUpperCase(), password: A.password } });
  assert.equal(r.status, 200, JSON.stringify(r.data));
});

await ok('create project with a role', async () => {
  const r = await req('POST', '/projects', {
    token: aToken,
    body: {
      title: 'Smoke Project ' + stamp,
      description: 'Testing the full flow',
      stage: 'MVP',
      type: 'SIDE_PROJECT',
      roles: [{ name: 'Backend dev', slots: 1, skills: [{ name: 'Node ' + stamp, level: 3 }] }]
    }
  });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  projectId = r.data.id;
  roleId = r.data.roles[0].id;
  assert.ok(projectId && roleId);
});

await ok('guest sees public project without tasks', async () => {
  const r = await req('GET', `/projects/${projectId}`);
  assert.equal(r.status, 200);
  assert.equal(r.data.viewer.isMember, false);
  assert.equal('tasks' in r.data, false);
});

await ok('invalid browse filter is a 400', async () => {
  const r = await req('GET', '/projects?status=BOGUS');
  assert.equal(r.status, 400);
});

await ok('seeded project appears in browse', async () => {
  const r = await req('GET', '/projects?status=');
  assert.equal(r.status, 200);
  assert.ok(r.data.projects.some(p => p.id === projectId));
});

await ok('second user applies', async () => {
  const r = await req('POST', `/projects/${projectId}/roles/${roleId}/apply`, { token: bToken, body: { message: 'hi' } });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  appId = r.data.id;
});

await ok('owner sees applicant email', async () => {
  const r = await req('GET', `/projects/${projectId}/applications`, { token: aToken });
  assert.equal(r.status, 200);
  assert.equal(r.data[0].user.email, B.email);
});

await ok('owner accepts, applicant confirms', async () => {
  let r = await req('POST', `/applications/${appId}/accept`, { token: aToken });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  r = await req('POST', `/applications/${appId}/confirm`, { token: bToken });
  assert.equal(r.status, 200, JSON.stringify(r.data));
});

await ok('new member sees tasks in project detail', async () => {
  const r = await req('GET', `/projects/${projectId}`, { token: bToken });
  assert.equal(r.status, 200);
  assert.equal(r.data.viewer.isMember, true);
  assert.ok(Array.isArray(r.data.tasks));
});

await ok('member can read messages', async () => {
  const r = await req('GET', `/projects/${projectId}/messages`, { token: bToken });
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.data));
});

await ok('avatar upload is stored and publicly served', async () => {
  const form = new FormData();
  form.append('avatar', new Blob([Buffer.from('fake-png-bytes')], { type: 'image/png' }), 'me.png');
  const res = await fetch(`${BASE}/users/me/avatar`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${bToken}` },
    body: form
  });
  const data = await res.json();
  assert.equal(res.status, 200, JSON.stringify(data));
  assert.match(data.profilePic, /^\/avatars\/[a-f0-9]{32}\.png$/);
  const img = await fetch(BASE.replace(/\/api$/, '') + data.profilePic);
  assert.equal(img.status, 200);
  assert.equal(img.headers.get('content-type'), 'image/png');
});

await ok('project file upload/download/delete round-trips', async () => {
  const form = new FormData();
  form.append('file', new Blob([Buffer.from('hello spec')], { type: 'text/plain' }), 'spec.txt');
  const up = await fetch(`${BASE}/projects/${projectId}/files`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${bToken}` },
    body: form
  });
  const record = await up.json();
  assert.equal(up.status, 200, JSON.stringify(record));

  const down = await fetch(`${BASE}/files/${record.id}/download`, { headers: { Authorization: `Bearer ${bToken}` } });
  assert.equal(down.status, 200);
  assert.equal(await down.text(), 'hello spec');
  assert.match(down.headers.get('content-disposition') || '', /spec\.txt/);

  const del = await fetch(`${BASE}/files/${record.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${bToken}` } });
  assert.equal(del.status, 200);
});

await ok('agent conversation works, generation 503s without key', async () => {
  const c = await req('POST', '/agent/conversations', { token: aToken, body: {} });
  assert.equal(c.status, 200, JSON.stringify(c.data));
  const m = await req('POST', `/agent/conversations/${c.data.id}/messages`, { token: aToken, body: { content: 'hello' } });
  assert.equal(m.status, 503);
});

await ok('private project hidden from guests, visible to member', async () => {
  let r = await req('PATCH', `/projects/${projectId}`, { token: aToken, body: { visibility: 'PRIVATE' } });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  r = await req('GET', `/projects/${projectId}`);
  assert.equal(r.status, 404);
  r = await req('GET', `/projects/${projectId}`, { token: bToken });
  assert.equal(r.status, 200);
  const browse = await req('GET', '/projects');
  assert.ok(!browse.data.projects.some(p => p.id === projectId));
});

await ok('javascript repoUrl rejected', async () => {
  const r = await req('PATCH', `/projects/${projectId}`, { token: aToken, body: { repoUrl: 'javascript:alert(1)' } });
  assert.equal(r.status, 400);
});

await ok('invalid visibility rejected', async () => {
  const r = await req('PATCH', `/projects/${projectId}`, { token: aToken, body: { visibility: 'SECRET' } });
  assert.equal(r.status, 400);
});

await ok('password reset flow (dev link)', async () => {
  const r = await req('POST', '/auth/forgot-password', { body: { email: A.email } });
  assert.equal(r.status, 200);
  resetToken = new URL(r.data.devModeResetLink).searchParams.get('token');
  assert.ok(resetToken, 'reset token present in test env');
  const reset = await req('POST', '/auth/reset-password', { body: { token: resetToken, newPassword: 'newpassword123' } });
  assert.equal(reset.status, 200, JSON.stringify(reset.data));
  const login = await req('POST', '/auth/login', { body: { email: A.email, password: 'newpassword123' } });
  assert.equal(login.status, 200, JSON.stringify(login.data));
  const replay = await req('POST', '/auth/reset-password', { body: { token: resetToken, newPassword: 'anotherpass123' } });
  assert.equal(replay.status, 400, 'token must be single-use');
});

await ok('unauthenticated dashboard is 401', async () => {
  const r = await req('GET', '/projects/mine');
  assert.equal(r.status, 401);
});

await ok('disallowed CORS origin gets no allow header', async () => {
  const res = await fetch(BASE + '/health', { headers: { Origin: 'https://evil.example.com' } });
  assert.equal(res.headers.get('access-control-allow-origin'), null);
});

for (const [state, name] of results) console.log(state, name);
const failed = results.filter(([s]) => s === 'FAIL');
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
