"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROPMCPServer = void 0;
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const constants_1 = require("../config/constants");
const repairOrderService_1 = require("../services/repairOrderService");
const logger_1 = __importDefault(require("../utils/logger"));
class ROPMCPServer {
    constructor() {
        this.server = new index_js_1.Server({
            name: constants_1.CONFIG.MCP.NAME,
            version: constants_1.CONFIG.MCP.VERSION,
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.roService = new repairOrderService_1.RepairOrderService();
        this.setupHandlers();
    }
    setupHandlers() {
        // List available tools
        this.server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: constants_1.TOOL_NAMES.LIST_REPAIR_ORDERS,
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
                        name: constants_1.TOOL_NAMES.GET_REPAIR_ORDER,
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
                        name: constants_1.TOOL_NAMES.GET_REPAIR_ORDER_BY_NUMBER,
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
                        name: constants_1.TOOL_NAMES.CREATE_REPAIR_ORDER,
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
                        name: constants_1.TOOL_NAMES.UPDATE_REPAIR_ORDER,
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
                        name: constants_1.TOOL_NAMES.UPDATE_REPAIR_ORDER_STATUS,
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
                        name: constants_1.TOOL_NAMES.DELETE_REPAIR_ORDER,
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
                        name: constants_1.TOOL_NAMES.GET_REPAIR_ORDERS_BY_STATUS,
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
                        name: constants_1.TOOL_NAMES.GET_REPAIR_ORDERS_BY_TECHNICIAN,
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
                        name: constants_1.TOOL_NAMES.GET_REPAIR_ORDERS_BY_VEHICLE,
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
                        name: constants_1.TOOL_NAMES.ADD_PART_TO_REPAIR_ORDER,
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
                        name: constants_1.TOOL_NAMES.GET_REPAIR_ORDER_STATS,
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
        this.server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                switch (name) {
                    case constants_1.TOOL_NAMES.LIST_REPAIR_ORDERS:
                        return await this.handleListRepairOrders((args || {}));
                    case constants_1.TOOL_NAMES.GET_REPAIR_ORDER:
                        return await this.handleGetRepairOrder(args);
                    case constants_1.TOOL_NAMES.GET_REPAIR_ORDER_BY_NUMBER:
                        return await this.handleGetRepairOrderByNumber(args);
                    case constants_1.TOOL_NAMES.CREATE_REPAIR_ORDER:
                        return await this.handleCreateRepairOrder(args);
                    case constants_1.TOOL_NAMES.UPDATE_REPAIR_ORDER:
                        return await this.handleUpdateRepairOrder(args);
                    case constants_1.TOOL_NAMES.UPDATE_REPAIR_ORDER_STATUS:
                        return await this.handleUpdateRepairOrderStatus(args);
                    case constants_1.TOOL_NAMES.DELETE_REPAIR_ORDER:
                        return await this.handleDeleteRepairOrder((args || {}));
                    case constants_1.TOOL_NAMES.GET_REPAIR_ORDERS_BY_STATUS:
                        return await this.handleGetRepairOrdersByStatus(args);
                    case constants_1.TOOL_NAMES.GET_REPAIR_ORDERS_BY_TECHNICIAN:
                        return await this.handleGetRepairOrdersByTechnician(args);
                    case constants_1.TOOL_NAMES.GET_REPAIR_ORDERS_BY_VEHICLE:
                        return await this.handleGetRepairOrdersByVehicle((args || {}));
                    case constants_1.TOOL_NAMES.ADD_PART_TO_REPAIR_ORDER:
                        return await this.handleAddPartToRepairOrder(args);
                    case constants_1.TOOL_NAMES.GET_REPAIR_ORDER_STATS:
                        return await this.handleGetRepairOrderStats();
                    default:
                        throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
                }
            }
            catch (error) {
                logger_1.default.error(`Error executing tool ${name}:`, error);
                throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Error executing tool: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
    // Tool handlers
    async handleListRepairOrders(params) {
        const result = await this.roService.listRepairOrders(params.page, params.size, params.sortBy, params.sortDir);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }
            ]
        };
    }
    async handleGetRepairOrder(params) {
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
    async handleGetRepairOrderByNumber(params) {
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
    async handleCreateRepairOrder(params) {
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
    async handleUpdateRepairOrder(params) {
        let result;
        if (params.id) {
            result = await this.roService.updateRepairOrder(params.id, params.updates);
        }
        else if (params.roNumber) {
            result = await this.roService.updateRepairOrderByNumber(params.roNumber, params.updates);
        }
        else {
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
    async handleUpdateRepairOrderStatus(params) {
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
    async handleDeleteRepairOrder(params) {
        if (params.id) {
            await this.roService.deleteRepairOrder(params.id);
        }
        else if (params.roNumber) {
            await this.roService.deleteRepairOrderByNumber(params.roNumber);
        }
        else {
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
    async handleGetRepairOrdersByStatus(params) {
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
    async handleGetRepairOrdersByTechnician(params) {
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
    async handleGetRepairOrdersByVehicle(params) {
        let result;
        if (params.vin) {
            result = await this.roService.getRepairOrdersByVehicleVin(params.vin);
        }
        else if (params.make && params.model) {
            result = await this.roService.getRepairOrdersByVehicle(params.make, params.model);
        }
        else {
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
    async handleAddPartToRepairOrder(params) {
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
    async handleGetRepairOrderStats() {
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
    async run() {
        const transport = new stdio_js_1.StdioServerTransport();
        logger_1.default.info(`Starting RO MCP Server v${constants_1.CONFIG.MCP.VERSION}`);
        await this.server.connect(transport);
        logger_1.default.info('RO MCP Server connected and ready');
    }
}
exports.ROPMCPServer = ROPMCPServer;
//# sourceMappingURL=server.js.map