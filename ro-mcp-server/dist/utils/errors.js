"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceUnavailableError = exports.ConflictError = exports.NotFoundError = exports.ValidationError = exports.AppError = void 0;
exports.handleServiceError = handleServiceError;
const constants_1 = require("../config/constants");
class AppError extends Error {
    constructor(message, code = constants_1.ERROR_CODES.INTERNAL_ERROR, statusCode = 500, isOperational = true) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        // Maintains proper stack trace for where our error was thrown
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message) {
        super(message, constants_1.ERROR_CODES.VALIDATION_ERROR, 400);
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends AppError {
    constructor(message) {
        super(message, constants_1.ERROR_CODES.REPAIR_ORDER_NOT_FOUND, 404);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message) {
        super(message, constants_1.ERROR_CODES.REPAIR_ORDER_EXISTS, 409);
    }
}
exports.ConflictError = ConflictError;
class ServiceUnavailableError extends AppError {
    constructor(message) {
        super(message, constants_1.ERROR_CODES.SERVICE_UNAVAILABLE, 503);
    }
}
exports.ServiceUnavailableError = ServiceUnavailableError;
function handleServiceError(error) {
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
    }
    else if (error.request) {
        // Network error
        return new ServiceUnavailableError('Unable to connect to RO Service');
    }
    else {
        // Other error
        return new AppError(error.message);
    }
}
//# sourceMappingURL=errors.js.map