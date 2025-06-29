import * as winston from 'winston';
export declare const logger: winston.Logger;
export declare class ValidationError extends Error {
    field?: string | undefined;
    constructor(message: string, field?: string | undefined);
}
export declare class APIError extends Error {
    statusCode: number;
    details?: any | undefined;
    constructor(message: string, statusCode?: number, details?: any | undefined);
}
export declare class PaymentServiceError extends Error {
    statusCode: number;
    originalError?: any | undefined;
    constructor(message: string, statusCode: number, originalError?: any | undefined);
}
export declare const handleError: (error: any) => {
    message: string;
    statusCode: number;
    details?: any;
};
export declare const createSuccessResponse: <T>(data: T, message?: string) => {
    success: boolean;
    data: T;
    message: string;
    timestamp: string;
};
export declare const createErrorResponse: (message: string, statusCode?: number, details?: any) => {
    success: boolean;
    error: {
        message: string;
        statusCode: number;
        details: any;
        timestamp: string;
    };
};
//# sourceMappingURL=errors.d.ts.map