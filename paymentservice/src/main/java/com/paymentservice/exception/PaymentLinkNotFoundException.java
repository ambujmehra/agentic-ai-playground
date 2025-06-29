package com.paymentservice.exception;

public class PaymentLinkNotFoundException extends RuntimeException {
    public PaymentLinkNotFoundException(String message) {
        super(message);
    }
    
    public PaymentLinkNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
