package com.roservice.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ROPart {
    private String partId;
    private String partNumber;
    private Integer quantity;
    private BigDecimal unitPrice;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime addedAt;

    // Constructors
    public ROPart() {
        this.addedAt = LocalDateTime.now();
    }

    public ROPart(String partId, String partNumber, Integer quantity, BigDecimal unitPrice) {
        this.partId = partId;
        this.partNumber = partNumber;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.addedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getPartId() {
        return partId;
    }

    public void setPartId(String partId) {
        this.partId = partId;
    }

    public String getPartNumber() {
        return partNumber;
    }

    public void setPartNumber(String partNumber) {
        this.partNumber = partNumber;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public LocalDateTime getAddedAt() {
        return addedAt;
    }

    public void setAddedAt(LocalDateTime addedAt) {
        this.addedAt = addedAt;
    }

    @Override
    public String toString() {
        return "ROPart{" +
                "partId='" + partId + '\'' +
                ", partNumber='" + partNumber + '\'' +
                ", quantity=" + quantity +
                ", unitPrice=" + unitPrice +
                ", addedAt=" + addedAt +
                '}';
    }
}
