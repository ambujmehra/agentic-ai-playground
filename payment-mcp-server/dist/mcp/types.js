import { z } from 'zod';
// Enums
export var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["INITIATED"] = "INITIATED";
    TransactionStatus["CAPTURED"] = "CAPTURED";
    TransactionStatus["FAILED"] = "FAILED";
    TransactionStatus["CANCELLED"] = "CANCELLED";
})(TransactionStatus || (TransactionStatus = {}));
export var PaymentType;
(function (PaymentType) {
    PaymentType["CREDIT"] = "CREDIT";
    PaymentType["DEBIT"] = "DEBIT";
})(PaymentType || (PaymentType = {}));
export var CardType;
(function (CardType) {
    CardType["VISA"] = "VISA";
    CardType["MASTERCARD"] = "MASTERCARD";
    CardType["AMEX"] = "AMEX";
    CardType["RUPAY"] = "RUPAY";
    CardType["UPI"] = "UPI";
    CardType["NETBANKING"] = "NETBANKING";
})(CardType || (CardType = {}));
export var PaymentLinkStatus;
(function (PaymentLinkStatus) {
    PaymentLinkStatus["ACTIVE"] = "ACTIVE";
    PaymentLinkStatus["USED"] = "USED";
    PaymentLinkStatus["EXPIRED"] = "EXPIRED";
    PaymentLinkStatus["CANCELLED"] = "CANCELLED";
})(PaymentLinkStatus || (PaymentLinkStatus = {}));
// Zod schemas for validation
export const CreateTransactionSchema = z.object({
    invoiceId: z.string().min(1, 'Invoice ID is required'),
    invoiceNumber: z.string().min(1, 'Invoice number is required'),
    customerId: z.string().min(1, 'Customer ID is required'),
    customerEmail: z.string().email('Valid email is required'),
    amount: z.number().positive('Amount must be greater than 0'),
    currency: z.string().default('INR'),
    paymentType: z.nativeEnum(PaymentType),
    cardType: z.nativeEnum(CardType),
    description: z.string().min(1, 'Description is required')
});
export const CreatePaymentLinkSchema = z.object({
    invoiceId: z.string().min(1, 'Invoice ID is required'),
    invoiceNumber: z.string().min(1, 'Invoice number is required'),
    amount: z.number().positive('Amount must be greater than 0'),
    currency: z.string().default('INR'),
    customerEmail: z.string().email('Valid email is required'),
    description: z.string().min(1, 'Description is required'),
    expiryHours: z.number().positive().optional().default(24)
});
export const PaginationSchema = z.object({
    page: z.number().min(0).optional().default(0),
    size: z.number().min(1).max(100).optional().default(20),
    sortBy: z.string().optional().default('createdAt'),
    sortDirection: z.enum(['asc', 'desc']).optional().default('desc')
});
// Additional schemas needed by tools
export const TransactionCreateRequestSchema = CreateTransactionSchema;
export const TransactionUpdateStatusRequestSchema = z.object({
    status: z.nativeEnum(TransactionStatus)
});
export const PaymentLinkCreateRequestSchema = CreatePaymentLinkSchema;
export const PaymentLinkUpdateRequestSchema = z.object({
    description: z.string().optional(),
    expiryHours: z.number().positive().optional(),
    notifyCustomer: z.boolean().optional(),
    redirectUrl: z.string().url().optional(),
    webhookUrl: z.string().url().optional()
});
export const PaginationParamsSchema = PaginationSchema;
export const SortParamsSchema = z.object({
    sortBy: z.string().optional().default('createdAt'),
    sortDirection: z.enum(['asc', 'desc']).optional().default('desc')
});
// Zod schemas for tenant validation (server-side only)
export const TenantHeadersSchema = z.object({
    tenantId: z.string().min(1, 'Tenant ID is required').max(50, 'Tenant ID too long'),
    dealerId: z.string().min(1, 'Dealer ID is required').max(50, 'Dealer ID too long'),
    userId: z.string().min(1, 'User ID is required').max(50, 'User ID too long'),
    locale: z.string().optional().default('en-US')
});
//# sourceMappingURL=types.js.map