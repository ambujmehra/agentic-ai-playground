// Type definitions for Repair Order MCP Server

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

export interface VehicleDetails {
  vehicleVin: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  mileage?: number;
}

export interface JobDetails {
  jobDescription: string;
  estimatedHours: number;
  laborRate: number;
  jobCategory: string;
}

export interface TechnicianDetails {
  technicianName: string;
  technicianId: string;
  technicianLevel: 'JUNIOR' | 'SENIOR' | 'EXPERT';
}

export interface ROPart {
  partId: string;
  partNumber: string;
  quantity: number;
  unitPrice: number;
  addedAt?: string;
}

export interface RepairOrder {
  id: number;
  roNumber: string;
  status: 'CREATED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  vehicleDetails: VehicleDetails;
  jobDetails: JobDetails;
  technicianDetails: TechnicianDetails;
  parts: ROPart[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRepairOrderRequest {
  roNumber: string;
  status?: 'CREATED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  vehicleDetails: VehicleDetails;
  jobDetails: JobDetails;
  technicianDetails: TechnicianDetails;
  parts?: ROPart[];
}

export interface UpdateRepairOrderRequest {
  status?: 'CREATED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  vehicleDetails?: VehicleDetails;
  jobDetails?: JobDetails;
  technicianDetails?: TechnicianDetails;
  parts?: ROPart[];
}

export interface RepairOrderListResponse {
  content: RepairOrder[];
  pageable: {
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    pageNumber: number;
    pageSize: number;
    unpaged: boolean;
    paged: boolean;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  size: number;
  numberOfElements: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  first: boolean;
  number: number;
  empty: boolean;
}

export interface RepairOrderStats {
  totalCount: number;
  createdCount: number;
  inProgressCount: number;
  completedCount: number;
}

// MCP Tool parameter interfaces
export interface ListRepairOrdersParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface GetRepairOrderParams {
  id: number;
}

export interface GetRepairOrderByNumberParams {
  roNumber: string;
}

export interface CreateRepairOrderParams {
  repairOrder: CreateRepairOrderRequest;
}

export interface UpdateRepairOrderParams {
  id?: number;
  roNumber?: string;
  updates: UpdateRepairOrderRequest;
}

export interface UpdateRepairOrderStatusParams {
  roNumber: string;
  status: 'CREATED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

export interface DeleteRepairOrderParams {
  id?: number;
  roNumber?: string;
}

export interface GetRepairOrdersByStatusParams {
  status: 'CREATED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

export interface GetRepairOrdersByTechnicianParams {
  technicianId: string;
}

export interface GetRepairOrdersByVehicleParams {
  vin?: string;
  make?: string;
  model?: string;
}

export interface AddPartToRepairOrderParams {
  roNumber: string;
  part: ROPart;
}
