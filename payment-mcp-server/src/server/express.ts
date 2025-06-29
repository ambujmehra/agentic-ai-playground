import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { MCPServer } from '../mcp/server.js';
import { PaymentService } from '../services/paymentService.js';
import { CONFIG } from '../config/constants.js';
import { logger } from '../utils/logger.js';
import { APIError, handleError } from '../utils/errors.js';
import { TenantHeaders } from '../mcp/types.js';

export class ExpressServer {
  private app: express.Application;
  private mcpServer: MCPServer;
  private paymentService: PaymentService;

  constructor() {
    this.app = express();
    this.paymentService = new PaymentService();
    this.mcpServer = new MCPServer(this.paymentService);
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private extractTenantHeaders(req: Request): TenantHeaders | null {
    const tenantId = req.headers['x-tenant-id'] as string;
    const dealerId = req.headers['x-dealer-id'] as string;
    const userId = req.headers['x-user-id'] as string;
    const locale = req.headers['x-locale'] as string || 'en-US';

    if (!tenantId || !dealerId || !userId) {
      return null;
    }

    return { tenantId, dealerId, userId, locale };
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    
    // CORS configuration
    this.app.use(cors({
      origin: CONFIG.CORS_ORIGINS,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Tenant-Id', 'X-Dealer-Id', 'X-User-Id', 'X-Locale']
    }));

    // Compression
    this.app.use(compression());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use('/api/', limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        query: req.query,
        body: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Root endpoint
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        name: 'Payment MCP Server',
        version: '1.0.0',
        description: 'Model Context Protocol server for payment management',
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/health',
          mcp: '/mcp',
          api: '/api'
        }
      });
    });

    // Health check endpoint
    this.app.get('/health', async (req: Request, res: Response) => {
      try {
        const paymentServiceHealth = await this.paymentService.healthCheck();
        const mcpServerInfo = this.mcpServer.getServerInfo();
        
        res.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          services: {
            paymentService: paymentServiceHealth,
            mcpServer: mcpServerInfo
          },
          cache: {
            size: this.paymentService.getCacheStats()
          }
        });
      } catch (error) {
        logger.error('Health check failed:', error);
        res.status(503).json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // MCP server info endpoint
    this.app.get('/mcp', (req: Request, res: Response) => {
      const serverInfo = this.mcpServer.getServerInfo();
      res.json(serverInfo);
    });

    // MCP tools endpoint
    this.app.get('/mcp/tools', (req: Request, res: Response) => {
      try {
        const tools = this.mcpServer['toolRegistry'].getAllTools();
        const toolsByCategory = this.mcpServer['toolRegistry'].getToolsByCategory();
        
        res.json({
          tools: tools,
          categories: toolsByCategory,
          count: tools.length
        });
      } catch (error) {
        logger.error('Error getting tools:', error);
        res.status(500).json({
          error: 'Failed to retrieve tools',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Standard MCP JSON-RPC endpoint
    this.app.post('/mcp', async (req: Request, res: Response): Promise<void> => {
      try {
        const { jsonrpc, id, method, params } = req.body;

        // Validate JSON-RPC format
        if (jsonrpc !== '2.0') {
          res.json({
            jsonrpc: '2.0',
            id,
            error: {
              code: -32600,
              message: 'Invalid Request - jsonrpc must be "2.0"'
            }
          });
          return;
        }

        logger.info(`MCP Request: ${method}`, { id, params });

        // Handle MCP protocol methods
        switch (method) {
          case 'initialize':
            res.json({
              jsonrpc: '2.0',
              id,
              result: {
                protocolVersion: '2024-11-05',
                capabilities: {
                  tools: {
                    listChanged: true
                  },
                  resources: {
                    subscribe: false,
                    listChanged: false
                  },
                  prompts: {
                    listChanged: false
                  }
                },
                serverInfo: this.mcpServer.getServerInfo()
              }
            });
            break;

          case 'notifications/initialized':
            // Notification - no response needed
            res.status(200).end();
            break;

          case 'tools/list':
            const tools = this.mcpServer['toolRegistry'].getAllTools();
            res.json({
              jsonrpc: '2.0',
              id,
              result: {
                tools: tools
              }
            });
            break;

          case 'tools/call':
            if (!params || !params.name) {
              res.json({
                jsonrpc: '2.0',
                id,
                error: {
                  code: -32602,
                  message: 'Invalid params - tool name required'
                }
              });
              return;
            }

            // Extract tenant headers from request
            const tenantHeaders = this.extractTenantHeaders(req);
            if (!tenantHeaders) {
              res.json({
                jsonrpc: '2.0',
                id,
                error: {
                  code: -32602,
                  message: 'Missing required tenant headers: X-Tenant-Id, X-Dealer-Id, X-User-Id'
                }
              });
              return;
            }

            // Set tenant context for this request
            this.paymentService.setTenantContext(tenantHeaders);

            try {
              const { name, arguments: toolArgs } = params;
              const result = await this.mcpServer['toolRegistry'].executeTool(name, toolArgs || {});
              
              res.json({
                jsonrpc: '2.0',
                id,
                result: {
                  content: [
                    {
                      type: 'text',
                      text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
                    }
                  ],
                  isError: false
                }
              });
            } finally {
              // Clear tenant context after request
              this.paymentService.clearTenantContext();
            }
            break;

          case 'resources/list':
            res.json({
              jsonrpc: '2.0',
              id,
              result: {
                resources: []
              }
            });
            break;

          case 'prompts/list':
            res.json({
              jsonrpc: '2.0',
              id,
              result: {
                prompts: []
              }
            });
            break;

          default:
            res.json({
              jsonrpc: '2.0',
              id,
              error: {
                code: -32601,
                message: `Method not found: ${method}`
              }
            });
        }

      } catch (error) {
        logger.error('MCP protocol error:', error);
        
        const errorResponse = {
          jsonrpc: '2.0',
          id: req.body.id,
          error: {
            code: -32603,
            message: 'Internal error',
            data: error instanceof Error ? error.message : 'Unknown error'
          }
        };

        if (error instanceof APIError) {
          errorResponse.error.code = error.statusCode === 400 ? -32602 : -32603;
          errorResponse.error.message = error.message;
        }

        res.status(200).json(errorResponse);
      }
    });

    // MCP tool execution endpoint (for testing)
    this.app.post('/mcp/tools/:toolName', async (req: Request, res: Response) => {
      try {
        const { toolName } = req.params;
        const args = req.body;

        // Extract tenant headers from request
        const tenantHeaders = this.extractTenantHeaders(req);
        if (!tenantHeaders) {
          res.status(400).json({
            error: 'Missing required tenant headers: X-Tenant-Id, X-Dealer-Id, X-User-Id',
            tool: toolName,
            timestamp: new Date().toISOString()
          });
          return;
        }

        // Set tenant context for this request
        this.paymentService.setTenantContext(tenantHeaders);

        try {
          const result = await this.mcpServer['toolRegistry'].executeTool(toolName, args);
          
          res.json({
            tool: toolName,
            result: result,
            timestamp: new Date().toISOString()
          });
        } finally {
          // Clear tenant context after request
          this.paymentService.clearTenantContext();
        }
      } catch (error) {
        logger.error(`Error executing tool ${req.params.toolName}:`, error);
        
        if (error instanceof APIError) {
          res.status(error.statusCode).json({
            error: error.message,
            tool: req.params.toolName,
            timestamp: new Date().toISOString()
          });
        } else {
          res.status(500).json({
            error: 'Internal server error',
            tool: req.params.toolName,
            details: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    // Cache management endpoints
    this.app.delete('/api/cache', (req: Request, res: Response) => {
      try {
        this.paymentService.clearCache();
        res.json({
          message: 'Cache cleared successfully',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Error clearing cache:', error);
        res.status(500).json({
          error: 'Failed to clear cache',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    this.app.get('/api/cache/stats', (req: Request, res: Response) => {
      try {
        const stats = this.paymentService.getCacheStats();
        res.json({
          cache: stats,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Error getting cache stats:', error);
        res.status(500).json({
          error: 'Failed to get cache stats',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // SSE endpoint for Server-Sent Events
    this.app.get('/sse', (req: Request, res: Response) => {
      logger.info('SSE connection established');
      
      // Set SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      // Send initial connection event
      res.write('data: {"type":"connection","status":"connected","server":"payment-mcp-server","timestamp":"' + new Date().toISOString() + '"}\n\n');

      // Handle MCP protocol over SSE
      const handleSSEMessage = (data: any) => {
        try {
          const response = JSON.stringify(data);
          res.write(`data: ${response}\n\n`);
        } catch (error) {
          logger.error('SSE message error:', error);
        }
      };

      // Send periodic server info
      const infoInterval = setInterval(() => {
        const serverInfo = this.mcpServer.getServerInfo();
        const cacheStats = this.paymentService.getCacheStats();
        handleSSEMessage({
          type: 'server-info',
          data: {
            server: serverInfo,
            cache: cacheStats,
            timestamp: new Date().toISOString()
          }
        });
      }, 30000); // Every 30 seconds

      // Keep connection alive with ping
      const keepAlive = setInterval(() => {
        res.write('data: {"type":"ping","timestamp":"' + new Date().toISOString() + '"}\n\n');
      }, 15000); // Every 15 seconds

      // Clean up on client disconnect
      req.on('close', () => {
        clearInterval(keepAlive);
        clearInterval(infoInterval);
        logger.info('SSE client disconnected');
      });

      req.on('error', (error) => {
        logger.error('SSE connection error:', error);
        clearInterval(keepAlive);
        clearInterval(infoInterval);
      });
    });

    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: `The requested endpoint ${req.method} ${req.originalUrl} was not found`,
        timestamp: new Date().toISOString()
      });
    });
  }

  private setupErrorHandling(): void {
    // Global error handler
    this.app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
      const errorResponse = handleError(error);
      
      logger.error('Express server error:', {
        error: errorResponse,
        request: {
          method: req.method,
          path: req.path,
          query: req.query,
          body: req.body,
          ip: req.ip
        }
      });

      res.status(errorResponse.statusCode).json({
        error: errorResponse.message,
        code: errorResponse.statusCode,
        timestamp: new Date().toISOString(),
        path: req.path
      });
    });

    // Unhandled promise rejection
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Promise Rejection:', { reason, promise });
    });

    // Uncaught exception
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });
  }

  public async start(): Promise<void> {
    try {
      // Start MCP server first
      await this.mcpServer.start();
      
      // Start Express server
      const server = this.app.listen(CONFIG.PORT, () => {
        logger.info(`Express server started on port ${CONFIG.PORT}`, {
          port: CONFIG.PORT,
          env: CONFIG.NODE_ENV,
          corsOrigins: CONFIG.CORS_ORIGINS
        });
      });

      // Graceful shutdown
      process.on('SIGTERM', async () => {
        logger.info('SIGTERM received, shutting down gracefully');
        server.close(async () => {
          await this.mcpServer.stop();
          process.exit(0);
        });
      });

      process.on('SIGINT', async () => {
        logger.info('SIGINT received, shutting down gracefully');
        server.close(async () => {
          await this.mcpServer.stop();
          process.exit(0);
        });
      });

    } catch (error) {
      logger.error('Failed to start Express server:', error);
      throw error;
    }
  }
}
