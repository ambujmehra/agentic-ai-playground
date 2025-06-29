import winston from 'winston';
import { CONFIG } from '../config/constants';

// Create winston logger
const logger = winston.createLogger({
  level: CONFIG.LOGGING.LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: CONFIG.SERVER.NAME },
  transports: [
    // Write to console with colorized output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          let log = `${timestamp} [${level}]: ${message}`;
          if (Object.keys(meta).length > 0) {
            log += ` ${JSON.stringify(meta)}`;
          }
          return log;
        })
      )
    }),
    // Write to file
    new winston.transports.File({ 
      filename: CONFIG.LOGGING.FILE,
      maxsize: parseInt(CONFIG.LOGGING.MAX_SIZE.replace('m', '')) * 1024 * 1024,
      maxFiles: CONFIG.LOGGING.MAX_FILES
    })
  ]
});

export default logger;
