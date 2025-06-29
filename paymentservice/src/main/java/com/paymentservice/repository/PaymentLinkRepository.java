package com.paymentservice.repository;

import com.paymentservice.entity.PaymentLink;
import com.paymentservice.enums.PaymentLinkStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentLinkRepository extends JpaRepository<PaymentLink, Long> {
    
    Optional<PaymentLink> findByLinkId(String linkId);
    
    List<PaymentLink> findByInvoiceId(String invoiceId);
    
    List<PaymentLink> findByInvoiceNumber(String invoiceNumber);
    
    List<PaymentLink> findByCustomerEmail(String customerEmail);
    
    List<PaymentLink> findByStatus(PaymentLinkStatus status);
    
    List<PaymentLink> findByTransactionId(Long transactionId);
    
    @Query("SELECT p FROM PaymentLink p WHERE p.expiryDate < :currentTime AND p.status = :status")
    List<PaymentLink> findExpiredLinks(@Param("currentTime") LocalDateTime currentTime, 
                                      @Param("status") PaymentLinkStatus status);
    
    @Query("SELECT p FROM PaymentLink p WHERE p.customerEmail = :email AND p.status = :status")
    List<PaymentLink> findByCustomerEmailAndStatus(@Param("email") String email, 
                                                   @Param("status") PaymentLinkStatus status);
}
