const prisma = require('../prisma');

// activates a membership for (projectId, roleId, userId), reusing an
// existing row if this person has ever held that exact role before (even if
// it's currently inactive) rather than creating a duplicate - the unique
// constraint on (roleId, userId) doesn't care whether the old row is active,
// so a blind `create` fails the moment someone cycles back into a role
// they've held previously.
async function activateMembership(tx, { projectId, roleId, userId }) {
  const existing = await tx.membership.findUnique({ where: { roleId_userId: { roleId, userId } } });
  if (existing) {
    return tx.membership.update({
      where: { id: existing.id },
      data: { active: true, joinedAt: new Date() }
    });
  }
  return tx.membership.create({ data: { projectId, roleId, userId } });
}

module.exports = { activateMembership };
