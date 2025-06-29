import { Express } from 'express';
export declare class ExpressServer {
    private app;
    private partService;
    constructor();
    private extractTenantHeaders;
    private setupMiddleware;
    private setupRoutes;
    start(): void;
    getApp(): Express;
}
//# sourceMappingURL=express.d.ts.map