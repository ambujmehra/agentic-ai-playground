#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = require("./server/express");
const logger_1 = require("./utils/logger");
const config_1 = require("./config");
// Load environment variables
dotenv_1.default.config();
// Function to start Express server
function startExpressServer() {
    try {
        const expressServer = new express_1.ExpressServer();
        expressServer.start();
    }
    catch (error) {
        logger_1.logger.error('Failed to start Express server:', error);
        process.exit(1);
    }
}
// Function to shutdown gracefully
function gracefulShutdown(signal) {
    logger_1.logger.info(`Received ${signal}. Starting graceful shutdown...`);
    // Close connections, save state, etc.
    process.exit(0);
}
// Handle graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
// Main execution
logger_1.logger.info('Starting Part MCP Server...');
logger_1.logger.info(`Configuration: ${JSON.stringify(config_1.config, null, 2)}`);
startExpressServer();
//# sourceMappingURL=index.js.map