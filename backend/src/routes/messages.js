const express = require('express');
const prisma = require('../prisma');
const { requireAuth } = require('../middlewares/authMiddleware');
const { asyncHandler } = require('../lib/asyncHandler');
const { requireIntParam } = require('../lib/validate');
const { assertMember } = require('../lib/projectAccess');

const router = express.Router();

// last 200 messages - plenty for a project workspace's history; pagination
// can be added later if a project's chat genuinely outgrows this
router.get('/projects/:projectId/messages', requireAuth, asyncHandler(async (req, res) => {
  const projectId = requireIntParam(req.params.projectId, 'project id');
  const check = await assertMember(projectId, req.user.id);
  if (check.error) return res.status(check.code).json({ error: check.error });

  const messages = await prisma.message.findMany({
    where: { projectId },
    include: { author: { select: { id: true, name: true, profilePic: true } } },
    orderBy: { createdAt: 'asc' },
    take: 200
  });
  res.json(messages);
}));

module.exports = router;
