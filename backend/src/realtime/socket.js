const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');

async function isProjectMember(projectId, userId) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return false;
  if (project.ownerId === userId) return true;
  const membership = await prisma.membership.findFirst({ where: { projectId, userId, active: true } });
  return !!membership;
}

function setupSocket(server) {
  const io = new Server(server, { cors: { origin: '*' } });

  // verify the JWT before allowing any connection at all
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('no auth token'));
    try {
      const data = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = data.id;
      next();
    } catch (err) {
      next(new Error('invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('joinRoom', async ({ projectId }) => {
      try {
        const member = await isProjectMember(projectId, socket.userId);
        if (!member) return socket.emit('error', { error: 'not a project member' });
        socket.join(`project_${projectId}`);
      } catch (err) {
        console.error(err);
        socket.emit('error', { error: 'could not join room' });
      }
    });

    socket.on('message', async ({ projectId, content }) => {
      try {
        if (!content || !content.trim()) return;
        // membership is re-checked here, not just at joinRoom time - a
        // client could otherwise emit 'message' for any projectId directly
        // without ever having joined that room
        const member = await isProjectMember(projectId, socket.userId);
        if (!member) return socket.emit('error', { error: 'not a project member' });

        // authorId always comes from the verified socket, never the payload
        const m = await prisma.message.create({
          data: { projectId, authorId: socket.userId, content },
          include: { author: { select: { id: true, name: true, profilePic: true } } }
        });
        io.to(`project_${projectId}`).emit('message', m);
      } catch (err) {
        console.error(err);
        socket.emit('error', { error: 'could not send message' });
      }
    });
  });

  return io;
}

module.exports = { setupSocket };
