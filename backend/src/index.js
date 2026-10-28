require('dotenv').config();

// Fail fast at boot instead of half-starting and erroring on the first
// request. Hosting dashboards surface a crash-with-reason much better than
// a service that is "up" but returns 500s.
const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter(key => !process.env[key]);
if (missing.length) {
  console.error(`[boot] missing required env var(s): ${missing.join(', ')}`);
  process.exit(1);
}
if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET.length < 32) {
  console.error('[boot] JWT_SECRET must be at least 32 characters in production');
  process.exit(1);
}
if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('[boot] ANTHROPIC_API_KEY is not set - the assistant endpoint will return 503');
}
if (!process.env.SMTP_HOST) {
  console.warn('[boot] SMTP_HOST is not set - notification emails and password-reset emails will not be sent');
}
const storage = require('./lib/storage');
if (process.env.NODE_ENV === 'production' && !storage.isRemote()) {
  console.warn('[boot] SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY are not set - uploaded avatars and files are stored on local disk and will disappear on redeploy');
}

const http = require('http');
const app = require('./app');
const prisma = require('./prisma');
const { setupSocket } = require('./realtime/socket');

const server = http.createServer(app);
const io = setupSocket(server);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Idea Blend API listening on ${PORT}`));

function shutdown(signal) {
  console.log(`[boot] ${signal} received, shutting down`);
  io.close();
  server.close(() => {
    prisma.$disconnect().finally(() => process.exit(0));
  });
  // don't hang forever on stuck connections
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
