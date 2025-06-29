package com.paymentservice.controller;

import com.paymentservice.dto.TransactionCreateRequest;
import com.paymentservice.dto.TransactionResponse;
import com.paymentservice.enums.CardType;
import com.paymentservice.enums.PaymentType;
import com.paymentservice.enums.TransactionStatus;
import com.paymentservice.service.TransactionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import javax.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/v1/transactions")
@Tag(name = "Transaction Management", description = "APIs for managing payment transactions. All endpoints require mandatory headers: X-Tenant-Id, X-Dealer-Id, X-User-Id. Optional header: X-Locale (defaults to en-US)")
public class TransactionController {
    
    @Autowired
    private TransactionService transactionService;
    
    @PostMapping
    @Operation(
        summary = "Create a new transaction", 
        description = "Creates a new payment transaction"
    )
    public ResponseEntity<TransactionResponse> createTransaction(
            @Valid @RequestBody TransactionCreateRequest request) {
        TransactionResponse response = transactionService.createTransaction(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
    
    @GetMapping("/{id}")
    @Operation(
        summary = "Get transaction by ID", 
        description = "Retrieves a transaction by its ID"
    )
    public ResponseEntity<TransactionResponse> getTransactionById(
            @Parameter(description = "Transaction ID") @PathVariable Long id) {
        TransactionResponse response = transactionService.getTransactionById(id);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping
    @Operation(
        summary = "Get all transactions", 
        description = "Retrieves all transactions with pagination"
    )
    public ResponseEntity<Page<TransactionResponse>> getAllTransactions(
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort by field") @RequestParam(defaultValue = "createdAt") String sortBy,
            @Parameter(description = "Sort direction") @RequestParam(defaultValue = "desc") String sortDirection) {
        
        Sort.Direction direction = sortDirection.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        Page<TransactionResponse> response = transactionService.getAllTransactions(pageable);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/customer/{email}")
    @Operation(
        summary = "Get transactions by customer email", 
        description = "Retrieves all transactions for a specific customer"
    )
    public ResponseEntity<List<TransactionResponse>> getTransactionsByCustomerEmail(
            @Parameter(description = "Customer email") @PathVariable String email) {
        List<TransactionResponse> response = transactionService.getTransactionsByCustomerEmail(email);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/card-type/{cardType}")
    @Operation(
        summary = "Get transactions by card type", 
        description = "Retrieves all transactions for a specific card type"
    )
    public ResponseEntity<List<TransactionResponse>> getTransactionsByCardType(
            @Parameter(description = "Card type") @PathVariable CardType cardType) {
        List<TransactionResponse> response = transactionService.getTransactionsByCardType(cardType);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/payment-type/{paymentType}")
    @Operation(
        summary = "Get transactions by payment type", 
        description = "Retrieves all transactions for a specific payment type"
    )
    public ResponseEntity<List<TransactionResponse>> getTransactionsByPaymentType(
            @Parameter(description = "Payment type") @PathVariable PaymentType paymentType) {
        List<TransactionResponse> response = transactionService.getTransactionsByPaymentType(paymentType);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/invoice/{invoiceId}")
    @Operation(
        summary = "Get transactions by invoice ID", 
        description = "Retrieves all transactions for a specific invoice"
    )
    public ResponseEntity<List<TransactionResponse>> getTransactionsByInvoiceId(
            @Parameter(description = "Invoice ID") @PathVariable String invoiceId) {
        List<TransactionResponse> response = transactionService.getTransactionsByInvoiceId(invoiceId);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/invoice-number/{invoiceNumber}")
    @Operation(
        summary = "Get transactions by invoice number", 
        description = "Retrieves all transactions for a specific invoice number"
    )
    public ResponseEntity<List<TransactionResponse>> getTransactionsByInvoiceNumber(
            @Parameter(description = "Invoice number") @PathVariable String invoiceNumber) {
        List<TransactionResponse> response = transactionService.getTransactionsByInvoiceNumber(invoiceNumber);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/status/{status}")
    @Operation(
        summary = "Get transactions by status", 
        description = "Retrieves all transactions with a specific status"
    )
    public ResponseEntity<List<TransactionResponse>> getTransactionsByStatus(
            @Parameter(description = "Transaction status") @PathVariable TransactionStatus status) {
        List<TransactionResponse> response = transactionService.getTransactionsByStatus(status);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/reference/{transactionReference}")
    @Operation(
        summary = "Get transaction by reference", 
        description = "Retrieves a transaction by its reference number"
    )
    public ResponseEntity<TransactionResponse> getTransactionByReference(
            @Parameter(description = "Transaction reference") @PathVariable String transactionReference) {
        TransactionResponse response = transactionService.getTransactionByReference(transactionReference);
        return ResponseEntity.ok(response);
    }
    
    @PutMapping("/{id}/process")
    @Operation(
        summary = "Process transaction", 
        description = "Processes a transaction and changes its status to CAPTURED"
    )
    public ResponseEntity<TransactionResponse> processTransaction(
            @Parameter(description = "Transaction ID") @PathVariable Long id) {
        TransactionResponse response = transactionService.processTransaction(id);
        return ResponseEntity.ok(response);
    }
    
    @PutMapping("/{id}/status")
    @Operation(
        summary = "Update transaction status", 
        description = "Updates the status of a transaction"
    )
    public ResponseEntity<TransactionResponse> updateTransactionStatus(
            @Parameter(description = "Transaction ID") @PathVariable Long id,
            @Parameter(description = "New status") @RequestParam TransactionStatus status) {
        TransactionResponse response = transactionService.updateTransactionStatus(id, status);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/metadata/card-types")
    @Operation(
        summary = "Get all available card types", 
        description = "Retrieves all available card types in the system"
    )
    public ResponseEntity<List<CardType>> getAllCardTypes() {
        List<CardType> cardTypes = transactionService.getAllCardTypes();
        return ResponseEntity.ok(cardTypes);
    }
    
    @GetMapping("/metadata/payment-types")
    @Operation(
        summary = "Get all available payment types", 
        description = "Retrieves all available payment types in the system"
    )
    public ResponseEntity<List<PaymentType>> getAllPaymentTypes() {
        List<PaymentType> paymentTypes = transactionService.getAllPaymentTypes();
        return ResponseEntity.ok(paymentTypes);
    }
    
    @GetMapping("/health")
    @Operation(
        summary = "Health check", 
        description = "Checks the health of the payment service"
    )
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        return ResponseEntity.ok(response);
    }
}
