const express = require('express');
const prisma = require('../prisma');
const { requireAuth } = require('../middlewares/authMiddleware');
const { asyncHandler } = require('../lib/asyncHandler');
const { requireIntParam } = require('../lib/validate');

const router = express.Router();

router.get('/notifications', requireAuth, asyncHandler(async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50
  });
  res.json(notifications);
}));

router.get('/notifications/unread-count', requireAuth, asyncHandler(async (req, res) => {
  const count = await prisma.notification.count({ where: { userId: req.user.id, read: false } });
  res.json({ count });
}));

router.post('/notifications/:id/read', requireAuth, asyncHandler(async (req, res) => {
  const id = requireIntParam(req.params.id, 'notification id');
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification) return res.status(404).json({ error: 'not found' });
  if (notification.userId !== req.user.id) return res.status(403).json({ error: 'not yours' });

  const updated = await prisma.notification.update({ where: { id }, data: { read: true } });
  res.json(updated);
}));

router.post('/notifications/read-all', requireAuth, asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({ where: { userId: req.user.id, read: false }, data: { read: true } });
  res.json({ ok: true });
}));

module.exports = router;
