export declare const CONFIG: {
    readonly PORT: number;
    readonly NODE_ENV: string;
    readonly JAVA_API_BASE_URL: string;
    readonly JAVA_API_TIMEOUT: number;
    readonly CORS_ORIGINS: string[];
    readonly CACHE_TTL_SECONDS: number;
    readonly CACHE_MAX_KEYS: number;
    readonly LOG_LEVEL: string;
    readonly LOG_FILE: string;
    readonly MAX_REQUEST_SIZE: string;
    readonly REQUEST_TIMEOUT: number;
};
export declare const SERVER_CONFIG: {
    readonly name: "payment-mcp-server";
    readonly version: "1.0.0";
    readonly description: "Model Context Protocol server for payment management with HTTP transport and CORS support";
};
export declare const MCP_SERVER_INFO: {
    readonly name: "Payment MCP Server";
    readonly version: "1.0.0";
    readonly description: "Model Context Protocol server for payment management with HTTP transport and CORS support";
    readonly capabilities: {
        readonly tools: {
            readonly listChanged: true;
        };
        readonly resources: {
            readonly listChanged: false;
        };
        readonly prompts: {
            readonly listChanged: false;
        };
    };
};
export declare const CACHE_KEYS: {
    readonly TRANSACTIONS_ALL: "transactions:all";
    readonly TRANSACTION_BY_ID: "transaction:id";
    readonly TRANSACTIONS_BY_CUSTOMER: "transactions:customer";
    readonly TRANSACTIONS_BY_STATUS: "transactions:status";
    readonly TRANSACTIONS_BY_PAYMENT_TYPE: "transactions:payment_type";
    readonly TRANSACTIONS_BY_CARD_TYPE: "transactions:card_type";
    readonly PAYMENT_LINKS_ALL: "payment_links:all";
    readonly PAYMENT_LINK_BY_ID: "payment_link:id";
    readonly PAYMENT_LINKS_BY_STATUS: "payment_links:status";
    readonly HEALTH_CHECK: "health:check";
};
//# sourceMappingURL=constants.d.ts.map