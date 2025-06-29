#!/usr/bin/env node

import dotenv from 'dotenv';
import { ExpressServer } from './server/express';
import { logger } from './utils/logger';
import { config } from './config';

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

// Function to shutdown gracefully
function gracefulShutdown(signal: string): void {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  // Close connections, save state, etc.
  process.exit(0);
}

// Handle graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Main execution
logger.info('Starting Part MCP Server...');
logger.info(`Configuration: ${JSON.stringify(config, null, 2)}`);

startExpressServer();
