package com.paymentservice.repository;

import com.paymentservice.entity.Transaction;
import com.paymentservice.enums.CardType;
import com.paymentservice.enums.PaymentType;
import com.paymentservice.enums.TransactionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    
    List<Transaction> findByCustomerEmail(String customerEmail);
    
    List<Transaction> findByCardType(CardType cardType);
    
    List<Transaction> findByPaymentType(PaymentType paymentType);
    
    List<Transaction> findByInvoiceId(String invoiceId);
    
    List<Transaction> findByInvoiceNumber(String invoiceNumber);
    
    List<Transaction> findByStatus(TransactionStatus status);
    
    Optional<Transaction> findByTransactionReference(String transactionReference);
    
    Page<Transaction> findByCustomerEmailContaining(String customerEmail, Pageable pageable);
    
    Page<Transaction> findByStatusAndCardType(TransactionStatus status, CardType cardType, Pageable pageable);
    
    @Query("SELECT t FROM Transaction t WHERE t.customerEmail = :email AND t.status = :status")
    List<Transaction> findByCustomerEmailAndStatus(@Param("email") String email, @Param("status") TransactionStatus status);
    
    @Query("SELECT t FROM Transaction t WHERE t.amount >= :minAmount AND t.amount <= :maxAmount")
    List<Transaction> findByAmountRange(@Param("minAmount") java.math.BigDecimal minAmount, 
                                       @Param("maxAmount") java.math.BigDecimal maxAmount);
}
