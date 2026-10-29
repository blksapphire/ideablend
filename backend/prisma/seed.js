// Demo data for local development and the hosted showcase. Re-running replaces
// the demo projects and refreshes the demo accounts; real users are untouched.
// Runs via `npm run db:seed` (or `npx prisma db seed`).
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const DEMO_PASSWORD = process.env.SEED_PASSWORD || 'demo12345';
const DEMO_DOMAIN = '@example.com';

const daysAgo = n => new Date(Date.now() - Math.round(n * 24 * 60 * 60 * 1000));

const SKILLS = [
  'React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Python', 'PyTorch',
  'Machine Learning', 'React Native', 'UI/UX Design', 'Figma',
  'Product Management', 'Growth Marketing', 'Copywriting', 'Go',
  'Kubernetes', 'DevOps'
];

const USERS = [
  {
    email: `maya${DEMO_DOMAIN}`,
    name: 'Maya Chen',
    headline: 'Product designer turning messy workflows into calm interfaces',
    bio: 'Ten years of product design across fintech and climate. I care about the boring screens nobody notices until they break.',
    location: 'Berlin, Germany',
    timezone: 'Europe/Berlin',
    availability: 'HOURS_20_40',
    openToProjects: true,
    openToCofounder: true,
    isVerified: true,
    githubUrl: 'https://github.com/mayachen',
    portfolioUrl: 'https://mayachen.design',
    skills: [['UI/UX Design', 5], ['Figma', 5], ['Product Management', 4], ['Copywriting', 3]]
  },
  {
    email: `leo${DEMO_DOMAIN}`,
    name: 'Leo Martins',
    headline: 'Full-stack engineer, React + Postgres, prefers shipping to polishing',
    bio: 'Built and sold a scheduling tool for music teachers. Now looking for a team with a real problem and uncomfortable deadlines.',
    location: 'Lisbon, Portugal',
    timezone: 'Europe/Lisbon',
    availability: 'FULL_TIME',
    openToProjects: true,
    openToCofounder: false,
    isVerified: true,
    githubUrl: 'https://github.com/leomartins',
    websiteUrl: 'https://leomartins.dev',
    skills: [['React', 5], ['TypeScript', 5], ['Node.js', 5], ['PostgreSQL', 4], ['DevOps', 3]]
  },
  {
    email: `priya${DEMO_DOMAIN}`,
    name: 'Priya Nair',
    headline: 'ML engineer working on climate and logistics models',
    bio: 'I turn messy operational data into forecasts people actually act on. Previously at a freight startup.',
    location: 'Bengaluru, India',
    timezone: 'Asia/Kolkata',
    availability: 'HOURS_10_20',
    openToProjects: true,
    openToFreelance: true,
    isVerified: true,
    githubUrl: 'https://github.com/priyanair',
    linkedinUrl: 'https://www.linkedin.com/in/priyanair',
    skills: [['Python', 5], ['PyTorch', 5], ['Machine Learning', 5], ['PostgreSQL', 3]]
  },
  {
    email: `sam${DEMO_DOMAIN}`,
    name: 'Sam Okafor',
    headline: 'Mobile developer, React Native, offline-first by default',
    bio: 'Shipped field apps used on bad connections in three countries. Happiest when the app works in a basement.',
    location: 'Lagos, Nigeria',
    timezone: 'Africa/Lagos',
    availability: 'HOURS_10_20',
    openToProjects: true,
    githubUrl: 'https://github.com/samokafor',
    skills: [['React Native', 5], ['TypeScript', 4], ['React', 4]]
  },
  {
    email: `ines${DEMO_DOMAIN}`,
    name: 'Inés García',
    headline: 'Growth and community, early-stage products',
    bio: 'I find the first hundred users who care and keep them talking. Formerly community lead at a developer tools startup.',
    location: 'Madrid, Spain',
    timezone: 'Europe/Madrid',
    availability: 'HOURS_5_10',
    openToProjects: true,
    openToFreelance: true,
    linkedinUrl: 'https://www.linkedin.com/in/inesgarcia',
    skills: [['Growth Marketing', 5], ['Copywriting', 4], ['Product Management', 3]]
  },
  {
    email: `ken${DEMO_DOMAIN}`,
    name: 'Ken Watanabe',
    headline: 'Infrastructure engineer for databases that must not fall over',
    bio: 'On-call survivor. I like observability, boring deploys, and writing down what went wrong.',
    location: 'Tokyo, Japan',
    timezone: 'Asia/Tokyo',
    availability: 'HOURS_5_10',
    openToProjects: true,
    isVerified: true,
    githubUrl: 'https://github.com/kenwatanabe',
    skills: [['Go', 5], ['Kubernetes', 5], ['PostgreSQL', 5], ['DevOps', 5]]
  },
  {
    email: `amara${DEMO_DOMAIN}`,
    name: 'Amara Diallo',
    headline: 'Product manager who writes specs people read',
    bio: 'I have run products at two nonprofits and one very chaotic marketplace. Strong opinions about scoping.',
    location: 'Toronto, Canada',
    timezone: 'America/Toronto',
    availability: 'HOURS_10_20',
    openToProjects: true,
    openToCofounder: true,
    linkedinUrl: 'https://www.linkedin.com/in/amaradiallo',
    skills: [['Product Management', 5], ['Copywriting', 4], ['Growth Marketing', 3]]
  },
  {
    email: `noah${DEMO_DOMAIN}`,
    name: 'Noah Kim',
    headline: 'Frontend developer with an accessibility habit',
    bio: 'I build interfaces that work with a keyboard, a screen reader, and a three-year-old phone.',
    location: 'Seoul, South Korea',
    timezone: 'Asia/Seoul',
    availability: 'HOURS_20_40',
    openToProjects: true,
    githubUrl: 'https://github.com/noahkim',
    portfolioUrl: 'https://noahkim.dev',
    skills: [['React', 5], ['TypeScript', 4], ['UI/UX Design', 3]]
  }
];

