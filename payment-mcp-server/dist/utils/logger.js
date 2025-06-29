import * as winston from 'winston';
import { CONFIG } from '../config/constants.js';
// Create Winston logger instance
export const logger = winston.createLogger({
    level: CONFIG.LOG_LEVEL,
    format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json()),
    defaultMeta: { service: 'payment-mcp-server' },
    transports: [
        // Write all logs with importance level of 'error' or less to error.log
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Write all logs with importance level of 'info' or less to combined.log
        new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ]
});
// If we're not in production, log to the console with a simple format
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(winston.format.colorize(), winston.format.simple())
    }));
}
// Create logs directory if it doesn't exist
import * as fs from 'fs';
if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs');
}
//# sourceMappingURL=logger.js.map