const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const { notify } = require('../lib/notify');
const { getOtherMemberIds } = require('../lib/projectAccess');
const { corsOptions } = require('../lib/cors');

const MAX_MESSAGE_LENGTH = 4000;
const RATE_WINDOW_MS = 10_000;
const RATE_MAX_MESSAGES = 15;

async function isProjectMember(projectId, userId) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return false;
  if (project.ownerId === userId) return true;
  const membership = await prisma.membership.findFirst({ where: { projectId, userId, active: true } });
  return !!membership;
}

function setupSocket(server) {
  const io = new Server(server, { cors: corsOptions });

  // verify the JWT before allowing any connection at all
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('no auth token'));
    try {
      const data = jwt.verify(token, process.env.JWT_SECRET);
      // a banned user still holds a valid JWT until it expires, so the ban
      // has to be enforced here too, not only on HTTP routes
      const user = await prisma.user.findUnique({ where: { id: data.id }, select: { isBanned: true } });
      if (!user) return next(new Error('invalid token'));
      if (user.isBanned) return next(new Error('account disabled'));
      socket.userId = data.id;
      next();
    } catch (err) {
      next(new Error('invalid token'));
    }
  });

  io.on('connection', (socket) => {
    // cheap per-connection flood guard; the DB check below is the real
    // authorization boundary
    let messageTimes = [];
    function withinRateLimit() {
      const now = Date.now();
      messageTimes = messageTimes.filter(t => now - t < RATE_WINDOW_MS);
      if (messageTimes.length >= RATE_MAX_MESSAGES) return false;
      messageTimes.push(now);
      return true;
    }

    socket.on('joinRoom', async ({ projectId } = {}) => {
      try {
        const id = Number(projectId);
        if (!Number.isInteger(id) || id <= 0) return socket.emit('error', { error: 'invalid project' });
        const member = await isProjectMember(id, socket.userId);
        if (!member) return socket.emit('error', { error: 'not a project member' });
        socket.join(`project_${id}`);
      } catch (err) {
        console.error(err);
        socket.emit('error', { error: 'could not join room' });
      }
    });

    socket.on('message', async ({ projectId, content } = {}) => {
      try {
        const id = Number(projectId);
        if (!Number.isInteger(id) || id <= 0) return socket.emit('error', { error: 'invalid project' });
        if (typeof content !== 'string' || !content.trim()) return;
        if (content.length > MAX_MESSAGE_LENGTH) {
          return socket.emit('error', { error: `message must be at most ${MAX_MESSAGE_LENGTH} characters` });
        }
        if (!withinRateLimit()) return socket.emit('error', { error: 'sending too fast, slow down' });

        // membership is re-checked here, not just at joinRoom time - a
        // client could otherwise emit 'message' for any projectId directly
        // without ever having joined that room
        const member = await isProjectMember(id, socket.userId);
        if (!member) return socket.emit('error', { error: 'not a project member' });

        // authorId always comes from the verified socket, never the payload
        const m = await prisma.message.create({
          data: { projectId: id, authorId: socket.userId, content: content.trim() },
          include: { author: { select: { id: true, name: true, profilePic: true } } }
        });
        io.to(`project_${id}`).emit('message', m);

        const otherIds = await getOtherMemberIds(id, socket.userId);
        await Promise.all(otherIds.map(uid => notify(prisma, {
          userId: uid, type: 'NEW_MESSAGE',
          message: `${m.author?.name || 'Someone'}: ${content.trim().slice(0, 60)}`,
          link: `/projects/${id}/workspace`
        })));
      } catch (err) {
        console.error(err);
        socket.emit('error', { error: 'could not send message' });
      }
    });
  });

  return io;
}

module.exports = { setupSocket };
