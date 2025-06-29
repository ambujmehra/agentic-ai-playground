"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_CODES = exports.JOB_CATEGORIES = exports.TECHNICIAN_LEVEL = exports.RO_STATUS = exports.TOOL_NAMES = exports.CONFIG = void 0;
// Configuration constants for the RO MCP Server
exports.CONFIG = {
    // Server configuration
    SERVER: {
        PORT: parseInt(process.env.RO_MCP_PORT || '3003'),
        HOST: process.env.RO_MCP_HOST || 'localhost',
        NAME: 'ro-mcp-server',
        VERSION: '1.0.0'
    },
    // RO Service configuration
    RO_SERVICE: {
        BASE_URL: process.env.RO_SERVICE_URL || 'http://localhost:8081',
        API_PREFIX: '/api/repair-orders',
        TIMEOUT: parseInt(process.env.RO_SERVICE_TIMEOUT || '10000'),
        RETRY_ATTEMPTS: parseInt(process.env.RO_SERVICE_RETRY_ATTEMPTS || '3')
    },
    // Logging configuration
    LOGGING: {
        LEVEL: process.env.LOG_LEVEL || 'info',
        FILE: process.env.LOG_FILE || 'logs/ro-mcp-server.log',
        MAX_SIZE: process.env.LOG_MAX_SIZE || '10m',
        MAX_FILES: parseInt(process.env.LOG_MAX_FILES || '5')
    },
    // MCP specific configuration
    MCP: {
        NAME: 'repair-order-management',
        VERSION: '1.0.0',
        DESCRIPTION: 'MCP server for comprehensive repair order management in automotive industry'
    }
};
// Tool names for MCP
exports.TOOL_NAMES = {
    LIST_REPAIR_ORDERS: 'list_repair_orders',
    GET_REPAIR_ORDER: 'get_repair_order',
    GET_REPAIR_ORDER_BY_NUMBER: 'get_repair_order_by_number',
    CREATE_REPAIR_ORDER: 'create_repair_order',
    UPDATE_REPAIR_ORDER: 'update_repair_order',
    UPDATE_REPAIR_ORDER_STATUS: 'update_repair_order_status',
    DELETE_REPAIR_ORDER: 'delete_repair_order',
    GET_REPAIR_ORDERS_BY_STATUS: 'get_repair_orders_by_status',
    GET_REPAIR_ORDERS_BY_TECHNICIAN: 'get_repair_orders_by_technician',
    GET_REPAIR_ORDERS_BY_VEHICLE: 'get_repair_orders_by_vehicle',
    ADD_PART_TO_REPAIR_ORDER: 'add_part_to_repair_order',
    GET_REPAIR_ORDER_STATS: 'get_repair_order_stats'
};
// RO Status enum
exports.RO_STATUS = {
    CREATED: 'CREATED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED'
};
// Technician Level enum
exports.TECHNICIAN_LEVEL = {
    JUNIOR: 'JUNIOR',
    SENIOR: 'SENIOR',
    EXPERT: 'EXPERT'
};
// Job categories
exports.JOB_CATEGORIES = {
    MAINTENANCE: 'MAINTENANCE',
    REPAIR: 'REPAIR',
    INSPECTION: 'INSPECTION',
    DIAGNOSTIC: 'DIAGNOSTIC',
    ELECTRICAL: 'ELECTRICAL',
    TRANSMISSION: 'TRANSMISSION',
    ENGINE: 'ENGINE',
    BRAKE: 'BRAKE',
    SUSPENSION: 'SUSPENSION',
    AC_HEATING: 'AC_HEATING'
};
// Error codes
exports.ERROR_CODES = {
    INVALID_REQUEST: 'INVALID_REQUEST',
    REPAIR_ORDER_NOT_FOUND: 'REPAIR_ORDER_NOT_FOUND',
    REPAIR_ORDER_EXISTS: 'REPAIR_ORDER_EXISTS',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR'
};
//# sourceMappingURL=constants.js.map