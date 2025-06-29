package com.roservice.dto.response;

import java.util.List;

public class RepairOrderListResponse {
    
    private List<RepairOrderResponse> repairOrders;
    private int totalCount;
    private int page;
    private int size;
    
    // Constructors
    public RepairOrderListResponse() {}
    
    public RepairOrderListResponse(List<RepairOrderResponse> repairOrders, int totalCount) {
        this.repairOrders = repairOrders;
        this.totalCount = totalCount;
    }
    
    public RepairOrderListResponse(List<RepairOrderResponse> repairOrders, int totalCount, int page, int size) {
        this.repairOrders = repairOrders;
        this.totalCount = totalCount;
        this.page = page;
        this.size = size;
    }
    
    // Getters and Setters
    public List<RepairOrderResponse> getRepairOrders() {
        return repairOrders;
    }
    
    public void setRepairOrders(List<RepairOrderResponse> repairOrders) {
        this.repairOrders = repairOrders;
    }
    
    public int getTotalCount() {
        return totalCount;
    }
    
    public void setTotalCount(int totalCount) {
        this.totalCount = totalCount;
    }
    
    public int getPage() {
        return page;
    }
    
    public void setPage(int page) {
        this.page = page;
    }
    
    public int getSize() {
        return size;
    }
    
    public void setSize(int size) {
        this.size = size;
    }
}
