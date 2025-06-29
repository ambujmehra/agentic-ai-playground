package com.roservice.dto.request;

import com.roservice.dto.ROPart;
import com.roservice.entity.embedded.JobDetails;
import com.roservice.entity.embedded.TechnicianDetails;
import com.roservice.entity.embedded.VehicleDetails;
import com.roservice.enums.ROStatus;

import javax.validation.Valid;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.util.List;

public class CreateRepairOrderRequest {
    
    @NotBlank(message = "RO number is required")
    private String roNumber;
    
    private ROStatus status = ROStatus.CREATED;
    
    @Valid
    @NotNull(message = "Vehicle details are required")
    private VehicleDetails vehicleDetails;
    
    @Valid
    @NotNull(message = "Job details are required")
    private JobDetails jobDetails;
    
    @Valid
    @NotNull(message = "Technician details are required")
    private TechnicianDetails technicianDetails;
    
    private List<ROPart> parts;
    
    // Constructors
    public CreateRepairOrderRequest() {}
    
    public CreateRepairOrderRequest(String roNumber, VehicleDetails vehicleDetails, 
                                  JobDetails jobDetails, TechnicianDetails technicianDetails) {
        this.roNumber = roNumber;
        this.vehicleDetails = vehicleDetails;
        this.jobDetails = jobDetails;
        this.technicianDetails = technicianDetails;
    }
    
    // Getters and Setters
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
}
