package com.paymentservice.entity;

import com.paymentservice.enums.PaymentLinkStatus;
import javax.persistence.*;
import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_links")
public class PaymentLink {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "link_id", unique = true, nullable = false)
    private String linkId;
    
    @Column(name = "transaction_id", nullable = false)
    @NotNull(message = "Transaction ID is required")
    private Long transactionId;
    
    @Column(name = "invoice_id", nullable = false)
    @NotBlank(message = "Invoice ID is required")
    private String invoiceId;
    
    @Column(name = "invoice_number", nullable = false)
    @NotBlank(message = "Invoice number is required")
    private String invoiceNumber;
    
    @Column(name = "amount", nullable = false, precision = 19, scale = 2)
    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    private BigDecimal amount;
    
    @Column(name = "currency", nullable = false)
    private String currency = "INR";
    
    @Column(name = "customer_email", nullable = false)
    @Email(message = "Valid email is required")
    @NotBlank(message = "Customer email is required")
    private String customerEmail;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private PaymentLinkStatus status = PaymentLinkStatus.ACTIVE;
    
    @Column(name = "expiry_date", nullable = false)
    private LocalDateTime expiryDate;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "description", length = 500)
    private String description;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (linkId == null) {
            linkId = "LINK_" + System.currentTimeMillis();
        }
        if (expiryDate == null) {
            expiryDate = LocalDateTime.now().plusDays(7); // Default 7 days expiry
        }
    }
    
    // Constructors
    public PaymentLink() {}
    
    public PaymentLink(Long transactionId, String invoiceId, String invoiceNumber, BigDecimal amount, 
                      String customerEmail, String description) {
        this.transactionId = transactionId;
        this.invoiceId = invoiceId;
        this.invoiceNumber = invoiceNumber;
        this.amount = amount;
        this.customerEmail = customerEmail;
        this.description = description;
    }
    
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
