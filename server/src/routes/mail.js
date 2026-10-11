const express = require('express');
const Mail = require('../models/Mail');
const config = require('../config');
const logger = require('../logger');
const requireAuth = require('../middleware/auth');
const { sendBulk } = require('../services/mailer');
const { parseRecipients } = require('../utils/emails');
const { HttpError, asyncHandler } = require('../utils/http');

const router = express.Router();
router.use(requireAuth);

const summary = (m) => ({
  id: m.id,
  subject: m.subject,
  isHtml: m.isHtml,
  status: m.status,
  totalRecipients: m.totalRecipients,
  sentCount: m.sentCount,
  failedCount: m.failedCount,
  error: m.error,
  createdAt: m.createdAt,
  completedAt: m.completedAt,
});

const resultMessage = (m) => {
  if (m.status === 'sent') return `Sent to all ${m.sentCount} recipient${m.sentCount === 1 ? '' : 's'}.`;
  if (m.status === 'partial') return `Sent to ${m.sentCount} of ${m.totalRecipients}. ${m.failedCount} failed - see history for details.`;
  return m.error || 'No emails were delivered.';
};

// POST /api/mail/send
router.post(
  '/send',
  asyncHandler(async (req, res) => {
    const { subject, body, recipients, isHtml = false } = req.body || {};
    const problems = [];

    const cleanSubject = typeof subject === 'string' ? subject.trim() : '';
    const cleanBody = typeof body === 'string' ? body : '';
    if (!cleanSubject) problems.push('Subject is required.');
    else if (cleanSubject.length > 200) problems.push('Subject must be 200 characters or fewer.');
    if (!cleanBody.trim()) problems.push('Message body is required.');

    const { valid, invalid } = parseRecipients(recipients);
    if (!valid.length) problems.push('Add at least one valid recipient.');
    if (invalid.length) problems.push(`Invalid address${invalid.length > 1 ? 'es' : ''}: ${invalid.slice(0, 5).join(', ')}${invalid.length > 5 ? '...' : ''}`);
    if (valid.length > config.maxRecipients) problems.push(`You can send to at most ${config.maxRecipients} recipients at a time.`);

    if (problems.length) throw new HttpError(400, problems.join(' '), problems);

    const mail = await Mail.create({
      subject: cleanSubject,
      body: cleanBody,
      isHtml: Boolean(isHtml),
      recipients: valid.map((email) => ({ email })),
      totalRecipients: valid.length,
      status: 'sending',
      sentBy: req.user.id,
    });
    logger.info(`Sending "${cleanSubject}" to ${valid.length} recipient(s)`, { mailId: mail.id, by: req.user.email });

    try {
      const results = await sendBulk({ recipients: valid, subject: cleanSubject, body: cleanBody, isHtml: Boolean(isHtml) });
      mail.recipients = results.map((r) => ({ email: r.email, status: r.ok ? 'sent' : 'failed', error: r.error }));
      mail.sentCount = results.filter((r) => r.ok).length;
      mail.failedCount = results.length - mail.sentCount;
      mail.status = mail.failedCount === 0 ? 'sent' : mail.sentCount === 0 ? 'failed' : 'partial';
      if (mail.status === 'failed') mail.error = results[0]?.error || 'No emails were delivered.';
    } catch (err) {
      mail.recipients = mail.recipients.map((r) => ({ email: r.email, status: 'failed', error: err.message }));
      mail.failedCount = mail.totalRecipients;
      mail.status = 'failed';
      mail.error = err.message;
    }
    mail.completedAt = new Date();
    await mail.save();

    logger.info(`Mail ${mail.id} finished: ${mail.status}`, { sent: mail.sentCount, failed: mail.failedCount });
    res.status(201).json({ message: resultMessage(mail), mail: summary(mail) });
  })
);

// GET /api/mail?page=1&limit=10&status=sent
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const filter = {};
    if (['sending', 'sent', 'partial', 'failed'].includes(req.query.status)) filter.status = req.query.status;

    const [items, total] = await Promise.all([
      Mail.find(filter).select('-body -recipients').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Mail.countDocuments(filter),
    ]);

    res.json({ items: items.map(summary), total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  })
);

// GET /api/mail/:id  (full record incl. body and per-recipient results)
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const mail = await Mail.findById(req.params.id);
    if (!mail) throw new HttpError(404, 'Email not found.');
    res.json({ mail: { ...summary(mail), body: mail.body, recipients: mail.recipients } });
  })
);

// DELETE /api/mail/:id
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const mail = await Mail.findByIdAndDelete(req.params.id);
    if (!mail) throw new HttpError(404, 'Email not found.');
    logger.info(`Mail ${mail.id} deleted`, { by: req.user.email });
    res.json({ message: 'Deleted from history.' });
  })
);

module.exports = router;
