package com.roservice.repository;

import com.roservice.entity.RepairOrder;
import com.roservice.enums.ROStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RepairOrderRepository extends JpaRepository<RepairOrder, Long> {
    
    // Find by RO number for dual access pattern
    Optional<RepairOrder> findByRoNumber(String roNumber);
    
    // Find by status
    List<RepairOrder> findByStatus(ROStatus status);
    
    // Find by technician
    @Query("SELECT ro FROM RepairOrder ro WHERE ro.technicianDetails.technicianId = :technicianId")
    List<RepairOrder> findByTechnicianId(@Param("technicianId") String technicianId);
    
    // Find by vehicle VIN
    @Query("SELECT ro FROM RepairOrder ro WHERE ro.vehicleDetails.vehicleVin = :vin")
    List<RepairOrder> findByVehicleVin(@Param("vin") String vin);
    
    // Find by vehicle make and model
    @Query("SELECT ro FROM RepairOrder ro WHERE ro.vehicleDetails.vehicleMake = :make AND ro.vehicleDetails.vehicleModel = :model")
    List<RepairOrder> findByVehicleMakeAndModel(@Param("make") String make, @Param("model") String model);
    
    // Find by job category
    @Query("SELECT ro FROM RepairOrder ro WHERE ro.jobDetails.jobCategory = :category")
    List<RepairOrder> findByJobCategory(@Param("category") String category);
    
    // Find ROs with estimated hours greater than specified value
    @Query("SELECT ro FROM RepairOrder ro WHERE ro.jobDetails.estimatedHours > :hours")
    List<RepairOrder> findByEstimatedHoursGreaterThan(@Param("hours") Double hours);
    
    // Find ROs by vehicle year range
    @Query("SELECT ro FROM RepairOrder ro WHERE ro.vehicleDetails.vehicleYear BETWEEN :startYear AND :endYear")
    List<RepairOrder> findByVehicleYearRange(@Param("startYear") Integer startYear, @Param("endYear") Integer endYear);
    
    // Check if RO number exists
    boolean existsByRoNumber(String roNumber);
    
    // Get count by status
    @Query("SELECT COUNT(ro) FROM RepairOrder ro WHERE ro.status = :status")
    long countByStatus(@Param("status") ROStatus status);
}
