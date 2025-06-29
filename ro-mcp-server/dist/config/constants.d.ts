export declare const CONFIG: {
    SERVER: {
        PORT: number;
        HOST: string;
        NAME: string;
        VERSION: string;
    };
    RO_SERVICE: {
        BASE_URL: string;
        API_PREFIX: string;
        TIMEOUT: number;
        RETRY_ATTEMPTS: number;
    };
    LOGGING: {
        LEVEL: string;
        FILE: string;
        MAX_SIZE: string;
        MAX_FILES: number;
    };
    MCP: {
        NAME: string;
        VERSION: string;
        DESCRIPTION: string;
    };
};
export declare const TOOL_NAMES: {
    LIST_REPAIR_ORDERS: string;
    GET_REPAIR_ORDER: string;
    GET_REPAIR_ORDER_BY_NUMBER: string;
    CREATE_REPAIR_ORDER: string;
    UPDATE_REPAIR_ORDER: string;
    UPDATE_REPAIR_ORDER_STATUS: string;
    DELETE_REPAIR_ORDER: string;
    GET_REPAIR_ORDERS_BY_STATUS: string;
    GET_REPAIR_ORDERS_BY_TECHNICIAN: string;
    GET_REPAIR_ORDERS_BY_VEHICLE: string;
    ADD_PART_TO_REPAIR_ORDER: string;
    GET_REPAIR_ORDER_STATS: string;
};
export declare const RO_STATUS: {
    readonly CREATED: "CREATED";
    readonly IN_PROGRESS: "IN_PROGRESS";
    readonly COMPLETED: "COMPLETED";
    readonly CANCELLED: "CANCELLED";
};
export declare const TECHNICIAN_LEVEL: {
    readonly JUNIOR: "JUNIOR";
    readonly SENIOR: "SENIOR";
    readonly EXPERT: "EXPERT";
};
export declare const JOB_CATEGORIES: {
    readonly MAINTENANCE: "MAINTENANCE";
    readonly REPAIR: "REPAIR";
    readonly INSPECTION: "INSPECTION";
    readonly DIAGNOSTIC: "DIAGNOSTIC";
    readonly ELECTRICAL: "ELECTRICAL";
    readonly TRANSMISSION: "TRANSMISSION";
    readonly ENGINE: "ENGINE";
    readonly BRAKE: "BRAKE";
    readonly SUSPENSION: "SUSPENSION";
    readonly AC_HEATING: "AC_HEATING";
};
export declare const ERROR_CODES: {
    readonly INVALID_REQUEST: "INVALID_REQUEST";
    readonly REPAIR_ORDER_NOT_FOUND: "REPAIR_ORDER_NOT_FOUND";
    readonly REPAIR_ORDER_EXISTS: "REPAIR_ORDER_EXISTS";
    readonly SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE";
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
};
//# sourceMappingURL=constants.d.ts.map