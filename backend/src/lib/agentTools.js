const prisma = require('../prisma');

// Tool definitions in Anthropic's format.
// Phase 1: read-only. Write tools are prepared but gated behind confirmation
// in Phase 2 — they return a preview object, not an executed action.
const TOOL_DEFINITIONS = [
  {
    name: 'get_my_projects',
    description: 'Get the projects the current user owns or is a confirmed member of.',
    input_schema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'get_project_detail',
    description: 'Get full detail for a specific project: description, roles, team members, open slots, and recent activity.',
    input_schema: {
      type: 'object',
      properties: {
        projectId: { type: 'number', description: 'The project id' }
      },
      required: ['projectId']
    }
  },
  {
    name: 'get_workspace_summary',
    description: 'Get a summary of a project workspace: task progress, open milestones, and recent activity. Use this when someone asks how a project is going.',
    input_schema: {
      type: 'object',
      properties: {
        projectId: { type: 'number', description: 'The project id' }
      },
      required: ['projectId']
    }
  },
  {
    name: 'search_projects',
    description: 'Search for projects on the platform by title, description, category, or stage. Returns open projects with available roles.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        category: { type: 'string', description: 'Filter by category (e.g. fintech, mobile)' },
        stage: { type: 'string', description: 'Filter by stage (IDEA, MVP, BETA, LIVE)' },
        commitment: { type: 'string', description: 'Filter by commitment (VOLUNTEER, EQUITY, PAID)' }
      },
      required: []
    }
  },
  {
    name: 'search_builders',
    description: 'Search for builders on the platform by name, headline, or skill. Only returns builders who are open to joining projects.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search by name or headline' },
        skill: { type: 'string', description: 'Filter by a specific skill (e.g. React, Python)' }
      },
      required: []
    }
  },
  {
    name: 'get_my_applications',
    description: 'Get the current user\'s project applications and their statuses.',
    input_schema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'get_my_notifications',
    description: 'Get recent unread notifications for the current user.',
    input_schema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'get_recommended_projects',
    description: 'Get projects recommended for the current user based on their skills, availability, and project owner reputation. Use this when someone asks what they should work on or what projects match them.',
    input_schema: {
      type: 'object',
      properties: {},
      required: []
    }
  }
];

