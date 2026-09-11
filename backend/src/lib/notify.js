const prisma = require('../prisma');
const { sendMail } = require('./mailer');
const { sendPush } = require('./push');

const EMAIL_WORTHY = new Set([
  'APPLICATION_RECEIVED', 'APPLICATION_ACCEPTED', 'APPLICATION_REJECTED',
  'MEMBER_REMOVED', 'PROJECT_COMPLETED', 'REVIEW_RECEIVED'
]);

async function notify(client, { userId, type, message, link }) {
  await client.notification.create({ data: { userId, type, message, link } });

  // push fires for every type - the user already opted in at the device level
  sendPush(userId, { title: 'Idea Blend', body: message, url: link }).catch(() => {});

  if (EMAIL_WORTHY.has(type)) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (user) {
      const url = link ? `${process.env.FRONTEND_URL || 'http://localhost:5173'}${link}` : null;
      sendMail({
        to: user.email,
        subject: 'Idea Blend notification',
        html: `<p>${message}</p>${url ? `<p><a href="${url}">View on Idea Blend</a></p>` : ''}`
      }).catch(() => {});
    }
  }
}

module.exports = { notify };
