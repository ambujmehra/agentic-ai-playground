import { PaymentService } from '../services/paymentService.js';
export declare class MCPServer {
    private server;
    private paymentService;
    private toolRegistry;
    constructor(paymentService?: PaymentService);
    private setupHandlers;
    start(): Promise<void>;
    stop(): Promise<void>;
    getServerInfo(): any;
}
//# sourceMappingURL=server.d.ts.map