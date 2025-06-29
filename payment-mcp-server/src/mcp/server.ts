import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListResourcesRequestSchema, ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { PaymentService } from '../services/paymentService.js';
import { ToolRegistry } from './tools/index.js';
import { SERVER_CONFIG } from '../config/constants.js';
import { APIError, PaymentServiceError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export class MCPServer {
  private server: Server;
  private paymentService: PaymentService;
  private toolRegistry: ToolRegistry;

  constructor(paymentService?: PaymentService) {
    this.server = new Server(
      {
        name: SERVER_CONFIG.name,
        version: SERVER_CONFIG.version,
        description: SERVER_CONFIG.description
      },
      {
        capabilities: {
          tools: {},
          resources: {}
        }
      }
    );

    this.paymentService = paymentService || new PaymentService();
    this.toolRegistry = new ToolRegistry(this.paymentService);
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Handle list_tools requests
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      try {
        const tools = this.toolRegistry.getAllTools();
        logger.info(`Returning ${tools.length} available tools`);
        
        return {
          tools: tools
        };
      } catch (error) {
        logger.error('Error listing tools:', error);
        throw new APIError('Failed to list tools', 500);
      }
    });

    // Handle call_tool requests
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        logger.info(`Executing tool: ${name}`, { arguments: args });
        
        // Validate tool exists
        if (!this.toolRegistry.validateToolExists(name)) {
          throw new APIError(`Tool not found: ${name}`, 404);
        }

        // Execute the tool
        const result = await this.toolRegistry.executeTool(name, args || {});
        
        logger.info(`Tool ${name} executed successfully`);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        logger.error(`Error executing tool ${name}:`, error);
        
        if (error instanceof APIError || error instanceof PaymentServiceError) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  error: error.message,
                  code: error.statusCode || 500,
                  tool: name
                }, null, 2)
              }
            ],
            isError: true
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: 'Internal server error',
                code: 500,
                tool: name,
                details: error instanceof Error ? error.message : 'Unknown error'
              }, null, 2)
            }
          ],
          isError: true
        };
      }
    });

    // Handle list_resources requests
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      try {
        const toolsCount = this.toolRegistry.getToolsCount();
        
        return {
          resources: [
            {
              uri: 'payment-tools://transactions',
              name: 'Transaction Management Tools',
              description: `${toolsCount.transactions} tools for managing payment transactions`,
              mimeType: 'application/json'
            },
            {
              uri: 'payment-tools://payment-links',
              name: 'Payment Link Management Tools',
              description: `${toolsCount.paymentLinks} tools for managing payment links`,
              mimeType: 'application/json'
            },
            {
              uri: 'payment-tools://health',
              name: 'Service Health Information',
              description: 'Health status of the payment service and cache',
              mimeType: 'application/json'
            }
          ]
        };
      } catch (error) {
        logger.error('Error listing resources:', error);
        throw new APIError('Failed to list resources', 500);
      }
    });

    // Error handling
    this.server.onerror = (error) => {
      logger.error('MCP Server error:', error);
    };
  }

  public async start(): Promise<void> {
    try {
      // Test payment service connection
      await this.paymentService.healthCheck();
      logger.info('Payment service health check passed');

      // Start the MCP server with stdio transport
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      const toolsCount = this.toolRegistry.getToolsCount();
      logger.info(`MCP Server started successfully with ${toolsCount.total} tools available`, {
        transactions: toolsCount.transactions,
        paymentLinks: toolsCount.paymentLinks,
        serverName: SERVER_CONFIG.name,
        version: SERVER_CONFIG.version
      });

    } catch (error) {
      logger.error('Failed to start MCP server:', error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    try {
      // Clear cache
      this.paymentService.clearCache();
      logger.info('MCP Server stopped successfully');
    } catch (error) {
      logger.error('Error stopping MCP server:', error);
      throw error;
    }
  }

  public getServerInfo(): any {
    const toolsCount = this.toolRegistry.getToolsCount();
    return {
      name: SERVER_CONFIG.name,
      version: SERVER_CONFIG.version,
      description: SERVER_CONFIG.description,
      tools: {
        total: toolsCount.total,
        transactions: toolsCount.transactions,
        paymentLinks: toolsCount.paymentLinks
      },
      capabilities: ['tools', 'resources'],
      status: 'running'
    };
  }
}
