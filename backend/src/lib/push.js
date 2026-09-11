const webPush = require('web-push');

// VAPID keys must be set in Railway environment variables.
// Generate a new pair with: node -e "const wp=require('web-push'); const k=wp.generateVAPIDKeys(); console.log(k)"
// Then set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in your Railway service variables.
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    'mailto:admin@ideablend.app',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

const prisma = require('../prisma');

// Sends a push notification to every registered device the user has subscribed
// from. Silently drops stale subscriptions (410 Gone) rather than crashing —
// users change browsers and devices; dead subscriptions are expected.
async function sendPush(userId, { title, body, url }) {
  if (!process.env.VAPID_PUBLIC_KEY) return; // push not configured, no-op

  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subscriptions.length === 0) return;

  const payload = JSON.stringify({
    title,
    body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    url: url ? `${process.env.FRONTEND_URL || 'https://ideablend.vercel.app'}${url}` : undefined
  });

  await Promise.all(subscriptions.map(async (sub) => {
    try {
      await webPush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        // subscription expired or revoked — remove it so we don't keep trying
        await prisma.pushSubscription.deleteMany({ where: { endpoint: sub.endpoint } }).catch(() => {});
      }
      // all other errors are swallowed — a push failure should never
      // break the API response that triggered it
    }
  }));
}

module.exports = { sendPush };
