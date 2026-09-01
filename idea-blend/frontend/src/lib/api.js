const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:4000/api').replace(/\/+$/, '');

function authHeaders() {
  const token = localStorage.getItem('ib_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle(res) {
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    // token missing/expired/invalid - clear the stale session so the UI
    // reflects reality instead of showing "logged in" while every call fails.
    // AuthContext listens for this event to update its state.
    localStorage.removeItem('ib_token');
    localStorage.removeItem('ib_user');
    window.dispatchEvent(new Event('ib:session-expired'));
  }
  if (!res.ok) throw new Error(data.error || `request failed (${res.status})`);
  return data;
}

export async function get(path) {
  const res = await fetch(API_BASE + path, { headers: { ...authHeaders() } });
  return handle(res);
}

export async function post(path, body) {
  const res = await fetch(API_BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body)
  });
  return handle(res);
}

export async function patch(path, body) {
  const res = await fetch(API_BASE + path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body)
  });
  return handle(res);
}

export async function del(path) {
  const res = await fetch(API_BASE + path, { method: 'DELETE', headers: { ...authHeaders() } });
  return handle(res);
}

// for multipart file uploads - deliberately does NOT set Content-Type,
// since the browser needs to generate the multipart boundary itself; setting
// it manually here would produce a malformed request the server can't parse
export async function uploadFile(path, file, fieldName = 'file') {
  const formData = new FormData();
  formData.append(fieldName, file);
  const res = await fetch(API_BASE + path, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: formData
  });
  return handle(res);
}

// GET /files/:id/download is auth-protected, so a plain <a href> link can't
// work (no way to attach the Authorization header) - this fetches the file
// as a blob instead and triggers the browser's normal save behavior
export async function downloadFile(path, filename) {
  const res = await fetch(API_BASE + path, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error('download failed');
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

// profilePic is stored as a server-relative path like "/avatars/xyz.png" -
// this resolves it against the API server's origin (not API_BASE, which
// includes the /api suffix avatars aren't served under)
export function avatarUrl(profilePic) {
  if (!profilePic) return null;
  if (profilePic.startsWith('http')) return profilePic;
  return API_BASE.replace(/\/api\/?$/, '') + profilePic;
}

export { API_BASE };
