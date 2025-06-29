import axios from 'axios';
import NodeCache from 'node-cache';
import { CONFIG } from '../config/constants.js';
import { logger } from '../utils/logger.js';
import { PaymentServiceError } from '../utils/errors.js';
export class PaymentService {
    constructor() {
        this.currentTenantHeaders = null;
        this.client = axios.create({
            baseURL: CONFIG.JAVA_API_BASE_URL,
            timeout: CONFIG.JAVA_API_TIMEOUT,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        this.cache = new NodeCache({
            stdTTL: CONFIG.CACHE_TTL_SECONDS,
            maxKeys: CONFIG.CACHE_MAX_KEYS,
            useClones: false
        });
        // Request interceptor for logging and adding tenant headers
        this.client.interceptors.request.use((config) => {
            // Add tenant headers to all requests if available
            if (this.currentTenantHeaders) {
                config.headers.set('X-Tenant-Id', this.currentTenantHeaders.tenantId);
                config.headers.set('X-Dealer-Id', this.currentTenantHeaders.dealerId);
                config.headers.set('X-User-Id', this.currentTenantHeaders.userId);
                config.headers.set('X-Locale', this.currentTenantHeaders.locale || 'en-US');
            }
            // Enhanced debug logging
            logger.debug(`Making request to: ${config.method?.toUpperCase()} ${config.baseURL}${config.url} with params:`, config.params);
            return config;
        }, (error) => {
            logger.error('Request error:', error);
            return Promise.reject(error);
        });
        // Response interceptor for error handling
        this.client.interceptors.response.use((response) => {
            logger.debug(`Response from ${response.config.url}: ${response.status}`);
            return response;
        }, (error) => {
            const message = error.response?.data?.message || error.message || 'Payment service error';
            const statusCode = error.response?.status || 500;
            logger.error(`Payment service error: ${message} (${statusCode})`);
            throw new PaymentServiceError(message, statusCode, error.response?.data);
        });
    }
    /**
     * Set tenant context for subsequent API calls
     */
    setTenantContext(tenantHeaders) {
        this.currentTenantHeaders = tenantHeaders;
        logger.debug(`Set tenant context: ${tenantHeaders.tenantId}/${tenantHeaders.dealerId}/${tenantHeaders.userId}`);
    }
    /**
     * Clear tenant context
     */
    clearTenantContext() {
        this.currentTenantHeaders = null;
        logger.debug('Cleared tenant context');
    }
    // Helper method to get cached data or fetch from API
    async getCachedOrFetch(cacheKey, fetchFn, ttlOverride) {
        const cached = this.cache.get(cacheKey);
        if (cached) {
            logger.debug(`Cache hit for key: ${cacheKey}`);
            return cached;
        }
        logger.debug(`Cache miss for key: ${cacheKey}, fetching from API`);
        const response = await fetchFn();
        if (ttlOverride) {
            this.cache.set(cacheKey, response.data, ttlOverride);
        }
        else {
            this.cache.set(cacheKey, response.data);
        }
        return response.data;
    }
    // Helper method to invalidate cache patterns
    invalidateCache(pattern) {
        const keys = this.cache.keys().filter(key => key.includes(pattern));
        keys.forEach(key => this.cache.del(key));
        logger.debug(`Invalidated ${keys.length} cache entries matching pattern: ${pattern}`);
    }
    // Transaction methods
    async createTransaction(data) {
        if (!this.currentTenantHeaders) {
            throw new PaymentServiceError('Tenant context not set. Call setTenantContext() first.', 400);
        }
        const response = await this.client.post('/transactions', data);
        this.invalidateCache('transactions');
        return response.data;
    }
    async getTransactionById(id) {
        if (!this.currentTenantHeaders) {
            throw new PaymentServiceError('Tenant context not set. Call setTenantContext() first.', 400);
        }
        const cacheKey = `transaction_${id}_${this.currentTenantHeaders.tenantId}`;
        return this.getCachedOrFetch(cacheKey, () => this.client.get(`/transactions/${id}`));
    }
    async getAllTransactions(params) {
        if (!this.currentTenantHeaders) {
            throw new PaymentServiceError('Tenant context not set. Call setTenantContext() first.', 400);
        }
        const cacheKey = `transactions_${JSON.stringify(params)}_${this.currentTenantHeaders.tenantId}`;
        return this.getCachedOrFetch(cacheKey, () => this.client.get('/transactions', { params }), 60 // Cache for 1 minute for paginated results
        );
    }
    async updateTransactionStatus(id, status) {
        if (!this.currentTenantHeaders) {
            throw new PaymentServiceError('Tenant context not set. Call setTenantContext() first.', 400);
        }
        const response = await this.client.put(`/transactions/${id}/status`, null, {
            params: { status }
        });
        this.invalidateCache('transaction');
        return response.data;
    }
    async processTransaction(id) {
        if (!this.currentTenantHeaders) {
            throw new PaymentServiceError('Tenant context not set. Call setTenantContext() first.', 400);
        }
        const response = await this.client.put(`/transactions/${id}/process`);
        this.invalidateCache('transaction');
        return response.data;
    }
    async searchTransactionsByCustomer(email) {
        if (!this.currentTenantHeaders) {
            throw new PaymentServiceError('Tenant context not set. Call setTenantContext() first.', 400);
        }
        const cacheKey = `transactions_customer_${email}_${this.currentTenantHeaders.tenantId}`;
        return this.getCachedOrFetch(cacheKey, () => this.client.get(`/transactions/customer/${encodeURIComponent(email)}`));
    }
    async searchTransactionsByCardType(cardType) {
        if (!this.currentTenantHeaders) {
            throw new PaymentServiceError('Tenant context not set. Call setTenantContext() first.', 400);
        }
        const cacheKey = `transactions_cardtype_${cardType}_${this.currentTenantHeaders.tenantId}`;
        return this.getCachedOrFetch(cacheKey, () => this.client.get(`/transactions/card-type/${cardType}`));
    }
    async searchTransactionsByStatus(status) {
        if (!this.currentTenantHeaders) {
            throw new PaymentServiceError('Tenant context not set. Call setTenantContext() first.', 400);
        }
        const cacheKey = `transactions_status_${status}_${this.currentTenantHeaders.tenantId}`;
        return this.getCachedOrFetch(cacheKey, () => this.client.get(`/transactions/status/${status}`));
    }
    async searchTransactionsByPaymentType(paymentType) {
        if (!this.currentTenantHeaders) {
            throw new PaymentServiceError('Tenant context not set. Call setTenantContext() first.', 400);
        }
        const cacheKey = `transactions_paymenttype_${paymentType}_${this.currentTenantHeaders.tenantId}`;
        return this.getCachedOrFetch(cacheKey, () => this.client.get(`/transactions/payment-type/${paymentType}`));
    }
    async searchTransactionsByInvoice(invoiceId) {
        if (!this.currentTenantHeaders) {
            throw new PaymentServiceError('Tenant context not set. Call setTenantContext() first.', 400);
        }
        const cacheKey = `transactions_invoice_${invoiceId}_${this.currentTenantHeaders.tenantId}`;
        return this.getCachedOrFetch(cacheKey, () => this.client.get(`/transactions/invoice/${encodeURIComponent(invoiceId)}`));
    }
    async searchTransactionsByReference(reference) {
        if (!this.currentTenantHeaders) {
            throw new PaymentServiceError('Tenant context not set. Call setTenantContext() first.', 400);
        }
        const cacheKey = `transaction_ref_${reference}_${this.currentTenantHeaders.tenantId}`;
        return this.getCachedOrFetch(cacheKey, () => this.client.get(`/transactions/reference/${encodeURIComponent(reference)}`));
    }
    // Payment Link methods
    async createPaymentLink(data) {
        if (!this.currentTenantHeaders) {
            throw new PaymentServiceError('Tenant context not set. Call setTenantContext() first.', 400);
        }
        const response = await this.client.post('/payment-links', data);
        this.invalidateCache('payment-links');
        return response.data;
    }
    async getPaymentLinkById(linkId) {
        if (!this.currentTenantHeaders) {
            throw new PaymentServiceError('Tenant context not set. Call setTenantContext() first.', 400);
        }
        const cacheKey = `payment_link_${linkId}_${this.currentTenantHeaders.tenantId}`;
        return this.getCachedOrFetch(cacheKey, () => this.client.get(`/payment-links/${encodeURIComponent(linkId)}`));
    }
    async getAllPaymentLinks() {
        if (!this.currentTenantHeaders) {
            throw new PaymentServiceError('Tenant context not set. Call setTenantContext() first.', 400);
        }
        const cacheKey = `payment_links_all_${this.currentTenantHeaders.tenantId}`;
        return this.getCachedOrFetch(cacheKey, () => this.client.get('/payment-links'), 60 // Cache for 1 minute
        );
    }
    async processPaymentLink(linkId) {
        if (!this.currentTenantHeaders) {
            throw new PaymentServiceError('Tenant context not set. Call setTenantContext() first.', 400);
        }
        const response = await this.client.post(`/payment-links/${encodeURIComponent(linkId)}/process`);
        this.invalidateCache('payment');
        return response.data;
    }
    async cancelPaymentLink(linkId) {
        if (!this.currentTenantHeaders) {
            throw new PaymentServiceError('Tenant context not set. Call setTenantContext() first.', 400);
        }
        const response = await this.client.post(`/payment-links/${encodeURIComponent(linkId)}/cancel`);
        this.invalidateCache('payment');
        return response.data;
    }
    async searchPaymentLinksByCustomer(email) {
        if (!this.currentTenantHeaders) {
            throw new PaymentServiceError('Tenant context not set. Call setTenantContext() first.', 400);
        }
        const cacheKey = `payment_links_customer_${email}_${this.currentTenantHeaders.tenantId}`;
        return this.getCachedOrFetch(cacheKey, () => this.client.get(`/payment-links/customer/${encodeURIComponent(email)}`));
    }
    async searchPaymentLinksByInvoice(invoiceId) {
        if (!this.currentTenantHeaders) {
            throw new PaymentServiceError('Tenant context not set. Call setTenantContext() first.', 400);
        }
        const cacheKey = `payment_links_invoice_${invoiceId}_${this.currentTenantHeaders.tenantId}`;
        return this.getCachedOrFetch(cacheKey, () => this.client.get(`/payment-links/invoice/${encodeURIComponent(invoiceId)}`));
    }
    async expireOldPaymentLinks() {
        if (!this.currentTenantHeaders) {
            throw new PaymentServiceError('Tenant context not set. Call setTenantContext() first.', 400);
        }
        const response = await this.client.post('/payment-links/expire-old');
        this.invalidateCache('payment-links');
        return response.data;
    }
    // Metadata methods
    async getAllCardTypes() {
        if (!this.currentTenantHeaders) {
            throw new PaymentServiceError('Tenant context not set. Call setTenantContext() first.', 400);
        }
        const tenantId = this.currentTenantHeaders.tenantId;
        const cacheKey = `card_types_${tenantId}`;
        return this.getCachedOrFetch(cacheKey, () => this.client.get('/transactions/metadata/card-types'), 3600 // Cache for 1 hour since this data rarely changes
        );
    }
    async getAllPaymentTypes() {
        if (!this.currentTenantHeaders) {
            throw new PaymentServiceError('Tenant context not set. Call setTenantContext() first.', 400);
        }
        const tenantId = this.currentTenantHeaders.tenantId;
        const cacheKey = `payment_types_${tenantId}`;
        return this.getCachedOrFetch(cacheKey, () => this.client.get('/transactions/metadata/payment-types'), 3600 // Cache for 1 hour since this data rarely changes
        );
    }
    // Analytics methods (temporarily disabled for multitenancy migration)
    async getTransactionAnalytics() {
        return {
            message: 'Analytics temporarily disabled during multitenancy migration',
            timestamp: new Date().toISOString()
        };
    }
    async getPaymentLinkAnalytics() {
        return {
            message: 'Analytics temporarily disabled during multitenancy migration',
            timestamp: new Date().toISOString()
        };
    }
    // Health check
    async healthCheck() {
        try {
            // Use actuator health endpoint which is excluded from tenant validation
            // Hardcode the health URL to avoid any path conflicts
            const healthUrl = 'http://localhost:8080/actuator/health';
            logger.debug(`Health check URL: ${healthUrl}`);
            await axios.get(healthUrl);
            return {
                status: 'healthy',
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            throw new PaymentServiceError('Payment service health check failed', 503, error);
        }
    }
    // Cache management
    getCacheStats() {
        return {
            keys: this.cache.keys().length,
            stats: this.cache.getStats()
        };
    }
    clearCache() {
        this.cache.flushAll();
        logger.info('Payment service cache cleared');
    }
}
//# sourceMappingURL=paymentService.js.map