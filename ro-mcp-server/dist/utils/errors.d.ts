export declare class AppError extends Error {
    readonly code: string;
    readonly statusCode: number;
    readonly isOperational: boolean;
    constructor(message: string, code?: string, statusCode?: number, isOperational?: boolean);
}
export declare class ValidationError extends AppError {
    constructor(message: string);
}
export declare class NotFoundError extends AppError {
    constructor(message: string);
}
export declare class ConflictError extends AppError {
    constructor(message: string);
}
export declare class ServiceUnavailableError extends AppError {
    constructor(message: string);
}
export declare function handleServiceError(error: any): AppError;
//# sourceMappingURL=errors.d.ts.map