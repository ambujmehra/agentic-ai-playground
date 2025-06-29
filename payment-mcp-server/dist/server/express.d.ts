export declare class ExpressServer {
    private app;
    private mcpServer;
    private paymentService;
    constructor();
    private extractTenantHeaders;
    private setupMiddleware;
    private setupRoutes;
    private setupErrorHandling;
    start(): Promise<void>;
}
//# sourceMappingURL=express.d.ts.map