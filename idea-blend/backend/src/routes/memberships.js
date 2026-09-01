const express = require('express');
const prisma = require('../prisma');
const { requireAuth } = require('../middlewares/authMiddleware');
const { asyncHandler } = require('../lib/asyncHandler');
const { requireIntParam } = require('../lib/validate');
const { activateMembership } = require('../lib/membership');
const { logActivity } = require('../lib/activity');

const router = express.Router();

async function assertOwner(projectId, userId) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return { error: 'not found', code: 404 };
  if (project.ownerId !== userId) return { error: 'not owner', code: 403 };
  return { project };
}

// owner moves a member from one role to another on the same project.
// this deactivates their current membership in that role and reactivates
// (or creates) one in the target role.
router.post('/memberships/:id/reassign', requireAuth, asyncHandler(async (req, res) => {
  const id = requireIntParam(req.params.id, 'membership id');
  const { toRoleId } = req.body;
  if (!toRoleId) return res.status(400).json({ error: 'toRoleId required' });
  const targetRoleId = requireIntParam(toRoleId, 'toRoleId');

  const membership = await prisma.membership.findUnique({ where: { id } });
  if (!membership) return res.status(404).json({ error: 'not found' });

  const ownerCheck = await assertOwner(membership.projectId, req.user.id);
  if (ownerCheck.error) return res.status(ownerCheck.code).json({ error: ownerCheck.error });

  const targetRole = await prisma.role.findUnique({ where: { id: targetRoleId }, include: { memberships: { where: { active: true } } } });
  if (!targetRole || targetRole.projectId !== membership.projectId) {
    return res.status(400).json({ error: 'target role must belong to the same project' });
  }
  if (targetRole.memberships.length >= targetRole.slots) {
    return res.status(400).json({ error: 'target role is already full' });
  }

  // interactive transaction: needs a conditional lookup (does an inactive
  // row for the target role already exist?) between the two writes, which a
  // plain array of prisma calls can't express
  const newMembership = await prisma.$transaction(async (tx) => {
    await tx.membership.update({ where: { id }, data: { active: false } });
    return activateMembership(tx, { projectId: membership.projectId, roleId: targetRole.id, userId: membership.userId });
  });

  res.json(newMembership);
}));

// owner removes a member from one specific role
router.delete('/memberships/:id', requireAuth, asyncHandler(async (req, res) => {
  const id = requireIntParam(req.params.id, 'membership id');
  const membership = await prisma.membership.findUnique({ where: { id }, include: { user: { select: { name: true } } } });
  if (!membership) return res.status(404).json({ error: 'not found' });

  const ownerCheck = await assertOwner(membership.projectId, req.user.id);
  if (ownerCheck.error) return res.status(ownerCheck.code).json({ error: ownerCheck.error });

  const [updated] = await prisma.$transaction(async (tx) => {
    const m = await tx.membership.update({ where: { id }, data: { active: false } });
    await logActivity(tx, { projectId: membership.projectId, actorId: req.user.id, type: 'MEMBER_REMOVED', message: `${membership.user?.name || 'A member'} was removed from a role` });
    return [m];
  });
  res.json(updated);
}));

// owner removes a member entirely from the project (all their active roles)
router.post('/projects/:projectId/members/:userId/remove', requireAuth, asyncHandler(async (req, res) => {
  const projectId = requireIntParam(req.params.projectId, 'project id');
  const userId = requireIntParam(req.params.userId, 'user id');

  const ownerCheck = await assertOwner(projectId, req.user.id);
  if (ownerCheck.error) return res.status(ownerCheck.code).json({ error: ownerCheck.error });

  const removedUser = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });

  const [result] = await prisma.$transaction(async (tx) => {
    const r = await tx.membership.updateMany({ where: { projectId, userId, active: true }, data: { active: false } });
    if (r.count > 0) {
      await logActivity(tx, { projectId, actorId: req.user.id, type: 'MEMBER_REMOVED', message: `${removedUser?.name || 'A member'} was removed from the project` });
    }
    return [r];
  });
  res.json({ removed: result.count });
}));

module.exports = router;
