const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('../logger');

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  const { host, port, user, pass } = config.smtp;
  if (!host || !user || !pass) {
    throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS in server/.env (or set MAIL_DRY_RUN=true).');
  }
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    pool: true,
    maxConnections: config.sendConcurrency,
    maxMessages: 100,
  });
  return transporter;
}

const stripHtml = (html) =>
  html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

function friendlyError(err) {
  if (err.code === 'EAUTH') return 'SMTP login was rejected. Check SMTP_USER / SMTP_PASS (Gmail needs an app password).';
  if (err.code === 'ECONNECTION' || err.code === 'ETIMEDOUT' || err.code === 'ESOCKET') return 'Could not reach the SMTP server.';
  if (err.responseCode >= 500 && err.response) return err.response.slice(0, 200);
  return (err.message || 'Unknown error').slice(0, 200);
}

async function sendOne({ to, subject, body, isHtml }) {
  if (config.dryRun) {
    await new Promise((r) => setTimeout(r, 40));
    return;
  }
  await getTransporter().sendMail({
    from: config.smtp.from,
    to, // one message per recipient so addresses are never exposed to each other
    subject,
    ...(isHtml ? { html: body, text: stripHtml(body) } : { text: body }),
  });
}

/**
 * Sends the message to every recipient, a few at a time.
 * Returns [{ email, ok, error? }] in the same order as `recipients`.
 * Throws only if the SMTP connection itself cannot be established.
 */
async function sendBulk({ recipients, subject, body, isHtml }) {
  if (!config.dryRun) {
    try {
      await getTransporter().verify();
    } catch (err) {
      const reason = friendlyError(err);
      logger.error('SMTP verification failed', { reason });
      throw new Error(`SMTP connection failed: ${reason}`);
    }
  } else {
    logger.warn('MAIL_DRY_RUN is on - no real emails are being sent');
  }

  const results = [];
  for (let i = 0; i < recipients.length; i += config.sendConcurrency) {
    const batch = recipients.slice(i, i + config.sendConcurrency);
    const settled = await Promise.allSettled(batch.map((to) => sendOne({ to, subject, body, isHtml })));
    settled.forEach((s, idx) => {
      if (s.status === 'fulfilled') {
        results.push({ email: batch[idx], ok: true });
      } else {
        const error = friendlyError(s.reason);
        logger.warn(`Failed to send to ${batch[idx]}`, { error });
        results.push({ email: batch[idx], ok: false, error });
      }
    });
  }
  return results;
}

module.exports = { sendBulk };
