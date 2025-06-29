import { jest } from '@jest/globals';

// Mock console methods to reduce noise during testing
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3002';
process.env.JAVA_API_BASE_URL = 'http://localhost:8080/api';
process.env.CORS_ORIGINS = 'http://localhost:3000,http://localhost:3001';
process.env.CACHE_TTL_SECONDS = '300';
process.env.CACHE_MAX_KEYS = '1000';
process.env.LOG_LEVEL = 'error';

// Suppress Winston logging during tests
jest.mock('../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));
