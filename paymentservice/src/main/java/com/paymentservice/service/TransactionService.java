package com.paymentservice.service;

import com.paymentservice.dto.TransactionCreateRequest;
import com.paymentservice.dto.TransactionResponse;
import com.paymentservice.entity.Transaction;
import com.paymentservice.enums.CardType;
import com.paymentservice.enums.PaymentType;
import com.paymentservice.enums.TransactionStatus;
import com.paymentservice.exception.TransactionNotFoundException;
import com.paymentservice.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class TransactionService {
    
    @Autowired
    private TransactionRepository transactionRepository;
    
    public TransactionResponse createTransaction(TransactionCreateRequest request) {
        Transaction transaction = new Transaction(
            request.getInvoiceId(),
            request.getInvoiceNumber(),
            request.getCustomerId(),
            request.getCustomerEmail(),
            request.getAmount(),
            request.getPaymentType(),
            request.getCardType(),
            request.getDescription()
        );
        
        if (request.getCurrency() != null) {
            transaction.setCurrency(request.getCurrency());
        }
        
        if (request.getPaymentMethod() != null) {
            transaction.setPaymentMethod(request.getPaymentMethod());
        }
        
        Transaction savedTransaction = transactionRepository.save(transaction);
        return convertToResponse(savedTransaction);
    }
    
    @Transactional(readOnly = true)
    public TransactionResponse getTransactionById(Long id) {
        Transaction transaction = transactionRepository.findById(id)
            .orElseThrow(() -> new TransactionNotFoundException("Transaction not found with id: " + id));
        return convertToResponse(transaction);
    }
    
    @Transactional(readOnly = true)
    public List<TransactionResponse> getAllTransactions() {
        return transactionRepository.findAll()
            .stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public Page<TransactionResponse> getAllTransactions(Pageable pageable) {
        return transactionRepository.findAll(pageable)
            .map(this::convertToResponse);
    }
    
    @Transactional(readOnly = true)
    public List<TransactionResponse> getTransactionsByCustomerEmail(String customerEmail) {
        return transactionRepository.findByCustomerEmail(customerEmail)
            .stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<TransactionResponse> getTransactionsByCardType(CardType cardType) {
        return transactionRepository.findByCardType(cardType)
            .stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<TransactionResponse> getTransactionsByPaymentType(PaymentType paymentType) {
        return transactionRepository.findByPaymentType(paymentType)
            .stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<TransactionResponse> getTransactionsByInvoiceId(String invoiceId) {
        return transactionRepository.findByInvoiceId(invoiceId)
            .stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<TransactionResponse> getTransactionsByInvoiceNumber(String invoiceNumber) {
        return transactionRepository.findByInvoiceNumber(invoiceNumber)
            .stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<TransactionResponse> getTransactionsByStatus(TransactionStatus status) {
        return transactionRepository.findByStatus(status)
            .stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }
    
    public TransactionResponse processTransaction(Long transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId)
            .orElseThrow(() -> new TransactionNotFoundException("Transaction not found with id: " + transactionId));
        
        if (transaction.getStatus() != TransactionStatus.INITIATED) {
            throw new IllegalArgumentException("Transaction can only be processed if it's in INITIATED status. Current status: " + transaction.getStatus());
        }
        
        transaction.setStatus(TransactionStatus.CAPTURED);
        transaction.setProcessedAt(LocalDateTime.now());
        
        Transaction savedTransaction = transactionRepository.save(transaction);
        return convertToResponse(savedTransaction);
    }
    
    public TransactionResponse updateTransactionStatus(Long transactionId, TransactionStatus status) {
        Transaction transaction = transactionRepository.findById(transactionId)
            .orElseThrow(() -> new TransactionNotFoundException("Transaction not found with id: " + transactionId));
        
        transaction.setStatus(status);
        if (status == TransactionStatus.CAPTURED) {
            transaction.setProcessedAt(LocalDateTime.now());
        }
        
        Transaction savedTransaction = transactionRepository.save(transaction);
        return convertToResponse(savedTransaction);
    }
    
    @Transactional(readOnly = true)
    public TransactionResponse getTransactionByReference(String transactionReference) {
        Transaction transaction = transactionRepository.findByTransactionReference(transactionReference)
            .orElseThrow(() -> new TransactionNotFoundException("Transaction not found with reference: " + transactionReference));
        return convertToResponse(transaction);
    }
    
    public List<CardType> getAllCardTypes() {
        return List.of(CardType.values());
    }
    
    public List<PaymentType> getAllPaymentTypes() {
        return List.of(PaymentType.values());
    }
    
    private TransactionResponse convertToResponse(Transaction transaction) {
        TransactionResponse response = new TransactionResponse();
        response.setId(transaction.getId());
        response.setInvoiceId(transaction.getInvoiceId());
        response.setInvoiceNumber(transaction.getInvoiceNumber());
        response.setCustomerId(transaction.getCustomerId());
        response.setCustomerEmail(transaction.getCustomerEmail());
        response.setAmount(transaction.getAmount());
        response.setCurrency(transaction.getCurrency());
        response.setPaymentType(transaction.getPaymentType());
        response.setCardType(transaction.getCardType());
        response.setStatus(transaction.getStatus());
        response.setPaymentMethod(transaction.getPaymentMethod());
        response.setTransactionReference(transaction.getTransactionReference());
        response.setCreatedAt(transaction.getCreatedAt());
        response.setUpdatedAt(transaction.getUpdatedAt());
        response.setProcessedAt(transaction.getProcessedAt());
        response.setDescription(transaction.getDescription());
        return response;
    }
}
