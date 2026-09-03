const express = require('express');
const prisma = require('../prisma');
const { requireAuth, requireAdmin } = require('../middlewares/authMiddleware');
const { asyncHandler } = require('../lib/asyncHandler');

const router = express.Router();

router.get('/stats', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    totalUsers, newUsers7d, activeUsers24h, activeUsers7d,
    totalProjects, newProjects7d, projectsByStatus, projectsByStage,
    totalApplications, applicationsByStatus,
    totalMessages, totalTasks, tasksByStatus,
    activeMemberships, totalReviews
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.user.count({ where: { lastActiveAt: { gte: oneDayAgo } } }),
    prisma.user.count({ where: { lastActiveAt: { gte: sevenDaysAgo } } }),
    prisma.project.count(),
    prisma.project.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.project.groupBy({ by: ['status'], _count: true }),
    prisma.project.groupBy({ by: ['stage'], _count: true }),
    prisma.application.count(),
    prisma.application.groupBy({ by: ['status'], _count: true }),
    prisma.message.count(),
    prisma.task.count(),
    prisma.task.groupBy({ by: ['status'], _count: true }),
    prisma.membership.count({ where: { active: true } }),
    prisma.review.count()
  ]);

  function toMap(groups) {
    return Object.fromEntries(groups.map(g => [g.status || g.stage, g._count]));
  }

  res.json({
    users: { total: totalUsers, newLast7Days: newUsers7d, active24h: activeUsers24h, active7d: activeUsers7d },
    projects: { total: totalProjects, newLast7Days: newProjects7d, byStatus: toMap(projectsByStatus), byStage: toMap(projectsByStage) },
    applications: { total: totalApplications, byStatus: toMap(applicationsByStatus) },
    messages: { total: totalMessages },
    tasks: { total: totalTasks, byStatus: toMap(tasksByStatus) },
    activeMemberships,
    reviews: { total: totalReviews }
  });
}));

// paginated user list for the admin "manage users" view
router.get('/users', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 25));
  const { q } = req.query;

  const where = q ? { OR: [{ email: { contains: q, mode: 'insensitive' } }, { name: { contains: q, mode: 'insensitive' } }] } : undefined;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { id: true, email: true, name: true, isAdmin: true, isBanned: true, isRemoved: true, createdAt: true, lastActiveAt: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.user.count({ where })
  ]);

  res.json({ users, page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
}));

// ban/unban - deliberately not a hard delete. This user may own projects,
// have sent messages, hold reviews, etc; those foreign keys are RESTRICT,
// so a real delete would fail (or, if forced through, silently destroy
// other people's project history). Banning blocks login/API access via
// requireAuth without touching any of that data.
router.post('/users/:id/ban', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) return res.status(400).json({ error: "can't ban yourself" });
  const updated = await prisma.user.update({ where: { id }, data: { isBanned: true }, select: { id: true, email: true, isBanned: true } });
  res.json(updated);
}));

router.post('/users/:id/unban', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const updated = await prisma.user.update({ where: { id }, data: { isBanned: false }, select: { id: true, email: true, isBanned: true } });
  res.json(updated);
}));

// "remove" = anonymize, not a real SQL delete (see the comment above ban/unban
// for why a hard delete isn't safe here). Scrubs every identifying field,
// detaches skill tags, and blocks login - but the row stays so every other
// user's projects/messages/reviews/tasks referencing this id stay intact.
// This cannot be undone: the original email/name/bio etc. are gone for good.
router.post('/users/:id/remove', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) return res.status(400).json({ error: "can't remove yourself" });

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ error: 'not found' });

  const randomPassword = require('crypto').randomBytes(32).toString('hex');
  const bcrypt = require('bcryptjs');
  const unusableHash = await bcrypt.hash(randomPassword, 10);

  await prisma.$transaction([
    prisma.userSkill.deleteMany({ where: { userId: id } }),
    prisma.user.update({
      where: { id },
      data: {
        email: `deleted-${id}@ideablend.removed`,
        password: unusableHash,
        name: null, headline: null, bio: null, skills: null,
        githubUrl: null, portfolioUrl: null, linkedinUrl: null, websiteUrl: null,
        location: null, timezone: null, profilePic: null,
        openToProjects: false, openToCofounder: false, openToFreelance: false, openToEmployment: false,
        availability: null,
        isBanned: true, isRemoved: true, isAdmin: false
      }
    })
  ]);

  res.json({ ok: true, id });
}));

module.exports = router;
