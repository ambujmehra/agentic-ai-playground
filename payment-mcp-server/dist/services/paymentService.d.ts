import NodeCache from 'node-cache';
import { Transaction, PaymentLink, PaginatedResponse, CreateTransactionArgs, CreatePaymentLinkArgs, TransactionStatus, PaginationArgs, TenantHeaders } from '../mcp/types.js';
export declare class PaymentService {
    private client;
    private cache;
    private currentTenantHeaders;
    constructor();
    /**
     * Set tenant context for subsequent API calls
     */
    setTenantContext(tenantHeaders: TenantHeaders): void;
    /**
     * Clear tenant context
     */
    clearTenantContext(): void;
    private getCachedOrFetch;
    private invalidateCache;
    createTransaction(data: CreateTransactionArgs): Promise<Transaction>;
    getTransactionById(id: number): Promise<Transaction>;
    getAllTransactions(params: PaginationArgs): Promise<PaginatedResponse<Transaction>>;
    updateTransactionStatus(id: number, status: TransactionStatus): Promise<Transaction>;
    processTransaction(id: number): Promise<Transaction>;
    searchTransactionsByCustomer(email: string): Promise<Transaction[]>;
    searchTransactionsByCardType(cardType: string): Promise<Transaction[]>;
    searchTransactionsByStatus(status: TransactionStatus): Promise<Transaction[]>;
    searchTransactionsByPaymentType(paymentType: string): Promise<Transaction[]>;
    searchTransactionsByInvoice(invoiceId: string): Promise<Transaction[]>;
    searchTransactionsByReference(reference: string): Promise<Transaction>;
    createPaymentLink(data: CreatePaymentLinkArgs): Promise<PaymentLink>;
    getPaymentLinkById(linkId: string): Promise<PaymentLink>;
    getAllPaymentLinks(): Promise<PaymentLink[]>;
    processPaymentLink(linkId: string): Promise<PaymentLink>;
    cancelPaymentLink(linkId: string): Promise<PaymentLink>;
    searchPaymentLinksByCustomer(email: string): Promise<PaymentLink[]>;
    searchPaymentLinksByInvoice(invoiceId: string): Promise<PaymentLink[]>;
    expireOldPaymentLinks(): Promise<string>;
    getAllCardTypes(): Promise<string[]>;
    getAllPaymentTypes(): Promise<string[]>;
    getTransactionAnalytics(): Promise<any>;
    getPaymentLinkAnalytics(): Promise<any>;
    healthCheck(): Promise<{
        status: string;
        timestamp: string;
    }>;
    getCacheStats(): {
        keys: number;
        stats: NodeCache.Stats;
    };
    clearCache(): void;
}
//# sourceMappingURL=paymentService.d.ts.map