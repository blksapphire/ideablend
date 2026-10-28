const prisma = require('../prisma');
const { sendMail } = require('./mailer');
const { sendPush } = require('./push');

const EMAIL_WORTHY = new Set([
  'APPLICATION_RECEIVED', 'APPLICATION_ACCEPTED', 'APPLICATION_REJECTED',
  'MEMBER_REMOVED', 'PROJECT_COMPLETED', 'REVIEW_RECEIVED'
]);

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

// Notification text often includes user-controlled names and project titles,
// and it is interpolated into HTML email - escaping here prevents markup or
// link injection through a display name.
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => HTML_ESCAPES[c]);
}

async function notify(client, { userId, type, message, link }) {
  await client.notification.create({ data: { userId, type, message, link } });

  // only internal app paths are allowed as links, never an absolute or
  // protocol-relative URL supplied by a caller
  const path = typeof link === 'string' && link.startsWith('/') && !link.startsWith('//') ? link : null;

  // push fires for every type - the user already opted in at the device level
  sendPush(userId, { title: 'Idea Blend', body: message, url: path }).catch(() => {});

  if (EMAIL_WORTHY.has(type)) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (user) {
      const url = path ? `${process.env.FRONTEND_URL || 'http://localhost:5173'}${path}` : null;
      sendMail({
        to: user.email,
        subject: 'Idea Blend notification',
        html: `<p>${escapeHtml(message)}</p>${url ? `<p><a href="${escapeHtml(url)}">View on Idea Blend</a></p>` : ''}`
      }).catch(() => {});
    }
  }
}

module.exports = { notify };
