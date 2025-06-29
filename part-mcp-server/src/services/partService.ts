import axios, { AxiosInstance } from 'axios';
import NodeCache from 'node-cache';
import { config } from '../config';
import { logger } from '../utils/logger';
import { Part, PartSearchParams, InventoryUpdate, TenantHeaders, TenantContext } from '../mcp/types';

export class PartService {
  private client: AxiosInstance;
  private cache: NodeCache;
  private currentTenantHeaders: TenantHeaders | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: config.partService.baseUrl,
      timeout: config.partService.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Initialize cache with 5 minute TTL
    this.cache = new NodeCache({
      stdTTL: 300, // 5 minutes
      checkperiod: 60, // Check for expired keys every minute
      useClones: false
    });

    // Setup request interceptor for tenant headers
    this.client.interceptors.request.use((config) => {
      if (this.currentTenantHeaders) {
        config.headers.set('X-Tenant-Id', this.currentTenantHeaders.tenantId);
        config.headers.set('X-Dealer-Id', this.currentTenantHeaders.dealerId);
        config.headers.set('X-User-Id', this.currentTenantHeaders.userId);
        config.headers.set('X-Locale', this.currentTenantHeaders.locale || 'en-US');
      }
      return config;
    });
  }

  // Tenant Context Management
  setTenantContext(tenantHeaders: TenantHeaders): void {
    this.currentTenantHeaders = tenantHeaders;
    logger.debug('Tenant context set', { 
      tenantId: tenantHeaders.tenantId,
      dealerId: tenantHeaders.dealerId,
      userId: tenantHeaders.userId,
      locale: tenantHeaders.locale
    });
  }

  clearTenantContext(): void {
    this.currentTenantHeaders = null;
    logger.debug('Tenant context cleared');
  }

  getTenantContext(): TenantContext | null {
    if (!this.currentTenantHeaders) return null;
    
    return {
      tenantId: this.currentTenantHeaders.tenantId,
      dealerId: this.currentTenantHeaders.dealerId,
      userId: this.currentTenantHeaders.userId,
      locale: this.currentTenantHeaders.locale || 'en-US'
    };
  }

  // Cache Management with Tenant Awareness
  private getCacheKey(key: string): string {
    const tenantContext = this.getTenantContext();
    if (tenantContext) {
      return `${key}_${tenantContext.tenantId}_${tenantContext.dealerId}`;
    }
    return key;
  }

  private setCache(key: string, value: any, ttl?: number): void {
    const tenantKey = this.getCacheKey(key);
    if (ttl !== undefined) {
      this.cache.set(tenantKey, value, ttl);
    } else {
      this.cache.set(tenantKey, value);
    }
    logger.debug(`Cache set: ${tenantKey}`);
  }

  private getCache<T>(key: string): T | undefined {
    const tenantKey = this.getCacheKey(key);
    const value = this.cache.get<T>(tenantKey);
    if (value) {
      logger.debug(`Cache hit: ${tenantKey}`);
    } else {
      logger.debug(`Cache miss: ${tenantKey}`);
    }
    return value;
  }

  private deleteCache(key: string): void {
    const tenantKey = this.getCacheKey(key);
    this.cache.del(tenantKey);
    logger.debug(`Cache deleted: ${tenantKey}`);
  }

  // Cache invalidation patterns
  private invalidatePartCaches(partId?: number): void {
    const patterns = ['parts_all', 'parts_search_', 'parts_category_', 'parts_brand_'];
    if (partId) {
      patterns.push(`part_${partId}`);
    }
    
    patterns.forEach(pattern => {
      const keys = this.cache.keys().filter((key: string) => key.includes(this.getCacheKey(pattern)));
      if (keys.length > 0) {
        this.cache.del(keys);
        logger.debug(`Invalidated cache keys: ${keys.join(', ')}`);
      }
    });
  }

  getCacheStats() {
    return {
      keys: this.cache.keys().length,
      size: this.cache.getStats()
    };
  }

  clearCache(): void {
    const tenantContext = this.getTenantContext();
    if (tenantContext) {
      // Clear only tenant-specific cache entries
      const tenantPrefix = `_${tenantContext.tenantId}_${tenantContext.dealerId}`;
      const tenantKeys = this.cache.keys().filter((key: string) => key.includes(tenantPrefix));
      if (tenantKeys.length > 0) {
        this.cache.del(tenantKeys);
        logger.info(`Cleared ${tenantKeys.length} tenant-specific cache entries`);
      }
    } else {
      // Clear all cache if no tenant context
      this.cache.flushAll();
      logger.info('Cleared all cache entries');
    }
  }

  // CRUD Operations
  async getAllParts(): Promise<Part[]> {
    const cacheKey = 'parts_all';
    const cached = this.getCache<Part[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      logger.info('Fetching all parts');
      const response = await this.client.get('/api/parts');
      const parts = response.data;
      this.setCache(cacheKey, parts, 300); // Cache for 5 minutes
      return parts;
    } catch (error) {
      logger.error('Error fetching all parts:', error);
      throw new Error('Failed to fetch parts');
    }
  }

  async getPartById(id: string): Promise<Part> {
    const cacheKey = `part_${id}`;
    const cached = this.getCache<Part>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      logger.info(`Fetching part by ID: ${id}`);
      const response = await this.client.get(`/api/parts/${id}`);
      const part = response.data;
      this.setCache(cacheKey, part, 600); // Cache individual parts for 10 minutes
      return part;
    } catch (error) {
      logger.error(`Error fetching part ${id}:`, error);
      throw new Error(`Failed to fetch part with ID ${id}`);
    }
  }

  async getPartByPartNumber(partNumber: string): Promise<Part> {
    const cacheKey = `part_number_${partNumber}`;
    const cached = this.getCache<Part>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      logger.info(`Fetching part by part number: ${partNumber}`);
      const response = await this.client.get(`/api/parts/part-number/${partNumber}`);
      const part = response.data;
      this.setCache(cacheKey, part, 600); // Cache for 10 minutes
      return part;
    } catch (error) {
      logger.error(`Error fetching part ${partNumber}:`, error);
      throw new Error(`Failed to fetch part with number ${partNumber}`);
    }
  }

  async createPart(part: Partial<Part>): Promise<Part> {
    try {
      logger.info('Creating new part:', part);
      const response = await this.client.post('/api/parts', part);
      return response.data;
    } catch (error) {
      logger.error('Error creating part:', error);
      throw new Error('Failed to create part');
    }
  }

  async updatePart(id: string, part: Partial<Part>): Promise<Part> {
    try {
      logger.info(`Updating part ${id}:`, part);
      const response = await this.client.put(`/api/parts/${id}`, part);
      return response.data;
    } catch (error) {
      logger.error(`Error updating part ${id}:`, error);
      throw new Error(`Failed to update part with ID ${id}`);
    }
  }

  async deletePart(id: string): Promise<void> {
    try {
      logger.info(`Deleting part ${id}`);
      await this.client.delete(`/api/parts/${id}`);
    } catch (error) {
      logger.error(`Error deleting part ${id}:`, error);
      throw new Error(`Failed to delete part with ID ${id}`);
    }
  }

  async getPartsByCategory(category: string): Promise<Part[]> {
    try {
      logger.info(`Fetching parts by category: ${category}`);
      const response = await this.client.get(`/api/parts/category/${encodeURIComponent(category)}`);
      return response.data;
    } catch (error) {
      logger.error(`Error fetching parts by category ${category}:`, error);
      throw new Error(`Failed to fetch parts in category ${category}`);
    }
  }

  async getPartsByBrand(brand: string): Promise<Part[]> {
    try {
      logger.info(`Fetching parts by brand: ${brand}`);
      const response = await this.client.get(`/api/parts/brand/${encodeURIComponent(brand)}`);
      return response.data;
    } catch (error) {
      logger.error(`Error fetching parts by brand ${brand}:`, error);
      throw new Error(`Failed to fetch parts from brand ${brand}`);
    }
  }

  async getPartsByRepairOrder(repairOrderId: number): Promise<Part[]> {
    try {
      logger.info(`Fetching parts by repair order: ${repairOrderId}`);
      const response = await this.client.get(`/api/parts/repair-order/${repairOrderId}`);
      return response.data;
    } catch (error) {
      logger.error(`Error fetching parts by repair order ${repairOrderId}:`, error);
      throw new Error(`Failed to fetch parts for repair order ${repairOrderId}`);
    }
  }

  // Inventory Management
  async getLowStockParts(threshold: number = 10): Promise<Part[]> {
    try {
      logger.info(`Fetching low stock parts with threshold: ${threshold}`);
      const response = await this.client.get(`/api/parts/low-stock?threshold=${threshold}`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching low stock parts:', error);
      throw new Error('Failed to fetch low stock parts');
    }
  }

  async getOutOfStockParts(): Promise<Part[]> {
    try {
      logger.info('Fetching out of stock parts');
      const response = await this.client.get('/api/parts/out-of-stock');
      return response.data;
    } catch (error) {
      logger.error('Error fetching out of stock parts:', error);
      throw new Error('Failed to fetch out of stock parts');
    }
  }

  async updateStock(id: string, quantity: number): Promise<Part> {
    try {
      logger.info(`Updating stock for part ${id} to ${quantity}`);
      const response = await this.client.put(`/api/parts/${id}/stock`, { quantity });
      return response.data;
    } catch (error) {
      logger.error(`Error updating stock for part ${id}:`, error);
      throw new Error(`Failed to update stock for part ${id}`);
    }
  }

  async adjustStock(id: string, adjustment: number): Promise<Part> {
    try {
      logger.info(`Adjusting stock for part ${id} by ${adjustment}`);
      const response = await this.client.put(`/api/parts/${id}/adjust-stock`, { adjustment });
      return response.data;
    } catch (error) {
      logger.error(`Error adjusting stock for part ${id}:`, error);
      throw new Error(`Failed to adjust stock for part ${id}`);
    }
  }

  async checkAvailability(id: string, requiredQuantity: number): Promise<boolean> {
    try {
      logger.info(`Checking availability for part ${id}, required: ${requiredQuantity}`);
      const response = await this.client.get(`/api/parts/${id}/availability?requiredQuantity=${requiredQuantity}`);
      return response.data.available;
    } catch (error) {
      logger.error(`Error checking availability for part ${id}:`, error);
      throw new Error(`Failed to check availability for part ${id}`);
    }
  }

  // Metadata
  async getAllCategories(): Promise<string[]> {
    try {
      logger.info('Fetching all categories');
      const response = await this.client.get('/api/parts/categories');
      return response.data;
    } catch (error) {
      logger.error('Error fetching categories:', error);
      throw new Error('Failed to fetch categories');
    }
  }

  async getAllBrands(): Promise<string[]> {
    try {
      logger.info('Fetching all brands');
      const response = await this.client.get('/api/parts/brands');
      return response.data;
    } catch (error) {
      logger.error('Error fetching brands:', error);
      throw new Error('Failed to fetch brands');
    }
  }

  async getHealthStatus(): Promise<any> {
    try {
      logger.info('Checking part service health');
      const response = await this.client.get('/api/parts/health');
      return response.data;
    } catch (error) {
      logger.error('Error checking part service health:', error);
      throw new Error('Part service is not healthy');
    }
  }

  // New methods to match ExpressServer calls
  async healthCheck(): Promise<any> {
    return this.getHealthStatus();
  }

  async getPartStats(): Promise<any> {
    try {
      logger.info('Fetching part statistics');
      const response = await this.client.get('/api/parts/stats');
      return response.data;
    } catch (error) {
      logger.error('Error fetching part stats:', error);
      throw new Error('Failed to fetch part statistics');
    }
  }

  async listParts(page?: number, size?: number, category?: string, status?: string, search?: string): Promise<any> {
    try {
      logger.info('Listing parts with filters:', { page, size, category, status, search });
      
      const params = new URLSearchParams();
      if (page !== undefined) params.append('page', page.toString());
      if (size !== undefined) params.append('size', size.toString());
      if (category) params.append('category', category);
      if (status) params.append('status', status);
      if (search) params.append('search', search);
      
      const queryString = params.toString();
      const response = await this.client.get(`/api/parts${queryString ? `?${queryString}` : ''}`);
      return response.data;
    } catch (error) {
      logger.error('Error listing parts:', error);
      throw new Error('Failed to list parts');
    }
  }

  async getPartByNumber(partNumber: string): Promise<Part> {
    return this.getPartByPartNumber(partNumber);
  }

  async getPartsByManufacturer(manufacturer: string): Promise<Part[]> {
    return this.getPartsByBrand(manufacturer);
  }

  async updatePartStock(id: string, quantity: number, operation: string): Promise<Part> {
    try {
      logger.info(`Updating part stock: ${id}, quantity: ${quantity}, operation: ${operation}`);

      let response;
      switch (operation) {
        case 'SET':
          response = await this.client.put(`/api/parts/${id}/stock`, { quantity });
          break;
        case 'ADD':
          response = await this.client.put(`/api/parts/${id}/adjust-stock`, { adjustment: quantity });
          break;
        case 'SUBTRACT':
          response = await this.client.put(`/api/parts/${id}/adjust-stock`, { adjustment: -quantity });
          break;
        default:
          throw new Error(`Invalid operation: ${operation}`);
      }

      return response.data;
    } catch (error) {
      logger.error(`Error updating part stock for ${id}:`, error);
      throw new Error(`Failed to update stock for part ${id}`);
    }
  }

  async searchParts(query: string, page?: number, size?: number): Promise<Part[]> {
    try {
      logger.info(`Searching parts with query: ${query}`);
      
      const params = new URLSearchParams();
      params.append('term', query);
      if (page !== undefined) params.append('page', page.toString());
      if (size !== undefined) params.append('size', size.toString());
      
      const response = await this.client.get(`/api/parts/search?${params.toString()}`);
      return response.data;
    } catch (error) {
      logger.error('Error searching parts:', error);
      throw new Error('Failed to search parts');
    }
  }

  async getPartsByPriceRange(minPrice: number, maxPrice: number): Promise<Part[]> {
    try {
      logger.info(`Fetching parts in price range: ${minPrice} - ${maxPrice}`);
      const response = await this.client.get(`/api/parts/price-range?minPrice=${minPrice}&maxPrice=${maxPrice}`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching parts by price range:', error);
      throw new Error('Failed to fetch parts by price range');
    }
  }

  async getPartsBySupplier(supplier: string): Promise<Part[]> {
    try {
      logger.info(`Fetching parts by supplier: ${supplier}`);
      const response = await this.client.get(`/api/parts/supplier/${encodeURIComponent(supplier)}`);
      return response.data;
    } catch (error) {
      logger.error(`Error fetching parts by supplier ${supplier}:`, error);
      throw new Error(`Failed to fetch parts from supplier ${supplier}`);
    }
  }

  async bulkUpdatePartPrices(priceAdjustment: number, category?: string, manufacturer?: string): Promise<any> {
    try {
      logger.info('Bulk updating part prices:', { priceAdjustment, category, manufacturer });
      
      const params = new URLSearchParams();
      params.append('priceAdjustment', priceAdjustment.toString());
      if (category) params.append('category', category);
      if (manufacturer) params.append('manufacturer', manufacturer);
      
      const response = await this.client.put(`/api/parts/bulk-price-update?${params.toString()}`);
      return response.data;
    } catch (error) {
      logger.error('Error bulk updating part prices:', error);
      throw new Error('Failed to bulk update part prices');
    }
  }

  async getPartInventoryValue(category?: string, manufacturer?: string): Promise<any> {
    try {
      logger.info('Fetching part inventory value:', { category, manufacturer });
      
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (manufacturer) params.append('manufacturer', manufacturer);
      
      const queryString = params.toString();
      const response = await this.client.get(`/api/parts/inventory-value${queryString ? `?${queryString}` : ''}`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching part inventory value:', error);
      throw new Error('Failed to fetch part inventory value');
    }
  }
}
