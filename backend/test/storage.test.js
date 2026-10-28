const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const storage = require('../src/lib/storage');

test('local storage: avatars are written, returned as /avatars URLs, and deletable', async () => {
  const saved = await storage.saveAvatar(Buffer.from('fake-image'), '.png', 'image/png');
  assert.match(saved.url, /^\/avatars\/[a-f0-9]{32}\.png$/);

  const filePath = path.join(storage.AVATAR_DIR, saved.key);
  assert.equal(await fs.promises.readFile(filePath, 'utf8'), 'fake-image');

  await storage.deleteAvatar(saved.url);
  await new Promise(r => setTimeout(r, 20));
  assert.equal(fs.existsSync(filePath), false);
});

test('local storage: project files round-trip and delete', async () => {
  const key = await storage.saveProjectFile(Buffer.from('spec contents'), 'design spec.pdf', 'application/pdf');
  assert.match(key, /^[a-f0-9]{32}\.pdf$/);

  const { stream } = await storage.openProjectFile(key);
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  assert.equal(Buffer.concat(chunks).toString(), 'spec contents');

  await storage.deleteProjectFile(key);
  await new Promise(r => setTimeout(r, 20));
  await assert.rejects(storage.openProjectFile(key), err => err.status === 404);
});

test('local storage: original filename extension is sanitized', async () => {
  const key = await storage.saveProjectFile(Buffer.from('x'), 'evil.html.exe', 'application/octet-stream');
  assert.match(key, /^[a-f0-9]{32}\.exe$/);
  await storage.deleteProjectFile(key);
});
