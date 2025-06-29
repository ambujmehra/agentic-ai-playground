"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.config = {
    server: {
        port: parseInt(process.env.PORT || '3005'),
        host: process.env.HOST || 'localhost',
        corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001',
            '*'
        ]
    },
    mcp: {
        name: 'part-mcp-server',
        version: '1.0.0',
        protocolVersion: '2024-11-05',
        implementation: {
            name: 'part-mcp-server',
            version: '1.0.0'
        }
    },
    partService: {
        baseUrl: process.env.PART_SERVICE_URL || 'http://localhost:8082',
        timeout: parseInt(process.env.PART_SERVICE_TIMEOUT || '5000')
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: process.env.LOG_FILE || 'logs/part-mcp-server.log'
    }
};
//# sourceMappingURL=index.js.map