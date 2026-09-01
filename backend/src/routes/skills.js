const express = require('express');
const prisma = require('../prisma');
const { requireAuth } = require('../middlewares/authMiddleware');
const { asyncHandler } = require('../lib/asyncHandler');

const router = express.Router();

// ?q= filters by name, used for a type-ahead when tagging skills
router.get('/', asyncHandler(async (req, res) => {
  const { q } = req.query;
  const skills = await prisma.skill.findMany({
    where: q ? { name: { contains: q, mode: 'insensitive' } } : undefined,
    orderBy: { name: 'asc' },
    take: 50
  });
  res.json(skills);
}));

// explicit creation, separate from the auto-create inside /users/me/skills,
// for a future "manage skill tags" admin view
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'name required' });
  const skill = await prisma.skill.upsert({
    where: { name: name.trim() },
    update: {},
    create: { name: name.trim() }
  });
  res.json(skill);
}));

module.exports = router;
