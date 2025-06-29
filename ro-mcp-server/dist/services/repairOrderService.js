"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepairOrderService = void 0;
const axios_1 = __importDefault(require("axios"));
const node_cache_1 = __importDefault(require("node-cache"));
const constants_1 = require("../config/constants");
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../utils/logger"));
class RepairOrderService {
    constructor() {
        this.currentTenantHeaders = null;
        this.client = axios_1.default.create({
            baseURL: `${constants_1.CONFIG.RO_SERVICE.BASE_URL}${constants_1.CONFIG.RO_SERVICE.API_PREFIX}`,
            timeout: constants_1.CONFIG.RO_SERVICE.TIMEOUT,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        this.cache = new node_cache_1.default({
            stdTTL: 300, // 5 minutes default cache
            maxKeys: 1000,
            useClones: false
        });
        // Add request interceptor for logging and tenant headers
        this.client.interceptors.request.use((config) => {
            // Add tenant headers to all requests if available
            if (this.currentTenantHeaders) {
                config.headers.set('X-Tenant-Id', this.currentTenantHeaders.tenantId);
                config.headers.set('X-Dealer-Id', this.currentTenantHeaders.dealerId);
                config.headers.set('X-User-Id', this.currentTenantHeaders.userId);
                config.headers.set('X-Locale', this.currentTenantHeaders.locale || 'en-US');
            }
            logger_1.default.debug(`Making request to: ${config.method?.toUpperCase()} ${config.url}`, {
                params: config.params,
                data: config.data
            });
            return config;
        }, (error) => {
            logger_1.default.error('Request error:', error);
            return Promise.reject(error);
        });
        // Add response interceptor for logging and error handling
        this.client.interceptors.response.use((response) => {
            logger_1.default.debug(`Response from: ${response.config.url}`, {
                status: response.status,
                data: response.data
            });
            return response;
        }, (error) => {
            logger_1.default.error('Response error:', {
                url: error.config?.url,
                status: error.response?.status,
                data: error.response?.data
            });
            throw (0, errors_1.handleServiceError)(error);
        });
    }
    /**
     * Set tenant context for subsequent API calls
     */
    setTenantContext(tenantHeaders) {
        this.currentTenantHeaders = tenantHeaders;
        logger_1.default.debug(`Set tenant context: ${tenantHeaders.tenantId}/${tenantHeaders.dealerId}/${tenantHeaders.userId}`);
    }
    /**
     * Clear tenant context
     */
    clearTenantContext() {
        this.currentTenantHeaders = null;
        logger_1.default.debug('Cleared tenant context');
    }
    /**
     * Get tenant-specific cache key
     */
    getTenantCacheKey(baseKey) {
        if (!this.currentTenantHeaders) {
            return baseKey;
        }
        return `${this.currentTenantHeaders.tenantId}:${this.currentTenantHeaders.dealerId}:${baseKey}`;
    }
    /**
     * Helper method to get cached data or fetch from API with tenant-aware caching
     */
    async getCachedOrFetch(cacheKey, fetchFn, ttlOverride) {
        const tenantCacheKey = this.getTenantCacheKey(cacheKey);
        const cached = this.cache.get(tenantCacheKey);
        if (cached) {
            logger_1.default.debug(`Cache hit for key: ${tenantCacheKey}`);
            return cached;
        }
        logger_1.default.debug(`Cache miss for key: ${tenantCacheKey}, fetching from API`);
        const response = await fetchFn();
        const data = response.data;
        if (ttlOverride !== undefined) {
            this.cache.set(tenantCacheKey, data, ttlOverride);
        }
        else {
            this.cache.set(tenantCacheKey, data);
        }
        logger_1.default.debug(`Cached data for key: ${tenantCacheKey}`);
        return data;
    }
    // Get all repair orders with pagination
    async listRepairOrders(page = 0, size = 10, sortBy = 'id', sortDir = 'asc') {
        const cacheKey = `repair_orders_${page}_${size}_${sortBy}_${sortDir}`;
        return this.getCachedOrFetch(cacheKey, () => this.client.get('', { params: { page, size, sortBy, sortDir } }), 60 // Cache for 1 minute for list operations
        );
    }
    // Get repair order by ID
    async getRepairOrder(id) {
        const cacheKey = `repair_order_${id}`;
        return this.getCachedOrFetch(cacheKey, () => this.client.get(`/${id}`), 300 // Cache for 5 minutes for individual records
        );
    }
    // Get repair order by RO number
    async getRepairOrderByNumber(roNumber) {
        const cacheKey = `repair_order_num_${roNumber}`;
        return this.getCachedOrFetch(cacheKey, () => this.client.get(`/number/${roNumber}`), 300 // Cache for 5 minutes for individual records
        );
    }
    // Create new repair order
    async createRepairOrder(repairOrder) {
        const response = await this.client.post('', repairOrder);
        // Invalidate related cache entries
        this.invalidateListCaches();
        return response.data;
    }
    // Update repair order by ID
    async updateRepairOrder(id, updates) {
        const response = await this.client.put(`/${id}`, updates);
        // Invalidate cache for this specific repair order and lists
        this.invalidateCacheForRepairOrder(id);
        this.invalidateListCaches();
        return response.data;
    }
    // Update repair order by RO number
    async updateRepairOrderByNumber(roNumber, updates) {
        const response = await this.client.put(`/number/${roNumber}`, updates);
        // Invalidate cache for this RO number and lists
        this.invalidateCacheForRepairOrderNumber(roNumber);
        this.invalidateListCaches();
        return response.data;
    }
    // Delete repair order by ID
    async deleteRepairOrder(id) {
        await this.client.delete(`/${id}`);
        // Invalidate cache for this specific repair order and lists
        this.invalidateCacheForRepairOrder(id);
        this.invalidateListCaches();
    }
    // Delete repair order by RO number
    async deleteRepairOrderByNumber(roNumber) {
        await this.client.delete(`/number/${roNumber}`);
        // Invalidate cache for this RO number and lists
        this.invalidateCacheForRepairOrderNumber(roNumber);
        this.invalidateListCaches();
    }
    // Get repair orders by status
    async getRepairOrdersByStatus(status) {
        const cacheKey = `repair_orders_status_${status}`;
        return this.getCachedOrFetch(cacheKey, () => this.client.get(`/status/${status}`), 180 // Cache for 3 minutes
        );
    }
    // Get repair orders by technician ID
    async getRepairOrdersByTechnician(technicianId) {
        const cacheKey = `repair_orders_tech_${technicianId}`;
        return this.getCachedOrFetch(cacheKey, () => this.client.get(`/technician/${technicianId}`), 180 // Cache for 3 minutes
        );
    }
    // Get repair orders by vehicle VIN
    async getRepairOrdersByVehicleVin(vin) {
        const cacheKey = `repair_orders_vin_${vin}`;
        return this.getCachedOrFetch(cacheKey, () => this.client.get(`/vehicle/vin/${vin}`), 300 // Cache for 5 minutes
        );
    }
    // Get repair orders by vehicle make and model
    async getRepairOrdersByVehicle(make, model) {
        const cacheKey = `repair_orders_vehicle_${make}_${model}`;
        return this.getCachedOrFetch(cacheKey, () => this.client.get(`/vehicle/${make}/${model}`), 300 // Cache for 5 minutes
        );
    }
    // Add part to repair order
    async addPartToRepairOrder(roNumber, part) {
        const response = await this.client.post(`/number/${roNumber}/parts`, part);
        // Invalidate cache for this RO number and lists
        this.invalidateCacheForRepairOrderNumber(roNumber);
        this.invalidateListCaches();
        return response.data;
    }
    // Update repair order status
    async updateRepairOrderStatus(roNumber, status) {
        const response = await this.client.patch(`/number/${roNumber}/status`, { status });
        // Invalidate cache for this RO number and lists
        this.invalidateCacheForRepairOrderNumber(roNumber);
        this.invalidateListCaches();
        return response.data;
    }
    // Get repair order statistics
    async getRepairOrderStats() {
        const cacheKey = 'repair_order_stats';
        return this.getCachedOrFetch(cacheKey, () => this.client.get('/stats'), 120 // Cache stats for 2 minutes
        );
    }
    // Health check
    async healthCheck() {
        const response = await this.client.get('/health');
        return response.data;
    }
    /**
     * Cache invalidation methods
     */
    invalidateCacheForRepairOrder(id) {
        const cacheKey = this.getTenantCacheKey(`repair_order_${id}`);
        this.cache.del(cacheKey);
        logger_1.default.debug(`Invalidated cache for repair order: ${id}`);
    }
    invalidateCacheForRepairOrderNumber(roNumber) {
        const cacheKey = this.getTenantCacheKey(`repair_order_num_${roNumber}`);
        this.cache.del(cacheKey);
        logger_1.default.debug(`Invalidated cache for repair order number: ${roNumber}`);
    }
    invalidateListCaches() {
        const keys = this.cache.keys();
        const tenantPrefix = this.currentTenantHeaders
            ? `${this.currentTenantHeaders.tenantId}:${this.currentTenantHeaders.dealerId}:`
            : '';
        const listKeys = keys.filter((key) => key.startsWith(tenantPrefix + 'repair_orders_') ||
            key.startsWith(tenantPrefix + 'repair_order_stats'));
        if (listKeys.length > 0) {
            this.cache.del(listKeys);
            logger_1.default.debug(`Invalidated ${listKeys.length} list cache entries`);
        }
    }
}
exports.RepairOrderService = RepairOrderService;
//# sourceMappingURL=repairOrderService.js.map