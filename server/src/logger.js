const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '..', 'logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = fs.createWriteStream(path.join(logDir, 'server.log'), { flags: 'a' });

function write(level, message, meta) {
  const line = `${new Date().toISOString()} [${level.toUpperCase()}] ${message}${meta ? ' ' + JSON.stringify(meta) : ''}`;
  (level === 'error' ? console.error : console.log)(line);
  logFile.write(line + '\n');
}

module.exports = {
  info: (m, meta) => write('info', m, meta),
  warn: (m, meta) => write('warn', m, meta),
  error: (m, meta) => write('error', m, meta),
  stream: { write: (msg) => write('http', msg.trim()) }, // for morgan
};
