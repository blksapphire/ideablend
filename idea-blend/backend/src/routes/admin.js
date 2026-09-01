const express = require('express');
const prisma = require('../prisma');
const { requireAuth, requireAdmin } = require('../middlewares/authMiddleware');
const { asyncHandler } = require('../lib/asyncHandler');

const router = express.Router();

router.get('/stats', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers, newUsers7d,
    totalProjects, newProjects7d, projectsByStatus, projectsByStage,
    totalApplications, applicationsByStatus,
    totalMessages, totalTasks, tasksByStatus,
    activeMemberships, totalReviews
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
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
    users: { total: totalUsers, newLast7Days: newUsers7d },
    projects: { total: totalProjects, newLast7Days: newProjects7d, byStatus: toMap(projectsByStatus), byStage: toMap(projectsByStage) },
    applications: { total: totalApplications, byStatus: toMap(applicationsByStatus) },
    messages: { total: totalMessages },
    tasks: { total: totalTasks, byStatus: toMap(tasksByStatus) },
    activeMemberships,
    reviews: { total: totalReviews }
  });
}));

module.exports = router;
