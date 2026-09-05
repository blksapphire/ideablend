const prisma = require('../prisma');
const { sendMail } = require('./mailer');

// events worth an email, not just an in-app badge. Deliberately excludes
// NEW_MESSAGE, TASK_COMPLETED, MILESTONE_COMPLETED - those fire constantly
// on an active project and would flood someone's inbox within a day.
const EMAIL_WORTHY = new Set([
  'APPLICATION_RECEIVED', 'APPLICATION_ACCEPTED', 'APPLICATION_REJECTED',
  'MEMBER_REMOVED', 'PROJECT_COMPLETED', 'REVIEW_RECEIVED'
]);

// `client` can be the plain prisma singleton or a $transaction client (tx) -
// the notification row is created with whatever's passed in, so this can be
// called inside or outside a transaction. Email always uses the plain
// prisma singleton for the lookup and fires after, best-effort.
async function notify(client, { userId, type, message, link }) {
  await client.notification.create({ data: { userId, type, message, link } });

  if (EMAIL_WORTHY.has(type)) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (user) {
      const url = link ? `${process.env.FRONTEND_URL || 'http://localhost:5173'}${link}` : null;
      sendMail({
        to: user.email,
        subject: 'Idea Blend notification',
        html: `<p>${message}</p>${url ? `<p><a href="${url}">View on Idea Blend</a></p>` : ''}`
      }).catch(() => {}); // never let an email failure break the main request
    }
  }
}

module.exports = { notify };
