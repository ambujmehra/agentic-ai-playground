#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = require("./server/express");
const logger_1 = __importDefault(require("./utils/logger"));
const constants_1 = require("./config/constants");
// Load environment variables
dotenv_1.default.config();
// Function to start Express server
function startExpressServer() {
    try {
        const expressServer = new express_1.ExpressServer();
        expressServer.start();
    }
    catch (error) {
        logger_1.default.error('Failed to start Express server:', error);
        process.exit(1);
    }
}
// Main function
async function main() {
    logger_1.default.info(`Starting RO MCP Server v${constants_1.CONFIG.MCP.VERSION}`);
    logger_1.default.info('Starting in HTTP/SSE mode...');
    startExpressServer();
}
// Handle process termination
process.on('SIGINT', () => {
    logger_1.default.info('Received SIGINT, shutting down gracefully...');
    process.exit(0);
});
process.on('SIGTERM', () => {
    logger_1.default.info('Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});
process.on('uncaughtException', (error) => {
    logger_1.default.error('Uncaught exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    logger_1.default.error('Unhandled rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
// Start the application
if (require.main === module) {
    main().catch((error) => {
        logger_1.default.error('Failed to start application:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=index.js.map