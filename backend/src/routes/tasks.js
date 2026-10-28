const express = require('express');
const prisma = require('../prisma');
const { requireAuth } = require('../middlewares/authMiddleware');
const { asyncHandler } = require('../lib/asyncHandler');
const { requireIntParam, requireFields, assertMaxLength } = require('../lib/validate');
const { assertMember, getOtherMemberIds } = require('../lib/projectAccess');
const { logActivity } = require('../lib/activity');
const { notify } = require('../lib/notify');

const router = express.Router();

const ALL_STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
// a regular member can move a task into any of these themselves - crucially,
// DONE is missing, and once a task IS in review, only the owner can move it
// anywhere else (approve to DONE, or send it back to IN_PROGRESS)
const MEMBER_SETTABLE = ['TODO', 'IN_PROGRESS', 'IN_REVIEW'];

router.get('/projects/:projectId/tasks', requireAuth, asyncHandler(async (req, res) => {
  const projectId = requireIntParam(req.params.projectId, 'project id');
  const check = await assertMember(projectId, req.user.id);
  if (check.error) return res.status(check.code).json({ error: check.error });

  const tasks = await prisma.task.findMany({
    where: { projectId },
    include: { assignee: { select: { id: true, name: true, profilePic: true } } },
    orderBy: { createdAt: 'asc' }
  });
  res.json(tasks);
}));

router.post('/projects/:projectId/tasks', requireAuth, asyncHandler(async (req, res) => {
  const projectId = requireIntParam(req.params.projectId, 'project id');
  const check = await assertMember(projectId, req.user.id);
  if (check.error) return res.status(check.code).json({ error: check.error });

  requireFields(req.body, ['title']);
  const { title, description, assigneeId } = req.body;
  assertMaxLength(title, 200, 'title');
  assertMaxLength(description, 5000, 'description');

  const targetId = assigneeId ? requireIntParam(assigneeId, 'assigneeId') : null;
  if (targetId) {
    const assigneeCheck = await assertMember(projectId, targetId);
    if (assigneeCheck.error) return res.status(400).json({ error: 'assignee must be a project member' });
  }

  const [task] = await prisma.$transaction(async (tx) => {
    const t = await tx.task.create({
      data: { projectId, title, description, assigneeId: targetId }
    });
    await logActivity(tx, { projectId, actorId: req.user.id, type: 'TASK_CREATED', message: `${req.user.name || 'Someone'} added task "${title}"` });
    return [t];
  });
  res.json(task);
}));

// move a task between kanban columns, or reassign it
router.patch('/tasks/:id', requireAuth, asyncHandler(async (req, res) => {
  const id = requireIntParam(req.params.id, 'task id');
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return res.status(404).json({ error: 'not found' });

  const check = await assertMember(task.projectId, req.user.id);
  if (check.error) return res.status(check.code).json({ error: check.error });

  const { title, description, status, assigneeId } = req.body;
  assertMaxLength(title, 200, 'title');
  assertMaxLength(description, 5000, 'description');

  let targetAssignee;
  if (assigneeId !== undefined) {
    targetAssignee = assigneeId ? requireIntParam(assigneeId, 'assigneeId') : null;
    if (targetAssignee) {
      const assigneeCheck = await assertMember(task.projectId, targetAssignee);
      if (assigneeCheck.error) return res.status(400).json({ error: 'assignee must be a project member' });
    }
  }

  if (status) {
    if (!ALL_STATUSES.includes(status)) return res.status(400).json({ error: 'invalid status' });
    if (!check.isOwner) {
      if (!MEMBER_SETTABLE.includes(status)) {
        return res.status(403).json({ error: 'only the project owner can approve a task as done' });
      }
      if (task.status === 'IN_REVIEW' && status !== 'IN_REVIEW') {
        return res.status(403).json({ error: 'only the project owner can move a task out of review' });
      }
    }
  }

  const willComplete = status === 'DONE' && task.status !== 'DONE';

  const [updated] = await prisma.$transaction(async (tx) => {
    const t = await tx.task.update({
      where: { id },
      data: { title, description, status, assigneeId: targetAssignee }
    });
    if (willComplete) {
      await logActivity(tx, { projectId: task.projectId, actorId: req.user.id, type: 'TASK_COMPLETED', message: `${req.user.name || 'Someone'} completed "${t.title}"` });
    }
    return [t];
  });

  if (willComplete) {
    const otherIds = await getOtherMemberIds(task.projectId, req.user.id);
    await Promise.all(otherIds.map(uid => notify(prisma, {
      userId: uid, type: 'TASK_COMPLETED',
      message: `${req.user.name || 'Someone'} completed "${updated.title}"`,
      link: `/projects/${task.projectId}/workspace`
    })));
  }

  res.json(updated);
}));

module.exports = router;
