package com.roservice.entity.embedded;

import javax.persistence.Embeddable;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;
import java.math.BigDecimal;

@Embeddable
public class JobDetails {
    
    @NotBlank(message = "Job description is required")
    private String jobDescription;
    
    @Positive(message = "Estimated hours must be positive")
    private Double estimatedHours;
    
    @NotNull(message = "Labor rate is required")
    @Positive(message = "Labor rate must be positive")
    private BigDecimal laborRate;
    
    private String jobCategory;

    // Constructors
    public JobDetails() {}

    public JobDetails(String jobDescription, Double estimatedHours, BigDecimal laborRate, String jobCategory) {
        this.jobDescription = jobDescription;
        this.estimatedHours = estimatedHours;
        this.laborRate = laborRate;
        this.jobCategory = jobCategory;
    }

    // Getters and Setters
    public String getJobDescription() {
        return jobDescription;
    }

    public void setJobDescription(String jobDescription) {
        this.jobDescription = jobDescription;
    }

    public Double getEstimatedHours() {
        return estimatedHours;
    }

    public void setEstimatedHours(Double estimatedHours) {
        this.estimatedHours = estimatedHours;
    }

    public BigDecimal getLaborRate() {
        return laborRate;
    }

    public void setLaborRate(BigDecimal laborRate) {
        this.laborRate = laborRate;
    }

    public String getJobCategory() {
        return jobCategory;
    }

    public void setJobCategory(String jobCategory) {
        this.jobCategory = jobCategory;
    }
}
