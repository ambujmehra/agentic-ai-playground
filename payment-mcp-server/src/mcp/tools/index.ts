import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { TransactionTools } from './transactionTools.js';
import { PaymentLinkTools } from './paymentLinkTools.js';
import { PaymentService } from '../../services/paymentService.js';
import { APIError } from '../../utils/errors.js';

export class ToolRegistry {
  private transactionTools: TransactionTools;
  private paymentLinkTools: PaymentLinkTools;
  private allTools: Map<string, Tool> = new Map();

  constructor(paymentService: PaymentService) {
    this.transactionTools = new TransactionTools(paymentService);
    this.paymentLinkTools = new PaymentLinkTools(paymentService);
    this.registerAllTools();
  }

  private registerAllTools(): void {
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

  public getAllTools(): Tool[] {
    return Array.from(this.allTools.values());
  }

  public getTool(name: string): Tool | undefined {
    return this.allTools.get(name);
  }

  public getToolNames(): string[] {
    return Array.from(this.allTools.keys());
  }

  public getToolsByCategory(): { transactions: Tool[]; paymentLinks: Tool[] } {
    return {
      transactions: this.transactionTools.getAllTools(),
      paymentLinks: this.paymentLinkTools.getAllTools()
    };
  }

  public async executeTool(name: string, arguments_: any): Promise<any> {
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
      } else if (paymentLinkToolNames.includes(name)) {
        return await this.paymentLinkTools.executePaymentLinkTool(name, arguments_);
      } else {
        throw new APIError(`Unknown tool category for: ${name}`, 500);
      }
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(`Error executing tool ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
  }

  public getToolsCount(): { total: number; transactions: number; paymentLinks: number } {
    const transactionCount = this.transactionTools.getAllTools().length;
    const paymentLinkCount = this.paymentLinkTools.getAllTools().length;
    
    return {
      total: transactionCount + paymentLinkCount,
      transactions: transactionCount,
      paymentLinks: paymentLinkCount
    };
  }

  public validateToolExists(name: string): boolean {
    return this.allTools.has(name);
  }
}
