package com.roservice.entity;

import com.roservice.converter.PartListConverter;
import com.roservice.dto.ROPart;
import com.roservice.entity.embedded.JobDetails;
import com.roservice.entity.embedded.TechnicianDetails;
import com.roservice.entity.embedded.VehicleDetails;
import com.roservice.enums.ROStatus;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import javax.persistence.*;
import javax.validation.Valid;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "repair_orders")
public class RepairOrder {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    @NotBlank(message = "RO Number is required")
    private String roNumber;
    
    @Enumerated(EnumType.STRING)
    @NotNull(message = "Status is required")
    private ROStatus status;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @Embedded
    @Valid
    @NotNull(message = "Vehicle details are required")
    private VehicleDetails vehicleDetails;
    
    @Embedded
    @Valid
    @NotNull(message = "Job details are required")
    private JobDetails jobDetails;
    
    @Embedded
    @Valid
    @NotNull(message = "Technician details are required")
    private TechnicianDetails technicianDetails;
    
    @Column(columnDefinition = "TEXT")
    @Convert(converter = PartListConverter.class)
    private List<ROPart> parts = new ArrayList<>();

    // Constructors
    public RepairOrder() {}

    public RepairOrder(String roNumber, ROStatus status, VehicleDetails vehicleDetails, 
                      JobDetails jobDetails, TechnicianDetails technicianDetails) {
        this.roNumber = roNumber;
        this.status = status;
        this.vehicleDetails = vehicleDetails;
        this.jobDetails = jobDetails;
        this.technicianDetails = technicianDetails;
        this.parts = new ArrayList<>();
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
        this.parts = parts != null ? parts : new ArrayList<>();
    }

    // Helper methods
    public void addPart(ROPart part) {
        if (this.parts == null) {
            this.parts = new ArrayList<>();
        }
        this.parts.add(part);
    }

    public void removePart(String partNumber) {
        if (this.parts != null) {
            this.parts.removeIf(part -> part.getPartNumber().equals(partNumber));
        }
    }

    @Override
    public String toString() {
        return "RepairOrder{" +
                "id=" + id +
                ", roNumber='" + roNumber + '\'' +
                ", status=" + status +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                ", partsCount=" + (parts != null ? parts.size() : 0) +
                '}';
    }
}
