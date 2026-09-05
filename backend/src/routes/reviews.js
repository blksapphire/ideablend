const express = require('express');
const prisma = require('../prisma');
const { requireAuth } = require('../middlewares/authMiddleware');
const { asyncHandler } = require('../lib/asyncHandler');
const { requireIntParam } = require('../lib/validate');
const { notify } = require('../lib/notify');

const router = express.Router();

// everyone who was actually on a project: the owner plus every user with at
// least one active-or-ever-active membership. Used both to check review
// eligibility and to build the "who's left to review" list.
async function getTeammates(projectId) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return null;
  const memberships = await prisma.membership.findMany({
    where: { projectId },
    distinct: ['userId'],
    include: { user: { select: { id: true, name: true, profilePic: true } } }
  });
  const ids = new Set([project.ownerId]);
  const people = [{ id: project.ownerId }];
  memberships.forEach(m => {
    if (!ids.has(m.userId)) {
      ids.add(m.userId);
      people.push(m.user);
    }
  });
  return { project, people };
}

router.post('/projects/:projectId/reviews', requireAuth, asyncHandler(async (req, res) => {
  const projectId = requireIntParam(req.params.projectId, 'project id');
  const { revieweeId, rating, comment } = req.body;
  if (!revieweeId) return res.status(400).json({ error: 'revieweeId required' });
  const targetId = requireIntParam(revieweeId, 'revieweeId');
  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ error: 'rating must be an integer 1-5' });
  }
  if (targetId === req.user.id) return res.status(400).json({ error: "can't review yourself" });

  const result = await getTeammates(projectId);
  if (!result) return res.status(404).json({ error: 'not found' });
  if (result.project.status !== 'COMPLETED') {
    return res.status(400).json({ error: 'reviews open once the project is marked completed' });
  }
  const teammateIds = new Set(result.people.map(p => p.id));
  if (!teammateIds.has(req.user.id)) return res.status(403).json({ error: 'you were not on this project' });
  if (!teammateIds.has(targetId)) return res.status(400).json({ error: 'that person was not on this project' });

  try {
    const review = await prisma.review.create({
      data: { projectId, reviewerId: req.user.id, revieweeId: targetId, rating: ratingNum, comment }
    });
    await notify(prisma, {
      userId: targetId, type: 'REVIEW_RECEIVED',
      message: `${req.user.name || 'Someone'} left you a ${ratingNum}-star review`,
      link: `/profile`
    });
    res.json(review);
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'you already reviewed this person for this project' });
    throw err;
  }
}));

// teammates on a completed project the current user hasn't reviewed yet -
// drives the "rate your teammates" prompt
router.get('/projects/:projectId/teammates-to-review', requireAuth, asyncHandler(async (req, res) => {
  const projectId = requireIntParam(req.params.projectId, 'project id');
  const result = await getTeammates(projectId);
  if (!result) return res.status(404).json({ error: 'not found' });
  if (result.project.status !== 'COMPLETED') return res.json([]);

  const teammateIds = new Set(result.people.map(p => p.id));
  if (!teammateIds.has(req.user.id)) return res.status(403).json({ error: 'you were not on this project' });

  const alreadyReviewed = await prisma.review.findMany({
    where: { projectId, reviewerId: req.user.id },
    select: { revieweeId: true }
  });
  const reviewedIds = new Set(alreadyReviewed.map(r => r.revieweeId));

  const pending = result.people.filter(p => p.id !== req.user.id && !reviewedIds.has(p.id));
  res.json(pending);
}));

// public reviews a user has received
router.get('/users/:id/reviews', asyncHandler(async (req, res) => {
  const id = requireIntParam(req.params.id, 'user id');
  const reviews = await prisma.review.findMany({
    where: { revieweeId: id },
    include: { reviewer: { select: { id: true, name: true, profilePic: true } }, project: { select: { id: true, title: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(reviews);
}));

module.exports = router;