const PROJECTS = [
  {
    key: 'kettle',
    owner: 'maya',
    title: 'Kettle',
    category: 'fintech',
    description: 'Shared money is where friendships go to die. Kettle is a small web app that lets flatmates pool a grocery budget, log receipts in seconds, and see who is actually owed what without a spreadsheet. We launch with a single trusted circle and no bank connections.',
    stage: 'MVP',
    type: 'SIDE_PROJECT',
    commitment: 'EQUITY',
    status: 'RECRUITING',
    daysAgo: 9,
    roles: [
      {
        name: 'Full-stack Engineer',
        description: 'Own the receipt capture flow end to end. React frontend, Node API, Postgres.',
        experience: 'MID',
        commitment: 'EQUITY',
        slots: 1,
        skills: [['React', 4], ['Node.js', 4], ['PostgreSQL', 3]]
      },
      {
        name: 'Product Designer',
        description: 'Design the two screens that decide whether people keep using this: shared balance and receipt entry.',
        experience: 'SENIOR',
        commitment: 'EQUITY',
        slots: 1,
        skills: [['UI/UX Design', 5], ['Figma', 4]]
      }
    ],
    tasks: [
      ['Sketch the shared balance screen', 'Product Designer', 'IN_PROGRESS'],
      ['Receipt image upload + OCR spike', 'Full-stack Engineer', 'TODO'],
      ['Decide on auth: magic link vs passkeys', null, 'IN_REVIEW'],
      ['Interview three flatmate groups', null, 'DONE']
    ],
    milestones: [
      ['Closed beta with five households', false, 3],
      ['Receipt capture under ten seconds', false, 14],
      ['Design system and first two flows', true, 20]
    ],
    messages: [
      ['maya', daysAgo(3), 'The balance screen draft is in Figma. I went with one number up top and a ledger below.'],
      ['maya', daysAgo(2), 'Leaning toward magic links for v1. Passkeys can wait until people trust the app with actual money.'],
      ['maya', daysAgo(1), 'Two more flatmate interviews booked for Thursday. The spreadsheet complaints are extremely consistent.']
    ],
    activities: [
      ['maya', 'MILESTONE_COMPLETED', 'Maya completed "Design system and first two flows"', 20],
      ['maya', 'TASK_CREATED', 'Maya created task "Sketch the shared balance screen"', 8],
      ['maya', 'TASK_COMPLETED', 'Maya completed task "Interview three flatmate groups"', 4]
    ]
  },
  {
    key: 'fieldnote',
    owner: 'ines',
    title: 'Fieldnote',
    category: 'productivity',
    description: 'Fieldnote is an offline-first notes app for NGO field workers. Teams capture observations, photos, and GPS points with no signal, then sync when they reach a connection. Built with a pilot group working on water quality in three regions.',
    stage: 'BETA',
    type: 'STARTUP',
    commitment: 'MIXED',
    status: 'ACTIVE',
    daysAgo: 74,
    roles: [
      {
        name: 'Engineering Lead',
        description: 'Own the sync engine and the API. Conflict resolution is the hard part.',
        experience: 'SENIOR',
        commitment: 'PAID',
        slots: 1,
        skills: [['Node.js', 5], ['PostgreSQL', 4], ['TypeScript', 4]],
        member: 'leo'
      },
      {
        name: 'Mobile Engineer',
        description: 'React Native app, offline storage, background sync.',
        experience: 'MID',
        commitment: 'PAID',
        slots: 1,
        skills: [['React Native', 5], ['TypeScript', 4]],
        member: 'sam'
      },
      {
        name: 'ML Engineer',
        description: 'Deduplicate observations and flag likely data-entry errors before sync.',
        experience: 'MID',
        commitment: 'MIXED',
        slots: 1,
        skills: [['Python', 4], ['Machine Learning', 4]],
        member: 'priya'
      }
    ],
    tasks: [
      ['Conflict resolution for concurrent edits', 'Engineering Lead', 'IN_PROGRESS'],
      ['Offline queue retry policy', 'Mobile Engineer', 'DONE'],
      ['Deduplicate photo observations', 'ML Engineer', 'TODO'],
      ['Pilot feedback review with three regions', null, 'DONE']
    ],
    milestones: [
      ['Sync engine handles two-way conflicts', true, 30],
      ['Pilot with three regions live', true, 12],
      ['Public beta with onboarding docs', false, 20]
    ],
    messages: [
      ['ines', daysAgo(5), 'Pilot call went well. Two regions asked for photo compression before upload.'],
      ['sam', daysAgo(4), 'Easy win, I will ship compression behind a setting.'],
      ['leo', daysAgo(3), 'Sync v2 is on staging. Please try breaking it with airplane mode.'],
      ['priya', daysAgo(1), 'Ran the duplicate detector over pilot data: 94 percent precision, false positives are blurry photos.']
    ],
    activities: [
      ['ines', 'MEMBER_JOINED', 'Leo joined as Engineering Lead', 70],
      ['ines', 'MEMBER_JOINED', 'Sam joined as Mobile Engineer', 58],
      ['ines', 'MEMBER_JOINED', 'Priya joined as ML Engineer', 41],
      ['leo', 'MILESTONE_COMPLETED', 'Leo completed "Sync engine handles two-way conflicts"', 30],
      ['ines', 'MILESTONE_COMPLETED', 'Inés completed "Pilot with three regions live"', 12]
    ]
  },
  {
    key: 'meridian',
    owner: 'ken',
    title: 'Meridian',
    category: 'developer tools',
    description: 'An open-source observability toolkit for Postgres. Meridian watches slow queries, lock contention, and bloat, then produces a plain-language report with the exact index or config change to try next. No agent, no SaaS account, just a binary and a dashboard.',
    stage: 'PLANNING',
    type: 'OPEN_SOURCE',
    commitment: 'VOLUNTEER',
    status: 'RECRUITING',
    daysAgo: 21,
    repoUrl: 'https://github.com/kenwatanabe/meridian',
    roles: [
      {
        name: 'Backend Engineer (Go)',
        description: 'Collectors for pg_stat_statements and lock waits, plus a sane config format.',
        experience: 'SENIOR',
        commitment: 'VOLUNTEER',
        slots: 1,
        skills: [['Go', 4], ['PostgreSQL', 5]]
      },
      {
        name: 'Frontend Engineer',
        description: 'A dashboard that reads like a report, not a wall of charts.',
        experience: 'MID',
        commitment: 'VOLUNTEER',
        slots: 1,
        skills: [['React', 4], ['TypeScript', 4]]
      }
    ],
    tasks: [
      ['Pick the first three collectors', 'Backend Engineer (Go)', 'DONE'],
      ['Wireframe the weekly report view', 'Frontend Engineer', 'TODO'],
      ['Write the contributor guide', null, 'IN_PROGRESS']
    ],
    milestones: [
      ['Collector prototype on a real database', false, 10],
      ['First public release', false, 45]
    ],
    messages: [
      ['ken', daysAgo(6), 'Scope check: v0.1 is slow queries only. Lock analysis is v0.2 or this never ships.'],
      ['ken', daysAgo(2), 'Froze the report JSON shape today. The frontend role is unblocked for whoever takes it.']
    ],
    activities: [
      ['ken', 'TASK_CREATED', 'Ken created the contributor guide draft', 5],
      ['ken', 'TASK_CREATED', 'Ken created task "Wireframe the weekly report view"', 6]
    ]
  },
  {
    key: 'parcel',
    owner: 'priya',
    title: 'Parcel',
    category: 'climate',
    description: 'Parcel routes deliveries by carbon intensity, not distance. It combines courier schedules, vehicle types, and grid carbon forecasts to answer one question: what is the lowest-emission way to get this parcel there today? Research pilot with a regional courier.',
    stage: 'PLANNING',
    type: 'RESEARCH',
    commitment: 'MIXED',
    status: 'ACTIVE',
    daysAgo: 48,
    roles: [
      {
        name: 'Research Engineer',
        description: 'Carbon model, route comparison, and a reproducible evaluation harness.',
        experience: 'SENIOR',
        commitment: 'MIXED',
        slots: 1,
        skills: [['Python', 5], ['Machine Learning', 4], ['PostgreSQL', 3]],
        member: 'ken'
      },
      {
        name: 'Data Scientist',
        description: "Clean the courier's historical routes and quantify how wrong our first model is.",
        experience: 'MID',
        commitment: 'MIXED',
        slots: 1,
        skills: [['Python', 4], ['Machine Learning', 3], ['PostgreSQL', 3]]
      }
    ],
    tasks: [
      ['Baseline carbon model v0', 'Research Engineer', 'DONE'],
      ['Validate against six weeks of courier data', 'Research Engineer', 'IN_PROGRESS'],
      ['Define the evaluation metric', null, 'DONE'],
      ['Write up the pilot hypothesis', null, 'IN_REVIEW']
    ],
    milestones: [
      ['Baseline model beats distance-only routing', true, 16],
      ['Pilot results written up and reviewed', false, 15]
    ],
    messages: [
      ['priya', daysAgo(7), 'Baseline is 11 percent better than distance-only on the test week. That is barely above noise, so no victory lap.'],
      ['ken', daysAgo(5), 'The grid forecast data is hourly but courier routes are daily. I will aggregate before joining.']
    ],
    activities: [
      ['priya', 'MEMBER_JOINED', 'Ken joined as Research Engineer', 44],
      ['priya', 'MILESTONE_COMPLETED', 'Priya completed "Baseline model beats distance-only routing"', 16],
      ['ken', 'TASK_COMPLETED', 'Ken completed task "Baseline carbon model v0"', 18]
    ]
  },
  {
    key: 'tempo',
    owner: 'noah',
    title: 'Tempo',
    category: 'community',
    description: 'Tempo is a tiny app for running clubs: one shared calendar, one map of safe routes, and a check-in button so nobody gets left behind. No feeds, no follower counts, no ads. Built for the Tuesday night group that keeps losing its thread.',
    stage: 'IDEA',
    type: 'COMMUNITY',
    commitment: 'VOLUNTEER',
    status: 'RECRUITING',
    daysAgo: 5,
    roles: [
      {
        name: 'React Native Developer',
        description: 'Build the calendar and check-in flow. This is a small, respectful app.',
        experience: 'ANY',
        commitment: 'VOLUNTEER',
        slots: 1,
        skills: [['React Native', 3], ['TypeScript', 3]]
      }
    ],
    tasks: [
      ['Sketch the check-in flow', 'React Native Developer', 'TODO'],
      ['List five clubs willing to pilot', null, 'IN_PROGRESS']
    ],
    milestones: [
      ['First pilot club using it weekly', false, 30]
    ],
    messages: [
      ['noah', daysAgo(2), 'I want this to take fifteen minutes to set up per club. If it needs an admin panel I have failed.']
    ],
    activities: [
      ['noah', 'TASK_CREATED', 'Noah created task "Sketch the check-in flow"', 5]
    ]
  },
  {
    key: 'atlas',
    owner: 'leo',
    title: 'Atlas',
    category: 'developer tools',
    description: 'Internal tooling for small engineering teams: one place to see deploys, incidents, and who is on call, without buying a platform. Currently a private prototype with two people.',
    stage: 'MVP',
    type: 'SIDE_PROJECT',
    commitment: 'MIXED',
    status: 'ACTIVE',
    visibility: 'PRIVATE',
    daysAgo: 33,
    roles: [
      {
        name: 'Infrastructure Engineer',
        description: 'Deploy hooks, incident timeline, and a schedule that people trust.',
        experience: 'SENIOR',
        commitment: 'MIXED',
        slots: 1,
        skills: [['Go', 4], ['Kubernetes', 4], ['DevOps', 4]],
        member: 'ken'
      }
    ],
    tasks: [
      ['Deploy webhook for GitHub Actions', 'Infrastructure Engineer', 'DONE'],
      ['Incident timeline data model', null, 'IN_PROGRESS'],
      ['Decide how on-call rotations are stored', null, 'TODO']
    ],
    milestones: [
      ['First deploy visible in the timeline', true, 12],
      ['Two-person dogfooding for a month', false, 20]
    ],
    messages: [
      ['leo', daysAgo(10), 'Private for now. If it survives a month of our own incidents I will open-source it.'],
      ['ken', daysAgo(9), 'The webhook is done. Timeline model next, I want immutable events.']
    ],
    activities: [
      ['leo', 'MEMBER_JOINED', 'Ken joined as Infrastructure Engineer', 30],
      ['ken', 'TASK_COMPLETED', 'Ken completed task "Deploy webhook for GitHub Actions"', 12],
      ['leo', 'MILESTONE_COMPLETED', 'Leo completed "First deploy visible in the timeline"', 12]
    ]
  },
  {
    key: 'lumen',
    owner: 'amara',
    title: 'Lumen',
    category: 'community',
    description: 'Lumen was a skill-swap platform for neighbourhoods: teach an hour, learn an hour. We ran it for a year with two community centres, learned that trust beats matching algorithms, and shut it down cleanly when the grant ended. Public write-up included.',
    stage: 'COMPLETED',
    type: 'COMMUNITY',
    commitment: 'VOLUNTEER',
    status: 'COMPLETED',
    visibility: 'PUBLIC',
    daysAgo: 260,
    roles: [
      {
        name: 'Frontend Engineer',
        description: 'The swap board, profiles, and the scheduling flow.',
        experience: 'MID',
        commitment: 'VOLUNTEER',
        slots: 1,
        skills: [['React', 4], ['TypeScript', 3]],
        member: 'noah'
      },
      {
        name: 'Backend Engineer',
        description: 'Matching, messaging, and the audit trail we needed for the grant.',
        experience: 'MID',
        commitment: 'VOLUNTEER',
        slots: 1,
        skills: [['Node.js', 4], ['PostgreSQL', 4]],
        member: 'leo'
      }
    ],
    tasks: [
      ['Swap board and profile pages', 'Frontend Engineer', 'DONE'],
      ['Matching and messaging API', 'Backend Engineer', 'DONE'],
      ['Grant reporting export', 'Backend Engineer', 'DONE'],
      ['Shutdown notice and data export', null, 'DONE']
    ],
    milestones: [
      ['Launch with two community centres', true, 220],
      ['One hundred completed swaps', true, 120],
      ['Clean shutdown and public write-up', true, 30]
    ],
    messages: [
      ['amara', daysAgo(45), 'Write-up is published. Thank you both, this was the least dramatic shutdown I have ever run.'],
      ['leo', daysAgo(44), 'Drama-free is the goal. Data export for participants is done.']
    ],
    activities: [
      ['amara', 'MEMBER_JOINED', 'Noah joined as Frontend Engineer', 250],
      ['amara', 'MEMBER_JOINED', 'Leo joined as Backend Engineer', 250],
      ['amara', 'MILESTONE_COMPLETED', 'Amara completed "One hundred completed swaps"', 120],
      ['amara', 'PROJECT_COMPLETED', 'Amara marked Lumen as completed', 30]
    ]
  }
];

