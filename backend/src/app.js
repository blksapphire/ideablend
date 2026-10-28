require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const prisma = require('./prisma');
const { corsOptions } = require('./lib/cors');

// created fresh on every boot rather than relying on committed .gitkeep
// files surviving the deploy pipeline. Local disk is only the development
// fallback: production should configure Supabase Storage (see lib/storage.js),
// because ephemeral hosts wipe this directory on deploy/restart.
fs.mkdirSync(path.join(__dirname, '..', 'uploads', 'avatars'), { recursive: true });

const authRoutes = require('./routes/auth');
const projectsRoutes = require('./routes/projects');
const applicationsRoutes = require('./routes/applications');
const membershipsRoutes = require('./routes/memberships');
const tasksRoutes = require('./routes/tasks');
const usersRoutes = require('./routes/users');
const skillsRoutes = require('./routes/skills');
const githubRoutes = require('./routes/github');
const filesRoutes = require('./routes/files');
const messagesRoutes = require('./routes/messages');
const reviewsRoutes = require('./routes/reviews');
const milestonesRoutes = require('./routes/milestones');
const adminRoutes = require('./routes/admin');
const discoverRoutes = require('./routes/discover');
const notificationsRoutes = require('./routes/notifications');
const followsRoutes = require('./routes/follows');
const pushRoutes = require('./routes/push');
const agentRoutes = require('./routes/agent');

const app = express();

// Render/Railway/Vercel sit in front of the app, so without this every
// request looks like it came from the proxy's IP and rate limiting would
// apply one shared bucket to the whole world.
app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);

// Content-Security-Policy is for HTML pages; this API only returns JSON, and
// the frontend is hosted separately. CORP is relaxed so avatars served from
// here can render on the frontend's origin.
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors(corsOptions));

// defense in depth: a client with a trailing slash on its base URL (e.g.
// "https://api.example.com/" + "/auth/register") produces "//auth/register",
// which Express won't match to any route. Collapsing repeated slashes here
// means a misconfigured client still works instead of getting a confusing 404.
app.use((req, res, next) => {
  req.url = req.url.replace(/\/{2,}/g, '/');
  next();
});

app.use(express.json({ limit: '256kb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'too many requests, slow down and try again shortly' }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'too many attempts, try again in a few minutes' }
});

app.use('/api', apiLimiter);

// avatars are meant to be publicly viewable (profile pictures shown across
// the app), unlike project files which stay behind auth checks. This static
// mount only serves avatars stored on local disk; with Supabase configured
// they're served from the bucket's public URL instead.
app.use('/avatars', express.static(path.join(__dirname, '..', 'uploads', 'avatars'), { maxAge: '1y', immutable: true }));

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch {
    res.status(503).json({ ok: false, error: 'database unavailable' });
  }
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/skills', skillsRoutes);
// each of these route files defines its own full path segments
// (e.g. /projects/:projectId/roles/:roleId/apply), so mounting all
// three at /api keeps URLs clean without extra nesting here
app.use('/api', applicationsRoutes);
app.use('/api', membershipsRoutes);
app.use('/api', tasksRoutes);
app.use('/api', githubRoutes);
app.use('/api', filesRoutes);
app.use('/api', messagesRoutes);
app.use('/api', reviewsRoutes);
app.use('/api', milestonesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', discoverRoutes);
app.use('/api', notificationsRoutes);
app.use('/api', followsRoutes);
app.use('/api', pushRoutes);
app.use('/api', agentRoutes);

app.get('/', (req, res) => res.json({ ok: true, platform: 'Idea Blend' }));

// unknown route
app.use((req, res) => {
  res.status(404).json({ error: 'not found' });
});

// centralized error handler - every asyncHandler-wrapped route forwards
// errors here via next(err) instead of crashing the process or hanging
// the request. Errors can set `err.status` (see lib/validate.js) for a
// specific status code; anything else is treated as a 500.
app.use((err, req, res, next) => {
  let status = err.status || err.statusCode || 500;
  if (err.name === 'MulterError') status = 400;
  if (err.type === 'entity.too.large') status = 413;
  if (err instanceof SyntaxError && status === 400) err.message = 'invalid JSON body';

  // map common Prisma failures to sensible HTTP responses instead of 500s
  if (typeof err.code === 'string' && err.code.startsWith('P2')) {
    if (err.code === 'P2025') { status = 404; err.message = 'not found'; }
    else if (err.code === 'P2002') { status = 409; err.message = 'already exists'; }
    else if (err.code === 'P2003') { status = 409; err.message = 'this record is still referenced elsewhere'; }
  }

  if (status >= 500) console.error(err);

  // never expose internals (stack details, DB errors) in production
  const message = status >= 500 && process.env.NODE_ENV === 'production'
    ? 'server error'
    : err.message || 'server error';
  res.status(status).json({ error: message });
});

module.exports = app;
