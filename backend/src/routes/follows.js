const express = require('express');
const prisma = require('../prisma');
const { requireAuth, optionalAuth } = require('../middlewares/authMiddleware');
const { asyncHandler } = require('../lib/asyncHandler');
const { requireIntParam } = require('../lib/validate');
const { notify } = require('../lib/notify');

const router = express.Router();

router.post('/users/:id/follow', requireAuth, asyncHandler(async (req, res) => {
  const id = requireIntParam(req.params.id, 'user id');
  if (id === req.user.id) return res.status(400).json({ error: "can't follow yourself" });

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return res.status(404).json({ error: 'not found' });

  try {
    await prisma.follow.create({ data: { followerId: req.user.id, followingId: id } });
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'already following' });
    throw err;
  }

  await notify(prisma, {
    userId: id, type: 'NEW_FOLLOWER',
    message: `${req.user.name || 'Someone'} started following you`,
    link: `/users/${req.user.id}`
  });

  res.json({ ok: true });
}));

router.post('/users/:id/unfollow', requireAuth, asyncHandler(async (req, res) => {
  const id = requireIntParam(req.params.id, 'user id');
  await prisma.follow.deleteMany({ where: { followerId: req.user.id, followingId: id } });
  res.json({ ok: true });
}));

router.get('/users/:id/followers', asyncHandler(async (req, res) => {
  const id = requireIntParam(req.params.id, 'user id');
  const rows = await prisma.follow.findMany({
    where: { followingId: id },
    include: { follower: { select: { id: true, name: true, headline: true, profilePic: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(rows.map(r => r.follower));
}));

router.get('/users/:id/following', asyncHandler(async (req, res) => {
  const id = requireIntParam(req.params.id, 'user id');
  const rows = await prisma.follow.findMany({
    where: { followerId: id },
    include: { following: { select: { id: true, name: true, headline: true, profilePic: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(rows.map(r => r.following));
}));

module.exports = router;
