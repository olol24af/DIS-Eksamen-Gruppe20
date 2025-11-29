const fs = require('fs');
const path = require('path');
const { createLogger, format, transports } = require('winston');

const logsDir = path.join(__dirname, '..', 'logs');
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

if (!isTest) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const jsonFormat = format.combine(
  format.timestamp({ format: () => new Date().toISOString() }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

const logger = createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  format: jsonFormat,
  defaultMeta: { service: 'waitlist-app' },
  transports: [
    new transports.Console({
      format: jsonFormat,
    }),
  ],
});

if (!isTest) {
  logger.add(
    new transports.File({
      filename: path.join(logsDir, 'application.log'),
      format: jsonFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    })
  );
}

module.exports = logger;
