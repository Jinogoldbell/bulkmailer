const logger = require('../logger');

exports.notFound = (req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });

// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, _next) => {
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid id.' });
  if (err.type === 'entity.too.large') return res.status(413).json({ message: 'Message is too large.' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Request body is not valid JSON.' });

  const status = err.status || 500;
  if (status >= 500) logger.error(err.message, { path: req.originalUrl, stack: err.stack });
  res.status(status).json({
    message: status >= 500 ? 'Something went wrong on the server.' : err.message,
    ...(err.details ? { details: err.details } : {}),
  });
};
