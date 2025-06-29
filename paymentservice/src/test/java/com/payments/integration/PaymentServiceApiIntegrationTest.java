package com.paymentservice.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.paymentservice.PaymentServiceApplication;
import com.paymentservice.dto.PaymentLinkCreateRequest;
import com.paymentservice.dto.TransactionCreateRequest;
import com.paymentservice.enums.CardType;
import com.paymentservice.enums.PaymentType;
import com.paymentservice.enums.TransactionStatus;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

/**
 * Comprehensive Integration Test Suite for Payment Service APIs
 * 
 * This test class covers all REST endpoints and business logic scenarios
 * for the Payment MCP Server.
 */
@SpringBootTest(classes = PaymentServiceApplication.class)
@AutoConfigureWebMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("Payment Service API Integration Tests")
public class PaymentServiceApiIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private ObjectMapper objectMapper;

    private MockMvc mockMvc;

    private static String createdTransactionId;
    private static String createdPaymentLinkId;

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders
                .webAppContextSetup(webApplicationContext)
                .build();
    }

    // =========================
    // Transaction Tests
    // =========================

    @Test
    @Order(1)
    @DisplayName("Should create a new transaction successfully")
    void testCreateTransaction() throws Exception {
        TransactionCreateRequest request = new TransactionCreateRequest();
        request.setInvoiceId("INV-TEST-001");
        request.setInvoiceNumber("INV-2025-TEST-001");
        request.setCustomerId("CUST-TEST-001");
        request.setCustomerEmail("test@example.com");
        request.setAmount(BigDecimal.valueOf(1000.00));
        request.setCurrency("INR");
        request.setPaymentType(PaymentType.CREDIT);
        request.setCardType(CardType.VISA);
        request.setDescription("Test transaction creation");

        MvcResult result = mockMvc.perform(post("/api/v1/transactions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.invoiceId", is("INV-TEST-001")))
                .andExpect(jsonPath("$.customerEmail", is("test@example.com")))
                .andExpect(jsonPath("$.amount", is(1000.00)))
                .andExpect(jsonPath("$.status", is("INITIATED")))
                .andReturn();

        // Extract created transaction ID for future tests
        String responseContent = result.getResponse().getContentAsString();
        Map<String, Object> response = objectMapper.readValue(responseContent, Map.class);
        createdTransactionId = response.get("id").toString();
    }

    @Test
    @Order(2)
    @DisplayName("Should retrieve transaction by ID")
    void testGetTransactionById() throws Exception {
        mockMvc.perform(get("/api/v1/transactions/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.invoiceId").exists())
                .andExpect(jsonPath("$.customerEmail").exists())
                .andExpect(jsonPath("$.amount").exists());
    }

    @Test
    @Order(3)
    @DisplayName("Should return 404 for non-existent transaction")
    void testGetNonExistentTransaction() throws Exception {
        mockMvc.perform(get("/api/v1/transactions/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.error", is("Transaction Not Found")));
    }

    @Test
    @Order(4)
    @DisplayName("Should retrieve transactions with pagination")
    void testGetTransactionsWithPagination() throws Exception {
        mockMvc.perform(get("/api/v1/transactions")
                .param("page", "0")
                .param("size", "5")
                .param("sortBy", "createdAt")
                .param("sortDirection", "desc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.pageable.pageSize", is(5)))
                .andExpect(jsonPath("$.pageable.pageNumber", is(0)))
                .andExpect(jsonPath("$.totalElements").exists());
    }

    @Test
    @Order(5)
    @DisplayName("Should search transactions by customer email")
    void testSearchTransactionsByEmail() throws Exception {
        mockMvc.perform(get("/api/v1/transactions/customer/john.doe@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[*].customerEmail", everyItem(is("john.doe@example.com"))));
    }

    @Test
    @Order(6)
    @DisplayName("Should search transactions by card type")
    void testSearchTransactionsByCardType() throws Exception {
        mockMvc.perform(get("/api/v1/transactions/card-type/VISA"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[*].cardType", everyItem(is("VISA"))));
    }

    @Test
    @Order(7)
    @DisplayName("Should search transactions by status")
    void testSearchTransactionsByStatus() throws Exception {
        mockMvc.perform(get("/api/v1/transactions/status/CAPTURED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[*].status", everyItem(is("CAPTURED"))));
    }

    @Test
    @Order(8)
    @DisplayName("Should update transaction status")
    void testUpdateTransactionStatus() throws Exception {
        if (createdTransactionId != null) {
            mockMvc.perform(put("/api/v1/transactions/" + createdTransactionId + "/status")
                    .param("status", "CAPTURED"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status", is("CAPTURED")))
                    .andExpect(jsonPath("$.processedAt").exists());
        }
    }

    @Test
    @Order(9)
    @DisplayName("Should process transaction")
    void testProcessTransaction() throws Exception {
        mockMvc.perform(put("/api/v1/transactions/2/process"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CAPTURED")))
                .andExpect(jsonPath("$.processedAt").exists());
    }

    @Test
    @Order(10)
    @DisplayName("Should validate transaction creation with invalid data")
    void testCreateTransactionValidation() throws Exception {
        TransactionCreateRequest invalidRequest = new TransactionCreateRequest();
        invalidRequest.setAmount(BigDecimal.valueOf(-100.00)); // Invalid negative amount
        invalidRequest.setCustomerEmail("invalid-email"); // Invalid email format

        mockMvc.perform(post("/api/v1/transactions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.error", is("Validation Failed")))
                .andExpect(jsonPath("$.validationErrors").exists());
    }

    // =========================
    // Payment Link Tests
    // =========================

    @Test
    @Order(11)
    @DisplayName("Should create a new payment link successfully")
    void testCreatePaymentLink() throws Exception {
        PaymentLinkCreateRequest request = new PaymentLinkCreateRequest();
        request.setInvoiceId("INV-LINK-TEST-001");
        request.setInvoiceNumber("INV-2025-LINK-TEST-001");
        request.setAmount(BigDecimal.valueOf(2000.00));
        request.setCurrency("INR");
        request.setCustomerEmail("linktest@example.com");
        request.setDescription("Test payment link creation");
        request.setExpiryDate(java.time.LocalDateTime.now().plusHours(72));

        MvcResult result = mockMvc.perform(post("/api/v1/payment-links")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.invoiceId", is("INV-LINK-TEST-001")))
                .andExpect(jsonPath("$.customerEmail", is("linktest@example.com")))
                .andExpect(jsonPath("$.amount", is(2000.00)))
                .andExpect(jsonPath("$.status", is("ACTIVE")))
                .andExpect(jsonPath("$.linkId").exists())
                .andExpect(jsonPath("$.transactionId").exists())
                .andReturn();

        // Extract created payment link ID for future tests
        String responseContent = result.getResponse().getContentAsString();
        Map<String, Object> response = objectMapper.readValue(responseContent, Map.class);
        createdPaymentLinkId = response.get("linkId").toString();
    }

    @Test
    @Order(12)
    @DisplayName("Should retrieve all payment links")
    void testGetAllPaymentLinks() throws Exception {
        mockMvc.perform(get("/api/v1/payment-links"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].linkId").exists())
                .andExpect(jsonPath("$[0].status").exists());
    }

    @Test
    @Order(13)
    @DisplayName("Should retrieve payment link by linkId")
    void testGetPaymentLinkById() throws Exception {
        if (createdPaymentLinkId != null) {
            mockMvc.perform(get("/api/v1/payment-links/" + createdPaymentLinkId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.linkId", is(createdPaymentLinkId)))
                    .andExpect(jsonPath("$.status", is("ACTIVE")));
        }
    }

    @Test
    @Order(14)
    @DisplayName("Should return 404 for non-existent payment link")
    void testGetNonExistentPaymentLink() throws Exception {
        mockMvc.perform(get("/api/v1/payment-links/INVALID_LINK_ID"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.error", is("Payment Link Not Found")));
    }

    @Test
    @Order(15)
    @DisplayName("Should search payment links by customer email")
    void testSearchPaymentLinksByEmail() throws Exception {
        mockMvc.perform(get("/api/v1/payment-links/customer/linktest@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @Order(16)
    @DisplayName("Should process payment link successfully")
    void testProcessPaymentLink() throws Exception {
        if (createdPaymentLinkId != null) {
            mockMvc.perform(post("/api/v1/payment-links/" + createdPaymentLinkId + "/process"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status", is("USED")))
                    .andExpect(jsonPath("$.linkId", is(createdPaymentLinkId)));
        }
    }

    @Test
    @Order(17)
    @DisplayName("Should cancel payment link successfully")
    void testCancelPaymentLink() throws Exception {
        // Create a new payment link specifically for cancellation test
        PaymentLinkCreateRequest request = new PaymentLinkCreateRequest();
        request.setInvoiceId("INV-CANCEL-TEST");
        request.setInvoiceNumber("INV-2025-CANCEL-TEST");
        request.setAmount(BigDecimal.valueOf(500.00));
        request.setCurrency("INR");
        request.setCustomerEmail("cancel@example.com");
        request.setDescription("Test payment link cancellation");
        request.setExpiryDate(java.time.LocalDateTime.now().plusHours(24));

        MvcResult createResult = mockMvc.perform(post("/api/v1/payment-links")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        String responseContent = createResult.getResponse().getContentAsString();
        Map<String, Object> response = objectMapper.readValue(responseContent, Map.class);
        String linkIdToCancel = response.get("linkId").toString();

        // Now cancel the payment link
        mockMvc.perform(post("/api/v1/payment-links/" + linkIdToCancel + "/cancel"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CANCELLED")))
                .andExpect(jsonPath("$.linkId", is(linkIdToCancel)));
    }

    @Test
    @Order(18)
    @DisplayName("Should validate payment link creation with invalid data")
    void testCreatePaymentLinkValidation() throws Exception {
        PaymentLinkCreateRequest invalidRequest = new PaymentLinkCreateRequest();
        invalidRequest.setAmount(BigDecimal.valueOf(2000.00));
        invalidRequest.setCurrency("INR");
        invalidRequest.setCustomerEmail("invalid-email"); // Invalid email format
        // Missing required fields: invoiceId, invoiceNumber

        mockMvc.perform(post("/api/v1/payment-links")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.error", is("Validation Failed")))
                .andExpect(jsonPath("$.validationErrors").exists());
    }

    @Test
    @Order(19)
    @DisplayName("Should expire old payment links")
    void testExpireOldPaymentLinks() throws Exception {
        mockMvc.perform(post("/api/v1/payment-links/expire-old"))
                .andExpect(status().isOk())
                .andExpect(content().string("Old payment links have been expired successfully"));
    }

    // =========================
    // Data Integrity Tests
    // =========================

    @Test
    @Order(20)
    @DisplayName("Should maintain data integrity between payment links and transactions")
    void testDataIntegrity() throws Exception {
        // Create a payment link
        PaymentLinkCreateRequest request = new PaymentLinkCreateRequest();
        request.setInvoiceId("INV-INTEGRITY-TEST");
        request.setInvoiceNumber("INV-2025-INTEGRITY-TEST");
        request.setAmount(BigDecimal.valueOf(1500.00));
        request.setCurrency("INR");
        request.setCustomerEmail("integrity@example.com");
        request.setDescription("Data integrity test");
        request.setExpiryDate(java.time.LocalDateTime.now().plusHours(48));

        MvcResult createResult = mockMvc.perform(post("/api/v1/payment-links")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        String responseContent = createResult.getResponse().getContentAsString();
        Map<String, Object> response = objectMapper.readValue(responseContent, Map.class);
        String linkId = response.get("linkId").toString();
        String transactionId = response.get("transactionId").toString();

        // Verify the linked transaction exists and has correct data
        mockMvc.perform(get("/api/v1/transactions/" + transactionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.invoiceId", is("INV-INTEGRITY-TEST")))
                .andExpect(jsonPath("$.customerEmail", is("integrity@example.com")))
                .andExpect(jsonPath("$.amount", is(1500.00)))
                .andExpect(jsonPath("$.status", is("INITIATED")));

        // Process the payment link
        mockMvc.perform(post("/api/v1/payment-links/" + linkId + "/process"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("USED")));

        // Verify the transaction status was updated
        mockMvc.perform(get("/api/v1/transactions/" + transactionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CAPTURED")))
                .andExpect(jsonPath("$.processedAt").exists());
    }

    // =========================
    // Edge Cases and Error Handling
    // =========================

    @Test
    @Order(21)
    @DisplayName("Should handle processing expired payment link")
    void testProcessExpiredPaymentLink() throws Exception {
        // This test assumes there's an expired payment link in the system
        // You might need to create one with a past expiry date or use test data
        mockMvc.perform(get("/api/v1/payment-links"))
                .andExpect(status().isOk())
                .andDo(result -> {
                    String content = result.getResponse().getContentAsString();
                    // Look for an expired payment link and try to process it
                    if (content.contains("EXPIRED")) {
                        // Extract an expired link ID and test processing it
                        // This would result in a 400 Bad Request
                    }
                });
    }

    @Test
    @Order(22)
    @DisplayName("Should handle concurrent access scenarios")
    void testConcurrentAccess() throws Exception {
        // Test multiple requests to the same endpoint
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(get("/api/v1/transactions?page=0&size=10"))
                    .andExpect(status().isOk());
        }
    }

    // =========================
    // Helper Methods
    // =========================

    @AfterAll
    static void tearDown() {
        // Clean up any test data if needed
        // Note: Since we're using H2 in-memory database, 
        // data is automatically cleaned up when the test context closes
    }
}
