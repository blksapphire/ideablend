const jwt = require('jsonwebtoken');
const prisma = require('../prisma');

// requires a valid token; rejects if missing/invalid
async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'no auth' });
  const token = header.split(' ')[1];
  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: data.id },
      select: { id: true, email: true, name: true, headline: true, skills: true, githubUrl: true, portfolioUrl: true, profilePic: true, bio: true, isAdmin: true }
    });
    if (!user) return res.status(401).json({ error: 'no user' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'invalid token' });
  }
}

// attaches req.user if a valid token is present, but doesn't reject if absent
// (useful for routes like GET /projects that work for logged-out users too)
async function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return next();
  const token = header.split(' ')[1];
  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: data.id },
      select: { id: true, email: true, name: true, profilePic: true }
    });
    if (user) req.user = user;
  } catch (err) {
    // ignore invalid token in optional mode
  }
  next();
}

// use after requireAuth - rejects anyone whose account isn't flagged as admin
function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) return res.status(403).json({ error: 'admin only' });
  next();
}

module.exports = { requireAuth, optionalAuth, requireAdmin };
