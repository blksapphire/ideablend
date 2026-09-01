const express = require('express');
const prisma = require('../prisma');
const { asyncHandler } = require('../lib/asyncHandler');

const router = express.Router();

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
const FEATURED_COUNT = 4;
const CANDIDATE_POOL_SIZE = 20;

// deterministic PRNG (mulberry32) - the same seed always produces the same
// shuffle order. Seeding with the current 4-hour time bucket means every
// request in the same window gets the identical featured set, and it
// changes automatically when the bucket rolls over - no cron job needed.
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seededShuffle(arr, seed) {
  const rand = mulberry32(seed);
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

router.get('/discover/featured', asyncHandler(async (req, res) => {
  const bucket = Math.floor(Date.now() / FOUR_HOURS_MS);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // ---- featured projects ----
  // criteria: publicly visible, still recruiting or active, and still has at
  // least one open role (no point featuring something fully staffed).
  // score = recency (fades over ~2 weeks) + recent momentum (applications/
  // messages/tasks in the last 7 days) - this favors projects that are both
  // new AND currently getting real activity, not just old popular ones.
  const candidateProjects = await prisma.project.findMany({
    where: { visibility: 'PUBLIC', status: { in: ['RECRUITING', 'ACTIVE'] } },
    include: {
      owner: { select: { id: true, name: true, profilePic: true } },
      roles: { include: { memberships: { where: { active: true } } } }
    },
    orderBy: { createdAt: 'desc' },
    take: 60
  });
  const projectIds = candidateProjects.map(p => p.id);

  const [recentApps, recentMsgs, recentTasks] = await Promise.all([
    prisma.application.groupBy({ by: ['projectId'], where: { projectId: { in: projectIds }, createdAt: { gte: sevenDaysAgo } }, _count: true }),
    prisma.message.groupBy({ by: ['projectId'], where: { projectId: { in: projectIds }, createdAt: { gte: sevenDaysAgo } }, _count: true }),
    prisma.task.groupBy({ by: ['projectId'], where: { projectId: { in: projectIds }, createdAt: { gte: sevenDaysAgo } }, _count: true })
  ]);
  const appMap = Object.fromEntries(recentApps.map(r => [r.projectId, r._count]));
  const msgMap = Object.fromEntries(recentMsgs.map(r => [r.projectId, r._count]));
  const taskMap = Object.fromEntries(recentTasks.map(r => [r.projectId, r._count]));

  const scoredProjects = candidateProjects
    .map(p => {
      const totalSlots = p.roles.reduce((s, r) => s + r.slots, 0);
      const filledSlots = p.roles.reduce((s, r) => s + r.memberships.length, 0);
      const hasOpenRole = filledSlots < totalSlots;
      const ageDays = (Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      const recencyScore = Math.max(0, 14 - ageDays);
      const momentumScore = (appMap[p.id] || 0) * 2 + (msgMap[p.id] || 0) * 0.5 + (taskMap[p.id] || 0);
      return { project: p, score: recencyScore + momentumScore, hasOpenRole };
    })
    .filter(s => s.hasOpenRole)
    .sort((a, b) => b.score - a.score);

  const projectPool = scoredProjects.slice(0, CANDIDATE_POOL_SIZE).map(s => ({
    ...s.project,
    roles: s.project.roles.map(r => ({ ...r, filledSlots: r.memberships.length }))
  }));
  const featuredProjects = seededShuffle(projectPool, bucket).slice(0, FEATURED_COUNT);

  // ---- featured builders ----
  // criteria: only people who've actually opened themselves up to being
  // found (open to projects/co-founding/freelance) - featuring someone who
  // didn't ask to be found is the wrong kind of "active". Scored by recent
  // messages sent + recent project joins in the last 7 days: "very active"
  // measured as real recent participation, not profile completeness.
  const candidateBuilders = await prisma.user.findMany({
    where: { OR: [{ openToProjects: true }, { openToCofounder: true }, { openToFreelance: true }] },
    select: { id: true, name: true, headline: true, profilePic: true, userSkills: { include: { skill: true } } },
    take: 60
  });
  const builderIds = candidateBuilders.map(u => u.id);

  const [recentMessageCounts, recentJoins] = await Promise.all([
    prisma.message.groupBy({ by: ['authorId'], where: { authorId: { in: builderIds }, createdAt: { gte: sevenDaysAgo } }, _count: true }),
    prisma.membership.groupBy({ by: ['userId'], where: { userId: { in: builderIds }, joinedAt: { gte: sevenDaysAgo } }, _count: true })
  ]);
  const recentMsgMap = Object.fromEntries(recentMessageCounts.map(r => [r.authorId, r._count]));
  const recentJoinMap = Object.fromEntries(recentJoins.map(r => [r.userId, r._count]));

  const scoredBuilders = candidateBuilders
    .map(u => ({ user: u, score: (recentMsgMap[u.id] || 0) + (recentJoinMap[u.id] || 0) * 3 }))
    .sort((a, b) => b.score - a.score);

  const builderPool = scoredBuilders.slice(0, CANDIDATE_POOL_SIZE).map(s => s.user);
  // offset seed by 1 so the builder shuffle order isn't identical to the project shuffle
  const featuredBuilders = seededShuffle(builderPool, bucket + 1).slice(0, FEATURED_COUNT);

  res.json({
    projects: featuredProjects,
    builders: featuredBuilders,
    rotatesAt: (bucket + 1) * FOUR_HOURS_MS
  });
}));

module.exports = router;
