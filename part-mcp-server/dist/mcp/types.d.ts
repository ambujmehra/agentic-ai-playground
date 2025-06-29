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
export interface MCPRequest {
    jsonrpc: '2.0';
    id?: string | number;
    method: string;
    params?: any;
}
export interface MCPResponse {
    jsonrpc: '2.0';
    id?: string | number;
    result?: any;
    error?: MCPError;
}
export interface MCPError {
    code: number;
    message: string;
    data?: any;
}
export interface MCPNotification {
    jsonrpc: '2.0';
    method: string;
    params?: any;
}
export interface ServerInfo {
    name: string;
    version: string;
    protocolVersion: string;
}
export interface ServerCapabilities {
    tools?: {
        listChanged?: boolean;
    };
    resources?: {
        subscribe?: boolean;
        listChanged?: boolean;
    };
    prompts?: {
        listChanged?: boolean;
    };
    logging?: {};
}
export interface Tool {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties: Record<string, any>;
        required?: string[];
    };
}
export interface ToolResult {
    content: Array<{
        type: 'text';
        text: string;
    }>;
    isError?: boolean;
}
export interface Part {
    id: string;
    partNumber: string;
    name: string;
    description?: string;
    category: string;
    brand: string;
    price: number;
    quantityInStock: number;
    location?: string;
    weightKg?: number;
    dimensions?: string;
    compatibleVehicles?: string;
    supplier?: string;
    supplierPartNumber?: string;
    warrantyMonths?: number;
    isOem: boolean;
    repairOrderId?: number;
    createdAt: string;
    updatedAt?: string;
}
export interface PartSearchParams {
    term?: string;
    category?: string;
    brand?: string;
    repairOrderId?: number;
    minPrice?: number;
    maxPrice?: number;
    vehicle?: string;
    isOem?: boolean;
    lowStockThreshold?: number;
}
export interface InventoryUpdate {
    quantity?: number;
    adjustment?: number;
}
//# sourceMappingURL=types.d.ts.map