const APPLICATIONS = [
  { project: 'kettle', role: 'Full-stack Engineer', user: 'leo', status: 'PENDING', message: 'I built a receipts-splitting tool before. Happy to show the messy parts.', daysAgo: 6 },
  { project: 'kettle', role: 'Product Designer', user: 'noah', status: 'PENDING', message: 'I can take the balance screen. Accessibility matters here more than usual.', daysAgo: 4 },
  { project: 'meridian', role: 'Frontend Engineer', user: 'sam', status: 'PENDING', message: 'Interested in the report view. I like tools that explain themselves.', daysAgo: 3 },
  { project: 'meridian', role: 'Backend Engineer (Go)', user: 'leo', status: 'PENDING', message: 'Go and Postgres are my daily tools. I can start with the slow-query collector.', daysAgo: 2 },
  { project: 'tempo', role: 'React Native Developer', user: 'sam', status: 'PENDING', message: 'I run with a club in Lagos. This is exactly the app we keep failing to build.', daysAgo: 1 },
  { project: 'parcel', role: 'Data Scientist', user: 'leo', status: 'REJECTED', message: 'I can clean the route data and build the evaluation harness.', daysAgo: 30 }
];

const REVIEWS = [
  { project: 'lumen', reviewer: 'amara', reviewee: 'noah', rating: 5, comment: 'Shipped a clean, accessible frontend and pushed back when the scope was wrong. Would work with again.', daysAgo: 25 },
  { project: 'lumen', reviewer: 'noah', reviewee: 'amara', rating: 5, comment: 'The clearest specs I have worked from. She protected the team from three bad ideas a week.', daysAgo: 25 },
  { project: 'lumen', reviewer: 'amara', reviewee: 'leo', rating: 4, comment: 'Solid backend and honest estimates. Kept the auditable export boring, which is a compliment.', daysAgo: 24 },
  { project: 'lumen', reviewer: 'leo', reviewee: 'amara', rating: 5, comment: 'Ran a calm, well-scoped project and shut it down at the right time. Rare.', daysAgo: 24 },
  { project: 'lumen', reviewer: 'noah', reviewee: 'leo', rating: 4, comment: 'Good API design and fast reviews. Occasionally over-engineered the matching step.', daysAgo: 23 }
];

