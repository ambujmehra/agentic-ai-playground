package com.paymentservice.service;

import com.paymentservice.dto.PaymentLinkCreateRequest;
import com.paymentservice.dto.PaymentLinkResponse;
import com.paymentservice.entity.PaymentLink;
import com.paymentservice.entity.Transaction;
import com.paymentservice.enums.CardType;
import com.paymentservice.enums.PaymentLinkStatus;
import com.paymentservice.enums.PaymentType;
import com.paymentservice.enums.TransactionStatus;
import com.paymentservice.exception.PaymentLinkNotFoundException;
import com.paymentservice.exception.TransactionNotFoundException;
import com.paymentservice.repository.PaymentLinkRepository;
import com.paymentservice.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class PaymentLinkService {
    
    @Autowired
    private PaymentLinkRepository paymentLinkRepository;
    
    @Autowired
    private TransactionRepository transactionRepository;
    
    @Autowired
    private TransactionService transactionService;
    
    public PaymentLinkResponse createPaymentLink(PaymentLinkCreateRequest request) {
        // First create a transaction in INITIATED state
        Transaction transaction = new Transaction(
            request.getInvoiceId(),
            request.getInvoiceNumber(),
            "SYSTEM_GENERATED", // Customer ID for payment link transactions
            request.getCustomerEmail(),
            request.getAmount(),
            PaymentType.CREDIT, // Default payment type for payment links
            CardType.VISA, // Default card type for payment links (will be updated when processed)
            request.getDescription()
        );
        
        if (request.getCurrency() != null) {
            transaction.setCurrency(request.getCurrency());
        }
        
        transaction.setPaymentMethod("Pending"); // Mark as pending until payment is made
        
        Transaction savedTransaction = transactionRepository.save(transaction);
        
        // Create payment link
        PaymentLink paymentLink = new PaymentLink(
            savedTransaction.getId(),
            request.getInvoiceId(),
            request.getInvoiceNumber(),
            request.getAmount(),
            request.getCustomerEmail(),
            request.getDescription()
        );
        
        if (request.getCurrency() != null) {
            paymentLink.setCurrency(request.getCurrency());
        }
        
        if (request.getExpiryDate() != null) {
            paymentLink.setExpiryDate(request.getExpiryDate());
        }
        
        PaymentLink savedPaymentLink = paymentLinkRepository.save(paymentLink);
        return convertToResponse(savedPaymentLink);
    }
    
    @Transactional(readOnly = true)
    public PaymentLinkResponse getPaymentLinkById(String linkId) {
        PaymentLink paymentLink = paymentLinkRepository.findByLinkId(linkId)
            .orElseThrow(() -> new PaymentLinkNotFoundException("Payment link not found with id: " + linkId));
        return convertToResponse(paymentLink);
    }
    
    @Transactional(readOnly = true)
    public List<PaymentLinkResponse> getPaymentLinksByInvoiceId(String invoiceId) {
        return paymentLinkRepository.findByInvoiceId(invoiceId)
            .stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<PaymentLinkResponse> getPaymentLinksByInvoiceNumber(String invoiceNumber) {
        return paymentLinkRepository.findByInvoiceNumber(invoiceNumber)
            .stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<PaymentLinkResponse> getPaymentLinksByCustomerEmail(String customerEmail) {
        return paymentLinkRepository.findByCustomerEmail(customerEmail)
            .stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<PaymentLinkResponse> getAllPaymentLinks() {
        return paymentLinkRepository.findAll()
            .stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }
    
    public PaymentLinkResponse processPaymentLink(String linkId) {
        PaymentLink paymentLink = paymentLinkRepository.findByLinkId(linkId)
            .orElseThrow(() -> new PaymentLinkNotFoundException("Payment link not found with id: " + linkId));
        
        // Check if link is valid
        if (paymentLink.getStatus() != PaymentLinkStatus.ACTIVE) {
            throw new IllegalArgumentException("Payment link is not active. Current status: " + paymentLink.getStatus());
        }
        
        if (paymentLink.getExpiryDate().isBefore(LocalDateTime.now())) {
            paymentLink.setStatus(PaymentLinkStatus.EXPIRED);
            paymentLinkRepository.save(paymentLink);
            throw new IllegalArgumentException("Payment link has expired");
        }
        
        // Update payment link status
        paymentLink.setStatus(PaymentLinkStatus.USED);
        PaymentLink savedPaymentLink = paymentLinkRepository.save(paymentLink);
        
        // Update corresponding transaction status
        transactionService.updateTransactionStatus(paymentLink.getTransactionId(), TransactionStatus.CAPTURED);
        
        return convertToResponse(savedPaymentLink);
    }
    
    public PaymentLinkResponse cancelPaymentLink(String linkId) {
        PaymentLink paymentLink = paymentLinkRepository.findByLinkId(linkId)
            .orElseThrow(() -> new PaymentLinkNotFoundException("Payment link not found with id: " + linkId));
        
        if (paymentLink.getStatus() == PaymentLinkStatus.USED) {
            throw new IllegalArgumentException("Cannot cancel a payment link that has already been used");
        }
        
        paymentLink.setStatus(PaymentLinkStatus.CANCELLED);
        PaymentLink savedPaymentLink = paymentLinkRepository.save(paymentLink);
        
        // Update corresponding transaction status
        transactionService.updateTransactionStatus(paymentLink.getTransactionId(), TransactionStatus.CANCELLED);
        
        return convertToResponse(savedPaymentLink);
    }
    
    @Transactional
    public void expireOldLinks() {
        List<PaymentLink> expiredLinks = paymentLinkRepository.findExpiredLinks(
            LocalDateTime.now(), PaymentLinkStatus.ACTIVE
        );
        
        for (PaymentLink link : expiredLinks) {
            link.setStatus(PaymentLinkStatus.EXPIRED);
            paymentLinkRepository.save(link);
            
            // Update corresponding transaction status
            transactionService.updateTransactionStatus(link.getTransactionId(), TransactionStatus.FAILED);
        }
    }
    
    private PaymentLinkResponse convertToResponse(PaymentLink paymentLink) {
        PaymentLinkResponse response = new PaymentLinkResponse();
        response.setId(paymentLink.getId());
        response.setLinkId(paymentLink.getLinkId());
        response.setTransactionId(paymentLink.getTransactionId());
        response.setInvoiceId(paymentLink.getInvoiceId());
        response.setInvoiceNumber(paymentLink.getInvoiceNumber());
        response.setAmount(paymentLink.getAmount());
        response.setCurrency(paymentLink.getCurrency());
        response.setCustomerEmail(paymentLink.getCustomerEmail());
        response.setStatus(paymentLink.getStatus());
        response.setExpiryDate(paymentLink.getExpiryDate());
        response.setCreatedAt(paymentLink.getCreatedAt());
        response.setDescription(paymentLink.getDescription());
        return response;
    }
}
