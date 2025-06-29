package com.roservice.dto.response;

import com.roservice.dto.ROPart;
import com.roservice.entity.RepairOrder;
import com.roservice.entity.embedded.JobDetails;
import com.roservice.entity.embedded.TechnicianDetails;
import com.roservice.entity.embedded.VehicleDetails;
import com.roservice.enums.ROStatus;

import java.time.LocalDateTime;
import java.util.List;

public class RepairOrderResponse {
    
    private Long id;
    private String roNumber;
    private ROStatus status;
    private VehicleDetails vehicleDetails;
    private JobDetails jobDetails;
    private TechnicianDetails technicianDetails;
    private List<ROPart> parts;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Constructors
    public RepairOrderResponse() {}
    
    public RepairOrderResponse(RepairOrder repairOrder) {
        this.id = repairOrder.getId();
        this.roNumber = repairOrder.getRoNumber();
        this.status = repairOrder.getStatus();
        this.vehicleDetails = repairOrder.getVehicleDetails();
        this.jobDetails = repairOrder.getJobDetails();
        this.technicianDetails = repairOrder.getTechnicianDetails();
        this.parts = repairOrder.getParts();
        this.createdAt = repairOrder.getCreatedAt();
        this.updatedAt = repairOrder.getUpdatedAt();
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getRoNumber() {
        return roNumber;
    }
    
    public void setRoNumber(String roNumber) {
        this.roNumber = roNumber;
    }
    
    public ROStatus getStatus() {
        return status;
    }
    
    public void setStatus(ROStatus status) {
        this.status = status;
    }
    
    public VehicleDetails getVehicleDetails() {
        return vehicleDetails;
    }
    
    public void setVehicleDetails(VehicleDetails vehicleDetails) {
        this.vehicleDetails = vehicleDetails;
    }
    
    public JobDetails getJobDetails() {
        return jobDetails;
    }
    
    public void setJobDetails(JobDetails jobDetails) {
        this.jobDetails = jobDetails;
    }
    
    public TechnicianDetails getTechnicianDetails() {
        return technicianDetails;
    }
    
    public void setTechnicianDetails(TechnicianDetails technicianDetails) {
        this.technicianDetails = technicianDetails;
    }
    
    public List<ROPart> getParts() {
        return parts;
    }
    
    public void setParts(List<ROPart> parts) {
        this.parts = parts;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
