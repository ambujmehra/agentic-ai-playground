"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpressServer = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const constants_1 = require("../config/constants");
const repairOrderService_1 = require("../services/repairOrderService");
const logger_1 = __importDefault(require("../utils/logger"));
class ExpressServer {
    constructor() {
        this.app = (0, express_1.default)();
        this.roService = new repairOrderService_1.RepairOrderService();
        this.setupMiddleware();
        this.setupRoutes();
    }
    extractTenantHeaders(req) {
        const tenantId = req.headers['x-tenant-id'];
        const dealerId = req.headers['x-dealer-id'];
        const userId = req.headers['x-user-id'];
        const locale = req.headers['x-locale'] || 'en-US';
        if (!tenantId || !dealerId || !userId) {
            return null;
        }
        return { tenantId, dealerId, userId, locale };
    }
    setupMiddleware() {
        // CORS configuration
        this.app.use((0, cors_1.default)({
            origin: ['http://localhost:3000', 'http://localhost:8080', '*'],
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Tenant-Id', 'X-Dealer-Id', 'X-User-Id', 'X-Locale']
        }));
        // Parse JSON bodies
        this.app.use(express_1.default.json());
        // Tenant context middleware
        this.app.use((req, _res, next) => {
            // Extract tenant headers for API requests (skip for root and health endpoints)
            if (!req.path.match(/^\/(health|$)/)) {
                const tenantHeaders = this.extractTenantHeaders(req);
                if (tenantHeaders) {
                    this.roService.setTenantContext(tenantHeaders);
                    logger_1.default.debug(`Set tenant context for request: ${tenantHeaders.tenantId}/${tenantHeaders.dealerId}/${tenantHeaders.userId}`);
                }
                else {
                    logger_1.default.warn(`Missing tenant headers for request: ${req.method} ${req.path}`);
                }
            }
            next();
        });
        // Request logging
        this.app.use((req, _res, next) => {
            logger_1.default.info(`${req.method} ${req.path}`, {
                query: req.query,
                body: req.body
            });
            next();
        });
    }
    setupRoutes() {
        // Root endpoint
        this.app.get('/', (_req, res) => {
            res.json({
                name: 'RO MCP Server',
                version: constants_1.CONFIG.MCP.VERSION,
                description: 'Model Context Protocol server for repair order management',
                status: 'running',
                timestamp: new Date().toISOString(),
                endpoints: {
                    health: '/health',
                    mcp: '/mcp',
                    sse: '/sse',
                    tools: '/tools',
                    stats: '/stats',
                    roService: '/ro-service'
                }
            });
        });
        // Health check endpoint
        this.app.get('/health', (_req, res) => {
            res.json({
                status: 'UP',
                service: constants_1.CONFIG.SERVER.NAME,
                version: constants_1.CONFIG.SERVER.VERSION,
                timestamp: new Date().toISOString()
            });
        });
        // RO Service health check proxy
        this.app.get('/ro-service/health', async (_req, res) => {
            try {
                const health = await this.roService.healthCheck();
                res.json(health);
            }
            catch (error) {
                res.status(503).json({
                    status: 'DOWN',
                    service: 'RO Service',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
        // Get repair order stats
        this.app.get('/stats', async (_req, res) => {
            try {
                const stats = await this.roService.getRepairOrderStats();
                res.json(stats);
            }
            catch (error) {
                logger_1.default.error('Error getting stats:', error);
                res.status(500).json({
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
        // MCP server info endpoint (GET)
        this.app.get('/mcp', (_req, res) => {
            res.json({
                name: constants_1.CONFIG.MCP.NAME,
                version: constants_1.CONFIG.MCP.VERSION,
                description: constants_1.CONFIG.MCP.DESCRIPTION,
                tools: {
                    total: 12,
                    repairOrders: 12
                },
                capabilities: [
                    'tools'
                ],
                status: 'running'
            });
        });
        // Standard MCP JSON-RPC endpoint (POST)
        this.app.post('/mcp', async (req, res) => {
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
                logger_1.default.info(`MCP JSON-RPC request: ${method}`, { params });
                let result;
                // Handle different MCP methods
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
                                serverInfo: {
                                    name: constants_1.CONFIG.MCP.NAME,
                                    version: constants_1.CONFIG.MCP.VERSION,
                                    description: constants_1.CONFIG.MCP.DESCRIPTION
                                }
                            }
                        });
                        break;
                    case 'notifications/initialized':
                        // Notification - no response needed
                        res.status(200).end();
                        break;
                    case 'tools/list':
                        result = {
                            tools: [
                                {
                                    name: 'list_repair_orders',
                                    description: 'List all repair orders with optional pagination',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            page: { type: 'number', description: 'Page number (0-based)' },
                                            size: { type: 'number', description: 'Number of items per page' }
                                        }
                                    }
                                },
                                {
                                    name: 'get_repair_order',
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
                                    name: 'get_repair_order_by_number',
                                    description: 'Get a repair order by RO number',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            roNumber: { type: 'string', description: 'RO number' }
                                        },
                                        required: ['roNumber']
                                    }
                                },
                                {
                                    name: 'create_repair_order',
                                    description: 'Create a new repair order',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            vehicleVin: { type: 'string' },
                                            vehicleMake: { type: 'string' },
                                            vehicleModel: { type: 'string' },
                                            vehicleYear: { type: 'number' },
                                            jobDescription: { type: 'string' },
                                            technicianId: { type: 'string' },
                                            technicianName: { type: 'string' },
                                            technicianLevel: { type: 'string' },
                                            laborRate: { type: 'number' },
                                            estimatedHours: { type: 'number' },
                                            jobCategory: { type: 'string' }
                                        },
                                        required: ['vehicleVin', 'vehicleMake', 'vehicleModel', 'vehicleYear', 'jobDescription']
                                    }
                                },
                                {
                                    name: 'update_repair_order',
                                    description: 'Update an existing repair order',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            id: { type: 'number' },
                                            jobDescription: { type: 'string' },
                                            technicianId: { type: 'string' },
                                            technicianName: { type: 'string' },
                                            technicianLevel: { type: 'string' },
                                            laborRate: { type: 'number' },
                                            estimatedHours: { type: 'number' },
                                            jobCategory: { type: 'string' }
                                        },
                                        required: ['id']
                                    }
                                },
                                {
                                    name: 'update_repair_order_status',
                                    description: 'Update repair order status',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            id: { type: 'number' },
                                            status: { type: 'string', enum: ['CREATED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] }
                                        },
                                        required: ['id', 'status']
                                    }
                                },
                                {
                                    name: 'delete_repair_order',
                                    description: 'Delete a repair order',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            id: { type: 'number' }
                                        },
                                        required: ['id']
                                    }
                                },
                                {
                                    name: 'get_repair_orders_by_status',
                                    description: 'Get repair orders by status',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            status: { type: 'string', enum: ['CREATED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] }
                                        },
                                        required: ['status']
                                    }
                                },
                                {
                                    name: 'get_repair_orders_by_technician',
                                    description: 'Get repair orders by technician',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            technicianId: { type: 'string' }
                                        },
                                        required: ['technicianId']
                                    }
                                },
                                {
                                    name: 'get_repair_orders_by_vehicle',
                                    description: 'Get repair orders by vehicle VIN or make/model',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            vehicleVin: { type: 'string', description: 'Vehicle VIN (alternative to make/model)' },
                                            make: { type: 'string', description: 'Vehicle make (requires model)' },
                                            model: { type: 'string', description: 'Vehicle model (requires make)' }
                                        }
                                    }
                                },
                                {
                                    name: 'add_part_to_repair_order',
                                    description: 'Add a part to a repair order',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            repairOrderId: { type: 'number' },
                                            partNumber: { type: 'string' },
                                            partName: { type: 'string' },
                                            quantity: { type: 'number' },
                                            unitPrice: { type: 'number' },
                                            category: { type: 'string' }
                                        },
                                        required: ['repairOrderId', 'partNumber', 'partName', 'quantity', 'unitPrice']
                                    }
                                },
                                {
                                    name: 'get_repair_order_stats',
                                    description: 'Get repair order statistics',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {}
                                    }
                                }
                            ]
                        };
                        break;
                    case 'tools/call':
                        const { name: toolName, arguments: toolArgs } = params || {};
                        // Handle tool calls
                        switch (toolName) {
                            case 'list_repair_orders':
                                result = await this.roService.listRepairOrders(toolArgs?.page || 0, toolArgs?.size || 20);
                                break;
                            case 'get_repair_order':
                                result = await this.roService.getRepairOrder(toolArgs.id);
                                break;
                            case 'get_repair_order_by_number':
                                result = await this.roService.getRepairOrderByNumber(toolArgs.roNumber);
                                break;
                            case 'create_repair_order':
                                result = await this.roService.createRepairOrder(toolArgs);
                                break;
                            case 'update_repair_order':
                                result = await this.roService.updateRepairOrder(toolArgs.id, toolArgs);
                                break;
                            case 'update_repair_order_status':
                                result = await this.roService.updateRepairOrderStatus(toolArgs.id, toolArgs.status);
                                break;
                            case 'delete_repair_order':
                                result = await this.roService.deleteRepairOrder(toolArgs.id);
                                break;
                            case 'get_repair_orders_by_status':
                                result = await this.roService.getRepairOrdersByStatus(toolArgs.status);
                                break;
                            case 'get_repair_orders_by_technician':
                                result = await this.roService.getRepairOrdersByTechnician(toolArgs.technicianId);
                                break;
                            case 'get_repair_orders_by_vehicle':
                                if (toolArgs.vehicleVin) {
                                    result = await this.roService.getRepairOrdersByVehicleVin(toolArgs.vehicleVin);
                                }
                                else if (toolArgs.make && toolArgs.model) {
                                    result = await this.roService.getRepairOrdersByVehicle(toolArgs.make, toolArgs.model);
                                }
                                else {
                                    res.json({
                                        jsonrpc: '2.0',
                                        id,
                                        error: {
                                            code: -32602,
                                            message: 'Invalid params - either vehicleVin or both make and model are required'
                                        }
                                    });
                                    return;
                                }
                                break;
                            case 'add_part_to_repair_order':
                                const { repairOrderId, ...partData } = toolArgs;
                                // First get the RO by ID to get the RO number
                                const repairOrder = await this.roService.getRepairOrder(repairOrderId);
                                result = await this.roService.addPartToRepairOrder(repairOrder.roNumber, partData);
                                break;
                            case 'get_repair_order_stats':
                                result = await this.roService.getRepairOrderStats();
                                break;
                            default:
                                res.json({
                                    jsonrpc: '2.0',
                                    id,
                                    error: {
                                        code: -32601,
                                        message: `Method not found: ${toolName}`
                                    }
                                });
                                return;
                        }
                        res.json({
                            jsonrpc: '2.0',
                            id,
                            result: {
                                content: [
                                    {
                                        type: 'text',
                                        text: JSON.stringify(result, null, 2)
                                    }
                                ]
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
                        return;
                }
                // Send success response for non-tool-call methods (like tools/list)
                if (method === 'tools/list') {
                    res.json({
                        jsonrpc: '2.0',
                        id,
                        result
                    });
                }
            }
            catch (error) {
                logger_1.default.error('MCP JSON-RPC error:', error);
                res.json({
                    jsonrpc: '2.0',
                    id: req.body?.id || null,
                    error: {
                        code: -32603,
                        message: 'Internal error',
                        data: error instanceof Error ? error.message : 'Unknown error'
                    }
                });
            }
        });
        // SSE endpoint for Server-Sent Events
        this.app.get('/sse', (_req, res) => {
            logger_1.default.info('SSE connection established');
            // Set SSE headers
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Cache-Control'
            });
            // Send initial connection event
            res.write('data: {"type":"connection","status":"connected","server":"ro-mcp-server","timestamp":"' + new Date().toISOString() + '"}\n\n');
            // Handle MCP protocol over SSE
            const handleSSEMessage = (data) => {
                try {
                    const response = JSON.stringify(data);
                    res.write(`data: ${response}\n\n`);
                }
                catch (error) {
                    logger_1.default.error('SSE message error:', error);
                }
            };
            // Send periodic server info
            const infoInterval = setInterval(async () => {
                try {
                    const stats = await this.roService.getRepairOrderStats();
                    handleSSEMessage({
                        type: 'server-info',
                        data: {
                            server: {
                                name: constants_1.CONFIG.MCP.NAME,
                                version: constants_1.CONFIG.MCP.VERSION,
                                status: 'running'
                            },
                            stats: stats,
                            timestamp: new Date().toISOString()
                        }
                    });
                }
                catch (error) {
                    logger_1.default.error('Error sending SSE server info:', error);
                }
            }, 30000); // Every 30 seconds
            // Keep connection alive with ping
            const keepAlive = setInterval(() => {
                res.write('data: {"type":"ping","timestamp":"' + new Date().toISOString() + '"}\n\n');
            }, 15000); // Every 15 seconds
            // Clean up on client disconnect
            _req.on('close', () => {
                clearInterval(keepAlive);
                clearInterval(infoInterval);
                logger_1.default.info('SSE client disconnected');
            });
            _req.on('error', (error) => {
                logger_1.default.error('SSE connection error:', error);
                clearInterval(keepAlive);
                clearInterval(infoInterval);
            });
        });
        // MCP tools information endpoint
        this.app.get('/tools', (_req, res) => {
            res.json({
                name: constants_1.CONFIG.MCP.NAME,
                version: constants_1.CONFIG.MCP.VERSION,
                description: constants_1.CONFIG.MCP.DESCRIPTION,
                tools: [
                    'list_repair_orders',
                    'get_repair_order',
                    'get_repair_order_by_number',
                    'create_repair_order',
                    'update_repair_order',
                    'update_repair_order_status',
                    'delete_repair_order',
                    'get_repair_orders_by_status',
                    'get_repair_orders_by_technician',
                    'get_repair_orders_by_vehicle',
                    'add_part_to_repair_order',
                    'get_repair_order_stats'
                ]
            });
        });
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Not Found',
                message: `Route ${req.method} ${req.originalUrl} not found`
            });
        });
        // Error handler
        this.app.use((error, _req, res, _next) => {
            logger_1.default.error('Express error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        });
    }
    start() {
        this.app.listen(constants_1.CONFIG.SERVER.PORT, constants_1.CONFIG.SERVER.HOST, () => {
            logger_1.default.info(`RO MCP Express Server running on http://${constants_1.CONFIG.SERVER.HOST}:${constants_1.CONFIG.SERVER.PORT}`);
        });
    }
    getApp() {
        return this.app;
    }
}
exports.ExpressServer = ExpressServer;
//# sourceMappingURL=express.js.map