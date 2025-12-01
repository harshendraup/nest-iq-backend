import winston from 'winston';
import path from 'path';
import fs from 'fs';

const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'cyan',
  },
};

winston.addColors(customLevels.colors);

const logFormat = winston.format.printf(({ level, message, timestamp, stack, requestId }) => {
  const logMsg = `[${timestamp}] [${level.toUpperCase()}]${requestId ? ` [req:${requestId}]` : ''} - ${
    stack || message
  }`;
  return logMsg;
});

const logger = winston.createLogger({
  levels: customLevels.levels,
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.errors({ stack: true }), // include stack trace for errors
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })
  ),
  transports: [
    new winston.transports.Console({
      format:
        process.env.NODE_ENV === 'production'
          ? winston.format.combine(winston.format.colorize(), logFormat)
          : winston.format.combine(winston.format.colorize(), logFormat),
    }),

    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024, 
      maxFiles: 5,
    }),

    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],
});

export const attachLogger = (requestId: string) => {
  return {
    error: (msg: string) => logger.error(msg, { requestId }),
    warn: (msg: string) => logger.warn(msg, { requestId }),
    info: (msg: string) => logger.info(msg, { requestId }),
    debug: (msg: string) => logger.debug(msg, { requestId }),
    http: (msg: string) => logger.log({ level: 'http', message: msg, requestId }),
  };
};

export default logger;
