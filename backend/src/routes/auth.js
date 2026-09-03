const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../prisma');
const { asyncHandler } = require('../lib/asyncHandler');
const { sendMail } = require('../lib/mailer');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function safeUser(user) {
  const { password, ...rest } = user;
  return rest;
}

router.post('/register', asyncHandler(async (req, res) => {
  const { email, password, name, skills, githubUrl, portfolioUrl } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'missing fields' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'invalid email' });
  if (password.length < 8) return res.status(400).json({ error: 'password must be at least 8 characters' });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(400).json({ error: 'email taken' });

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hash, name, skills, githubUrl, portfolioUrl, lastActiveAt: new Date() }
  });

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: safeUser(user) });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'missing fields' });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'invalid credentials' });
  if (user.isBanned) return res.status(403).json({ error: 'this account has been banned' });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });

  await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: safeUser(user) });
}));

// --- password reset ---

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

router.post('/forgot-password', asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });

  const user = await prisma.user.findUnique({ where: { email } });
  // always respond the same way whether or not the email exists, so this
  // endpoint can't be used to enumerate registered accounts
  const genericResponse = { message: 'If that email is registered, a reset link has been sent.' };

  if (!user) return res.json(genericResponse);

  const token = crypto.randomBytes(32).toString('hex');
  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) }
  });

  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
  const sent = await sendMail({
    to: email,
    subject: 'Reset your Idea Blend password',
    html: `<p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href="${resetLink}">${resetLink}</a></p>`
  });

  // no SMTP configured (sendMail returned false) - this is the dev/testing
  // fallback: return the link directly instead of silently doing nothing.
  // Set SMTP_HOST etc. in .env before real users rely on this.
  if (!sent) return res.json({ ...genericResponse, devModeResetLink: resetLink });

  res.json(genericResponse);
}));

router.post('/reset-password', asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: 'token and newPassword required' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'password must be at least 8 characters' });

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
    return res.status(400).json({ error: 'invalid or expired reset link' });
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { password: hash } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { used: true } })
  ]);

  res.json({ message: 'Password updated. You can now sign in.' });
}));

module.exports = router;
