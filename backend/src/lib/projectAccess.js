const prisma = require('../prisma');

async function assertMember(projectId, userId) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return { error: 'not found', code: 404 };
  if (project.ownerId === userId) return { project, isOwner: true };
  const membership = await prisma.membership.findFirst({ where: { projectId, userId, active: true } });
  if (!membership) return { error: 'not a project member', code: 403 };
  return { project, isOwner: false };
}

// owner + everyone with an active membership on this project, excluding
// one user id (typically whoever triggered the action, so they don't get
// notified about their own move)
async function getOtherMemberIds(projectId, excludeUserId) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return [];
  const memberships = await prisma.membership.findMany({ where: { projectId, active: true }, select: { userId: true } });
  const ids = new Set([project.ownerId, ...memberships.map(m => m.userId)]);
  ids.delete(excludeUserId);
  return Array.from(ids);
}

module.exports = { assertMember, getOtherMemberIds };
