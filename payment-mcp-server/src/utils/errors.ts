import * as winston from 'winston';
import { CONFIG } from '../config/constants.js';

// Create logger instance
export const logger = winston.createLogger({
  level: CONFIG.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.colorize({ all: CONFIG.NODE_ENV === 'development' }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
      return `${timestamp} [${level}]: ${stack || message}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      silent: CONFIG.NODE_ENV === 'test'
    }),
    new winston.transports.File({
      filename: CONFIG.LOG_FILE,
      silent: CONFIG.NODE_ENV === 'test'
    })
  ]
});

// Custom error classes
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class PaymentServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public originalError?: any
  ) {
    super(message);
    this.name = 'PaymentServiceError';
  }
}

// Error handling utilities
export const handleError = (error: any): { message: string; statusCode: number; details?: any } => {
  logger.error('Error occurred:', error);

  if (error instanceof ValidationError) {
    return {
      message: error.message,
      statusCode: 400,
      details: error.field ? { field: error.field } : undefined
    };
  }

  if (error instanceof APIError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      details: error.details
    };
  }

  if (error instanceof PaymentServiceError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      details: error.originalError
    };
  }

  // Generic error handling
  if (error.response) {
    // Axios error
    return {
      message: error.response.data?.message || 'External API error',
      statusCode: error.response.status || 500,
      details: error.response.data
    };
  }

  if (error.code === 'ECONNREFUSED') {
    return {
      message: 'Payment service is not available',
      statusCode: 503
    };
  }

  return {
    message: 'Internal server error',
    statusCode: 500
  };
};

// Success response utility
export const createSuccessResponse = <T>(data: T, message?: string) => {
  return {
    success: true,
    data,
    message: message || 'Operation completed successfully',
    timestamp: new Date().toISOString()
  };
};

// Error response utility
export const createErrorResponse = (message: string, statusCode: number = 500, details?: any) => {
  return {
    success: false,
    error: {
      message,
      statusCode,
      details,
      timestamp: new Date().toISOString()
    }
  };
};
