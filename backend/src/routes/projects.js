const express = require('express');
const prisma = require('../prisma');
const { requireAuth, optionalAuth } = require('../middlewares/authMiddleware');
const { asyncHandler } = require('../lib/asyncHandler');
const { requireIntParam, requireFields } = require('../lib/validate');
const { logActivity } = require('../lib/activity');

const router = express.Router();

const VALID_STAGES = ['IDEA', 'PLANNING', 'MVP', 'BETA', 'LIVE', 'COMPLETED', 'ARCHIVED'];
const VALID_TYPES = ['STARTUP', 'OPEN_SOURCE', 'SIDE_PROJECT', 'HACKATHON', 'RESEARCH', 'COMMUNITY', 'EXPERIMENTAL'];
const VALID_COMMITMENTS = ['VOLUNTEER', 'EQUITY', 'PAID', 'MIXED'];
const VALID_EXPERIENCE = ['ANY', 'JUNIOR', 'MID', 'SENIOR'];

const ROLE_INCLUDE = { roleSkills: { include: { skill: true } }, memberships: { where: { active: true }, include: { user: { select: { id: true, name: true, profilePic: true } } } } };

// create a project with its roles in one call
// body: { title, description, category, stage, type, commitment,
//         roles: [{ name, slots, description, experience, commitment, skills: [{ name, level }] }] }
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const { title, description, category, stage, type, commitment, roles } = req.body;
  requireFields(req.body, ['title', 'description']);
  if (!Array.isArray(roles) || roles.length === 0) {
    const err = new Error('at least one role required');
    err.status = 400;
    throw err;
  }
  const badRole = roles.find(r => !r.name || !r.name.trim());
  if (badRole) {
    const err = new Error('every role needs a name');
    err.status = 400;
    throw err;
  }
  if (stage && !VALID_STAGES.includes(stage)) return res.status(400).json({ error: 'invalid stage' });
  if (type && !VALID_TYPES.includes(type)) return res.status(400).json({ error: 'invalid type' });
  if (commitment && !VALID_COMMITMENTS.includes(commitment)) return res.status(400).json({ error: 'invalid commitment' });
  for (const r of roles) {
    if (r.experience && !VALID_EXPERIENCE.includes(r.experience)) return res.status(400).json({ error: `invalid experience for role ${r.name}` });
    if (r.commitment && !VALID_COMMITMENTS.includes(r.commitment)) return res.status(400).json({ error: `invalid commitment for role ${r.name}` });
  }

  // resolve every skill name mentioned across all roles to a Skill id up
  // front (creating new tags as needed), so the nested role creation below
  // can reference them directly instead of needing a second pass
  const allSkillNames = [...new Set(roles.flatMap(r => (r.skills || []).map(s => s.name?.trim()).filter(Boolean)))];
  const skillIdByName = {};
  for (const name of allSkillNames) {
    const skill = await prisma.skill.upsert({ where: { name }, update: {}, create: { name } });
    skillIdByName[name] = skill.id;
  }

  const project = await prisma.project.create({
    data: {
      title,
      description,
      category,
      stage: stage || undefined,
      type: type || undefined,
      commitment: commitment || undefined,
      ownerId: req.user.id,
      roles: {
        create: roles.map(r => ({
          name: r.name.trim(),
          slots: Math.max(1, Number(r.slots) || 1),
          description: r.description || undefined,
          experience: r.experience || undefined,
          commitment: r.commitment || undefined,
          roleSkills: {
            create: (r.skills || [])
              .filter(s => s.name && s.name.trim() && skillIdByName[s.name.trim()])
              .map(s => ({ skillId: skillIdByName[s.name.trim()], level: Math.min(5, Math.max(1, Number(s.level) || 3)) }))
          }
        }))
      }
    },
    include: { roles: { include: ROLE_INCLUDE }, owner: { select: { id: true, name: true, profilePic: true } } }
  });

  res.json(withFilledCounts([project])[0]);
}));

// browse projects: ?q=&category=&status=&stage=&type=&commitment=&page=&pageSize=
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { q, category, status, stage, type, commitment } = req.query;
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 12));

  const where = {};
  if (q) where.OR = [{ title: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }];
  if (category) where.category = category;
  if (status) where.status = status;
  if (stage) where.stage = stage;
  if (type) where.type = type;
  if (commitment) where.commitment = commitment;
  // hide completed+private projects from browse unless you're the owner
  where.NOT = { AND: [{ status: 'COMPLETED' }, { visibility: 'PRIVATE' }] };

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, profilePic: true } },
        roles: { include: ROLE_INCLUDE }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.project.count({ where })
  ]);

  res.json({
    projects: withFilledCounts(projects),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  });
}));

