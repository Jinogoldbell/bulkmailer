require('dotenv').config();

const bool = (v, d = false) => (v === undefined ? d : String(v).toLowerCase() === 'true');
const int = (v, d) => (Number.isFinite(parseInt(v, 10)) ? parseInt(v, 10) : d);

const config = {
  env: process.env.NODE_ENV || 'development',
  port: int(process.env.PORT, 5000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  admin: {
    email: (process.env.ADMIN_EMAIL || '').toLowerCase().trim(),
    password: process.env.ADMIN_PASSWORD || '',
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: int(process.env.SMTP_PORT, 587),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
  },
  dryRun: bool(process.env.MAIL_DRY_RUN, false),
  maxRecipients: int(process.env.MAX_RECIPIENTS, 200),
  sendConcurrency: Math.max(1, int(process.env.SEND_CONCURRENCY, 5)),
};

const missing = ['mongoUri', 'jwtSecret'].filter((k) => !config[k]);
if (missing.length) {
  console.error(`Missing required environment variable(s): ${missing.join(', ')}. Copy server/.env.example to server/.env.`);
  process.exit(1);
}

module.exports = config;
