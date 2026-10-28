const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../prisma');
const { asyncHandler } = require('../lib/asyncHandler');
const { sendMail } = require('../lib/mailer');
const { normalizeEmail, optionalHttpUrl, assertMaxLength, requireFields } = require('../lib/validate');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

function safeUser(user) {
  const { password, ...rest } = user;
  return rest;
}

function signToken(user) {
  return jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

router.post('/register', asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const { password, name, skills, githubUrl, portfolioUrl } = req.body;
  requireFields({ email, password }, ['email', 'password']);
  if (typeof password !== 'string') return res.status(400).json({ error: 'invalid password' });
  if (!EMAIL_RE.test(email) || email.length > 254) return res.status(400).json({ error: 'invalid email' });
  if (password.length < 8) return res.status(400).json({ error: 'password must be at least 8 characters' });
  if (password.length > 128) return res.status(400).json({ error: 'password must be at most 128 characters' });
  assertMaxLength(name, 80, 'name');
  assertMaxLength(skills, 500, 'skills');

  const existing = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
  if (existing) return res.status(400).json({ error: 'email taken' });

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: hash,
      name: name?.trim() || null,
      skills,
      githubUrl: optionalHttpUrl(githubUrl, 'githubUrl'),
      portfolioUrl: optionalHttpUrl(portfolioUrl, 'portfolioUrl'),
      lastActiveAt: new Date()
    }
  });

  res.json({ token: signToken(user), user: safeUser(user) });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const { password } = req.body;
  requireFields({ email, password }, ['email', 'password']);
  if (typeof password !== 'string') return res.status(401).json({ error: 'invalid credentials' });

  // insensitive lookup keeps accounts created before emails were normalized
  // (e.g. "Sam@Example.com") reachable
  const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
  if (!user) return res.status(401).json({ error: 'invalid credentials' });
  if (user.isBanned) return res.status(403).json({ error: 'this account has been banned' });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });

  await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });

  res.json({ token: signToken(user), user: safeUser(user) });
}));

// --- password reset ---

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

router.post('/forgot-password', asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  if (!email) return res.status(400).json({ error: 'email required' });

  const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
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
    to: user.email,
    subject: 'Reset your Idea Blend password',
    html: `<p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href="${resetLink}">${resetLink}</a></p>`
  });

  // Only ever echo the reset link back on a non-production server with no
  // SMTP configured. In production that would hand the reset token to
  // whoever typed the victim's email address.
  if (!sent && !IS_PRODUCTION) return res.json({ ...genericResponse, devModeResetLink: resetLink });
  if (!sent) console.warn('[auth] SMTP not configured - password reset email was not delivered');

  res.json(genericResponse);
}));

router.post('/reset-password', asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  requireFields({ token, newPassword }, ['token', 'newPassword']);
  if (typeof token !== 'string' || typeof newPassword !== 'string') return res.status(400).json({ error: 'invalid reset request' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'password must be at least 8 characters' });
  if (newPassword.length > 128) return res.status(400).json({ error: 'password must be at most 128 characters' });

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
    return res.status(400).json({ error: 'invalid or expired reset link' });
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { password: hash } }),
    // invalidate every outstanding token for this account, not just the one
    // used, so an older leaked link can't be replayed
    prisma.passwordResetToken.updateMany({
      where: { userId: resetToken.userId, used: false },
      data: { used: true }
    })
  ]);

  res.json({ message: 'Password updated. You can now sign in.' });
}));

module.exports = router;
