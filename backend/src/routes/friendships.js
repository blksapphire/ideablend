const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();
const asyncHandler = require('../lib/asyncHandler');
const { authenticateToken } = require('../lib/auth');

// Send friend request
router.post('/friendships/request/:receiverId', authenticateToken, asyncHandler(async (req, res) => {
  const { receiverId } = req.params;
  const requesterId = req.user.id;
  const receiver = parseInt(receiverId);
  
  if (requesterId === receiver) {
    return res.status(400).json({ error: 'Cannot add yourself as friend' });
  }
  
  // Check if receiver exists
  const user = await prisma.user.findUnique({ where: { id: receiver } });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Check if already friends or request pending
  const existing = await prisma.friendship.findUnique({
    where: { requesterId_receiverId: { requesterId, receiverId: receiver } }
  });
  
  if (existing) {
    if (existing.status === 'PENDING') {
      return res.status(400).json({ error: 'Friend request already sent' });
    } else if (existing.status === 'ACCEPTED') {
      return res.status(400).json({ error: 'Already friends' });
    }
  }
  
  const friendship = await prisma.friendship.create({
    data: {
      requesterId,
      receiverId: receiver,
      status: 'PENDING'
    }
  });
  
  // Create notification for receiver
  await prisma.notification.create({
    data: {
      userId: receiver,
      type: 'FRIEND_REQUEST',
      title: 'Friend Request',
      message: `${req.user.name || 'A user'} sent you a friend request`,
      relatedUserId: requesterId
    }
  });
  
  res.status(201).json(friendship);
}));

// Accept friend request
router.post('/friendships/accept/:requesterId', authenticateToken, asyncHandler(async (req, res) => {
  const { requesterId } = req.params;
  const receiverId = req.user.id;
  const requester = parseInt(requesterId);
  
  const friendship = await prisma.friendship.findUnique({
    where: { requesterId_receiverId: { requesterId: requester, receiverId } }
  });
  
  if (!friendship) {
    return res.status(404).json({ error: 'Friend request not found' });
  }
  
  if (friendship.status !== 'PENDING') {
    return res.status(400).json({ error: 'Invalid request' });
  }
  
  const updated = await prisma.friendship.update({
    where: { id: friendship.id },
    data: { status: 'ACCEPTED', acceptedAt: new Date() }
  });
  
  // Create notification for requester
  const requesterUser = await prisma.user.findUnique({ where: { id: requester } });
  await prisma.notification.create({
    data: {
      userId: requester,
      type: 'FRIEND_ACCEPTED',
      title: 'Friend Request Accepted',
      message: `${req.user.name || 'A user'} accepted your friend request`,
      relatedUserId: receiverId
    }
  });
  
  res.json(updated);
}));

// Reject/Remove friend
router.delete('/friendships/:friendshipId', authenticateToken, asyncHandler(async (req, res) => {
  const { friendshipId } = req.params;
  const userId = req.user.id;
  
  const friendship = await prisma.friendship.findUnique({ where: { id: parseInt(friendshipId) } });
  if (!friendship) {
    return res.status(404).json({ error: 'Friendship not found' });
  }
  
  // Verify ownership
  if (friendship.requesterId !== userId && friendship.receiverId !== userId) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  await prisma.friendship.delete({ where: { id: parseInt(friendshipId) } });
  res.json({ message: 'Friendship removed' });
}));

// Get user's friends
router.get('/users/:userId/friends', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = parseInt(userId);
  
  // Get accepted friendships where this user is requester
  const sent = await prisma.friendship.findMany({
    where: { requesterId: user, status: 'ACCEPTED' },
    include: {
      receiver: {
        select: {
          id: true,
          name: true,
          profilePic: true,
          headline: true,
          bio: true
        }
      }
    }
  });
  
  // Get accepted friendships where this user is receiver
  const received = await prisma.friendship.findMany({
    where: { receiverId: user, status: 'ACCEPTED' },
    include: {
      requester: {
        select: {
          id: true,
          name: true,
          profilePic: true,
          headline: true,
          bio: true
        }
      }
    }
  });
  
  const friends = [
    ...sent.map(f => f.receiver),
    ...received.map(f => f.requester)
  ];
  
  res.json(friends);
}));

// Get pending friend requests for user
router.get('/friendships/pending', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const pending = await prisma.friendship.findMany({
    where: { receiverId: userId, status: 'PENDING' },
    include: {
      requester: {
        select: {
          id: true,
          name: true,
          profilePic: true,
          headline: true,
          bio: true,
          skills: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  res.json(pending);
}));

module.exports = router;
