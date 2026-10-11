const jwt = require('jsonwebtoken');
const config = require('../config');
const { HttpError } = require('../utils/http');

module.exports = function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new HttpError(401, 'Please sign in to continue.'));
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(new HttpError(401, 'Your session has expired. Please sign in again.'));
  }
};
