import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { PaymentService } from '../../services/paymentService.js';
export declare class ToolRegistry {
    private transactionTools;
    private paymentLinkTools;
    private allTools;
    constructor(paymentService: PaymentService);
    private registerAllTools;
    getAllTools(): Tool[];
    getTool(name: string): Tool | undefined;
    getToolNames(): string[];
    getToolsByCategory(): {
        transactions: Tool[];
        paymentLinks: Tool[];
    };
    executeTool(name: string, arguments_: any): Promise<any>;
    getToolsCount(): {
        total: number;
        transactions: number;
        paymentLinks: number;
    };
    validateToolExists(name: string): boolean;
}
//# sourceMappingURL=index.d.ts.map