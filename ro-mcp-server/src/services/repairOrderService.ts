import axios, { AxiosInstance, AxiosResponse } from 'axios';
import NodeCache from 'node-cache';
import { CONFIG } from '../config/constants';
import { handleServiceError } from '../utils/errors';
import logger from '../utils/logger';
import {
  RepairOrder,
  CreateRepairOrderRequest,
  UpdateRepairOrderRequest,
  RepairOrderListResponse,
  RepairOrderStats,
  ROPart,
  TenantHeaders
} from '../mcp/types';

export class RepairOrderService {
  private client: AxiosInstance;
  private cache: NodeCache;
  private currentTenantHeaders: TenantHeaders | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: `${CONFIG.RO_SERVICE.BASE_URL}${CONFIG.RO_SERVICE.API_PREFIX}`,
      timeout: CONFIG.RO_SERVICE.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    this.cache = new NodeCache({
      stdTTL: 300, // 5 minutes default cache
      maxKeys: 1000,
      useClones: false
    });

    // Add request interceptor for logging and tenant headers
    this.client.interceptors.request.use(
      (config) => {
        // Add tenant headers to all requests if available
        if (this.currentTenantHeaders) {
          config.headers.set('X-Tenant-Id', this.currentTenantHeaders.tenantId);
          config.headers.set('X-Dealer-Id', this.currentTenantHeaders.dealerId);
          config.headers.set('X-User-Id', this.currentTenantHeaders.userId);
          config.headers.set('X-Locale', this.currentTenantHeaders.locale || 'en-US');
        }

        logger.debug(`Making request to: ${config.method?.toUpperCase()} ${config.url}`, {
          params: config.params,
          data: config.data
        });
        return config;
      },
      (error) => {
        logger.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging and error handling
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`Response from: ${response.config.url}`, {
          status: response.status,
          data: response.data
        });
        return response;
      },
      (error) => {
        logger.error('Response error:', {
          url: error.config?.url,
          status: error.response?.status,
          data: error.response?.data
        });
        throw handleServiceError(error);
      }
    );
  }

  /**
   * Set tenant context for subsequent API calls
   */
  setTenantContext(tenantHeaders: TenantHeaders): void {
    this.currentTenantHeaders = tenantHeaders;
    logger.debug(`Set tenant context: ${tenantHeaders.tenantId}/${tenantHeaders.dealerId}/${tenantHeaders.userId}`);
  }

  /**
   * Clear tenant context
   */
  clearTenantContext(): void {
    this.currentTenantHeaders = null;
    logger.debug('Cleared tenant context');
  }

  /**
   * Get tenant-specific cache key
   */
  private getTenantCacheKey(baseKey: string): string {
    if (!this.currentTenantHeaders) {
      return baseKey;
    }
    return `${this.currentTenantHeaders.tenantId}:${this.currentTenantHeaders.dealerId}:${baseKey}`;
  }

  /**
   * Helper method to get cached data or fetch from API with tenant-aware caching
   */
  private async getCachedOrFetch<T>(
    cacheKey: string,
    fetchFn: () => Promise<AxiosResponse<T>>,
    ttlOverride?: number
  ): Promise<T> {
    const tenantCacheKey = this.getTenantCacheKey(cacheKey);
    const cached = this.cache.get<T>(tenantCacheKey);
    if (cached) {
      logger.debug(`Cache hit for key: ${tenantCacheKey}`);
      return cached;
    }

    logger.debug(`Cache miss for key: ${tenantCacheKey}, fetching from API`);
    const response = await fetchFn();
    const data = response.data;
    
    if (ttlOverride !== undefined) {
      this.cache.set(tenantCacheKey, data, ttlOverride);
    } else {
      this.cache.set(tenantCacheKey, data);
    }
    logger.debug(`Cached data for key: ${tenantCacheKey}`);
    
    return data;
  }

  // Get all repair orders with pagination
  async listRepairOrders(
    page: number = 0,
    size: number = 10,
    sortBy: string = 'id',
    sortDir: 'asc' | 'desc' = 'asc'
  ): Promise<RepairOrderListResponse> {
    const cacheKey = `repair_orders_${page}_${size}_${sortBy}_${sortDir}`;
    return this.getCachedOrFetch(
      cacheKey,
      () => this.client.get('', { params: { page, size, sortBy, sortDir } }),
      60 // Cache for 1 minute for list operations
    );
  }

  // Get repair order by ID
  async getRepairOrder(id: number): Promise<RepairOrder> {
    const cacheKey = `repair_order_${id}`;
    return this.getCachedOrFetch(
      cacheKey,
      () => this.client.get(`/${id}`),
      300 // Cache for 5 minutes for individual records
    );
  }

  // Get repair order by RO number
  async getRepairOrderByNumber(roNumber: string): Promise<RepairOrder> {
    const cacheKey = `repair_order_num_${roNumber}`;
    return this.getCachedOrFetch(
      cacheKey,
      () => this.client.get(`/number/${roNumber}`),
      300 // Cache for 5 minutes for individual records
    );
  }

  // Create new repair order
  async createRepairOrder(repairOrder: CreateRepairOrderRequest): Promise<RepairOrder> {
    const response: AxiosResponse<RepairOrder> = await this.client.post('', repairOrder);
    // Invalidate related cache entries
    this.invalidateListCaches();
    return response.data;
  }

  // Update repair order by ID
  async updateRepairOrder(id: number, updates: UpdateRepairOrderRequest): Promise<RepairOrder> {
    const response: AxiosResponse<RepairOrder> = await this.client.put(`/${id}`, updates);
    // Invalidate cache for this specific repair order and lists
    this.invalidateCacheForRepairOrder(id);
    this.invalidateListCaches();
    return response.data;
  }

  // Update repair order by RO number
  async updateRepairOrderByNumber(roNumber: string, updates: UpdateRepairOrderRequest): Promise<RepairOrder> {
    const response: AxiosResponse<RepairOrder> = await this.client.put(`/number/${roNumber}`, updates);
    // Invalidate cache for this RO number and lists
    this.invalidateCacheForRepairOrderNumber(roNumber);
    this.invalidateListCaches();
    return response.data;
  }

  // Delete repair order by ID
  async deleteRepairOrder(id: number): Promise<void> {
    await this.client.delete(`/${id}`);
    // Invalidate cache for this specific repair order and lists
    this.invalidateCacheForRepairOrder(id);
    this.invalidateListCaches();
  }

  // Delete repair order by RO number
  async deleteRepairOrderByNumber(roNumber: string): Promise<void> {
    await this.client.delete(`/number/${roNumber}`);
    // Invalidate cache for this RO number and lists
    this.invalidateCacheForRepairOrderNumber(roNumber);
    this.invalidateListCaches();
  }

  // Get repair orders by status
  async getRepairOrdersByStatus(status: string): Promise<RepairOrder[]> {
    const cacheKey = `repair_orders_status_${status}`;
    return this.getCachedOrFetch(
      cacheKey,
      () => this.client.get(`/status/${status}`),
      180 // Cache for 3 minutes
    );
  }

  // Get repair orders by technician ID
  async getRepairOrdersByTechnician(technicianId: string): Promise<RepairOrder[]> {
    const cacheKey = `repair_orders_tech_${technicianId}`;
    return this.getCachedOrFetch(
      cacheKey,
      () => this.client.get(`/technician/${technicianId}`),
      180 // Cache for 3 minutes
    );
  }

  // Get repair orders by vehicle VIN
  async getRepairOrdersByVehicleVin(vin: string): Promise<RepairOrder[]> {
    const cacheKey = `repair_orders_vin_${vin}`;
    return this.getCachedOrFetch(
      cacheKey,
      () => this.client.get(`/vehicle/vin/${vin}`),
      300 // Cache for 5 minutes
    );
  }

  // Get repair orders by vehicle make and model
  async getRepairOrdersByVehicle(make: string, model: string): Promise<RepairOrder[]> {
    const cacheKey = `repair_orders_vehicle_${make}_${model}`;
    return this.getCachedOrFetch(
      cacheKey,
      () => this.client.get(`/vehicle/${make}/${model}`),
      300 // Cache for 5 minutes
    );
  }

  // Add part to repair order
  async addPartToRepairOrder(roNumber: string, part: ROPart): Promise<RepairOrder> {
    const response: AxiosResponse<RepairOrder> = await this.client.post(`/number/${roNumber}/parts`, part);
    // Invalidate cache for this RO number and lists
    this.invalidateCacheForRepairOrderNumber(roNumber);
    this.invalidateListCaches();
    return response.data;
  }

  // Update repair order status
  async updateRepairOrderStatus(roNumber: string, status: string): Promise<RepairOrder> {
    const response: AxiosResponse<RepairOrder> = await this.client.patch(`/number/${roNumber}/status`, { status });
    // Invalidate cache for this RO number and lists
    this.invalidateCacheForRepairOrderNumber(roNumber);
    this.invalidateListCaches();
    return response.data;
  }

  // Get repair order statistics
  async getRepairOrderStats(): Promise<RepairOrderStats> {
    const cacheKey = 'repair_order_stats';
    return this.getCachedOrFetch(
      cacheKey,
      () => this.client.get('/stats'),
      120 // Cache stats for 2 minutes
    );
  }

  // Health check
  async healthCheck(): Promise<{ status: string; service: string; timestamp: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }

  /**
   * Cache invalidation methods
   */
  private invalidateCacheForRepairOrder(id: number): void {
    const cacheKey = this.getTenantCacheKey(`repair_order_${id}`);
    this.cache.del(cacheKey);
    logger.debug(`Invalidated cache for repair order: ${id}`);
  }

  private invalidateCacheForRepairOrderNumber(roNumber: string): void {
    const cacheKey = this.getTenantCacheKey(`repair_order_num_${roNumber}`);
    this.cache.del(cacheKey);
    logger.debug(`Invalidated cache for repair order number: ${roNumber}`);
  }

  private invalidateListCaches(): void {
    const keys = this.cache.keys();
    const tenantPrefix = this.currentTenantHeaders 
      ? `${this.currentTenantHeaders.tenantId}:${this.currentTenantHeaders.dealerId}:` 
      : '';
    
    const listKeys = keys.filter((key: string) => 
      key.startsWith(tenantPrefix + 'repair_orders_') || 
      key.startsWith(tenantPrefix + 'repair_order_stats')
    );
    
    if (listKeys.length > 0) {
      this.cache.del(listKeys);
      logger.debug(`Invalidated ${listKeys.length} list cache entries`);
    }
  }
}
