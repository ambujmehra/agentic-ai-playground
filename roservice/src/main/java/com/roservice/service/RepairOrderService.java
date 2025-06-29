package com.roservice.service;

import com.roservice.dto.ROPart;
import com.roservice.dto.request.CreateRepairOrderRequest;
import com.roservice.dto.request.UpdateRepairOrderRequest;
import com.roservice.dto.response.RepairOrderResponse;
import com.roservice.entity.RepairOrder;
import com.roservice.enums.ROStatus;
import com.roservice.repository.RepairOrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class RepairOrderService {
    
    @Autowired
    private RepairOrderRepository repairOrderRepository;
    
    // Create new repair order
    public RepairOrderResponse createRepairOrder(CreateRepairOrderRequest request) {
        // Check if RO number already exists
        if (repairOrderRepository.existsByRoNumber(request.getRoNumber())) {
            throw new IllegalArgumentException("Repair order with number " + request.getRoNumber() + " already exists");
        }
        
        RepairOrder repairOrder = new RepairOrder();
        repairOrder.setRoNumber(request.getRoNumber());
        repairOrder.setStatus(request.getStatus() != null ? request.getStatus() : ROStatus.CREATED);
        repairOrder.setVehicleDetails(request.getVehicleDetails());
        repairOrder.setJobDetails(request.getJobDetails());
        repairOrder.setTechnicianDetails(request.getTechnicianDetails());
        repairOrder.setParts(request.getParts());
        repairOrder.setCreatedAt(LocalDateTime.now());
        repairOrder.setUpdatedAt(LocalDateTime.now());
        
        RepairOrder savedOrder = repairOrderRepository.save(repairOrder);
        return new RepairOrderResponse(savedOrder);
    }
    
    // Get repair order by ID
    @Transactional(readOnly = true)
    public RepairOrderResponse getRepairOrderById(Long id) {
        RepairOrder repairOrder = repairOrderRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Repair order not found with id: " + id));
        return new RepairOrderResponse(repairOrder);
    }
    
    // Get repair order by RO number (dual access pattern)
    @Transactional(readOnly = true)
    public RepairOrderResponse getRepairOrderByNumber(String roNumber) {
        RepairOrder repairOrder = repairOrderRepository.findByRoNumber(roNumber)
            .orElseThrow(() -> new EntityNotFoundException("Repair order not found with number: " + roNumber));
        return new RepairOrderResponse(repairOrder);
    }
    
    // Update repair order by ID
    public RepairOrderResponse updateRepairOrder(Long id, UpdateRepairOrderRequest request) {
        RepairOrder repairOrder = repairOrderRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Repair order not found with id: " + id));
        
        updateRepairOrderFields(repairOrder, request);
        RepairOrder updatedOrder = repairOrderRepository.save(repairOrder);
        return new RepairOrderResponse(updatedOrder);
    }
    
    // Update repair order by RO number (dual access pattern)
    public RepairOrderResponse updateRepairOrderByNumber(String roNumber, UpdateRepairOrderRequest request) {
        RepairOrder repairOrder = repairOrderRepository.findByRoNumber(roNumber)
            .orElseThrow(() -> new EntityNotFoundException("Repair order not found with number: " + roNumber));
        
        updateRepairOrderFields(repairOrder, request);
        RepairOrder updatedOrder = repairOrderRepository.save(repairOrder);
        return new RepairOrderResponse(updatedOrder);
    }
    
    // Delete repair order by ID
    public void deleteRepairOrder(Long id) {
        if (!repairOrderRepository.existsById(id)) {
            throw new EntityNotFoundException("Repair order not found with id: " + id);
        }
        repairOrderRepository.deleteById(id);
    }
    
    // Delete repair order by RO number
    public void deleteRepairOrderByNumber(String roNumber) {
        RepairOrder repairOrder = repairOrderRepository.findByRoNumber(roNumber)
            .orElseThrow(() -> new EntityNotFoundException("Repair order not found with number: " + roNumber));
        repairOrderRepository.delete(repairOrder);
    }
    
    // Get all repair orders with pagination
    @Transactional(readOnly = true)
    public Page<RepairOrderResponse> getAllRepairOrders(Pageable pageable) {
        Page<RepairOrder> repairOrders = repairOrderRepository.findAll(pageable);
        return repairOrders.map(RepairOrderResponse::new);
    }
    
    // Get repair orders by status
    @Transactional(readOnly = true)
    public List<RepairOrderResponse> getRepairOrdersByStatus(ROStatus status) {
        List<RepairOrder> repairOrders = repairOrderRepository.findByStatus(status);
        return repairOrders.stream()
            .map(RepairOrderResponse::new)
            .collect(Collectors.toList());
    }
    
    // Get repair orders by technician ID
    @Transactional(readOnly = true)
    public List<RepairOrderResponse> getRepairOrdersByTechnician(String technicianId) {
        List<RepairOrder> repairOrders = repairOrderRepository.findByTechnicianId(technicianId);
        return repairOrders.stream()
            .map(RepairOrderResponse::new)
            .collect(Collectors.toList());
    }
    
    // Get repair orders by vehicle VIN
    @Transactional(readOnly = true)
    public List<RepairOrderResponse> getRepairOrdersByVehicleVin(String vin) {
        List<RepairOrder> repairOrders = repairOrderRepository.findByVehicleVin(vin);
        return repairOrders.stream()
            .map(RepairOrderResponse::new)
            .collect(Collectors.toList());
    }
    
    // Get repair orders by vehicle make and model
    @Transactional(readOnly = true)
    public List<RepairOrderResponse> getRepairOrdersByVehicle(String make, String model) {
        List<RepairOrder> repairOrders = repairOrderRepository.findByVehicleMakeAndModel(make, model);
        return repairOrders.stream()
            .map(RepairOrderResponse::new)
            .collect(Collectors.toList());
    }
    
    // Add part to repair order
    public RepairOrderResponse addPartToRepairOrder(String roNumber, ROPart part) {
        RepairOrder repairOrder = repairOrderRepository.findByRoNumber(roNumber)
            .orElseThrow(() -> new EntityNotFoundException("Repair order not found with number: " + roNumber));
        
        if (repairOrder.getParts() == null) {
            repairOrder.setParts(List.of(part));
        } else {
            repairOrder.getParts().add(part);
        }
        
        repairOrder.setUpdatedAt(LocalDateTime.now());
        RepairOrder updatedOrder = repairOrderRepository.save(repairOrder);
        return new RepairOrderResponse(updatedOrder);
    }
    
    // Update repair order status
    public RepairOrderResponse updateStatus(String roNumber, ROStatus status) {
        RepairOrder repairOrder = repairOrderRepository.findByRoNumber(roNumber)
            .orElseThrow(() -> new EntityNotFoundException("Repair order not found with number: " + roNumber));
        
        repairOrder.setStatus(status);
        repairOrder.setUpdatedAt(LocalDateTime.now());
        
        RepairOrder updatedOrder = repairOrderRepository.save(repairOrder);
        return new RepairOrderResponse(updatedOrder);
    }
    
    // Get repair order statistics
    @Transactional(readOnly = true)
    public RepairOrderStats getRepairOrderStats() {
        long totalCount = repairOrderRepository.count();
        long createdCount = repairOrderRepository.countByStatus(ROStatus.CREATED);
        long inProgressCount = repairOrderRepository.countByStatus(ROStatus.IN_PROGRESS);
        long completedCount = repairOrderRepository.countByStatus(ROStatus.COMPLETED);
        
        return new RepairOrderStats(totalCount, createdCount, inProgressCount, completedCount);
    }
    
    // Helper method to update repair order fields
    private void updateRepairOrderFields(RepairOrder repairOrder, UpdateRepairOrderRequest request) {
        if (request.getStatus() != null) {
            repairOrder.setStatus(request.getStatus());
        }
        if (request.getVehicleDetails() != null) {
            repairOrder.setVehicleDetails(request.getVehicleDetails());
        }
        if (request.getJobDetails() != null) {
            repairOrder.setJobDetails(request.getJobDetails());
        }
        if (request.getTechnicianDetails() != null) {
            repairOrder.setTechnicianDetails(request.getTechnicianDetails());
        }
        if (request.getParts() != null) {
            repairOrder.setParts(request.getParts());
        }
        repairOrder.setUpdatedAt(LocalDateTime.now());
    }
    
    // Inner class for statistics
    public static class RepairOrderStats {
        private final long totalCount;
        private final long createdCount;
        private final long inProgressCount;
        private final long completedCount;
        
        public RepairOrderStats(long totalCount, long createdCount, long inProgressCount, long completedCount) {
            this.totalCount = totalCount;
            this.createdCount = createdCount;
            this.inProgressCount = inProgressCount;
            this.completedCount = completedCount;
        }
        
        public long getTotalCount() { return totalCount; }
        public long getCreatedCount() { return createdCount; }
        public long getInProgressCount() { return inProgressCount; }
        public long getCompletedCount() { return completedCount; }
    }
}
