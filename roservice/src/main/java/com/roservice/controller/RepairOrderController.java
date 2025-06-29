package com.roservice.controller;

import com.roservice.config.ContextProvider;
import com.roservice.dto.ROPart;
import com.roservice.dto.request.CreateRepairOrderRequest;
import com.roservice.dto.request.UpdateRepairOrderRequest;
import com.roservice.dto.response.RepairOrderResponse;
import com.roservice.enums.ROStatus;
import com.roservice.service.RepairOrderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/repair-orders")
@CrossOrigin(origins = "*")
public class RepairOrderController {
    
    private static final Logger logger = LoggerFactory.getLogger(RepairOrderController.class);
    
    @Autowired
    private RepairOrderService repairOrderService;
    
    // Create new repair order
    @PostMapping
    public ResponseEntity<RepairOrderResponse> createRepairOrder(@Valid @RequestBody CreateRepairOrderRequest request) {
        logger.info("Creating repair order for tenant: {}", ContextProvider.getTenantId());
        RepairOrderResponse response = repairOrderService.createRepairOrder(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
    
    // Get all repair orders with pagination
    @GetMapping
    public ResponseEntity<Page<RepairOrderResponse>> getAllRepairOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        
        logger.info("Getting all repair orders for tenant: {}", ContextProvider.getTenantId());
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
            Sort.by(sortBy).descending() : 
            Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<RepairOrderResponse> repairOrders = repairOrderService.getAllRepairOrders(pageable);
        return ResponseEntity.ok(repairOrders);
    }
    
    // Get repair order by ID
    @GetMapping("/{id}")
    public ResponseEntity<RepairOrderResponse> getRepairOrderById(@PathVariable Long id) {
        logger.info("Getting repair order {} for tenant: {}", id, ContextProvider.getTenantId());
        RepairOrderResponse response = repairOrderService.getRepairOrderById(id);
        return ResponseEntity.ok(response);
    }
    
    // Get repair order by RO number (dual access pattern)
    @GetMapping("/number/{roNumber}")
    public ResponseEntity<RepairOrderResponse> getRepairOrderByNumber(@PathVariable String roNumber) {
        logger.info("Getting repair order {} for tenant: {}", roNumber, ContextProvider.getTenantId());
        RepairOrderResponse response = repairOrderService.getRepairOrderByNumber(roNumber);
        return ResponseEntity.ok(response);
    }
    
    // Update repair order by ID
    @PutMapping("/{id}")
    public ResponseEntity<RepairOrderResponse> updateRepairOrder(
            @PathVariable Long id, 
            @Valid @RequestBody UpdateRepairOrderRequest request) {
        logger.info("Updating repair order {} for tenant: {}", id, ContextProvider.getTenantId());
        RepairOrderResponse response = repairOrderService.updateRepairOrder(id, request);
        return ResponseEntity.ok(response);
    }
    
    // Update repair order by RO number (dual access pattern)
    @PutMapping("/number/{roNumber}")
    public ResponseEntity<RepairOrderResponse> updateRepairOrderByNumber(
            @PathVariable String roNumber, 
            @Valid @RequestBody UpdateRepairOrderRequest request) {
        logger.info("Updating repair order {} for tenant: {}", roNumber, ContextProvider.getTenantId());
        RepairOrderResponse response = repairOrderService.updateRepairOrderByNumber(roNumber, request);
        return ResponseEntity.ok(response);
    }
    
    // Delete repair order by ID
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRepairOrder(@PathVariable Long id) {
        logger.info("Deleting repair order {} for tenant: {}", id, ContextProvider.getTenantId());
        repairOrderService.deleteRepairOrder(id);
        return ResponseEntity.noContent().build();
    }
    
    // Delete repair order by RO number
    @DeleteMapping("/number/{roNumber}")
    public ResponseEntity<Void> deleteRepairOrderByNumber(@PathVariable String roNumber) {
        repairOrderService.deleteRepairOrderByNumber(roNumber);
        return ResponseEntity.noContent().build();
    }
    
    // Get repair orders by status
    @GetMapping("/status/{status}")
    public ResponseEntity<List<RepairOrderResponse>> getRepairOrdersByStatus(@PathVariable ROStatus status) {
        List<RepairOrderResponse> repairOrders = repairOrderService.getRepairOrdersByStatus(status);
        return ResponseEntity.ok(repairOrders);
    }
    
    // Get repair orders by technician ID
    @GetMapping("/technician/{technicianId}")
    public ResponseEntity<List<RepairOrderResponse>> getRepairOrdersByTechnician(@PathVariable String technicianId) {
        List<RepairOrderResponse> repairOrders = repairOrderService.getRepairOrdersByTechnician(technicianId);
        return ResponseEntity.ok(repairOrders);
    }
    
    // Get repair orders by vehicle VIN
    @GetMapping("/vehicle/vin/{vin}")
    public ResponseEntity<List<RepairOrderResponse>> getRepairOrdersByVehicleVin(@PathVariable String vin) {
        List<RepairOrderResponse> repairOrders = repairOrderService.getRepairOrdersByVehicleVin(vin);
        return ResponseEntity.ok(repairOrders);
    }
    
    // Get repair orders by vehicle make and model
    @GetMapping("/vehicle/{make}/{model}")
    public ResponseEntity<List<RepairOrderResponse>> getRepairOrdersByVehicle(
            @PathVariable String make, 
            @PathVariable String model) {
        List<RepairOrderResponse> repairOrders = repairOrderService.getRepairOrdersByVehicle(make, model);
        return ResponseEntity.ok(repairOrders);
    }
    
    // Add part to repair order
    @PostMapping("/number/{roNumber}/parts")
    public ResponseEntity<RepairOrderResponse> addPartToRepairOrder(
            @PathVariable String roNumber, 
            @Valid @RequestBody ROPart part) {
        RepairOrderResponse response = repairOrderService.addPartToRepairOrder(roNumber, part);
        return ResponseEntity.ok(response);
    }
    
    // Update repair order status
    @PatchMapping("/number/{roNumber}/status")
    public ResponseEntity<RepairOrderResponse> updateRepairOrderStatus(
            @PathVariable String roNumber, 
            @RequestBody Map<String, String> statusUpdate) {
        ROStatus status = ROStatus.valueOf(statusUpdate.get("status"));
        RepairOrderResponse response = repairOrderService.updateStatus(roNumber, status);
        return ResponseEntity.ok(response);
    }
    
    // Get repair order statistics
    @GetMapping("/stats")
    public ResponseEntity<RepairOrderService.RepairOrderStats> getRepairOrderStats() {
        RepairOrderService.RepairOrderStats stats = repairOrderService.getRepairOrderStats();
        return ResponseEntity.ok(stats);
    }
    
    // Health check endpoint
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "service", "Repair Order Service",
            "timestamp", java.time.LocalDateTime.now().toString()
        ));
    }
}
