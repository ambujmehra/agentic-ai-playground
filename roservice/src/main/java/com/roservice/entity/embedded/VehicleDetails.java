package com.roservice.entity.embedded;

import javax.persistence.Embeddable;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

@Embeddable
public class VehicleDetails {
    
    @NotBlank(message = "Vehicle VIN is required")
    private String vehicleVin;
    
    @NotBlank(message = "Vehicle make is required")
    private String vehicleMake;
    
    @NotBlank(message = "Vehicle model is required")
    private String vehicleModel;
    
    @NotNull(message = "Vehicle year is required")
    private Integer vehicleYear;
    
    private Long mileage;

    // Constructors
    public VehicleDetails() {}

    public VehicleDetails(String vehicleVin, String vehicleMake, String vehicleModel, Integer vehicleYear, Long mileage) {
        this.vehicleVin = vehicleVin;
        this.vehicleMake = vehicleMake;
        this.vehicleModel = vehicleModel;
        this.vehicleYear = vehicleYear;
        this.mileage = mileage;
    }

    // Getters and Setters
    public String getVehicleVin() {
        return vehicleVin;
    }

    public void setVehicleVin(String vehicleVin) {
        this.vehicleVin = vehicleVin;
    }

    public String getVehicleMake() {
        return vehicleMake;
    }

    public void setVehicleMake(String vehicleMake) {
        this.vehicleMake = vehicleMake;
    }

    public String getVehicleModel() {
        return vehicleModel;
    }

    public void setVehicleModel(String vehicleModel) {
        this.vehicleModel = vehicleModel;
    }

    public Integer getVehicleYear() {
        return vehicleYear;
    }

    public void setVehicleYear(Integer vehicleYear) {
        this.vehicleYear = vehicleYear;
    }

    public Long getMileage() {
        return mileage;
    }

    public void setMileage(Long mileage) {
        this.mileage = mileage;
    }
}
