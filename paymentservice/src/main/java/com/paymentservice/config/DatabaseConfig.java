package com.paymentservice.config;

import com.paymentservice.entity.Transaction;
import com.paymentservice.entity.PaymentLink;
import com.paymentservice.enums.CardType;
import com.paymentservice.enums.PaymentType;
import com.paymentservice.enums.TransactionStatus;
import com.paymentservice.enums.PaymentLinkStatus;
import com.paymentservice.repository.TransactionRepository;
import com.paymentservice.repository.PaymentLinkRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
public class DatabaseConfig implements CommandLineRunner {
    
    @Autowired
    private TransactionRepository transactionRepository;
    
    @Autowired
    private PaymentLinkRepository paymentLinkRepository;
    
    @Override
    public void run(String... args) throws Exception {
        // Check if data already exists
        if (transactionRepository.count() == 0) {
            loadDummyData();
        }
    }
    
    private void loadDummyData() {
        // Create dummy transactions
        Transaction transaction1 = new Transaction(
            "INV-001", "INV-2024-001", "CUST-001", "john.doe@example.com",
            new BigDecimal("1500.00"), PaymentType.CREDIT, CardType.VISA,
            "Payment for subscription service"
        );
        transaction1.setStatus(TransactionStatus.CAPTURED);
        transaction1.setProcessedAt(LocalDateTime.now().minusHours(2));
        transaction1.setPaymentMethod("**** **** **** 1234");
        transactionRepository.save(transaction1);
        
        Transaction transaction2 = new Transaction(
            "INV-002", "INV-2024-002", "CUST-002", "jane.smith@example.com",
            new BigDecimal("750.50"), PaymentType.DEBIT, CardType.MASTERCARD,
            "Product purchase"
        );
        transaction2.setPaymentMethod("**** **** **** 5678");
        transactionRepository.save(transaction2);
        
        Transaction transaction3 = new Transaction(
            "INV-003", "INV-2024-003", "CUST-003", "bob.wilson@example.com",
            new BigDecimal("2250.75"), PaymentType.CREDIT, CardType.AMEX,
            "Premium service upgrade"
        );
        transaction3.setStatus(TransactionStatus.FAILED);
        transaction3.setPaymentMethod("**** **** **** 9012");
        transactionRepository.save(transaction3);
        
        Transaction transaction4 = new Transaction(
            "INV-004", "INV-2024-004", "CUST-004", "alice.brown@example.com",
            new BigDecimal("500.00"), PaymentType.DEBIT, CardType.RUPAY,
            "Mobile recharge"
        );
        transaction4.setStatus(TransactionStatus.CAPTURED);
        transaction4.setProcessedAt(LocalDateTime.now().minusMinutes(30));
        transaction4.setPaymentMethod("**** **** **** 3456");
        transactionRepository.save(transaction4);
        
        Transaction transaction5 = new Transaction(
            "INV-005", "INV-2024-005", "CUST-005", "charlie.davis@example.com",
            new BigDecimal("3200.00"), PaymentType.CREDIT, CardType.UPI,
            "Laptop purchase"
        );
        transaction5.setPaymentMethod("charlie@upi");
        transactionRepository.save(transaction5);
        
        Transaction transaction6 = new Transaction(
            "INV-006", "INV-2024-006", "CUST-006", "diana.jones@example.com",
            new BigDecimal("1200.25"), PaymentType.DEBIT, CardType.NETBANKING,
            "Insurance premium"
        );
        transaction6.setStatus(TransactionStatus.CANCELLED);
        transaction6.setPaymentMethod("SBI NetBanking");
        transactionRepository.save(transaction6);
        
        // Create some transactions for payment links
        Transaction linkTransaction1 = new Transaction(
            "INV-007", "INV-2024-007", "SYSTEM_GENERATED", "mike.taylor@example.com",
            new BigDecimal("800.00"), PaymentType.CREDIT, CardType.VISA,
            "Consulting service payment"
        );
        linkTransaction1.setPaymentMethod("Pending");
        Transaction savedLinkTransaction1 = transactionRepository.save(linkTransaction1);
        
        Transaction linkTransaction2 = new Transaction(
            "INV-008", "INV-2024-008", "SYSTEM_GENERATED", "sara.clark@example.com",
            new BigDecimal("1500.00"), PaymentType.DEBIT, CardType.MASTERCARD,
            "Event ticket booking"
        );
        linkTransaction2.setPaymentMethod("Pending");
        Transaction savedLinkTransaction2 = transactionRepository.save(linkTransaction2);
        
        // Create dummy payment links
        PaymentLink paymentLink1 = new PaymentLink(
            savedLinkTransaction1.getId(), "INV-007", "INV-2024-007",
            new BigDecimal("800.00"), "mike.taylor@example.com",
            "Consulting service payment"
        );
        paymentLink1.setExpiryDate(LocalDateTime.now().plusDays(5));
        paymentLinkRepository.save(paymentLink1);
        
        PaymentLink paymentLink2 = new PaymentLink(
            savedLinkTransaction2.getId(), "INV-008", "INV-2024-008",
            new BigDecimal("1500.00"), "sara.clark@example.com",
            "Event ticket booking"
        );
        paymentLink2.setExpiryDate(LocalDateTime.now().plusDays(3));
        paymentLinkRepository.save(paymentLink2);
        
        // Create an expired payment link
        Transaction expiredLinkTransaction = new Transaction(
            "INV-009", "INV-2024-009", "SYSTEM_GENERATED", "expired.user@example.com",
            new BigDecimal("300.00"), PaymentType.CREDIT, CardType.UPI,
            "Expired payment link"
        );
        expiredLinkTransaction.setPaymentMethod("Pending");
        Transaction savedExpiredTransaction = transactionRepository.save(expiredLinkTransaction);
        
        PaymentLink expiredLink = new PaymentLink(
            savedExpiredTransaction.getId(), "INV-009", "INV-2024-009",
            new BigDecimal("300.00"), "expired.user@example.com",
            "Expired payment link"
        );
        expiredLink.setExpiryDate(LocalDateTime.now().minusDays(1));
        expiredLink.setStatus(PaymentLinkStatus.EXPIRED);
        paymentLinkRepository.save(expiredLink);
        
        System.out.println("Dummy data loaded successfully!");
        System.out.println("Created " + transactionRepository.count() + " transactions");
        System.out.println("Created " + paymentLinkRepository.count() + " payment links");
    }
}
