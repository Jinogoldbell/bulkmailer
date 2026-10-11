const mongoose = require('mongoose');
const config = require('./config');
const logger = require('./logger');
const app = require('./app');
const User = require('./models/User');
const Mail = require('./models/Mail');

async function seedAdmin() {
  if (await User.exists({})) return;
  if (!config.admin.email || !config.admin.password) {
    logger.warn('No admin user exists. Set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env and restart.');
    return;
  }
  await User.create({ email: config.admin.email, passwordHash: await User.hash(config.admin.password) });
  logger.info(`Created admin user ${config.admin.email}`);
}

async function start() {
  await mongoose.connect(config.mongoUri);
  logger.info('Connected to MongoDB');

  await seedAdmin();

  // A crash mid-send would leave records stuck on "sending"
  const stale = await Mail.updateMany({ status: 'sending' }, { status: 'failed', error: 'Server stopped before sending finished.' });
  if (stale.modifiedCount) logger.warn(`Marked ${stale.modifiedCount} interrupted email(s) as failed`);

  app.listen(config.port, () => logger.info(`API listening on http://localhost:${config.port}`));
}

start().catch((err) => {
  logger.error(`Failed to start: ${err.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (err) => logger.error('Unhandled rejection', { message: err?.message }));
