const express = require('express');
const prisma = require('../prisma');
const { requireAuth } = require('../middlewares/authMiddleware');
const { asyncHandler } = require('../lib/asyncHandler');

const router = express.Router();

// the frontend needs this key to create a push subscription
router.get('/push/vapid-public-key', (req, res) => {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) return res.status(503).json({ error: 'push not configured on this server' });
  res.json({ key });
});

// browser sends its subscription object here after calling
// serviceWorkerRegistration.pushManager.subscribe()
// Push endpoints are URLs the server makes requests to, so only the real
// browser push services are accepted - otherwise a subscribe request could
// turn this into an SSRF probe against internal hosts.
const PUSH_ENDPOINT_RE = /^https:\/\/([a-z0-9-]+\.)*(fcm\.googleapis\.com|push\.services\.mozilla\.com|notify\.windows\.com|push\.apple\.com)\//i;

router.post('/push/subscribe', requireAuth, asyncHandler(async (req, res) => {
  const { endpoint, keys } = req.body;
  if (typeof endpoint !== 'string' || endpoint.length > 1000 || !PUSH_ENDPOINT_RE.test(endpoint)) {
    return res.status(400).json({ error: 'invalid subscription endpoint' });
  }
  if (typeof keys?.p256dh !== 'string' || typeof keys?.auth !== 'string') {
    return res.status(400).json({ error: 'invalid subscription keys' });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { userId: req.user.id, p256dh: keys.p256dh, auth: keys.auth },
    create: { userId: req.user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth }
  });

  res.json({ ok: true });
}));

router.post('/push/unsubscribe', requireAuth, asyncHandler(async (req, res) => {
  const { endpoint } = req.body;
  if (endpoint) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: req.user.id } });
  }
  res.json({ ok: true });
}));

module.exports = router;
