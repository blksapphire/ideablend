const nodemailer = require('nodemailer');

let transporter = null;
if (process.env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
  });
}

// returns true if actually sent, false if no SMTP is configured (caller
// should fall back to a dev-mode response in that case - e.g. returning the
// reset link directly instead of emailing it)
async function sendMail({ to, subject, html }) {
  if (!transporter) return false;
  await transporter.sendMail({ from: process.env.SMTP_FROM || 'Idea Blend <no-reply@ideablend.local>', to, subject, html });
  return true;
}

module.exports = { sendMail };
