// Shared CORS configuration for both Express and Socket.IO so the two can
// never drift apart. Set CORS_ORIGINS to a comma-separated allowlist in
// production (e.g. "https://ideablend.vercel.app"). Localhost and Vercel
// preview URLs are allowed by default so deploys and local dev just work.
const DEV_ORIGINS = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4000',
  'http://127.0.0.1:4000'
]);

const VERCEL_PREVIEW_RE = /^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.vercel\.app$/i;

function allowedOrigins() {
  return (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(s => s.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

function isAllowed(origin) {
  if (!origin) return true; // same-origin, curl, server-to-server
  if (DEV_ORIGINS.has(origin)) return true;
  if (allowedOrigins().includes(origin)) return true;
  if (VERCEL_PREVIEW_RE.test(origin)) return true;
  if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL.replace(/\/+$/, '')) return true;
  return false;
}

const corsOptions = {
  origin(origin, cb) {
    if (isAllowed(origin)) return cb(null, true);
    return cb(null, false);
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
};

module.exports = { corsOptions, isAllowed };
