import { TransactionTools } from './transactionTools.js';
import { PaymentLinkTools } from './paymentLinkTools.js';
import { APIError } from '../../utils/errors.js';
export class ToolRegistry {
    constructor(paymentService) {
        this.allTools = new Map();
        this.transactionTools = new TransactionTools(paymentService);
        this.paymentLinkTools = new PaymentLinkTools(paymentService);
        this.registerAllTools();
    }
    registerAllTools() {
        // Register transaction tools
        const transactionTools = this.transactionTools.getAllTools();
        for (const tool of transactionTools) {
            this.allTools.set(tool.name, tool);
        }
        // Register payment link tools
        const paymentLinkTools = this.paymentLinkTools.getAllTools();
        for (const tool of paymentLinkTools) {
            this.allTools.set(tool.name, tool);
        }
    }
    getAllTools() {
        return Array.from(this.allTools.values());
    }
    getTool(name) {
        return this.allTools.get(name);
    }
    getToolNames() {
        return Array.from(this.allTools.keys());
    }
    getToolsByCategory() {
        return {
            transactions: this.transactionTools.getAllTools(),
            paymentLinks: this.paymentLinkTools.getAllTools()
        };
    }
    async executeTool(name, arguments_) {
        const tool = this.allTools.get(name);
        if (!tool) {
            throw new APIError(`Tool not found: ${name}`, 404);
        }
        try {
            // Determine which category the tool belongs to and execute accordingly
            const transactionToolNames = this.transactionTools.getAllTools().map(t => t.name);
            const paymentLinkToolNames = this.paymentLinkTools.getAllTools().map(t => t.name);
            if (transactionToolNames.includes(name)) {
                return await this.transactionTools.executeTransactionTool(name, arguments_);
            }
            else if (paymentLinkToolNames.includes(name)) {
                return await this.paymentLinkTools.executePaymentLinkTool(name, arguments_);
            }
            else {
                throw new APIError(`Unknown tool category for: ${name}`, 500);
            }
        }
        catch (error) {
            if (error instanceof APIError) {
                throw error;
            }
            throw new APIError(`Error executing tool ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
        }
    }
    getToolsCount() {
        const transactionCount = this.transactionTools.getAllTools().length;
        const paymentLinkCount = this.paymentLinkTools.getAllTools().length;
        return {
            total: transactionCount + paymentLinkCount,
            transactions: transactionCount,
            paymentLinks: paymentLinkCount
        };
    }
    validateToolExists(name) {
        return this.allTools.has(name);
    }
}
//# sourceMappingURL=index.js.map