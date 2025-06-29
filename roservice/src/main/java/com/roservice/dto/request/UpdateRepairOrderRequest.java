package com.roservice.dto.request;

import com.roservice.dto.ROPart;
import com.roservice.entity.embedded.JobDetails;
import com.roservice.entity.embedded.TechnicianDetails;
import com.roservice.entity.embedded.VehicleDetails;
import com.roservice.enums.ROStatus;

import javax.validation.Valid;
import java.util.List;

public class UpdateRepairOrderRequest {
    
    private ROStatus status;
    
    @Valid
    private VehicleDetails vehicleDetails;
    
    @Valid
    private JobDetails jobDetails;
    
    @Valid
    private TechnicianDetails technicianDetails;
    
    private List<ROPart> parts;
    
    // Constructors
    public UpdateRepairOrderRequest() {}
    
    // Getters and Setters
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
