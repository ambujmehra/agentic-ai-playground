package com.paymentservice.controller;

import com.paymentservice.dto.PaymentLinkCreateRequest;
import com.paymentservice.dto.PaymentLinkResponse;
import com.paymentservice.service.PaymentLinkService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import javax.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/payment-links")
@Tag(name = "Payment Link Management", description = "APIs for managing payment links. All endpoints require mandatory headers: X-Tenant-Id, X-Dealer-Id, X-User-Id. Optional header: X-Locale (defaults to en-US)")
public class PaymentLinkController {
    
    @Autowired
    private PaymentLinkService paymentLinkService;
    
    @PostMapping
    @Operation(
        summary = "Create a payment link", 
        description = "Creates a new payment link and associated transaction"
    )
    public ResponseEntity<PaymentLinkResponse> createPaymentLink(
            @Valid @RequestBody PaymentLinkCreateRequest request) {
        PaymentLinkResponse response = paymentLinkService.createPaymentLink(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
    
    @GetMapping("/{linkId}")
    @Operation(summary = "Get payment link by ID", description = "Retrieves a payment link by its ID")
    public ResponseEntity<PaymentLinkResponse> getPaymentLinkById(
            @Parameter(description = "Payment link ID") @PathVariable String linkId) {
        PaymentLinkResponse response = paymentLinkService.getPaymentLinkById(linkId);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping
    @Operation(
        summary = "Get all payment links", 
        description = "Retrieves all payment links. Requires tenant headers for multitenancy."
    )
    public ResponseEntity<List<PaymentLinkResponse>> getAllPaymentLinks(
            @Parameter(name = "X-Tenant-Id", description = "Tenant ID (required)", required = true) 
            @RequestHeader("X-Tenant-Id") String tenantId,
            @Parameter(name = "X-Dealer-Id", description = "Dealer ID (required)", required = true) 
            @RequestHeader("X-Dealer-Id") String dealerId,
            @Parameter(name = "X-User-Id", description = "User ID (required)", required = true) 
            @RequestHeader("X-User-Id") String userId,
            @Parameter(name = "X-Locale", description = "Locale (optional)", required = false) 
            @RequestHeader(value = "X-Locale", required = false) String locale) {
        List<PaymentLinkResponse> response = paymentLinkService.getAllPaymentLinks();
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/invoice/{invoiceId}")
    @Operation(summary = "Get payment links by invoice ID", description = "Retrieves all payment links for a specific invoice")
    public ResponseEntity<List<PaymentLinkResponse>> getPaymentLinksByInvoiceId(
            @Parameter(description = "Invoice ID") @PathVariable String invoiceId) {
        List<PaymentLinkResponse> response = paymentLinkService.getPaymentLinksByInvoiceId(invoiceId);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/invoice-number/{invoiceNumber}")
    @Operation(summary = "Get payment links by invoice number", description = "Retrieves all payment links for a specific invoice number")
    public ResponseEntity<List<PaymentLinkResponse>> getPaymentLinksByInvoiceNumber(
            @Parameter(description = "Invoice number") @PathVariable String invoiceNumber) {
        List<PaymentLinkResponse> response = paymentLinkService.getPaymentLinksByInvoiceNumber(invoiceNumber);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/customer/{email}")
    @Operation(summary = "Get payment links by customer email", description = "Retrieves all payment links for a specific customer")
    public ResponseEntity<List<PaymentLinkResponse>> getPaymentLinksByCustomerEmail(
            @Parameter(description = "Customer email") @PathVariable String email) {
        List<PaymentLinkResponse> response = paymentLinkService.getPaymentLinksByCustomerEmail(email);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/{linkId}/process")
    @Operation(summary = "Process payment link", description = "Processes a payment link and updates the associated transaction")
    public ResponseEntity<PaymentLinkResponse> processPaymentLink(
            @Parameter(description = "Payment link ID") @PathVariable String linkId) {
        PaymentLinkResponse response = paymentLinkService.processPaymentLink(linkId);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/{linkId}/cancel")
    @Operation(summary = "Cancel payment link", description = "Cancels a payment link and updates the associated transaction")
    public ResponseEntity<PaymentLinkResponse> cancelPaymentLink(
            @Parameter(description = "Payment link ID") @PathVariable String linkId) {
        PaymentLinkResponse response = paymentLinkService.cancelPaymentLink(linkId);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/expire-old")
    @Operation(summary = "Expire old payment links", description = "Manually triggers expiration of old payment links")
    public ResponseEntity<String> expireOldLinks() {
        paymentLinkService.expireOldLinks();
        return ResponseEntity.ok("Old payment links have been expired successfully");
    }
}
