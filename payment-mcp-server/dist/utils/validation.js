import { z } from 'zod';
import { ValidationError } from './errors.js';
// Generic validation function
export const validateInput = (schema, data) => {
    try {
        return schema.parse(data);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            const firstError = error.errors[0];
            throw new ValidationError(`${firstError.path.join('.')}: ${firstError.message}`, firstError.path.join('.'));
        }
        throw new ValidationError('Invalid input data');
    }
};
// Email validation
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
// Amount validation
export const isValidAmount = (amount) => {
    return amount > 0 && Number.isFinite(amount) && amount <= 999999999;
};
// Invoice ID validation
export const isValidInvoiceId = (invoiceId) => {
    return invoiceId.length >= 1 && invoiceId.length <= 50;
};
// Currency validation
export const isValidCurrency = (currency) => {
    const validCurrencies = ['INR', 'USD', 'EUR', 'GBP'];
    return validCurrencies.includes(currency.toUpperCase());
};
// Pagination validation
export const validatePagination = (page, size) => {
    const validatedPage = Math.max(0, page || 0);
    const validatedSize = Math.min(Math.max(1, size || 20), 100);
    return {
        page: validatedPage,
        size: validatedSize
    };
};
// Sort direction validation
export const validateSortDirection = (direction) => {
    return direction?.toLowerCase() === 'asc' ? 'asc' : 'desc';
};
// Generic ID validation
export const isValidId = (id) => {
    const numId = Number(id);
    return Number.isInteger(numId) && numId > 0;
};
//# sourceMappingURL=validation.js.map