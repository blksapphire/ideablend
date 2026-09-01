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

module.exports = { requireIntParam, requireFields };