// Tool executors — plain async functions, no HTTP, direct Prisma.
// Each returns a serialisable object; the agent sees this as its tool_result.
async function executeTool(toolName, input, userId) {
  switch (toolName) {
    case 'get_my_projects': {
      const [owned, memberships] = await Promise.all([
        prisma.project.findMany({
          where: { ownerId: userId },
          select: { id: true, title: true, status: true, stage: true, commitment: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 10
        }),
        prisma.membership.findMany({
          where: { userId, active: true },
          include: { project: { select: { id: true, title: true, status: true, stage: true } } },
          orderBy: { joinedAt: 'desc' },
          take: 10
        })
      ]);
      return {
        owned: owned.map(p => ({ id: p.id, title: p.title, status: p.status, stage: p.stage })),
        joined: memberships.map(m => ({ id: m.project.id, title: m.project.title, status: m.project.status }))
      };
    }

    case 'get_project_detail': {
      const project = await prisma.project.findUnique({
        where: { id: Number(input.projectId) },
        include: {
          owner: { select: { id: true, name: true } },
          roles: {
            include: {
              memberships: { where: { active: true }, include: { user: { select: { id: true, name: true } } } },
              roleSkills: { include: { skill: true } }
            }
          }
        }
      });
      if (!project) return { error: 'Project not found' };
      return {
        id: project.id,
        title: project.title,
        description: project.description,
        status: project.status,
        stage: project.stage,
        commitment: project.commitment,
        owner: project.owner.name,
        roles: project.roles.map(r => ({
          name: r.name,
          slots: r.slots,
          filled: r.memberships.length,
          open: r.slots - r.memberships.length,
          skills: r.roleSkills.map(rs => rs.skill.name),
          members: r.memberships.map(m => m.user.name)
        }))
      };
    }

    case 'get_workspace_summary': {
      const projectId = Number(input.projectId);
      const [tasks, milestones, activity] = await Promise.all([
        prisma.task.findMany({ where: { projectId }, select: { title: true, status: true } }),
        prisma.milestone.findMany({ where: { projectId }, select: { title: true, completed: true } }),
        prisma.activity.findMany({
          where: { projectId },
          include: { actor: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10
        })
      ]);
      const byStatus = tasks.reduce((acc, t) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; }, {});
      return {
        tasks: {
          total: tasks.length,
          byStatus,
          done: byStatus.DONE || 0,
          inProgress: byStatus.IN_PROGRESS || 0,
          todo: byStatus.TODO || 0
        },
        milestones: {
          total: milestones.length,
          completed: milestones.filter(m => m.completed).length,
          open: milestones.filter(m => !m.completed).map(m => m.title)
        },
        recentActivity: activity.map(a => `${a.actor?.name || 'Someone'}: ${a.message}`)
      };
    }

    case 'search_projects': {
      const where = { visibility: 'PUBLIC', status: { in: ['RECRUITING', 'ACTIVE'] } };
      if (input.query) where.OR = [
        { title: { contains: input.query, mode: 'insensitive' } },
        { description: { contains: input.query, mode: 'insensitive' } }
      ];
      if (input.category) where.category = input.category;
      if (input.stage) where.stage = input.stage;
      if (input.commitment) where.commitment = input.commitment;

      const projects = await prisma.project.findMany({
        where,
        include: {
          owner: { select: { name: true } },
          roles: { include: { memberships: { where: { active: true } } } }
        },
        take: 8,
        orderBy: { createdAt: 'desc' }
      });

      return projects.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description.slice(0, 120),
        stage: p.stage,
        commitment: p.commitment,
        owner: p.owner.name,
        openRoles: p.roles
          .filter(r => r.memberships.length < r.slots)
          .map(r => r.name)
      }));
    }

    case 'search_builders': {
      const where = { isBanned: false };
      if (input.query) where.OR = [
        { name: { contains: input.query, mode: 'insensitive' } },
        { headline: { contains: input.query, mode: 'insensitive' } }
      ];
      if (input.skill) where.userSkills = { some: { skill: { name: { equals: input.skill, mode: 'insensitive' } } } };

      const users = await prisma.user.findMany({
        where,
        select: {
          id: true, name: true, headline: true, location: true, availability: true,
          userSkills: { include: { skill: true } }
        },
        take: 8
      });

      return users.map(u => ({
        id: u.id,
        name: u.name,
        headline: u.headline,
        location: u.location,
        availability: u.availability,
        skills: u.userSkills.map(us => us.skill.name)
      }));
    }

    case 'get_my_applications': {
      const apps = await prisma.application.findMany({
        where: { userId },
        include: {
          project: { select: { id: true, title: true } },
          role: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });
      return apps.map(a => ({
        projectId: a.project.id,
        project: a.project.title,
        role: a.role.name,
        status: a.status,
        appliedAt: a.createdAt.toISOString().slice(0, 10)
      }));
    }

    case 'get_my_notifications': {
      const notifications = await prisma.notification.findMany({
        where: { userId, read: false },
        orderBy: { createdAt: 'desc' },
        take: 10
      });
      return notifications.map(n => ({
        type: n.type,
        message: n.message,
        link: n.link,
        createdAt: n.createdAt.toISOString().slice(0, 10)
      }));
    }

    case 'get_recommended_projects': {
      const viewerSkills = await prisma.userSkill.findMany({
        where: { userId },
        select: { skill: { select: { name: true } } }
      });
      const viewerSkillNames = new Set(viewerSkills.map(s => s.skill.name.toLowerCase()));

      const candidates = await prisma.project.findMany({
        where: {
          visibility: 'PUBLIC',
          status: { in: ['RECRUITING', 'ACTIVE'] },
          ownerId: { not: userId }
        },
        include: {
          owner: { select: { name: true } },
          roles: {
            include: {
              memberships: { where: { active: true } },
              roleSkills: { include: { skill: true } }
            }
          }
        },
        take: 30,
        orderBy: { createdAt: 'desc' }
      });

      const scored = candidates.map(p => {
        const projectSkills = new Set(p.roles.flatMap(r => r.roleSkills.map(rs => rs.skill.name.toLowerCase())));
        const overlap = [...projectSkills].filter(s => viewerSkillNames.has(s)).length;
        const hasOpen = p.roles.some(r => r.memberships.length < r.slots);
        return { project: p, score: overlap * 10, hasOpen };
      })
        .filter(s => s.hasOpen)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      return scored.map(s => ({
        id: s.project.id,
        title: s.project.title,
        description: s.project.description.slice(0, 100),
        stage: s.project.stage,
        matchReason: s.score > 0 ? `${s.score / 10} skill(s) in common` : 'Recently posted'
      }));
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

module.exports = { TOOL_DEFINITIONS, executeTool };
