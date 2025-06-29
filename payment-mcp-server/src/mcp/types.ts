import { z } from 'zod';

// Enums
export enum TransactionStatus {
  INITIATED = 'INITIATED',
  CAPTURED = 'CAPTURED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum PaymentType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT'
}

export enum CardType {
  VISA = 'VISA',
  MASTERCARD = 'MASTERCARD',
  AMEX = 'AMEX',
  RUPAY = 'RUPAY',
  UPI = 'UPI',
  NETBANKING = 'NETBANKING'
}

export enum PaymentLinkStatus {
  ACTIVE = 'ACTIVE',
  USED = 'USED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}

// Tenant Context interfaces
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

// Base interfaces
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

// MCP Tool types
export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

// API Error types
export interface APIError {
  status: number;
  error: string;
  message: string;
  timestamp: string;
  validationErrors?: Record<string, string>;
}

// Cache types
export interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Tool argument types
export type CreateTransactionArgs = z.infer<typeof CreateTransactionSchema>;
export type CreatePaymentLinkArgs = z.infer<typeof CreatePaymentLinkSchema>;
export type PaginationArgs = z.infer<typeof PaginationSchema>;

// Tool arguments with tenant context (internal use only)
export interface ToolArgsWithTenant<T = any> {
  tenantId: string;
  dealerId: string;
  userId: string;
  locale?: string;
  args: T;
}

// Zod schemas for tenant validation (server-side only)
export const TenantHeadersSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required').max(50, 'Tenant ID too long'),
  dealerId: z.string().min(1, 'Dealer ID is required').max(50, 'Dealer ID too long'),
  userId: z.string().min(1, 'User ID is required').max(50, 'User ID too long'),
  locale: z.string().optional().default('en-US')
});
