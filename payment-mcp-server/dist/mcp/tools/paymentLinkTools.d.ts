import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { PaymentService } from '../../services/paymentService.js';
export declare class PaymentLinkTools {
    private paymentService;
    constructor(paymentService: PaymentService);
    getAllTools(): Tool[];
    private getPaymentLinksListTool;
    private getPaymentLinkByIdTool;
    private createPaymentLinkTool;
    private updatePaymentLinkTool;
    private processPaymentLinkTool;
    private cancelPaymentLinkTool;
    private getPaymentLinksByStatusTool;
    executePaymentLinkTool(name: string, arguments_: any): Promise<any>;
    private handleGetPaymentLinksList;
    private handleGetPaymentLinkById;
    private handleCreatePaymentLink;
    private handleUpdatePaymentLink;
    private handleProcessPaymentLink;
    private handleCancelPaymentLink;
    private handleGetPaymentLinksByStatus;
}
//# sourceMappingURL=paymentLinkTools.d.ts.map