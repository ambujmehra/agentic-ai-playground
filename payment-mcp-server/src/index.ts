#!/usr/bin/env node

import { ExpressServer } from './server/express.js';
import { MCPServer } from './mcp/server.js';
import { CONFIG } from './config/constants.js';
import { logger } from './utils/logger.js';

async function main() {
  try {
    logger.info('Starting Payment MCP Server...', {
      version: '1.0.0',
      nodeEnv: CONFIG.NODE_ENV,
      port: CONFIG.PORT
    });

    // Determine server mode based on arguments
    const args = process.argv.slice(2);
    const mode = args.find(arg => arg === '--stdio' || arg === '--http') || '--http';

    if (mode === '--stdio') {
      // Start as pure MCP server with stdio transport
      logger.info('Starting in MCP stdio mode');
      const mcpServer = new MCPServer();
      await mcpServer.start();
    } else {
      // Start as HTTP server with MCP capabilities (default)
      logger.info('Starting in HTTP mode with MCP capabilities');
      const expressServer = new ExpressServer();
      await expressServer.start();
    }

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled rejections and exceptions
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception thrown:', error);
  process.exit(1);
});

// Start the application
main().catch((error) => {
  logger.error('Application startup failed:', error);
  process.exit(1);
});
