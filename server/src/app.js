const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const logger = require('./logger');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors({ origin: config.clientOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('tiny', { stream: logger.stream }));

app.get('/api/health', (_req, res) => res.json({ ok: true, dryRun: config.dryRun }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/mail', require('./routes/mail'));
app.use('/api', notFound);

// In production, serve the built React app from the same server
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (config.env === 'production' && fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.use(errorHandler);

module.exports = app;
