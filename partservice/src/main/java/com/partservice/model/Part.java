package com.partservice.model;

import javax.persistence.*;
import javax.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "parts")
public class Part {
    
    @Id
    @Column(name = "id", nullable = false)
    private String id;
    
    @NotBlank(message = "Part number is required")
    @Column(name = "part_number", unique = true, nullable = false)
    private String partNumber;
    
    @NotBlank(message = "Name is required")
    @Column(name = "name", nullable = false)
    private String name;
    
    @Column(name = "description", length = 1000)
    private String description;
    
    @NotBlank(message = "Category is required")
    @Column(name = "category", nullable = false)
    private String category;
    
    @NotBlank(message = "Brand is required")
    @Column(name = "brand", nullable = false)
    private String brand;
    
    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    private BigDecimal price;
    
    @Min(value = 0, message = "Quantity in stock cannot be negative")
    @Column(name = "quantity_in_stock", nullable = false)
    private Integer quantityInStock = 0;
    
    @Column(name = "location")
    private String location;
    
    @Column(name = "weight_kg", precision = 10, scale = 3)
    private BigDecimal weightKg;
    
    @Column(name = "dimensions")
    private String dimensions;
    
    @Column(name = "compatible_vehicles", length = 1000)
    private String compatibleVehicles;
    
    @Column(name = "supplier")
    private String supplier;
    
    @Column(name = "supplier_part_number")
    private String supplierPartNumber;
    
    @Column(name = "warranty_months")
    private Integer warrantyMonths;
    
    @Column(name = "is_oem")
    private Boolean isOem = false;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Constructors
    public Part() {
        this.createdAt = LocalDateTime.now();
    }
    
    public Part(String partNumber, String name, String category, String brand, BigDecimal price) {
        this();
        this.partNumber = partNumber;
        this.name = name;
        this.category = category;
        this.brand = brand;
        this.price = price;
    }
    
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getPartNumber() {
        return partNumber;
    }
    
    public void setPartNumber(String partNumber) {
        this.partNumber = partNumber;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getCategory() {
        return category;
    }
    
    public void setCategory(String category) {
        this.category = category;
    }
    
    public String getBrand() {
        return brand;
    }
    
    public void setBrand(String brand) {
        this.brand = brand;
    }
    
    public BigDecimal getPrice() {
        return price;
    }
    
    public void setPrice(BigDecimal price) {
        this.price = price;
    }
    
    public Integer getQuantityInStock() {
        return quantityInStock;
    }
    
    public void setQuantityInStock(Integer quantityInStock) {
        this.quantityInStock = quantityInStock;
    }
    
    public String getLocation() {
        return location;
    }
    
    public void setLocation(String location) {
        this.location = location;
    }
    
    public BigDecimal getWeightKg() {
        return weightKg;
    }
    
    public void setWeightKg(BigDecimal weightKg) {
        this.weightKg = weightKg;
    }
    
    public String getDimensions() {
        return dimensions;
    }
    
    public void setDimensions(String dimensions) {
        this.dimensions = dimensions;
    }
    
    public String getCompatibleVehicles() {
        return compatibleVehicles;
    }
    
    public void setCompatibleVehicles(String compatibleVehicles) {
        this.compatibleVehicles = compatibleVehicles;
    }
    
    public String getSupplier() {
        return supplier;
    }
    
    public void setSupplier(String supplier) {
        this.supplier = supplier;
    }
    
    public String getSupplierPartNumber() {
        return supplierPartNumber;
    }
    
    public void setSupplierPartNumber(String supplierPartNumber) {
        this.supplierPartNumber = supplierPartNumber;
    }
    
    public Integer getWarrantyMonths() {
        return warrantyMonths;
    }
    
    public void setWarrantyMonths(Integer warrantyMonths) {
        this.warrantyMonths = warrantyMonths;
    }
    
    public Boolean getIsOem() {
        return isOem;
    }
    
    public void setIsOem(Boolean isOem) {
        this.isOem = isOem;
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
    
    @Override
    public String toString() {
        return "Part{" +
                "id=" + id +
                ", partNumber='" + partNumber + '\'' +
                ", name='" + name + '\'' +
                ", category='" + category + '\'' +
                ", brand='" + brand + '\'' +
                ", price=" + price +
                ", quantityInStock=" + quantityInStock +
                '}';
    }
}
