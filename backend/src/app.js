require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');

// created fresh on every boot rather than relying on committed .gitkeep
// files surviving the deploy pipeline - matters especially on platforms
// with ephemeral/fresh filesystems per deploy (see the file storage note
// further down in this file, near the static /avatars mount)
fs.mkdirSync(path.join(__dirname, '..', 'uploads', 'avatars'), { recursive: true });

// temporary diagnostic - remove once the Railway Volume mount path is confirmed
console.log('[UPLOAD_PATH_CHECK] process.cwd():', process.cwd());
console.log('[UPLOAD_PATH_CHECK] uploads resolve to:', path.join(__dirname, '..', 'uploads'));

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

const app = express();
app.use(cors());

// defense in depth: a client with a trailing slash on its base URL (e.g.
// "https://api.example.com/" + "/auth/register") produces "//auth/register",
// which Express won't match to any route. Collapsing repeated slashes here
// means a misconfigured client still works instead of getting a confusing 404.
app.use((req, res, next) => {
  req.url = req.url.replace(/\/{2,}/g, '/');
  next();
});
app.use(express.json());

// avatars are meant to be publicly viewable (profile pictures shown across
// the app), unlike project files which stay behind auth checks
//
// IMPORTANT: this stores files on local disk, which does NOT survive a
// redeploy on platforms like Railway/Render/Heroku (ephemeral filesystem -
// wiped clean on every deploy). Fine for local dev and short-lived testing;
// before relying on this for real, migrate to a persistent Railway Volume
// or an object store (S3/Cloudflare R2).
app.use('/avatars', express.static(path.join(__dirname, '..', 'uploads', 'avatars')));

app.use('/api/auth', authRoutes);
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
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: err.message || 'server error' });
});

module.exports = app;