const FOLLOWS = [
  ['maya', 'leo'], ['noah', 'maya'], ['leo', 'priya'], ['ines', 'maya'], ['sam', 'leo'], ['amara', 'noah']
];

async function main() {
  console.log('[seed] hashing demo password');
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  console.log('[seed] upserting skills');
  const skillIds = {};
  for (const name of SKILLS) {
    const skill = await prisma.skill.upsert({ where: { name }, update: {}, create: { name } });
    skillIds[name] = skill.id;
  }

  console.log('[seed] upserting demo users');
  const userIds = {};
  for (const [index, u] of USERS.entries()) {
    const data = {
      name: u.name,
      password: passwordHash,
      headline: u.headline,
      bio: u.bio,
      location: u.location,
      timezone: u.timezone,
      availability: u.availability || null,
      openToProjects: Boolean(u.openToProjects),
      openToCofounder: Boolean(u.openToCofounder),
      openToFreelance: Boolean(u.openToFreelance),
      openToEmployment: Boolean(u.openToEmployment),
      isVerified: Boolean(u.isVerified),
      githubUrl: u.githubUrl || null,
      portfolioUrl: u.portfolioUrl || null,
      linkedinUrl: u.linkedinUrl || null,
      websiteUrl: u.websiteUrl || null,
      lastActiveAt: daysAgo(index % 3)
    };
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: data,
      create: { email: u.email, ...data }
    });
    userIds[u.email.split('@')[0]] = user.id;

    await prisma.userSkill.deleteMany({ where: { userId: user.id } });
    await prisma.userSkill.createMany({
      data: u.skills.map(([name, level]) => ({ userId: user.id, skillId: skillIds[name], level }))
    });
  }

  const need = key => {
    const id = userIds[key];
    if (!id) throw new Error(`[seed] unknown demo user "${key}"`);
    return id;
  };

  console.log('[seed] clearing previous demo projects');
  const demoUserIds = Object.values(userIds);
  const oldProjects = await prisma.project.findMany({
    where: { ownerId: { in: demoUserIds } },
    select: { id: true }
  });
  const oldProjectIds = oldProjects.map(p => p.id);
  if (oldProjectIds.length) {
    const scope = { projectId: { in: oldProjectIds } };
    await prisma.activity.deleteMany({ where: scope });
    await prisma.review.deleteMany({ where: scope });
    await prisma.message.deleteMany({ where: scope });
    await prisma.task.deleteMany({ where: scope });
    await prisma.projectFile.deleteMany({ where: scope });
    await prisma.membership.deleteMany({ where: scope });
    await prisma.application.deleteMany({ where: scope });
    await prisma.milestone.deleteMany({ where: scope });
    await prisma.roleSkill.deleteMany({ where: { role: { projectId: { in: oldProjectIds } } } });
    await prisma.role.deleteMany({ where: scope });
    await prisma.project.deleteMany({ where: { id: { in: oldProjectIds } } });
  }
  await prisma.follow.deleteMany({
    where: { OR: [{ followerId: { in: demoUserIds } }, { followingId: { in: demoUserIds } }] }
  });
  await prisma.notification.deleteMany({ where: { userId: { in: demoUserIds } } });
  await prisma.passwordResetToken.deleteMany({ where: { userId: { in: demoUserIds } } });
  await prisma.pushSubscription.deleteMany({ where: { userId: { in: demoUserIds } } });
  await prisma.agentConversation.deleteMany({ where: { userId: { in: demoUserIds } } });

  console.log('[seed] creating projects');
  const projectIds = {};
  const roleIds = {};
  for (const p of PROJECTS) {
    const createdAt = daysAgo(p.daysAgo);
    const ownerId = need(p.owner);
    const roles = p.roles.map(r => ({
      name: r.name,
      description: r.description,
      experience: r.experience || 'ANY',
      commitment: r.commitment || null,
      slots: r.slots || 1,
      createdAt,
      roleSkills: {
        create: r.skills.map(([name, level]) => ({
          skill: { connect: { id: skillIds[name] } },
          level
        }))
      }
    }));

    const project = await prisma.project.create({
      data: {
        title: p.title,
        description: p.description,
        category: p.category,
        status: p.status,
        stage: p.stage,
        type: p.type,
        commitment: p.commitment || null,
        visibility: p.visibility || 'PUBLIC',
        repoUrl: p.repoUrl || null,
        ownerId,
        createdAt,
        roles: { create: roles },
        tasks: {
          create: p.tasks.map(([title, roleName, status]) => {
            const role = roleName ? p.roles.find(r => r.name === roleName) : null;
            return {
              title,
              status,
              createdAt,
              assigneeId: role?.member ? need(role.member) : null
            };
          })
        },
        milestones: {
          create: p.milestones.map(([title, completed, completedDaysAgo], i) => ({
            title,
            order: i,
            completed,
            createdAt,
            completedAt: completed ? daysAgo(completedDaysAgo) : null
          }))
        },
        messages: {
          create: p.messages.map(([author, sentAt, content]) => ({
            authorId: need(author),
            content,
            createdAt: sentAt
          }))
        },
        activities: {
          create: p.activities.map(([actor, type, message, when]) => ({
            actorId: need(actor),
            type,
            message,
            createdAt: daysAgo(when)
          }))
        }
      },
      include: { roles: true }
    });

    projectIds[p.key] = project.id;
    for (const role of project.roles) roleIds[`${p.key}:${role.name}`] = role.id;
  }

  console.log('[seed] creating memberships');
  for (const p of PROJECTS) {
    for (const role of p.roles) {
      if (!role.member) continue;
      const roleId = roleIds[`${p.key}:${role.name}`];
      const userId = need(role.member);
      await prisma.membership.create({
        data: {
          projectId: projectIds[p.key],
          roleId,
          userId,
          joinedAt: daysAgo(p.daysAgo - 2)
        }
      });
      await prisma.application.create({
        data: {
          projectId: projectIds[p.key],
          roleId,
          userId,
          status: 'CONFIRMED',
          message: 'Accepted and confirmed for the seeded demo team.',
          createdAt: daysAgo(p.daysAgo - 1)
        }
      });
    }
  }

  console.log('[seed] creating applications');
  for (const a of APPLICATIONS) {
    await prisma.application.create({
      data: {
        projectId: projectIds[a.project],
        roleId: roleIds[`${a.project}:${a.role}`],
        userId: need(a.user),
        status: a.status,
        message: a.message,
        createdAt: daysAgo(a.daysAgo)
      }
    });
  }

  console.log('[seed] creating reviews');
  for (const r of REVIEWS) {
    await prisma.review.create({
      data: {
        projectId: projectIds[r.project],
        reviewerId: need(r.reviewer),
        revieweeId: need(r.reviewee),
        rating: r.rating,
        comment: r.comment,
        createdAt: daysAgo(r.daysAgo)
      }
    });
  }

  console.log('[seed] creating follows and notifications');
  for (const [follower, following] of FOLLOWS) {
    await prisma.follow.create({
      data: { followerId: need(follower), followingId: need(following), createdAt: daysAgo(12) }
    });
  }

  await prisma.notification.createMany({
    data: [
      {
        userId: userIds.maya,
        type: 'APPLICATION_RECEIVED',
        message: 'Leo Martins applied to Full-stack Engineer on Kettle',
        link: `/projects/${projectIds.kettle}`,
        read: false,
        createdAt: daysAgo(6)
      },
      {
        userId: userIds.leo,
        type: 'NEW_FOLLOWER',
        message: 'Maya Chen started following you',
        link: `/users/${userIds.maya}`,
        read: false,
        createdAt: daysAgo(12)
      },
      {
        userId: userIds.sam,
        type: 'MILESTONE_COMPLETED',
        message: 'Inés García completed "Pilot with three regions live" on Fieldnote',
        link: `/projects/${projectIds.fieldnote}`,
        read: true,
        createdAt: daysAgo(12)
      },
      {
        userId: userIds.amara,
        type: 'REVIEW_RECEIVED',
        message: 'Noah Kim left you a 5-star review on Lumen',
        link: '/profile',
        read: true,
        createdAt: daysAgo(25)
      }
    ]
  });

  const [userCount, projectCount] = await Promise.all([
    prisma.user.count({ where: { email: { endsWith: DEMO_DOMAIN } } }),
    prisma.project.count({ where: { ownerId: { in: demoUserIds } } })
  ]);

  console.log(`\n[seed] done: ${userCount} demo users, ${projectCount} demo projects`);
  console.log(`[seed] demo accounts: maya/leo/priya/sam/ines/ken/amara/noah${DEMO_DOMAIN}`);
  console.log(`[seed] password for all demo accounts: ${DEMO_PASSWORD}`);
}

main()
  .catch(err => {
    console.error('[seed] failed:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
