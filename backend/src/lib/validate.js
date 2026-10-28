// Parses a route param as a positive integer ID, or throws a 400 error the
// centralized error middleware will turn into a clean response - instead of
// letting Number('abc') become NaN and blow up a Prisma query further down.
function requireIntParam(value, label = 'id') {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    const err = new Error(`invalid ${label}`);
    err.status = 400;
    throw err;
  }
  return n;
}

// Checks that every listed field is present and non-empty on the body.
function requireFields(body, fields) {
  const missing = fields.filter(f => body[f] === undefined || body[f] === null || body[f] === '');
  if (missing.length) {
    const err = new Error(`missing required field(s): ${missing.join(', ')}`);
    err.status = 400;
    throw err;
  }
}

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

// Emails are stored and compared lowercase so "Sam@Example.com" and
// "sam@example.com" can't create two accounts (or fail to log in).
function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function assertMaxLength(value, max, label) {
  if (value != null && String(value).length > max) {
    throw badRequest(`${label} must be at most ${max} characters`);
  }
}

// Only absolute http(s) links belong in profile/project URL fields. Without
// this, a "javascript:" value would be rendered as a clickable link.
function optionalHttpUrl(value, label = 'url') {
  const raw = String(value || '').trim();
  if (!raw) return null;
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw badRequest(`${label} must be a valid URL`);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw badRequest(`${label} must start with http:// or https://`);
  }
  return raw;
}

module.exports = {
  requireIntParam,
  requireFields,
  normalizeEmail,
  assertMaxLength,
  optionalHttpUrl
};
