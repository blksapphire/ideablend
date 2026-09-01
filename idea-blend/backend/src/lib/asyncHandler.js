// Express 4 doesn't catch rejected promises from async route handlers on its
// own - an unhandled rejection either hangs the request or crashes the
// process depending on Node version. Wrapping every handler in this forwards
// the error to next(), which the centralized error middleware in app.js
// turns into a clean JSON response.
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { asyncHandler };
