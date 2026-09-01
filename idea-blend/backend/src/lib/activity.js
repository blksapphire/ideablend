const prisma = require('../prisma');

// creates an Activity row. Accepts a plain prisma client or a transaction
// client (tx) so it can be called both standalone and inside $transaction.
async function logActivity(client, { projectId, actorId, type, message }) {
  return client.activity.create({ data: { projectId, actorId, type, message } });
}

module.exports = { logActivity };
