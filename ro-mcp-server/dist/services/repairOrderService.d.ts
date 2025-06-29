import { RepairOrder, CreateRepairOrderRequest, UpdateRepairOrderRequest, RepairOrderListResponse, RepairOrderStats, ROPart, TenantHeaders } from '../mcp/types';
export declare class RepairOrderService {
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
    /**
     * Get tenant-specific cache key
     */
    private getTenantCacheKey;
    /**
     * Helper method to get cached data or fetch from API with tenant-aware caching
     */
    private getCachedOrFetch;
    listRepairOrders(page?: number, size?: number, sortBy?: string, sortDir?: 'asc' | 'desc'): Promise<RepairOrderListResponse>;
    getRepairOrder(id: number): Promise<RepairOrder>;
    getRepairOrderByNumber(roNumber: string): Promise<RepairOrder>;
    createRepairOrder(repairOrder: CreateRepairOrderRequest): Promise<RepairOrder>;
    updateRepairOrder(id: number, updates: UpdateRepairOrderRequest): Promise<RepairOrder>;
    updateRepairOrderByNumber(roNumber: string, updates: UpdateRepairOrderRequest): Promise<RepairOrder>;
    deleteRepairOrder(id: number): Promise<void>;
    deleteRepairOrderByNumber(roNumber: string): Promise<void>;
    getRepairOrdersByStatus(status: string): Promise<RepairOrder[]>;
    getRepairOrdersByTechnician(technicianId: string): Promise<RepairOrder[]>;
    getRepairOrdersByVehicleVin(vin: string): Promise<RepairOrder[]>;
    getRepairOrdersByVehicle(make: string, model: string): Promise<RepairOrder[]>;
    addPartToRepairOrder(roNumber: string, part: ROPart): Promise<RepairOrder>;
    updateRepairOrderStatus(roNumber: string, status: string): Promise<RepairOrder>;
    getRepairOrderStats(): Promise<RepairOrderStats>;
    healthCheck(): Promise<{
        status: string;
        service: string;
        timestamp: string;
    }>;
    /**
     * Cache invalidation methods
     */
    private invalidateCacheForRepairOrder;
    private invalidateCacheForRepairOrderNumber;
    private invalidateListCaches;
}
//# sourceMappingURL=repairOrderService.d.ts.map