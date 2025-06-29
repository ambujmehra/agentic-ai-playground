import { z } from 'zod';
export declare enum TransactionStatus {
    INITIATED = "INITIATED",
    CAPTURED = "CAPTURED",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED"
}
export declare enum PaymentType {
    CREDIT = "CREDIT",
    DEBIT = "DEBIT"
}
export declare enum CardType {
    VISA = "VISA",
    MASTERCARD = "MASTERCARD",
    AMEX = "AMEX",
    RUPAY = "RUPAY",
    UPI = "UPI",
    NETBANKING = "NETBANKING"
}
export declare enum PaymentLinkStatus {
    ACTIVE = "ACTIVE",
    USED = "USED",
    EXPIRED = "EXPIRED",
    CANCELLED = "CANCELLED"
}
export interface TenantHeaders {
    tenantId: string;
    dealerId: string;
    userId: string;
    locale?: string;
}
export interface TenantContext {
    tenantId: string;
    dealerId: string;
    userId: string;
    locale: string;
}
export interface Transaction {
    id: number;
    invoiceId: string;
    invoiceNumber: string;
    customerId: string;
    customerEmail: string;
    amount: number;
    currency: string;
    paymentType: PaymentType;
    cardType: CardType;
    status: TransactionStatus;
    paymentMethod: string;
    transactionReference: string;
    createdAt: string;
    updatedAt: string;
    processedAt?: string;
    description: string;
}
export interface PaymentLink {
    id: number;
    linkId: string;
    transactionId: number;
    invoiceId: string;
    invoiceNumber: string;
    amount: number;
    currency: string;
    customerEmail: string;
    status: PaymentLinkStatus;
    expiryDate: string;
    createdAt: string;
    description: string;
}
export interface PaginatedResponse<T> {
    content: T[];
    pageable: {
        sort: {
            unsorted: boolean;
            sorted: boolean;
            empty: boolean;
        };
        pageNumber: number;
        pageSize: number;
        offset: number;
        paged: boolean;
        unpaged: boolean;
    };
    totalPages: number;
    totalElements: number;
    last: boolean;
    numberOfElements: number;
    sort: {
        unsorted: boolean;
        sorted: boolean;
        empty: boolean;
    };
    number: number;
    first: boolean;
    size: number;
    empty: boolean;
}
export declare const CreateTransactionSchema: z.ZodObject<{
    invoiceId: z.ZodString;
    invoiceNumber: z.ZodString;
    customerId: z.ZodString;
    customerEmail: z.ZodString;
    amount: z.ZodNumber;
    currency: z.ZodDefault<z.ZodString>;
    paymentType: z.ZodNativeEnum<typeof PaymentType>;
    cardType: z.ZodNativeEnum<typeof CardType>;
    description: z.ZodString;
}, "strip", z.ZodTypeAny, {
    invoiceId: string;
    invoiceNumber: string;
    customerId: string;
    customerEmail: string;
    amount: number;
    currency: string;
    paymentType: PaymentType;
    cardType: CardType;
    description: string;
}, {
    invoiceId: string;
    invoiceNumber: string;
    customerId: string;
    customerEmail: string;
    amount: number;
    paymentType: PaymentType;
    cardType: CardType;
    description: string;
    currency?: string | undefined;
}>;
export declare const CreatePaymentLinkSchema: z.ZodObject<{
    invoiceId: z.ZodString;
    invoiceNumber: z.ZodString;
    amount: z.ZodNumber;
    currency: z.ZodDefault<z.ZodString>;
    customerEmail: z.ZodString;
    description: z.ZodString;
    expiryHours: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    invoiceId: string;
    invoiceNumber: string;
    customerEmail: string;
    amount: number;
    currency: string;
    description: string;
    expiryHours: number;
}, {
    invoiceId: string;
    invoiceNumber: string;
    customerEmail: string;
    amount: number;
    description: string;
    currency?: string | undefined;
    expiryHours?: number | undefined;
}>;
export declare const PaginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    size: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    sortBy: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    sortDirection: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    size: number;
    sortBy: string;
    sortDirection: "asc" | "desc";
}, {
    page?: number | undefined;
    size?: number | undefined;
    sortBy?: string | undefined;
    sortDirection?: "asc" | "desc" | undefined;
}>;
export declare const TransactionCreateRequestSchema: z.ZodObject<{
    invoiceId: z.ZodString;
    invoiceNumber: z.ZodString;
    customerId: z.ZodString;
    customerEmail: z.ZodString;
    amount: z.ZodNumber;
    currency: z.ZodDefault<z.ZodString>;
    paymentType: z.ZodNativeEnum<typeof PaymentType>;
    cardType: z.ZodNativeEnum<typeof CardType>;
    description: z.ZodString;
}, "strip", z.ZodTypeAny, {
    invoiceId: string;
    invoiceNumber: string;
    customerId: string;
    customerEmail: string;
    amount: number;
    currency: string;
    paymentType: PaymentType;
    cardType: CardType;
    description: string;
}, {
    invoiceId: string;
    invoiceNumber: string;
    customerId: string;
    customerEmail: string;
    amount: number;
    paymentType: PaymentType;
    cardType: CardType;
    description: string;
    currency?: string | undefined;
}>;
export declare const TransactionUpdateStatusRequestSchema: z.ZodObject<{
    status: z.ZodNativeEnum<typeof TransactionStatus>;
}, "strip", z.ZodTypeAny, {
    status: TransactionStatus;
}, {
    status: TransactionStatus;
}>;
export declare const PaymentLinkCreateRequestSchema: z.ZodObject<{
    invoiceId: z.ZodString;
    invoiceNumber: z.ZodString;
    amount: z.ZodNumber;
    currency: z.ZodDefault<z.ZodString>;
    customerEmail: z.ZodString;
    description: z.ZodString;
    expiryHours: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    invoiceId: string;
    invoiceNumber: string;
    customerEmail: string;
    amount: number;
    currency: string;
    description: string;
    expiryHours: number;
}, {
    invoiceId: string;
    invoiceNumber: string;
    customerEmail: string;
    amount: number;
    description: string;
    currency?: string | undefined;
    expiryHours?: number | undefined;
}>;
export declare const PaymentLinkUpdateRequestSchema: z.ZodObject<{
    description: z.ZodOptional<z.ZodString>;
    expiryHours: z.ZodOptional<z.ZodNumber>;
    notifyCustomer: z.ZodOptional<z.ZodBoolean>;
    redirectUrl: z.ZodOptional<z.ZodString>;
    webhookUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    description?: string | undefined;
    expiryHours?: number | undefined;
    notifyCustomer?: boolean | undefined;
    redirectUrl?: string | undefined;
    webhookUrl?: string | undefined;
}, {
    description?: string | undefined;
    expiryHours?: number | undefined;
    notifyCustomer?: boolean | undefined;
    redirectUrl?: string | undefined;
    webhookUrl?: string | undefined;
}>;
export declare const PaginationParamsSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    size: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    sortBy: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    sortDirection: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    size: number;
    sortBy: string;
    sortDirection: "asc" | "desc";
}, {
    page?: number | undefined;
    size?: number | undefined;
    sortBy?: string | undefined;
    sortDirection?: "asc" | "desc" | undefined;
}>;
export declare const SortParamsSchema: z.ZodObject<{
    sortBy: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    sortDirection: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
}, "strip", z.ZodTypeAny, {
    sortBy: string;
    sortDirection: "asc" | "desc";
}, {
    sortBy?: string | undefined;
    sortDirection?: "asc" | "desc" | undefined;
}>;
export interface MCPToolDefinition {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties: Record<string, any>;
        required?: string[];
    };
}
export interface APIError {
    status: number;
    error: string;
    message: string;
    timestamp: string;
    validationErrors?: Record<string, string>;
}
export interface CacheItem<T> {
    data: T;
    timestamp: number;
    ttl: number;
}
export type CreateTransactionArgs = z.infer<typeof CreateTransactionSchema>;
export type CreatePaymentLinkArgs = z.infer<typeof CreatePaymentLinkSchema>;
export type PaginationArgs = z.infer<typeof PaginationSchema>;
export interface ToolArgsWithTenant<T = any> {
    tenantId: string;
    dealerId: string;
    userId: string;
    locale?: string;
    args: T;
}
export declare const TenantHeadersSchema: z.ZodObject<{
    tenantId: z.ZodString;
    dealerId: z.ZodString;
    userId: z.ZodString;
    locale: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    tenantId: string;
    dealerId: string;
    userId: string;
    locale: string;
}, {
    tenantId: string;
    dealerId: string;
    userId: string;
    locale?: string | undefined;
}>;
//# sourceMappingURL=types.d.ts.map