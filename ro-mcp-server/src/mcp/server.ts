import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { CONFIG, TOOL_NAMES } from '../config/constants';
import { RepairOrderService } from '../services/repairOrderService';
import logger from '../utils/logger';
import {
  ListRepairOrdersParams,
  GetRepairOrderParams,
  GetRepairOrderByNumberParams,
  CreateRepairOrderParams,
  UpdateRepairOrderParams,
  UpdateRepairOrderStatusParams,
  DeleteRepairOrderParams,
  GetRepairOrdersByStatusParams,
  GetRepairOrdersByTechnicianParams,
  GetRepairOrdersByVehicleParams,
  AddPartToRepairOrderParams
} from './types';

export class ROPMCPServer {
  private server: Server;
  private roService: RepairOrderService;

  constructor() {
    this.server = new Server(
      {
        name: CONFIG.MCP.NAME,
        version: CONFIG.MCP.VERSION,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.roService = new RepairOrderService();
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: TOOL_NAMES.LIST_REPAIR_ORDERS,
            description: 'List repair orders with pagination and sorting options',
            inputSchema: {
              type: 'object',
              properties: {
                page: { type: 'number', description: 'Page number (0-based)', default: 0 },
                size: { type: 'number', description: 'Number of items per page', default: 10 },
                sortBy: { type: 'string', description: 'Field to sort by', default: 'id' },
                sortDir: { type: 'string', enum: ['asc', 'desc'], description: 'Sort direction', default: 'asc' }
              }
            }
          },
          {
            name: TOOL_NAMES.GET_REPAIR_ORDER,
            description: 'Get a specific repair order by ID',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'number', description: 'Repair order ID' }
              },
              required: ['id']
            }
          },
          {
            name: TOOL_NAMES.GET_REPAIR_ORDER_BY_NUMBER,
            description: 'Get a specific repair order by RO number',
            inputSchema: {
              type: 'object',
              properties: {
                roNumber: { type: 'string', description: 'Repair order number (e.g., RO-2024-001)' }
              },
              required: ['roNumber']
            }
          },
          {
            name: TOOL_NAMES.CREATE_REPAIR_ORDER,
            description: 'Create a new repair order',
            inputSchema: {
              type: 'object',
              properties: {
                repairOrder: {
                  type: 'object',
                  properties: {
                    roNumber: { type: 'string', description: 'Unique RO number' },
                    status: { type: 'string', enum: ['CREATED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], default: 'CREATED' },
                    vehicleDetails: {
                      type: 'object',
                      properties: {
                        vehicleVin: { type: 'string', description: 'Vehicle VIN' },
                        vehicleMake: { type: 'string', description: 'Vehicle make' },
                        vehicleModel: { type: 'string', description: 'Vehicle model' },
                        vehicleYear: { type: 'number', description: 'Vehicle year' },
                        mileage: { type: 'number', description: 'Vehicle mileage' }
                      },
                      required: ['vehicleVin', 'vehicleMake', 'vehicleModel', 'vehicleYear']
                    },
                    jobDetails: {
                      type: 'object',
                      properties: {
                        jobDescription: { type: 'string', description: 'Job description' },
                        estimatedHours: { type: 'number', description: 'Estimated hours' },
                        laborRate: { type: 'number', description: 'Labor rate per hour' },
                        jobCategory: { type: 'string', description: 'Job category' }
                      },
                      required: ['jobDescription', 'estimatedHours', 'laborRate']
                    },
                    technicianDetails: {
                      type: 'object',
                      properties: {
                        technicianName: { type: 'string', description: 'Technician name' },
                        technicianId: { type: 'string', description: 'Technician ID' },
                        technicianLevel: { type: 'string', enum: ['JUNIOR', 'SENIOR', 'EXPERT'], description: 'Technician level' }
                      },
                      required: ['technicianName', 'technicianId', 'technicianLevel']
                    },
                    parts: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          partId: { type: 'string', description: 'Part ID' },
                          partNumber: { type: 'string', description: 'Part number' },
                          quantity: { type: 'number', description: 'Quantity' },
                          unitPrice: { type: 'number', description: 'Unit price' }
                        },
                        required: ['partId', 'partNumber', 'quantity', 'unitPrice']
                      }
                    }
                  },
                  required: ['roNumber', 'vehicleDetails', 'jobDetails', 'technicianDetails']
                }
              },
              required: ['repairOrder']
            }
          },
          {
            name: TOOL_NAMES.UPDATE_REPAIR_ORDER,
            description: 'Update an existing repair order by ID or RO number',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'number', description: 'Repair order ID (use either id or roNumber)' },
                roNumber: { type: 'string', description: 'Repair order number (use either id or roNumber)' },
                updates: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['CREATED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] },
                    vehicleDetails: { type: 'object' },
                    jobDetails: { type: 'object' },
                    technicianDetails: { type: 'object' },
                    parts: { type: 'array' }
                  }
                }
              },
              required: ['updates']
            }
          },
          {
            name: TOOL_NAMES.UPDATE_REPAIR_ORDER_STATUS,
            description: 'Update the status of a repair order',
            inputSchema: {
              type: 'object',
              properties: {
                roNumber: { type: 'string', description: 'Repair order number' },
                status: { type: 'string', enum: ['CREATED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], description: 'New status' }
              },
              required: ['roNumber', 'status']
            }
          },
          {
            name: TOOL_NAMES.DELETE_REPAIR_ORDER,
            description: 'Delete a repair order by ID or RO number',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'number', description: 'Repair order ID (use either id or roNumber)' },
                roNumber: { type: 'string', description: 'Repair order number (use either id or roNumber)' }
              }
            }
          },
          {
            name: TOOL_NAMES.GET_REPAIR_ORDERS_BY_STATUS,
            description: 'Get all repair orders with a specific status',
            inputSchema: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['CREATED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], description: 'Status to filter by' }
              },
              required: ['status']
            }
          },
          {
            name: TOOL_NAMES.GET_REPAIR_ORDERS_BY_TECHNICIAN,
            description: 'Get all repair orders assigned to a specific technician',
            inputSchema: {
              type: 'object',
              properties: {
                technicianId: { type: 'string', description: 'Technician ID' }
              },
              required: ['technicianId']
            }
          },
          {
            name: TOOL_NAMES.GET_REPAIR_ORDERS_BY_VEHICLE,
            description: 'Get repair orders by vehicle VIN or make/model',
            inputSchema: {
              type: 'object',
              properties: {
                vin: { type: 'string', description: 'Vehicle VIN (use either vin or make/model)' },
                make: { type: 'string', description: 'Vehicle make (use with model)' },
                model: { type: 'string', description: 'Vehicle model (use with make)' }
              }
            }
          },
          {
            name: TOOL_NAMES.ADD_PART_TO_REPAIR_ORDER,
            description: 'Add a part to an existing repair order',
            inputSchema: {
              type: 'object',
              properties: {
                roNumber: { type: 'string', description: 'Repair order number' },
                part: {
                  type: 'object',
                  properties: {
                    partId: { type: 'string', description: 'Part ID' },
                    partNumber: { type: 'string', description: 'Part number' },
                    quantity: { type: 'number', description: 'Quantity' },
                    unitPrice: { type: 'number', description: 'Unit price' }
                  },
                  required: ['partId', 'partNumber', 'quantity', 'unitPrice']
                }
              },
              required: ['roNumber', 'part']
            }
          },
          {
            name: TOOL_NAMES.GET_REPAIR_ORDER_STATS,
            description: 'Get repair order statistics (total, by status)',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case TOOL_NAMES.LIST_REPAIR_ORDERS:
            return await this.handleListRepairOrders((args || {}) as ListRepairOrdersParams);

          case TOOL_NAMES.GET_REPAIR_ORDER:
            return await this.handleGetRepairOrder(args as unknown as GetRepairOrderParams);

          case TOOL_NAMES.GET_REPAIR_ORDER_BY_NUMBER:
            return await this.handleGetRepairOrderByNumber(args as unknown as GetRepairOrderByNumberParams);

          case TOOL_NAMES.CREATE_REPAIR_ORDER:
            return await this.handleCreateRepairOrder(args as unknown as CreateRepairOrderParams);

          case TOOL_NAMES.UPDATE_REPAIR_ORDER:
            return await this.handleUpdateRepairOrder(args as unknown as UpdateRepairOrderParams);

          case TOOL_NAMES.UPDATE_REPAIR_ORDER_STATUS:
            return await this.handleUpdateRepairOrderStatus(args as unknown as UpdateRepairOrderStatusParams);

          case TOOL_NAMES.DELETE_REPAIR_ORDER:
            return await this.handleDeleteRepairOrder((args || {}) as DeleteRepairOrderParams);

          case TOOL_NAMES.GET_REPAIR_ORDERS_BY_STATUS:
            return await this.handleGetRepairOrdersByStatus(args as unknown as GetRepairOrdersByStatusParams);

          case TOOL_NAMES.GET_REPAIR_ORDERS_BY_TECHNICIAN:
            return await this.handleGetRepairOrdersByTechnician(args as unknown as GetRepairOrdersByTechnicianParams);

          case TOOL_NAMES.GET_REPAIR_ORDERS_BY_VEHICLE:
            return await this.handleGetRepairOrdersByVehicle((args || {}) as GetRepairOrdersByVehicleParams);

          case TOOL_NAMES.ADD_PART_TO_REPAIR_ORDER:
            return await this.handleAddPartToRepairOrder(args as unknown as AddPartToRepairOrderParams);

          case TOOL_NAMES.GET_REPAIR_ORDER_STATS:
            return await this.handleGetRepairOrderStats();

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        logger.error(`Error executing tool ${name}:`, error);
        throw new McpError(
          ErrorCode.InternalError,
          `Error executing tool: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });
  }

  // Tool handlers
  private async handleListRepairOrders(params: ListRepairOrdersParams) {
    const result = await this.roService.listRepairOrders(
      params.page,
      params.size,
      params.sortBy,
      params.sortDir
    );
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleGetRepairOrder(params: GetRepairOrderParams) {
    const result = await this.roService.getRepairOrder(params.id);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleGetRepairOrderByNumber(params: GetRepairOrderByNumberParams) {
    const result = await this.roService.getRepairOrderByNumber(params.roNumber);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleCreateRepairOrder(params: CreateRepairOrderParams) {
    const result = await this.roService.createRepairOrder(params.repairOrder);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleUpdateRepairOrder(params: UpdateRepairOrderParams) {
    let result;
    if (params.id) {
      result = await this.roService.updateRepairOrder(params.id, params.updates);
    } else if (params.roNumber) {
      result = await this.roService.updateRepairOrderByNumber(params.roNumber, params.updates);
    } else {
      throw new Error('Either id or roNumber must be provided');
    }
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleUpdateRepairOrderStatus(params: UpdateRepairOrderStatusParams) {
    const result = await this.roService.updateRepairOrderStatus(params.roNumber, params.status);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleDeleteRepairOrder(params: DeleteRepairOrderParams) {
    if (params.id) {
      await this.roService.deleteRepairOrder(params.id);
    } else if (params.roNumber) {
      await this.roService.deleteRepairOrderByNumber(params.roNumber);
    } else {
      throw new Error('Either id or roNumber must be provided');
    }
    return {
      content: [
        {
          type: 'text',
          text: 'Repair order deleted successfully'
        }
      ]
    };
  }

  private async handleGetRepairOrdersByStatus(params: GetRepairOrdersByStatusParams) {
    const result = await this.roService.getRepairOrdersByStatus(params.status);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleGetRepairOrdersByTechnician(params: GetRepairOrdersByTechnicianParams) {
    const result = await this.roService.getRepairOrdersByTechnician(params.technicianId);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleGetRepairOrdersByVehicle(params: GetRepairOrdersByVehicleParams) {
    let result;
    if (params.vin) {
      result = await this.roService.getRepairOrdersByVehicleVin(params.vin);
    } else if (params.make && params.model) {
      result = await this.roService.getRepairOrdersByVehicle(params.make, params.model);
    } else {
      throw new Error('Either vin or both make and model must be provided');
    }
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleAddPartToRepairOrder(params: AddPartToRepairOrderParams) {
    const result = await this.roService.addPartToRepairOrder(params.roNumber, params.part);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleGetRepairOrderStats() {
    const result = await this.roService.getRepairOrderStats();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    logger.info(`Starting RO MCP Server v${CONFIG.MCP.VERSION}`);
    await this.server.connect(transport);
    logger.info('RO MCP Server connected and ready');
  }
}
