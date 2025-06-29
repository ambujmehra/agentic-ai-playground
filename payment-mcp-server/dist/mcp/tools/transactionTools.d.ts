import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { PaymentService } from '../../services/paymentService.js';
export declare class TransactionTools {
    private paymentService;
    constructor(paymentService: PaymentService);
    getAllTools(): Tool[];
    private getTransactionsListTool;
    private getTransactionByIdTool;
    private createTransactionTool;
    private updateTransactionStatusTool;
    private processTransactionTool;
    private getTransactionsByCustomerTool;
    private getTransactionsByStatusTool;
    private getTransactionsByPaymentTypeTool;
    private getTransactionsByCardTypeTool;
    executeTransactionTool(name: string, arguments_: any): Promise<any>;
    private handleGetTransactionsList;
    private handleGetTransactionById;
    private handleCreateTransaction;
    private handleUpdateTransactionStatus;
    private handleProcessTransaction;
    private handleGetTransactionsByCustomer;
    private handleGetTransactionsByStatus;
    private handleGetTransactionsByPaymentType;
    private handleGetTransactionsByCardType;
    private getAllCardTypesTool;
    private getAllPaymentTypesTool;
    private handleGetAllCardTypes;
    private handleGetAllPaymentTypes;
}
//# sourceMappingURL=transactionTools.d.ts.map