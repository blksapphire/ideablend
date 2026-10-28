const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { Readable } = require('stream');

// Uploaded files live either on local disk (development) or in Supabase
// Storage (production). The free hosting tier has an ephemeral filesystem,
// so anything written to disk disappears on the next deploy or restart.
// Configure SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY to switch to remote.
const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const AVATAR_BUCKET = process.env.SUPABASE_AVATAR_BUCKET || 'avatars';
const FILE_BUCKET = process.env.SUPABASE_FILE_BUCKET || 'project-files';

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
const AVATAR_DIR = path.join(UPLOAD_DIR, 'avatars');

const remote = Boolean(SUPABASE_URL && SUPABASE_KEY);

function isRemote() {
  return remote;
}

function randomName(ext) {
  return crypto.randomBytes(16).toString('hex') + ext;
}

async function storageRequest(bucket, key, init = {}) {
  const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${encodeURIComponent(key)}`;
  const headers = {
    Authorization: `Bearer ${SUPABASE_KEY}`,
    apikey: SUPABASE_KEY,
    ...(init.headers || {})
  };
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    const err = new Error(`storage request failed (${res.status})`);
    if (res.status === 404) err.status = 404;
    console.error(`[storage] ${init.method || 'GET'} ${bucket}/${key} -> ${res.status} ${detail.slice(0, 200)}`);
    throw err;
  }
  return res;
}

function avatarPublicUrl(key) {
  return `${SUPABASE_URL}/storage/v1/object/public/${AVATAR_BUCKET}/${key}`;
}

// `ext` is chosen by the caller from a MIME allowlist, never from the
// uploaded filename, so a spoofed "avatar.html" can't be served as HTML.
async function saveAvatar(buffer, ext, contentType) {
  const key = randomName(ext);
  if (!remote) {
    fs.mkdirSync(AVATAR_DIR, { recursive: true });
    await fs.promises.writeFile(path.join(AVATAR_DIR, key), buffer);
    return { key, url: `/avatars/${key}` };
  }
  await storageRequest(AVATAR_BUCKET, key, {
    method: 'POST',
    headers: { 'Content-Type': contentType || 'application/octet-stream', 'x-upsert': 'true' },
    body: buffer
  });
  return { key, url: avatarPublicUrl(key) };
}

function safeExtension(originalName) {
  const ext = path.extname(String(originalName || '')).toLowerCase();
  return /^\.[a-z0-9]{1,10}$/.test(ext) ? ext : '';
}

async function saveProjectFile(buffer, originalName, contentType) {
  const key = randomName(safeExtension(originalName));
  if (!remote) {
    await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.promises.writeFile(path.join(UPLOAD_DIR, key), buffer);
    return key;
  }
  await storageRequest(FILE_BUCKET, key, {
    method: 'POST',
    headers: { 'Content-Type': contentType || 'application/octet-stream', 'x-upsert': 'true' },
    body: buffer
  });
  return key;
}

async function openProjectFile(key) {
  if (!remote) {
    const filePath = path.join(UPLOAD_DIR, key);
    const exists = await fs.promises.access(filePath).then(() => true, () => false);
    if (!exists) {
      const err = new Error('file not found');
      err.status = 404;
      throw err;
    }
    return { stream: fs.createReadStream(filePath), contentType: null };
  }
  const res = await storageRequest(FILE_BUCKET, key);
  return { stream: Readable.fromWeb(res.body), contentType: res.headers.get('content-type') };
}

async function deleteProjectFile(key) {
  if (!remote) {
    fs.promises.unlink(path.join(UPLOAD_DIR, key)).catch(() => {});
    return;
  }
  await storageRequest(FILE_BUCKET, key, { method: 'DELETE' }).catch(() => {});
}

// best-effort cleanup of a replaced avatar; supports both the old relative
// "/avatars/..." paths and the absolute Supabase public URLs
async function deleteAvatar(profilePic) {
  if (!profilePic) return;
  if (profilePic.startsWith('/avatars/')) {
    fs.promises.unlink(path.join(AVATAR_DIR, path.basename(profilePic))).catch(() => {});
    return;
  }
  const prefix = `${SUPABASE_URL}/storage/v1/object/public/${AVATAR_BUCKET}/`;
  if (remote && profilePic.startsWith(prefix)) {
    await storageRequest(AVATAR_BUCKET, decodeURIComponent(profilePic.slice(prefix.length)), { method: 'DELETE' }).catch(() => {});
  }
}

module.exports = {
  isRemote,
  saveAvatar,
  saveProjectFile,
  openProjectFile,
  deleteProjectFile,
  deleteAvatar,
  AVATAR_DIR,
  UPLOAD_DIR
};
