package com.roservice.entity.embedded;

import com.roservice.enums.TechnicianLevel;

import javax.persistence.Embeddable;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.validation.constraints.NotBlank;

@Embeddable
public class TechnicianDetails {
    
    @NotBlank(message = "Technician name is required")
    private String technicianName;
    
    @NotBlank(message = "Technician ID is required")
    private String technicianId;
    
    @Enumerated(EnumType.STRING)
    private TechnicianLevel technicianLevel;

    // Constructors
    public TechnicianDetails() {}

    public TechnicianDetails(String technicianName, String technicianId, TechnicianLevel technicianLevel) {
        this.technicianName = technicianName;
        this.technicianId = technicianId;
        this.technicianLevel = technicianLevel;
    }

    // Getters and Setters
    public String getTechnicianName() {
        return technicianName;
    }

    public void setTechnicianName(String technicianName) {
        this.technicianName = technicianName;
    }

    public String getTechnicianId() {
        return technicianId;
    }

    public void setTechnicianId(String technicianId) {
        this.technicianId = technicianId;
    }

    public TechnicianLevel getTechnicianLevel() {
        return technicianLevel;
    }

    public void setTechnicianLevel(TechnicianLevel technicianLevel) {
        this.technicianLevel = technicianLevel;
    }
}
