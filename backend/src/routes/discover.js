const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();
const asyncHandler = require('../lib/asyncHandler');
const { authenticateToken } = require('../lib/auth');

// Personalized Discover: Get recommended projects based on user profile
router.get('/discover/projects', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;
  
  // Get user's profile
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { userSkills: { include: { skill: true } } }
  });
  
  const userSkillIds = user.userSkills.map(us => us.skillId);
  
  // Get projects where user:
  // 1. hasn't already applied or joined
  // 2. status is RECRUITING
  // 3. has matching skills with roles
  // 4. availability and commitment type align
  
  const projects = await prisma.project.findMany({
    where: {
      status: 'RECRUITING',
      AND: [
        {
          applications: {
            none: { userId }
          }
        },
        {
          memberships: {
            none: { userId }
          }
        }
      ]
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          profilePic: true,
          headline: true
        }
      },
      roles: {
        include: {
          roleSkills: {
            include: { skill: true }
          },
          memberships: true,
          applications: true
        }
      }
    },
    skip,
    take: parseInt(limit) || 10
  });
  
  // Score projects based on skill match, availability, commitment
  const scoredProjects = projects.map(project => {
    let score = 0;
    
    // Score based on role skill matches
    project.roles.forEach(role => {
      const matchingSkills = role.roleSkills.filter(rs => userSkillIds.includes(rs.skillId));
      score += matchingSkills.length * 10; // 10 points per matching skill
      
      // Bonus if user meets experience level
      if (role.experience === 'ANY') score += 5;
      if (role.experience === 'JUNIOR' && !user.isAdmin) score += 3;
      if (role.experience === 'MID') score += 5;
      if (role.experience === 'SENIOR') score += 8;
      
      // Score based on availability match
      if (role.commitment === 'VOLUNTEER' && user.availability === 'HOURS_5_10') score += 8;
      if (role.commitment === 'PAID' && user.openToEmployment) score += 10;
      if (role.commitment === 'EQUITY' && user.openToCofounder) score += 10;
      
      // Availability band match
      if (role.commitment === 'FULL_TIME' && user.availability === 'FULL_TIME') score += 8;
      if (role.commitment === 'HOURS_20_40' && ['HOURS_20_40', 'FULL_TIME'].includes(user.availability)) score += 6;
    });
    
    // Bonus for projects in early stages (more room to grow)
    if (project.stage === 'IDEA') score += 3;
    if (project.stage === 'PLANNING') score += 2;
    
    return { ...project, _score: score };
  });
  
  // Sort by score descending
  const sorted = scoredProjects.sort((a, b) => b._score - a._score);
  
  res.json({
    projects: sorted.map(p => {
      const { _score, ...project } = p;
      return { ...project, matchScore: _score };
    }),
    page,
    limit,
    total: sorted.length
  });
}));

// Personalized Discover: Get recommended builders based on user profile
router.get('/discover/builders', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;
  
  // Get user's profile
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { userSkills: { include: { skill: true } } }
  });
  
  const userSkillIds = user.userSkills.map(us => us.skillId);
  
  // Find users who:
  // 1. are open to projects/cofounder/freelance/employment
  // 2. are not already friends
  // 3. have complementary skills
  // 4. are not the current user
  // 5. are not banned/removed
  
  const builders = await prisma.user.findMany({
    where: {
      id: { not: userId },
      isRemoved: false,
      isBanned: false,
      OR: [
        { openToProjects: true },
        { openToCofounder: true },
        { openToFreelance: true },
        { openToEmployment: true }
      ]
    },
    include: {
      userSkills: { include: { skill: true } },
      ownedProjects: true,
      memberships: true
    },
    skip,
    take: parseInt(limit) || 10
  });
  
  // Score builders based on:
  // 1. Skill overlap with user
  // 2. Complementary skills (skills user doesn't have)
  // 3. Active projects they're involved in
  // 4. Profile completeness
  
  const scoredBuilders = builders.map(builder => {
    let score = 0;
    const builderSkillIds = builder.userSkills.map(us => us.skillId);
    
    // Matching skills
    const matchingSkills = builderSkillIds.filter(id => userSkillIds.includes(id));
    score += matchingSkills.length * 8;
    
    // Complementary skills (they have, user doesn't)
    const complementarySkills = builderSkillIds.filter(id => !userSkillIds.includes(id));
    score += complementarySkills.length * 5;
    
    // Active project involvement
    score += builder.memberships.length * 3;
    score += builder.ownedProjects.length * 5;
    
    // Profile completeness bonus
    if (builder.name) score += 2;
    if (builder.profilePic) score += 2;
    if (builder.headline) score += 2;
    if (builder.bio) score += 2;
    if (builder.location) score += 1;
    
    // Availability bonus
    if (builder.openToCofounder) score += 8;
    if (builder.openToProjects) score += 5;
    
    return { ...builder, _score: score };
  });
  
  // Sort by score descending
  const sorted = scoredBuilders.sort((a, b) => b._score - a._score);
  
  res.json({
    builders: sorted.map(b => {
      const { _score, ...builder } = b;
      return {
        id: builder.id,
        name: builder.name,
        profilePic: builder.profilePic,
        headline: builder.headline,
        bio: builder.bio,
        location: builder.location,
        skills: builder.userSkills.map(us => ({ id: us.skill.id, name: us.skill.name, level: us.level })),
        projectsCount: builder.ownedProjects.length + builder.memberships.length,
        openToProjects: builder.openToProjects,
        openToCofounder: builder.openToCofounder,
        openToFreelance: builder.openToFreelance,
        openToEmployment: builder.openToEmployment,
        matchScore: _score
      };
    }),
    page,
    limit,
    total: sorted.length
  });
}));

module.exports = router;
