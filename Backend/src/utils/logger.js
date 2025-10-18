import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
          const base = `${timestamp} [${level}] ${message}`;
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return stack ? `${base}\n${stack}${metaStr}` : `${base}${metaStr}`;
        })
      )
    })
  ]
});

export default logger;