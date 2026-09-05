const express = require('express');
const prisma = require('../prisma');
const { requireAuth } = require('../middlewares/authMiddleware');
const { asyncHandler } = require('../lib/asyncHandler');
const { requireIntParam } = require('../lib/validate');
const { activateMembership } = require('../lib/membership');
const { logActivity } = require('../lib/activity');
const { notify } = require('../lib/notify');

const router = express.Router();

// the logged-in user's own applications, across all projects - this is what
// powers the "you were accepted, confirm to join" UI on their side
router.get('/applications/mine', requireAuth, asyncHandler(async (req, res) => {
  const applications = await prisma.application.findMany({
    where: { userId: req.user.id },
    include: { project: { select: { id: true, title: true } }, role: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(applications);
}));

// apply to a specific role on a project
router.post('/projects/:projectId/roles/:roleId/apply', requireAuth, asyncHandler(async (req, res) => {
  const projectId = requireIntParam(req.params.projectId, 'project id');
  const roleId = requireIntParam(req.params.roleId, 'role id');
  const { message } = req.body;

  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role || role.projectId !== projectId) return res.status(404).json({ error: 'role not found' });

  const existing = await prisma.application.findUnique({ where: { roleId_userId: { roleId, userId: req.user.id } } });
  if (existing) return res.status(400).json({ error: 'already applied to this role' });

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  const application = await prisma.application.create({
    data: { projectId, roleId, userId: req.user.id, message }
  });

  await notify(prisma, {
    userId: project.ownerId, type: 'APPLICATION_RECEIVED',
    message: `${req.user.name || 'Someone'} applied for ${role.name}`,
    link: `/projects/${projectId}/applications`
  });

  res.json(application);
}));

// owner: list applications for a project (optionally filter by role or status)
router.get('/projects/:projectId/applications', requireAuth, asyncHandler(async (req, res) => {
  const projectId = requireIntParam(req.params.projectId, 'project id');
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return res.status(404).json({ error: 'not found' });
  if (project.ownerId !== req.user.id) return res.status(403).json({ error: 'not owner' });

  const { roleId, status } = req.query;
  const where = { projectId };
  if (roleId) where.roleId = requireIntParam(roleId, 'role id');
  if (status) where.status = status;

  const applications = await prisma.application.findMany({
    where,
    include: { user: { select: { id: true, name: true, skills: true, profilePic: true } }, role: true },
    orderBy: { createdAt: 'asc' }
  });
  res.json(applications);
}));

// owner accepts -> ACCEPTED, awaiting applicant confirmation. Does not create a Membership yet.
router.post('/applications/:id/accept', requireAuth, asyncHandler(async (req, res) => {
  const id = requireIntParam(req.params.id, 'application id');
  const application = await prisma.application.findUnique({ where: { id }, include: { project: true, role: { include: { memberships: { where: { active: true } } } } } });
  if (!application) return res.status(404).json({ error: 'not found' });
  if (application.project.ownerId !== req.user.id) return res.status(403).json({ error: 'not owner' });
  if (application.status !== 'PENDING') return res.status(400).json({ error: `cannot accept from status ${application.status}` });
  if (application.role.memberships.length >= application.role.slots) {
    return res.status(400).json({ error: 'role is already full' });
  }

  const updated = await prisma.application.update({ where: { id }, data: { status: 'ACCEPTED' } });
  await notify(prisma, {
    userId: application.userId, type: 'APPLICATION_ACCEPTED',
    message: `You were accepted for ${application.role.name} on ${application.project.title}`,
    link: `/my-applications`
  });
  res.json(updated);
}));

router.post('/applications/:id/reject', requireAuth, asyncHandler(async (req, res) => {
  const id = requireIntParam(req.params.id, 'application id');
  const application = await prisma.application.findUnique({ where: { id }, include: { project: true, role: true } });
  if (!application) return res.status(404).json({ error: 'not found' });
  if (application.project.ownerId !== req.user.id) return res.status(403).json({ error: 'not owner' });

  const updated = await prisma.application.update({ where: { id }, data: { status: 'REJECTED' } });
  await notify(prisma, {
    userId: application.userId, type: 'APPLICATION_REJECTED',
    message: `Your application for ${application.role.name} on ${application.project.title} wasn't accepted`,
    link: `/my-applications`
  });
  res.json(updated);
}));

// applicant confirms an ACCEPTED application -> creates the Membership (the confirmation step)
router.post('/applications/:id/confirm', requireAuth, asyncHandler(async (req, res) => {
  const id = requireIntParam(req.params.id, 'application id');
  const application = await prisma.application.findUnique({ where: { id }, include: { project: true, role: { include: { memberships: { where: { active: true } } } } } });
  if (!application) return res.status(404).json({ error: 'not found' });
  if (application.userId !== req.user.id) return res.status(403).json({ error: 'not your application' });
  if (application.status !== 'ACCEPTED') return res.status(400).json({ error: `cannot confirm from status ${application.status}` });
  if (application.role.memberships.length >= application.role.slots) {
    return res.status(400).json({ error: 'role filled while you were confirming' });
  }

  const [updatedApp, membership] = await prisma.$transaction(async (tx) => {
    const app = await tx.application.update({ where: { id }, data: { status: 'CONFIRMED' } });
    const m = await activateMembership(tx, { projectId: application.projectId, roleId: application.roleId, userId: application.userId });
    await logActivity(tx, {
      projectId: application.projectId, actorId: req.user.id, type: 'MEMBER_JOINED',
      message: `${req.user.name || 'Someone'} joined as ${application.role.name}`
    });
    return [app, m];
  });

  res.json({ application: updatedApp, membership });

  notify(prisma, {
    userId: application.project.ownerId, type: 'MEMBER_JOINED',
    message: `${req.user.name || 'Someone'} joined as ${application.role.name}`,
    link: `/projects/${application.projectId}/workspace`
  }).catch(() => {});
}));

// applicant withdraws before the process completes
router.post('/applications/:id/withdraw', requireAuth, asyncHandler(async (req, res) => {
  const id = requireIntParam(req.params.id, 'application id');
  const application = await prisma.application.findUnique({ where: { id } });
  if (!application) return res.status(404).json({ error: 'not found' });
  if (application.userId !== req.user.id) return res.status(403).json({ error: 'not your application' });
  if (application.status === 'CONFIRMED') return res.status(400).json({ error: 'already confirmed, leave the project instead' });

  const updated = await prisma.application.update({ where: { id }, data: { status: 'WITHDRAWN' } });
  res.json(updated);
}));

module.exports = router;
