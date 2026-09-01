const prisma = require('../prisma');

async function assertMember(projectId, userId) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return { error: 'not found', code: 404 };
  if (project.ownerId === userId) return { project, isOwner: true };
  const membership = await prisma.membership.findFirst({ where: { projectId, userId, active: true } });
  if (!membership) return { error: 'not a project member', code: 403 };
  return { project, isOwner: false };
}

module.exports = { assertMember };
