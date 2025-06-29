import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const CONFIG = {
  PORT: process.env.PORT ? parseInt(process.env.PORT) : 3002,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Java API Configuration - Fixed to match PaymentService expectations
  JAVA_API_BASE_URL: process.env.JAVA_API_BASE_URL || 'http://localhost:8080/api/v1',
  JAVA_API_TIMEOUT: process.env.JAVA_API_TIMEOUT ? parseInt(process.env.JAVA_API_TIMEOUT) : 30000,
  
  // CORS Configuration - Fixed to match ExpressServer expectations
  CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  ],
  
  // Cache Configuration - Fixed to match PaymentService expectations
  CACHE_TTL_SECONDS: process.env.CACHE_TTL_SECONDS ? parseInt(process.env.CACHE_TTL_SECONDS) : 300,
  CACHE_MAX_KEYS: process.env.CACHE_MAX_KEYS ? parseInt(process.env.CACHE_MAX_KEYS) : 1000,
  
  // Logging Configuration
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE: process.env.LOG_FILE || 'payment-mcp-server.log',
  
  // Server Configuration
  MAX_REQUEST_SIZE: process.env.MAX_REQUEST_SIZE || '10mb',
  REQUEST_TIMEOUT: process.env.REQUEST_TIMEOUT ? parseInt(process.env.REQUEST_TIMEOUT) : 30000,
} as const;

export const SERVER_CONFIG = {
  name: 'payment-mcp-server',
  version: '1.0.0',
  description: 'Model Context Protocol server for payment management with HTTP transport and CORS support'
} as const;

export const MCP_SERVER_INFO = {
  name: 'Payment MCP Server',
  version: '1.0.0',
  description: 'Model Context Protocol server for payment management with HTTP transport and CORS support',
  capabilities: {
    tools: { listChanged: true },
    resources: { listChanged: false },
    prompts: { listChanged: false }
  }
} as const;

export const CACHE_KEYS = {
  TRANSACTIONS_ALL: 'transactions:all',
  TRANSACTION_BY_ID: 'transaction:id',
  TRANSACTIONS_BY_CUSTOMER: 'transactions:customer',
  TRANSACTIONS_BY_STATUS: 'transactions:status',
  TRANSACTIONS_BY_PAYMENT_TYPE: 'transactions:payment_type',
  TRANSACTIONS_BY_CARD_TYPE: 'transactions:card_type',
  PAYMENT_LINKS_ALL: 'payment_links:all',
  PAYMENT_LINK_BY_ID: 'payment_link:id',
  PAYMENT_LINKS_BY_STATUS: 'payment_links:status',
  HEALTH_CHECK: 'health:check'
} as const;
