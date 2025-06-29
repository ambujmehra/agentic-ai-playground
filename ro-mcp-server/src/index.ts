#!/usr/bin/env node

import dotenv from 'dotenv';
import { ExpressServer } from './server/express';
import logger from './utils/logger';
import { CONFIG } from './config/constants';

// Load environment variables
dotenv.config();

// Function to start Express server
function startExpressServer(): void {
  try {
    const expressServer = new ExpressServer();
    expressServer.start();
  } catch (error) {
    logger.error('Failed to start Express server:', error);
    process.exit(1);
  }
}

// Main function
async function main(): Promise<void> {
  logger.info(`Starting RO MCP Server v${CONFIG.MCP.VERSION}`);
  logger.info('Starting in HTTP/SSE mode...');
  startExpressServer();
}

// Handle process termination
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
if (require.main === module) {
  main().catch((error) => {
    logger.error('Failed to start application:', error);
    process.exit(1);
  });
}
