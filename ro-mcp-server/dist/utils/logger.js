"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const constants_1 = require("../config/constants");
// Create winston logger
const logger = winston_1.default.createLogger({
    level: constants_1.CONFIG.LOGGING.LEVEL,
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
    defaultMeta: { service: constants_1.CONFIG.SERVER.NAME },
    transports: [
        // Write to console with colorized output
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple(), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
                let log = `${timestamp} [${level}]: ${message}`;
                if (Object.keys(meta).length > 0) {
                    log += ` ${JSON.stringify(meta)}`;
                }
                return log;
            }))
        }),
        // Write to file
        new winston_1.default.transports.File({
            filename: constants_1.CONFIG.LOGGING.FILE,
            maxsize: parseInt(constants_1.CONFIG.LOGGING.MAX_SIZE.replace('m', '')) * 1024 * 1024,
            maxFiles: constants_1.CONFIG.LOGGING.MAX_FILES
        })
    ]
});
exports.default = logger;
//# sourceMappingURL=logger.js.map