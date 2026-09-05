const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();
const asyncHandler = require('../lib/asyncHandler');
const { authenticateToken } = require('../lib/auth');

// Get all notifications for logged-in user
router.get('/notifications', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      type: true,
      title: true,
      message: true,
      relatedUserId: true,
      relatedProjectId: true,
      read: true,
      createdAt: true
    }
  });
  
  res.json(notifications);
}));

// Get unread notification count
router.get('/notifications/unread-count', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const count = await prisma.notification.count({
    where: { userId, read: false }
  });
  
  res.json({ unreadCount: count });
}));

// Mark notification as read
router.patch('/notifications/:id/read', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  // Verify ownership
  const notification = await prisma.notification.findUnique({ where: { id: parseInt(id) } });
  if (!notification || notification.userId !== userId) {
    return res.status(404).json({ error: 'Notification not found' });
  }
  
  const updated = await prisma.notification.update({
    where: { id: parseInt(id) },
    data: { read: true, readAt: new Date() }
  });
  
  res.json(updated);
}));

// Mark all as read
router.patch('/notifications/mark-all-read', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true, readAt: new Date() }
  });
  
  res.json({ message: 'All notifications marked as read' });
}));

// Delete notification
router.delete('/notifications/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  const notification = await prisma.notification.findUnique({ where: { id: parseInt(id) } });
  if (!notification || notification.userId !== userId) {
    return res.status(404).json({ error: 'Notification not found' });
  }
  
  await prisma.notification.delete({ where: { id: parseInt(id) } });
  res.json({ message: 'Notification deleted' });
}));

module.exports = router;
