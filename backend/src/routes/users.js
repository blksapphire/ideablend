const express = require('express');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const prisma = require('../prisma');
const { requireAuth } = require('../middlewares/authMiddleware');
const { getUserStats } = require('../lib/userStats');
const { asyncHandler } = require('../lib/asyncHandler');
const { requireIntParam } = require('../lib/validate');

const router = express.Router();

const AVATAR_DIR = path.join(__dirname, '..', '..', 'uploads', 'avatars');
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB - a profile photo, not a document
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AVATAR_DIR),
  filename: (req, file, cb) => cb(null, crypto.randomBytes(16).toString('hex') + path.extname(file.originalname))
});
const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: MAX_AVATAR_SIZE },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('avatar must be an image'));
    cb(null, true);
  }
});

const PUBLIC_SELECT = {
  id: true, name: true, headline: true, bio: true, skills: true,
  githubUrl: true, portfolioUrl: true, linkedinUrl: true, websiteUrl: true,
  location: true, timezone: true, profilePic: true,
  openToProjects: true, openToCofounder: true, openToFreelance: true, openToEmployment: true,
  availability: true,
  userSkills: { include: { skill: true } }
};

// search/browse builders by name, headline, or skill - public, no auth
// needed to browse, same pattern as project browsing
router.get('/', asyncHandler(async (req, res) => {
  const { q, skill } = req.query;
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 12));

  const where = { isBanned: false };
  if (q) where.OR = [{ name: { contains: q, mode: 'insensitive' } }, { headline: { contains: q, mode: 'insensitive' } }];
  if (skill) where.userSkills = { some: { skill: { name: { equals: skill, mode: 'insensitive' } } } };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where, select: PUBLIC_SELECT,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize, take: pageSize
    }),
    prisma.user.count({ where })
  ]);

  // stats aren't computed per-user here (would be N+1 queries against
  // reviews/memberships for every result) - list view shows profile+skills
  // only, full stats load on the single-profile page
  res.json({ users, page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
}));

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { ...PUBLIC_SELECT, email: true, isAdmin: true }
  });
  const stats = await getUserStats(req.user.id);
  res.json({ ...user, stats });
}));

const VALID_AVAILABILITY = ['HOURS_5_10', 'HOURS_10_20', 'HOURS_20_40', 'FULL_TIME'];

router.patch('/me', requireAuth, asyncHandler(async (req, res) => {
  const {
    name, headline, bio, skills, githubUrl, portfolioUrl, linkedinUrl, websiteUrl,
    location, timezone, profilePic, openToProjects, openToCofounder, openToFreelance,
    openToEmployment, availability
  } = req.body;

  if (availability !== undefined && availability !== null && !VALID_AVAILABILITY.includes(availability)) {
    return res.status(400).json({ error: 'invalid availability value' });
  }

  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      name, headline, bio, skills, githubUrl, portfolioUrl, linkedinUrl, websiteUrl,
      location, timezone, profilePic,
      openToProjects: openToProjects !== undefined ? Boolean(openToProjects) : undefined,
      openToCofounder: openToCofounder !== undefined ? Boolean(openToCofounder) : undefined,
      openToFreelance: openToFreelance !== undefined ? Boolean(openToFreelance) : undefined,
      openToEmployment: openToEmployment !== undefined ? Boolean(openToEmployment) : undefined,
      availability
    },
    select: { ...PUBLIC_SELECT, email: true, isAdmin: true }
  });
  res.json(updated);
}));

router.post('/me/avatar', requireAuth, (req, res, next) => {
  uploadAvatar.single('avatar')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no image provided' });
  const profilePic = `/avatars/${req.file.filename}`;
  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: { profilePic },
    select: { ...PUBLIC_SELECT, email: true, isAdmin: true }
  });
  res.json(updated);
}));

// attach or update a tagged skill on your own profile. Creates the Skill
// tag if it doesn't exist yet (so anyone can introduce a new skill name).
router.post('/me/skills', requireAuth, asyncHandler(async (req, res) => {
  const { name, level } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'skill name required' });
  const lvl = level ? Number(level) : 3;
  if (!Number.isInteger(lvl) || lvl < 1 || lvl > 5) {
    return res.status(400).json({ error: 'level must be an integer 1-5' });
  }

  const skill = await prisma.skill.upsert({
    where: { name: name.trim() },
    update: {},
    create: { name: name.trim() }
  });

  const userSkill = await prisma.userSkill.upsert({
    where: { userId_skillId: { userId: req.user.id, skillId: skill.id } },
    update: { level: lvl },
    create: { userId: req.user.id, skillId: skill.id, level: lvl }
  });

  res.json({ ...userSkill, skill });
}));

router.delete('/me/skills/:skillId', requireAuth, asyncHandler(async (req, res) => {
  const skillId = requireIntParam(req.params.skillId, 'skill id');
  await prisma.userSkill.deleteMany({ where: { userId: req.user.id, skillId } });
  res.json({ ok: true });
}));

// public view of another builder's profile
router.get('/:id', asyncHandler(async (req, res) => {
  const id = requireIntParam(req.params.id, 'user id');
  const user = await prisma.user.findUnique({ where: { id }, select: PUBLIC_SELECT });
  if (!user) return res.status(404).json({ error: 'not found' });
  const stats = await getUserStats(id);
  res.json({ ...user, stats });
}));

module.exports = router;