// the logged-in user's own dashboard: projects they own, and projects
// they've joined as a confirmed member. Must be declared before /:id or
// Express would try to parse "mine" as a project id.
router.get('/mine', requireAuth, asyncHandler(async (req, res) => {
  const include = {
    owner: { select: { id: true, name: true, profilePic: true } },
    roles: { include: ROLE_INCLUDE }
  };

  const [owned, memberships] = await Promise.all([
    prisma.project.findMany({ where: { ownerId: req.user.id }, include, orderBy: { createdAt: 'desc' } }),
    prisma.membership.findMany({
      where: { userId: req.user.id, active: true },
      include: { project: { include } },
      orderBy: { joinedAt: 'desc' }
    })
  ]);

  // a person can own a project and also hold a role on it (see schema notes),
  // so dedupe joined-by-membership against the owned list
  const ownedIds = new Set(owned.map(p => p.id));
  const joinedMap = new Map();
  memberships.forEach(m => { if (!ownedIds.has(m.project.id)) joinedMap.set(m.project.id, m.project); });

  res.json({
    owned: withFilledCounts(owned),
    joined: withFilledCounts(Array.from(joinedMap.values()))
  });
}));

// project detail, including roster and task/message counts
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const id = requireIntParam(req.params.id, 'project id');
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, profilePic: true } },
      roles: { include: ROLE_INCLUDE },
      tasks: true
    }
  });
  if (!project) return res.status(404).json({ error: 'not found' });
  res.json(withFilledCounts([project])[0]);
}));

// owner-only updates: status, visibility, stage/type/commitment, description edits
router.patch('/:id', requireAuth, asyncHandler(async (req, res) => {
  const id = requireIntParam(req.params.id, 'project id');
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return res.status(404).json({ error: 'not found' });
  if (project.ownerId !== req.user.id) return res.status(403).json({ error: 'not owner' });

  const { title, description, category, status, visibility, repoUrl, stage, type, commitment } = req.body;
  if (stage && !VALID_STAGES.includes(stage)) return res.status(400).json({ error: 'invalid stage' });
  if (type && !VALID_TYPES.includes(type)) return res.status(400).json({ error: 'invalid type' });
  if (commitment && !VALID_COMMITMENTS.includes(commitment)) return res.status(400).json({ error: 'invalid commitment' });

  const willComplete = status === 'COMPLETED' && project.status !== 'COMPLETED';

  const [updated] = await prisma.$transaction(async (tx) => {
    const p = await tx.project.update({
      where: { id },
      data: { title, description, category, status, visibility, repoUrl, stage, type, commitment }
    });
    if (willComplete) {
      await logActivity(tx, { projectId: id, actorId: req.user.id, type: 'PROJECT_COMPLETED', message: `${req.user.name || 'The owner'} marked this project as completed` });
    }
    return [p];
  });
  res.json(updated);
}));

// owner adds a new role vacancy to an existing project - the counterpart
// to defining roles at creation time, since that was previously the only
// way to add one
router.post('/:id/roles', requireAuth, asyncHandler(async (req, res) => {
  const id = requireIntParam(req.params.id, 'project id');
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return res.status(404).json({ error: 'not found' });
  if (project.ownerId !== req.user.id) return res.status(403).json({ error: 'not owner' });

  const { name, slots, description, experience, commitment, skills } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'role name required' });
  if (experience && !VALID_EXPERIENCE.includes(experience)) return res.status(400).json({ error: 'invalid experience' });
  if (commitment && !VALID_COMMITMENTS.includes(commitment)) return res.status(400).json({ error: 'invalid commitment' });

  const skillNames = [...new Set((skills || []).map(s => s.name?.trim()).filter(Boolean))];
  const skillIdByName = {};
  for (const skillName of skillNames) {
    const skill = await prisma.skill.upsert({ where: { name: skillName }, update: {}, create: { name: skillName } });
    skillIdByName[skillName] = skill.id;
  }

  const role = await prisma.role.create({
    data: {
      projectId: id,
      name: name.trim(),
      slots: Math.max(1, Number(slots) || 1),
      description: description || undefined,
      experience: experience || undefined,
      commitment: commitment || undefined,
      roleSkills: {
        create: (skills || [])
          .filter(s => s.name && s.name.trim() && skillIdByName[s.name.trim()])
          .map(s => ({ skillId: skillIdByName[s.name.trim()], level: Math.min(5, Math.max(1, Number(s.level) || 3)) }))
      }
    },
    include: ROLE_INCLUDE
  });

  res.json({ ...role, filledSlots: 0 });
}));

// attach a computed `filledSlots` per role instead of trusting a stored count
function withFilledCounts(projects) {
  return projects.map(p => ({
    ...p,
    roles: p.roles?.map(r => ({
      ...r,
      filledSlots: r.memberships ? r.memberships.length : undefined
    }))
  }));
}

module.exports = router;
