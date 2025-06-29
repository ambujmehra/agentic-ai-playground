import { z } from 'zod';
export declare const validateInput: <T>(schema: z.ZodSchema<T>, data: unknown) => T;
export declare const isValidEmail: (email: string) => boolean;
export declare const isValidAmount: (amount: number) => boolean;
export declare const isValidInvoiceId: (invoiceId: string) => boolean;
export declare const isValidCurrency: (currency: string) => boolean;
export declare const validatePagination: (page?: number, size?: number) => {
    page: number;
    size: number;
};
export declare const validateSortDirection: (direction?: string) => "asc" | "desc";
export declare const isValidId: (id: any) => boolean;
//# sourceMappingURL=validation.d.ts.map