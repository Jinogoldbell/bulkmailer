const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const config = require('../config');
const logger = require('../logger');
const requireAuth = require('../middleware/auth');
const { HttpError, asyncHandler } = require('../utils/http');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many sign-in attempts. Try again in 15 minutes.' },
});

router.post(
  '/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const email = String(req.body?.email || '').toLowerCase().trim();
    const password = String(req.body?.password || '');
    if (!email || !password) throw new HttpError(400, 'Enter your email and password.');

    const user = await User.findOne({ email }).select('+passwordHash');
    const ok = user && (await user.verifyPassword(password));
    if (!ok) {
      logger.warn('Failed login', { email });
      throw new HttpError(401, 'Email or password is incorrect.');
    }

    const token = jwt.sign({ sub: user.id, email: user.email }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
    logger.info('Admin signed in', { email });
    res.json({ token, user: { id: user.id, email: user.email } });
  })
);

router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));

module.exports = router;
