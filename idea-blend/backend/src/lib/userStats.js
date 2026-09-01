const prisma = require('../prisma');

// completedProjects: how many COMPLETED projects this person was owner or an
// active member of.
async function countCompletedProjects(userId) {
  const owned = await prisma.project.count({ where: { ownerId: userId, status: 'COMPLETED' } });
  const joined = await prisma.membership.count({
    where: { userId, active: true, project: { status: 'COMPLETED' } }
  });
  return owned + joined;
}

// responseRate: of all applications received on projects this person owns,
// what fraction did they actually act on (accept or reject) rather than
// leave pending? Applicants who withdrew aren't held against the owner.
// Returns null if they've never received an application - there's nothing
// to measure yet, and 0% would misleadingly read as "ignores everyone".
async function computeResponseRate(userId) {
  const received = await prisma.application.findMany({
    where: { project: { ownerId: userId }, status: { not: 'WITHDRAWN' } },
    select: { status: true }
  });
  if (received.length === 0) return null;
  const actioned = received.filter(a => a.status !== 'PENDING').length;
  return Math.round((actioned / received.length) * 100);
}

// averageRating: mean of star ratings (1-5) left by actual teammates after a
// project completed. This replaces an earlier proxy metric (ratio of
// applications that ended in confirmation) that existed before real peer
// review data was available - now that reviews exist, the proxy is gone.
// Returns null (not 0) when nobody's reviewed them yet.
async function computeRatingStats(userId) {
  const agg = await prisma.review.aggregate({
    where: { revieweeId: userId },
    _avg: { rating: true },
    _count: { rating: true }
  });
  return {
    averageRating: agg._count.rating > 0 ? Math.round(agg._avg.rating * 10) / 10 : null,
    reviewCount: agg._count.rating
  };
}

async function getUserStats(userId) {
  const [completedProjects, responseRate, ratingStats] = await Promise.all([
    countCompletedProjects(userId),
    computeResponseRate(userId),
    computeRatingStats(userId)
  ]);
  return { completedProjects, responseRate, ...ratingStats };
}

module.exports = { getUserStats };
