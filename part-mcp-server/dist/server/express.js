"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpressServer = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const config_1 = require("../config");
const partService_1 = require("../services/partService");
const logger_1 = require("../utils/logger");
class ExpressServer {
    constructor() {
        this.app = (0, express_1.default)();
        this.partService = new partService_1.PartService();
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
        // Enable CORS
        this.app.use((0, cors_1.default)({
            origin: config_1.config.server.corsOrigins,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Tenant-Id', 'X-Dealer-Id', 'X-User-Id', 'X-Locale'],
            optionsSuccessStatus: 200
        }));
        // Parse JSON bodies
        this.app.use(express_1.default.json());
        // Request logging
        this.app.use((req, _res, next) => {
            logger_1.logger.info(`${req.method} ${req.path}`, {
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
                name: 'Part MCP Server',
                version: config_1.config.mcp.version,
                description: 'Model Context Protocol server for automotive parts management',
                status: 'running',
                timestamp: new Date().toISOString(),
                endpoints: {
                    health: '/health',
                    mcp: '/mcp',
                    sse: '/sse',
                    tools: '/tools',
                    stats: '/stats',
                    partService: '/part-service'
                }
            });
        });
        // Health check endpoint
        this.app.get('/health', (_req, res) => {
            res.json({
                status: 'UP',
                service: config_1.config.mcp.name,
                version: config_1.config.mcp.version,
                timestamp: new Date().toISOString()
            });
        });
        // Part Service health check proxy
        this.app.get('/part-service/health', async (req, res) => {
            // Extract tenant headers for part service proxy calls
            const tenantHeaders = this.extractTenantHeaders(req);
            if (!tenantHeaders) {
                res.status(400).json({
                    error: "Tenant Validation Failed",
                    message: "Missing required tenant headers: X-Tenant-Id, X-Dealer-Id, X-User-Id are required",
                    code: "MT001",
                    timestamp: new Date().toISOString(),
                    required_headers: ["X-Tenant-Id", "X-Dealer-Id", "X-User-Id", "X-Locale (optional)"]
                });
                return;
            }
            // Set tenant context for this request
            this.partService.setTenantContext(tenantHeaders);
            try {
                const health = await this.partService.healthCheck();
                res.json(health);
            }
            catch (error) {
                res.status(503).json({
                    status: 'DOWN',
                    service: 'Part Service',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
            finally {
                // Clear tenant context after request
                this.partService.clearTenantContext();
            }
        });
        // Get part stats
        this.app.get('/stats', async (req, res) => {
            // Extract tenant headers for part service stats calls
            const tenantHeaders = this.extractTenantHeaders(req);
            if (!tenantHeaders) {
                res.status(400).json({
                    error: "Tenant Validation Failed",
                    message: "Missing required tenant headers: X-Tenant-Id, X-Dealer-Id, X-User-Id are required",
                    code: "MT001",
                    timestamp: new Date().toISOString(),
                    required_headers: ["X-Tenant-Id", "X-Dealer-Id", "X-User-Id", "X-Locale (optional)"]
                });
                return;
            }
            // Set tenant context for this request
            this.partService.setTenantContext(tenantHeaders);
            try {
                const stats = await this.partService.getPartStats();
                res.json(stats);
            }
            catch (error) {
                logger_1.logger.error('Error getting stats:', error);
                res.status(500).json({
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
            finally {
                // Clear tenant context after request
                this.partService.clearTenantContext();
            }
        });
        // MCP server info endpoint (GET)
        this.app.get('/mcp', (_req, res) => {
            res.json({
                name: config_1.config.mcp.name,
                version: config_1.config.mcp.version,
                description: 'Model Context Protocol server for automotive parts management',
                tools: {
                    total: 15,
                    parts: 15
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
                logger_1.logger.info(`MCP JSON-RPC request: ${method}`, { params });
                let result;
                // Handle different MCP methods
                switch (method) {
                    case 'initialize':
                        res.json({
                            jsonrpc: '2.0',
                            id,
                            result: {
                                protocolVersion: config_1.config.mcp.protocolVersion,
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
                                    name: config_1.config.mcp.name,
                                    version: config_1.config.mcp.version,
                                    description: 'Model Context Protocol server for automotive parts management'
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
                                    name: 'list_parts',
                                    description: 'List all parts with optional pagination and filtering',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            page: { type: 'number', description: 'Page number (0-based)' },
                                            size: { type: 'number', description: 'Number of items per page' },
                                            category: { type: 'string', description: 'Filter by part category' },
                                            status: { type: 'string', description: 'Filter by part status' },
                                            search: { type: 'string', description: 'Search by part number or name' }
                                        }
                                    }
                                },
                                {
                                    name: 'get_part',
                                    description: 'Get a specific part by ID',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            id: { type: 'string', description: 'Part ID' }
                                        },
                                        required: ['id']
                                    }
                                },
                                {
                                    name: 'get_part_by_number',
                                    description: 'Get a part by part number',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            partNumber: { type: 'string', description: 'Part number' }
                                        },
                                        required: ['partNumber']
                                    }
                                },
                                {
                                    name: 'create_part',
                                    description: 'Create a new part',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            partNumber: { type: 'string' },
                                            name: { type: 'string' },
                                            description: { type: 'string' },
                                            category: { type: 'string' },
                                            manufacturer: { type: 'string' },
                                            price: { type: 'number' },
                                            cost: { type: 'number' },
                                            stockQuantity: { type: 'number' },
                                            minimumStockLevel: { type: 'number' },
                                            location: { type: 'string' },
                                            supplier: { type: 'string' },
                                            warrantyPeriodMonths: { type: 'number' }
                                        },
                                        required: ['partNumber', 'name', 'category', 'price']
                                    }
                                },
                                {
                                    name: 'update_part',
                                    description: 'Update an existing part',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            id: { type: 'string' },
                                            name: { type: 'string' },
                                            description: { type: 'string' },
                                            category: { type: 'string' },
                                            manufacturer: { type: 'string' },
                                            price: { type: 'number' },
                                            cost: { type: 'number' },
                                            stockQuantity: { type: 'number' },
                                            minimumStockLevel: { type: 'number' },
                                            location: { type: 'string' },
                                            supplier: { type: 'string' },
                                            warrantyPeriodMonths: { type: 'number' }
                                        },
                                        required: ['id']
                                    }
                                },
                                {
                                    name: 'delete_part',
                                    description: 'Delete a part',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            id: { type: 'string' }
                                        },
                                        required: ['id']
                                    }
                                },
                                {
                                    name: 'get_parts_by_category',
                                    description: 'Get parts by category',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            category: { type: 'string', enum: ['MAINTENANCE', 'BRAKE_REPAIR', 'ENGINE_REPAIR', 'TRANSMISSION', 'ELECTRICAL'] }
                                        },
                                        required: ['category']
                                    }
                                },
                                {
                                    name: 'get_parts_by_manufacturer',
                                    description: 'Get parts by manufacturer',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            manufacturer: { type: 'string' }
                                        },
                                        required: ['manufacturer']
                                    }
                                },
                                {
                                    name: 'get_low_stock_parts',
                                    description: 'Get parts with low stock levels',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            threshold: { type: 'number', description: 'Stock threshold (optional, defaults to minimum stock level)' }
                                        }
                                    }
                                },
                                {
                                    name: 'update_part_stock',
                                    description: 'Update part stock quantity',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            id: { type: 'string' },
                                            quantity: { type: 'number' },
                                            operation: { type: 'string', enum: ['SET', 'ADD', 'SUBTRACT'], description: 'Stock operation type' }
                                        },
                                        required: ['id', 'quantity', 'operation']
                                    }
                                },
                                {
                                    name: 'search_parts',
                                    description: 'Search parts by name, description, or part number',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            query: { type: 'string', description: 'Search query' },
                                            page: { type: 'number', description: 'Page number (0-based)' },
                                            size: { type: 'number', description: 'Number of items per page' }
                                        },
                                        required: ['query']
                                    }
                                },
                                {
                                    name: 'get_parts_by_price_range',
                                    description: 'Get parts within a price range',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            minPrice: { type: 'number' },
                                            maxPrice: { type: 'number' }
                                        },
                                        required: ['minPrice', 'maxPrice']
                                    }
                                },
                                {
                                    name: 'get_parts_by_supplier',
                                    description: 'Get parts by supplier',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            supplier: { type: 'string' }
                                        },
                                        required: ['supplier']
                                    }
                                },
                                {
                                    name: 'bulk_update_part_prices',
                                    description: 'Bulk update part prices by category or manufacturer',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            category: { type: 'string' },
                                            manufacturer: { type: 'string' },
                                            priceAdjustment: { type: 'number', description: 'Price adjustment percentage' }
                                        },
                                        required: ['priceAdjustment']
                                    }
                                },
                                {
                                    name: 'get_part_inventory_value',
                                    description: 'Get total inventory value for parts',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            category: { type: 'string', description: 'Filter by category (optional)' },
                                            manufacturer: { type: 'string', description: 'Filter by manufacturer (optional)' }
                                        }
                                    }
                                }
                            ]
                        };
                        res.json({
                            jsonrpc: '2.0',
                            id,
                            result
                        });
                        break;
                    case 'tools/call':
                        // Extract tenant headers from request for tool calls
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
                        this.partService.setTenantContext(tenantHeaders);
                        try {
                            const { name: toolName, arguments: toolArgs } = params;
                            switch (toolName) {
                                case 'list_parts':
                                    result = await this.partService.listParts(toolArgs?.page, toolArgs?.size, toolArgs?.category, toolArgs?.status, toolArgs?.search);
                                    break;
                                case 'get_part':
                                    result = await this.partService.getPartById(toolArgs.id);
                                    break;
                                case 'get_part_by_number':
                                    result = await this.partService.getPartByNumber(toolArgs.partNumber);
                                    break;
                                case 'create_part':
                                    result = await this.partService.createPart(toolArgs);
                                    break;
                                case 'update_part':
                                    result = await this.partService.updatePart(toolArgs.id, toolArgs);
                                    break;
                                case 'delete_part':
                                    result = await this.partService.deletePart(toolArgs.id);
                                    break;
                                case 'get_parts_by_category':
                                    result = await this.partService.getPartsByCategory(toolArgs.category);
                                    break;
                                case 'get_parts_by_manufacturer':
                                    result = await this.partService.getPartsByManufacturer(toolArgs.manufacturer);
                                    break;
                                case 'get_low_stock_parts':
                                    result = await this.partService.getLowStockParts(toolArgs?.threshold);
                                    break;
                                case 'update_part_stock':
                                    result = await this.partService.updatePartStock(toolArgs.id, toolArgs.quantity, toolArgs.operation);
                                    break;
                                case 'search_parts':
                                    result = await this.partService.searchParts(toolArgs.query, toolArgs?.page, toolArgs?.size);
                                    break;
                                case 'get_parts_by_price_range':
                                    result = await this.partService.getPartsByPriceRange(toolArgs.minPrice, toolArgs.maxPrice);
                                    break;
                                case 'get_parts_by_supplier':
                                    result = await this.partService.getPartsBySupplier(toolArgs.supplier);
                                    break;
                                case 'bulk_update_part_prices':
                                    result = await this.partService.bulkUpdatePartPrices(toolArgs.priceAdjustment, toolArgs?.category, toolArgs?.manufacturer);
                                    break;
                                case 'get_part_inventory_value':
                                    result = await this.partService.getPartInventoryValue(toolArgs?.category, toolArgs?.manufacturer);
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
                        }
                        catch (error) {
                            logger_1.logger.error(`Error executing tool ${params.name}:`, error);
                            res.json({
                                jsonrpc: '2.0',
                                id,
                                error: {
                                    code: -32603,
                                    message: 'Internal error',
                                    data: error instanceof Error ? error.message : 'Unknown error'
                                }
                            });
                        }
                        finally {
                            // Clear tenant context after request
                            this.partService.clearTenantContext();
                        }
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
                        break;
                }
            }
            catch (error) {
                logger_1.logger.error('Error processing MCP request:', error);
                res.status(500).json({
                    jsonrpc: '2.0',
                    id: req.body.id,
                    error: {
                        code: -32603,
                        message: 'Internal error',
                        data: error instanceof Error ? error.message : 'Unknown error'
                    }
                });
            }
        });
        // Server-Sent Events endpoint for MCP notifications
        this.app.get('/sse', (req, res) => {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Cache-Control'
            });
            // Send initial connection event
            res.write('data: {"type":"connected","timestamp":"' + new Date().toISOString() + '"}\n\n');
            // Keep connection alive with periodic heartbeat
            const heartbeat = setInterval(() => {
                res.write('data: {"type":"heartbeat","timestamp":"' + new Date().toISOString() + '"}\n\n');
            }, 30000);
            // Clean up on disconnect
            req.on('close', () => {
                clearInterval(heartbeat);
            });
        });
        // SSE endpoint for Server-Sent Events
        this.app.get('/sse', (req, res) => {
            logger_1.logger.info('SSE connection established');
            // Set SSE headers
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Cache-Control'
            });
            // Send initial connection event
            res.write('data: {"type":"connection","status":"connected","server":"part-mcp-server","timestamp":"' + new Date().toISOString() + '"}\n\n');
            // Handle MCP protocol over SSE
            const handleSSEMessage = (data) => {
                try {
                    const response = JSON.stringify(data);
                    res.write(`data: ${response}\n\n`);
                }
                catch (error) {
                    logger_1.logger.error('SSE message error:', error);
                }
            };
            // Send periodic server info
            const infoInterval = setInterval(async () => {
                try {
                    const stats = await this.partService.getPartStats();
                    handleSSEMessage({
                        type: 'server-info',
                        data: {
                            server: {
                                name: config_1.config.mcp.name,
                                version: config_1.config.mcp.version,
                                status: 'running'
                            },
                            stats: stats,
                            timestamp: new Date().toISOString()
                        }
                    });
                }
                catch (error) {
                    logger_1.logger.error('Error sending SSE server info:', error);
                }
            }, 30000); // Every 30 seconds
            // Keep connection alive with ping
            const keepAlive = setInterval(() => {
                res.write('data: {"type":"ping","timestamp":"' + new Date().toISOString() + '"}\n\n');
            }, 15000); // Every 15 seconds
            // Clean up on client disconnect
            req.on('close', () => {
                clearInterval(keepAlive);
                clearInterval(infoInterval);
                logger_1.logger.info('SSE client disconnected');
            });
            req.on('error', (error) => {
                logger_1.logger.error('SSE connection error:', error);
                clearInterval(keepAlive);
                clearInterval(infoInterval);
            });
        });
        // SSE endpoint for Server-Sent Events
        this.app.get('/sse', (req, res) => {
            logger_1.logger.info('SSE connection established');
            // Set SSE headers
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Cache-Control'
            });
            // Send initial connection event
            res.write('data: {"type":"connection","status":"connected","server":"part-mcp-server","timestamp":"' + new Date().toISOString() + '"}\n\n');
            // Handle MCP protocol over SSE
            const handleSSEMessage = (data) => {
                try {
                    const response = JSON.stringify(data);
                    res.write(`data: ${response}\n\n`);
                }
                catch (error) {
                    logger_1.logger.error('SSE message error:', error);
                }
            };
            // Send periodic server info
            const infoInterval = setInterval(async () => {
                try {
                    const stats = await this.partService.getPartStats();
                    handleSSEMessage({
                        type: 'server-info',
                        data: {
                            server: {
                                name: config_1.config.mcp.name,
                                version: config_1.config.mcp.version,
                                status: 'running'
                            },
                            stats: stats,
                            timestamp: new Date().toISOString()
                        }
                    });
                }
                catch (error) {
                    logger_1.logger.error('Error sending SSE server info:', error);
                }
            }, 30000); // Every 30 seconds
            // Keep connection alive with ping
            const keepAlive = setInterval(() => {
                res.write('data: {"type":"ping","timestamp":"' + new Date().toISOString() + '"}\n\n');
            }, 15000); // Every 15 seconds
            // Clean up on client disconnect
            req.on('close', () => {
                clearInterval(keepAlive);
                clearInterval(infoInterval);
                logger_1.logger.info('SSE client disconnected');
            });
            req.on('error', (error) => {
                logger_1.logger.error('SSE connection error:', error);
                clearInterval(keepAlive);
                clearInterval(infoInterval);
            });
        });
        // Tools listing endpoint
        this.app.get('/tools', (_req, res) => {
            res.json({
                tools: [
                    'list_parts',
                    'get_part',
                    'get_part_by_number',
                    'create_part',
                    'update_part',
                    'delete_part',
                    'get_parts_by_category',
                    'get_parts_by_manufacturer',
                    'get_low_stock_parts',
                    'update_part_stock',
                    'search_parts',
                    'get_parts_by_price_range',
                    'get_parts_by_supplier',
                    'bulk_update_part_prices',
                    'get_part_inventory_value'
                ],
                total: 15
            });
        });
        // Error handling middleware
        this.app.use((error, _req, res, _next) => {
            logger_1.logger.error('Unhandled error:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: error.message
            });
        });
    }
    start() {
        this.app.listen(config_1.config.server.port, config_1.config.server.host, () => {
            logger_1.logger.info(`Part MCP Server started on ${config_1.config.server.host}:${config_1.config.server.port}`);
            logger_1.logger.info(`MCP endpoint: http://${config_1.config.server.host}:${config_1.config.server.port}/mcp`);
            logger_1.logger.info(`Health check: http://${config_1.config.server.host}:${config_1.config.server.port}/health`);
            logger_1.logger.info(`SSE endpoint: http://${config_1.config.server.host}:${config_1.config.server.port}/sse`);
        });
    }
    getApp() {
        return this.app;
    }
}
exports.ExpressServer = ExpressServer;
//# sourceMappingURL=express.js.map