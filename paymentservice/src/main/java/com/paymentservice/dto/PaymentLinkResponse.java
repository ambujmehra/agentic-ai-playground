package com.paymentservice.dto;

import com.paymentservice.enums.PaymentLinkStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PaymentLinkResponse {
    
    private Long id;
    private String linkId;
    private Long transactionId;
    private String invoiceId;
    private String invoiceNumber;
    private BigDecimal amount;
    private String currency;
    private String customerEmail;
    private PaymentLinkStatus status;
    private LocalDateTime expiryDate;
    private LocalDateTime createdAt;
    private String description;
    
    // Constructors
    public PaymentLinkResponse() {}
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getLinkId() {
        return linkId;
    }
    
    public void setLinkId(String linkId) {
        this.linkId = linkId;
    }
    
    public Long getTransactionId() {
        return transactionId;
    }
    
    public void setTransactionId(Long transactionId) {
        this.transactionId = transactionId;
    }
    
    public String getInvoiceId() {
        return invoiceId;
    }
    
    public void setInvoiceId(String invoiceId) {
        this.invoiceId = invoiceId;
    }
    
    public String getInvoiceNumber() {
        return invoiceNumber;
    }
    
    public void setInvoiceNumber(String invoiceNumber) {
        this.invoiceNumber = invoiceNumber;
    }
    
    public BigDecimal getAmount() {
        return amount;
    }
    
    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }
    
    public String getCurrency() {
        return currency;
    }
    
    public void setCurrency(String currency) {
        this.currency = currency;
    }
    
    public String getCustomerEmail() {
        return customerEmail;
    }
    
    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }
    
    public PaymentLinkStatus getStatus() {
        return status;
    }
    
    public void setStatus(PaymentLinkStatus status) {
        this.status = status;
    }
    
    public LocalDateTime getExpiryDate() {
        return expiryDate;
    }
    
    public void setExpiryDate(LocalDateTime expiryDate) {
        this.expiryDate = expiryDate;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
}
