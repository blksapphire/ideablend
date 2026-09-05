const express = require('express');
const prisma = require('../prisma');
const { requireAuth } = require('../middlewares/authMiddleware');
const { asyncHandler } = require('../lib/asyncHandler');
const { requireIntParam, requireFields } = require('../lib/validate');
const { assertMember, getOtherMemberIds } = require('../lib/projectAccess');
const { logActivity } = require('../lib/activity');
const { notify } = require('../lib/notify');

const router = express.Router();

router.get('/projects/:projectId/milestones', requireAuth, asyncHandler(async (req, res) => {
  const projectId = requireIntParam(req.params.projectId, 'project id');
  const check = await assertMember(projectId, req.user.id);
  if (check.error) return res.status(check.code).json({ error: check.error });

  const milestones = await prisma.milestone.findMany({ where: { projectId }, orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] });
  res.json(milestones);
}));

router.post('/projects/:projectId/milestones', requireAuth, asyncHandler(async (req, res) => {
  const projectId = requireIntParam(req.params.projectId, 'project id');
  const check = await assertMember(projectId, req.user.id);
  if (check.error) return res.status(check.code).json({ error: check.error });

  requireFields(req.body, ['title']);
  const { title, description } = req.body;

  const [milestone] = await prisma.$transaction(async (tx) => {
    const m = await tx.milestone.create({ data: { projectId, title, description } });
    await logActivity(tx, { projectId, actorId: req.user.id, type: 'MILESTONE_CREATED', message: `${req.user.name || 'Someone'} added milestone "${title}"` });
    return [m];
  });
  res.json(milestone);
}));

// toggle completed on/off; only logs an activity entry on the false->true transition
router.patch('/milestones/:id', requireAuth, asyncHandler(async (req, res) => {
  const id = requireIntParam(req.params.id, 'milestone id');
  const milestone = await prisma.milestone.findUnique({ where: { id } });
  if (!milestone) return res.status(404).json({ error: 'not found' });

  const check = await assertMember(milestone.projectId, req.user.id);
  if (check.error) return res.status(check.code).json({ error: check.error });

  const { completed, title, description } = req.body;
  const willComplete = completed === true && !milestone.completed;

  const [updated] = await prisma.$transaction(async (tx) => {
    const m = await tx.milestone.update({
      where: { id },
      data: {
        title, description,
        completed: completed !== undefined ? Boolean(completed) : undefined,
        completedAt: completed === true ? new Date() : (completed === false ? null : undefined)
      }
    });
    if (willComplete) {
      await logActivity(tx, { projectId: milestone.projectId, actorId: req.user.id, type: 'MILESTONE_COMPLETED', message: `${req.user.name || 'Someone'} completed milestone "${m.title}"` });
    }
    return [m];
  });

  if (willComplete) {
    const otherIds = await getOtherMemberIds(milestone.projectId, req.user.id);
    await Promise.all(otherIds.map(uid => notify(prisma, {
      userId: uid, type: 'MILESTONE_COMPLETED',
      message: `${req.user.name || 'Someone'} completed milestone "${updated.title}"`,
      link: `/projects/${milestone.projectId}/workspace`
    })));
  }

  res.json(updated);
}));

router.get('/projects/:projectId/activity', requireAuth, asyncHandler(async (req, res) => {
  const projectId = requireIntParam(req.params.projectId, 'project id');
  const check = await assertMember(projectId, req.user.id);
  if (check.error) return res.status(check.code).json({ error: check.error });

  const activity = await prisma.activity.findMany({
    where: { projectId },
    include: { actor: { select: { id: true, name: true, profilePic: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50
  });
  res.json(activity);
}));

module.exports = router;
