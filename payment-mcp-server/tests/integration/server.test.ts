import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import { ExpressServer } from '../../src/server/express.js';

// Mock the MCP server and payment service
jest.mock('../../src/mcp/server.js');
jest.mock('../../src/services/paymentService.js');

describe('Express Server Integration', () => {
  let server: ExpressServer;
  let app: any;

  beforeEach(async () => {
    server = new ExpressServer();
    app = server['app']; // Access private app property for testing
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Health endpoints', () => {
    test('GET / should return server info', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toMatchObject({
        name: 'Payment MCP Server',
        version: '1.0.0',
        status: 'running',
        endpoints: {
          health: '/health',
          mcp: '/mcp',
          api: '/api'
        }
      });
      expect(response.body.timestamp).toBeDefined();
    });

    test('GET /health should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        services: expect.any(Object),
        cache: expect.any(Object)
      });
      expect(response.body.timestamp).toBeDefined();
    });

    test('GET /mcp should return MCP server info', async () => {
      const response = await request(app)
        .get('/mcp')
        .expect(200);

      expect(response.body).toMatchObject({
        name: expect.any(String),
        version: expect.any(String),
        tools: expect.any(Object),
        capabilities: expect.any(Array),
        status: 'running'
      });
    });
  });

  describe('MCP endpoints', () => {
    test('GET /mcp/tools should return available tools', async () => {
      const response = await request(app)
        .get('/mcp/tools')
        .expect(200);

      expect(response.body).toMatchObject({
        tools: expect.any(Array),
        categories: expect.any(Object),
        count: expect.any(Number)
      });
    });

    test('POST /mcp/tools/:toolName should execute tool', async () => {
      const toolName = 'get_transactions_list';
      const args = { page: 0, size: 10 };

      const response = await request(app)
        .post(`/mcp/tools/${toolName}`)
        .send(args)
        .expect(200);

      expect(response.body).toMatchObject({
        tool: toolName,
        result: expect.any(Object),
        timestamp: expect.any(String)
      });
    });

    test('POST /mcp/tools/:toolName should handle tool errors', async () => {
      const toolName = 'invalid_tool';
      const args = {};

      const response = await request(app)
        .post(`/mcp/tools/${toolName}`)
        .send(args)
        .expect(404);

      expect(response.body).toMatchObject({
        error: expect.stringContaining('not found'),
        tool: toolName,
        timestamp: expect.any(String)
      });
    });
  });

  describe('Cache endpoints', () => {
    test('DELETE /api/cache should clear cache', async () => {
      const response = await request(app)
        .delete('/api/cache')
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Cache cleared successfully',
        timestamp: expect.any(String)
      });
    });

    test('GET /api/cache/stats should return cache statistics', async () => {
      const response = await request(app)
        .get('/api/cache/stats')
        .expect(200);

      expect(response.body).toMatchObject({
        cache: expect.any(Object),
        timestamp: expect.any(String)
      });
    });
  });

  describe('Error handling', () => {
    test('should return 404 for unknown endpoints', async () => {
      const response = await request(app)
        .get('/unknown-endpoint')
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Not Found',
        message: expect.stringContaining('not found'),
        timestamp: expect.any(String)
      });
    });

    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/mcp/tools/test')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);
    });
  });

  describe('CORS and Security', () => {
    test('should include CORS headers', async () => {
      const response = await request(app)
        .options('/')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
    });

    test('should include security headers', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBeDefined();
      expect(response.headers['x-frame-options']).toBeDefined();
    });
  });
});
