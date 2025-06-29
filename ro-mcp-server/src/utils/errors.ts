import { ERROR_CODES } from '../config/constants';

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string = ERROR_CODES.INTERNAL_ERROR,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, ERROR_CODES.VALIDATION_ERROR, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, ERROR_CODES.REPAIR_ORDER_NOT_FOUND, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, ERROR_CODES.REPAIR_ORDER_EXISTS, 409);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string) {
    super(message, ERROR_CODES.SERVICE_UNAVAILABLE, 503);
  }
}

export function handleServiceError(error: any): AppError {
  if (error.response) {
    // HTTP error response from RO service
    const status = error.response.status;
    const message = error.response.data?.message || error.message;
    
    switch (status) {
      case 404:
        return new NotFoundError(message);
      case 409:
        return new ConflictError(message);
      case 400:
        return new ValidationError(message);
      default:
        return new ServiceUnavailableError(`RO Service error: ${message}`);
    }
  } else if (error.request) {
    // Network error
    return new ServiceUnavailableError('Unable to connect to RO Service');
  } else {
    // Other error
    return new AppError(error.message);
  }
}
