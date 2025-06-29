#!/bin/bash

# Payment Service API Test Script
# This script comprehensively tests all endpoints of the Java Spring Boot Payment MCP Server
# Usage: ./test-api-endpoints.sh [base_url]
# Default base_url: http://localhost:8080

set -e  # Exit on any error

# Configuration
BASE_URL=${1:-"http://localhost:8080"}
API_BASE="$BASE_URL/api/v1"
CONTENT_TYPE="Content-Type: application/json"
ACCEPT="Accept: application/json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Utility functions
print_header() {
    echo -e "\n${BLUE}===== $1 =====${NC}"
}

print_test() {
    echo -e "${YELLOW}Testing: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ PASS: $1${NC}"
    ((TESTS_PASSED++))
}

print_failure() {
    echo -e "${RED}❌ FAIL: $1${NC}"
    echo -e "${RED}   Error: $2${NC}"
    ((TESTS_FAILED++))
}

print_info() {
    echo -e "${BLUE}ℹ️  INFO: $1${NC}"
}

# HTTP request function with error handling
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    ((TOTAL_TESTS++))
    print_test "$description"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X "$method" \
            -H "$CONTENT_TYPE" -H "$ACCEPT" \
            -d "$data" "$API_BASE$endpoint" 2>/dev/null)
    else
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X "$method" \
            -H "$ACCEPT" "$API_BASE$endpoint" 2>/dev/null)
    fi
    
    http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
    response_body=$(echo "$response" | sed '/HTTP_STATUS/d')
    
    echo "Response: $response_body" | head -c 200
    if [ ${#response_body} -gt 200 ]; then echo "..."; fi
    
    # Store response for later use
    LAST_RESPONSE="$response_body"
    LAST_HTTP_STATUS="$http_status"
}

# Validation functions
validate_status() {
    local expected=$1
    local description=$2
    
    if [ "$LAST_HTTP_STATUS" = "$expected" ]; then
        print_success "$description (HTTP $expected)"
        return 0
    else
        print_failure "$description" "Expected HTTP $expected, got HTTP $LAST_HTTP_STATUS"
        return 1
    fi
}

validate_json_field() {
    local field=$1
    local expected_value=$2
    local description=$3
    
    if echo "$LAST_RESPONSE" | grep -q "\"$field\":.*$expected_value"; then
        print_success "$description"
        return 0
    else
        print_failure "$description" "Field '$field' with value '$expected_value' not found"
        return 1
    fi
}

extract_json_field() {
    local field=$1
    echo "$LAST_RESPONSE" | grep -o "\"$field\":\"[^\"]*\"" | cut -d'"' -f4
}

# Health check
check_service_health() {
    print_header "HEALTH CHECK"
    
    make_request "GET" "/transactions?page=0&size=1" "" "Service health check"
    validate_status "200" "Service is responding"
}

# Transaction Tests
test_transactions() {
    print_header "TRANSACTION ENDPOINT TESTS"
    
    # Get all transactions with pagination
    make_request "GET" "/transactions?page=0&size=5" "" "Get transactions with pagination"
    validate_status "200" "Transactions list retrieval"
    
    # Get specific transaction
    make_request "GET" "/transactions/1" "" "Get transaction by ID"
    validate_status "200" "Specific transaction retrieval"
    
    # Get non-existent transaction (should fail)
    make_request "GET" "/transactions/999" "" "Get non-existent transaction"
    validate_status "404" "Non-existent transaction handling"
    
    # Search by customer email
    make_request "GET" "/transactions/customer/john.doe@example.com" "" "Search by customer email"
    validate_status "200" "Customer email search"
    
    # Search by card type
    make_request "GET" "/transactions/card-type/VISA" "" "Search by card type"
    validate_status "200" "Card type search"
    
    # Search by status
    make_request "GET" "/transactions/status/CAPTURED" "" "Search by transaction status"
    validate_status "200" "Transaction status search"
    
    # Search by payment type
    make_request "GET" "/transactions/payment-type/CREDIT" "" "Search by payment type"
    validate_status "200" "Payment type search"
    
    # Update transaction status
    make_request "PUT" "/transactions/2/status?status=CAPTURED" "" "Update transaction status"
    validate_status "200" "Transaction status update"
    
    # Process transaction
    make_request "PUT" "/transactions/3/process" "" "Process transaction"
    validate_status "200" "Transaction processing"
    
    # Create new transaction
    local transaction_data='{
        "invoiceId": "INV-TEST-001",
        "invoiceNumber": "INV-2025-TEST-001",
        "customerId": "CUST-TEST-001",
        "customerEmail": "test@example.com",
        "amount": 1000.00,
        "currency": "INR",
        "paymentType": "CREDIT",
        "cardType": "VISA",
        "description": "Test transaction creation"
    }'
    
    make_request "POST" "/transactions" "$transaction_data" "Create new transaction"
    validate_status "201" "Transaction creation"
    
    # Validation error test
    local invalid_transaction='{
        "amount": -100.00,
        "customerEmail": "invalid-email",
        "description": ""
    }'
    
    make_request "POST" "/transactions" "$invalid_transaction" "Create transaction with validation errors"
    validate_status "400" "Validation error handling"
}

# Payment Link Tests
test_payment_links() {
    print_header "PAYMENT LINK ENDPOINT TESTS"
    
    # Get all payment links
    make_request "GET" "/payment-links" "" "Get all payment links"
    validate_status "200" "Payment links list retrieval"
    
    # Get specific payment link by linkId
    make_request "GET" "/payment-links/LINK_1750228524555" "" "Get payment link by linkId"
    local status_code=$LAST_HTTP_STATUS
    
    if [ "$status_code" = "200" ]; then
        validate_status "200" "Specific payment link retrieval"
    elif [ "$status_code" = "404" ]; then
        print_info "Payment link not found (may have been used/expired)"
        # Try getting the list first to find an active link
        make_request "GET" "/payment-links" "" "Get payment links to find active one"
        ACTIVE_LINK_ID=$(echo "$LAST_RESPONSE" | grep -o '"linkId":"[^"]*"' | head -1 | cut -d'"' -f4)
        if [ -n "$ACTIVE_LINK_ID" ]; then
            make_request "GET" "/payment-links/$ACTIVE_LINK_ID" "" "Get active payment link"
            validate_status "200" "Active payment link retrieval"
        fi
    fi
    
    # Search by customer email
    make_request "GET" "/payment-links/customer/test@example.com" "" "Search payment links by customer"
    validate_status "200" "Payment link customer search"
    
    # Create new payment link
    local payment_link_data='{
        "invoiceId": "INV-LINK-TEST-001",
        "invoiceNumber": "INV-2025-LINK-TEST-001",
        "amount": 2000.00,
        "currency": "INR",
        "customerEmail": "linktest@example.com",
        "description": "Test payment link creation",
        "expiryHours": 72
    }'
    
    make_request "POST" "/payment-links" "$payment_link_data" "Create new payment link"
    validate_status "201" "Payment link creation"
    
    # Extract created link ID for further tests
    NEW_LINK_ID=$(extract_json_field "linkId")
    
    if [ -n "$NEW_LINK_ID" ]; then
        print_info "Created new payment link: $NEW_LINK_ID"
        
        # Test payment link processing
        make_request "POST" "/payment-links/$NEW_LINK_ID/process" "" "Process payment link"
        if validate_status "200" "Payment link processing"; then
            validate_json_field "status" "USED" "Payment link status updated to USED"
        fi
    fi
    
    # Validation error test
    local invalid_link='{
        "amount": 2000.00,
        "currency": "INR",
        "customerEmail": "invalid-email"
    }'
    
    make_request "POST" "/payment-links" "$invalid_link" "Create payment link with validation errors"
    validate_status "400" "Payment link validation error handling"
}

# Advanced Feature Tests
test_advanced_features() {
    print_header "ADVANCED FEATURE TESTS"
    
    # Pagination with different page sizes
    make_request "GET" "/transactions?page=0&size=3" "" "Pagination - first page with 3 items"
    validate_status "200" "Small page size pagination"
    
    make_request "GET" "/transactions?page=1&size=3" "" "Pagination - second page"
    validate_status "200" "Second page pagination"
    
    # Sorting tests
    make_request "GET" "/transactions?sortBy=amount&sortDirection=desc" "" "Sort by amount descending"
    validate_status "200" "Amount-based sorting"
    
    make_request "GET" "/transactions?sortBy=createdAt&sortDirection=asc" "" "Sort by creation date ascending"
    validate_status "200" "Date-based sorting"
    
    # Expire old payment links
    make_request "POST" "/payment-links/expire-old" "" "Expire old payment links"
    validate_status "200" "Bulk payment link expiration"
}

# Error Handling Tests
test_error_handling() {
    print_header "ERROR HANDLING TESTS"
    
    # Non-existent endpoints
    make_request "GET" "/nonexistent" "" "Non-existent endpoint"
    validate_status "404" "404 handling for invalid endpoints"
    
    # Invalid payment link processing
    make_request "POST" "/payment-links/INVALID_LINK_ID/process" "" "Process invalid payment link"
    validate_status "404" "Invalid payment link processing"
    
    # Invalid transaction update
    make_request "PUT" "/transactions/999/status?status=CAPTURED" "" "Update non-existent transaction"
    validate_status "404" "Non-existent transaction update"
}

# Data Integrity Tests
test_data_integrity() {
    print_header "DATA INTEGRITY TESTS"
    
    # Create payment link and verify transaction creation
    local integrity_test_data='{
        "invoiceId": "INV-INTEGRITY-001",
        "invoiceNumber": "INV-2025-INTEGRITY-001",
        "amount": 1500.00,
        "currency": "INR",
        "customerEmail": "integrity@example.com",
        "description": "Data integrity test",
        "expiryHours": 48
    }'
    
    make_request "POST" "/payment-links" "$integrity_test_data" "Create payment link for integrity test"
    if validate_status "201" "Payment link creation for integrity test"; then
        INTEGRITY_LINK_ID=$(extract_json_field "linkId")
        INTEGRITY_TRANSACTION_ID=$(extract_json_field "transactionId")
        
        print_info "Created link: $INTEGRITY_LINK_ID, transaction: $INTEGRITY_TRANSACTION_ID"
        
        # Verify transaction exists
        if [ -n "$INTEGRITY_TRANSACTION_ID" ]; then
            make_request "GET" "/transactions/$INTEGRITY_TRANSACTION_ID" "" "Verify linked transaction exists"
            validate_status "200" "Linked transaction verification"
            
            # Process payment link and verify transaction update
            make_request "POST" "/payment-links/$INTEGRITY_LINK_ID/process" "" "Process payment link for integrity"
            if validate_status "200" "Payment link processing for integrity"; then
                # Check transaction status was updated
                make_request "GET" "/transactions/$INTEGRITY_TRANSACTION_ID" "" "Verify transaction status updated"
                if validate_status "200" "Transaction status verification"; then
                    validate_json_field "status" "CAPTURED" "Transaction status updated to CAPTURED"
                fi
            fi
        fi
    fi
}

# Performance Tests
test_performance() {
    print_header "BASIC PERFORMANCE TESTS"
    
    print_info "Testing response times for key endpoints..."
    
    # Test transaction listing performance
    local start_time=$(date +%s%N)
    make_request "GET" "/transactions?page=0&size=20" "" "Performance test - transaction listing"
    local end_time=$(date +%s%N)
    local duration=$(((end_time - start_time) / 1000000)) # Convert to milliseconds
    
    if validate_status "200" "Transaction listing performance"; then
        print_info "Response time: ${duration}ms"
        if [ $duration -lt 1000 ]; then
            print_success "Response time under 1 second"
        else
            print_info "Response time: ${duration}ms (consider optimization)"
        fi
    fi
}

# API Documentation Tests
test_documentation() {
    print_header "API DOCUMENTATION TESTS"
    
    # Test Swagger UI accessibility
    make_request "GET" "" "" "Swagger UI endpoint test"
    local swagger_status=$LAST_HTTP_STATUS
    
    # For Spring Boot, try common Swagger endpoints
    curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/swagger-ui.html" > /tmp/swagger_status
    local swagger_ui_status=$(cat /tmp/swagger_status)
    
    if [ "$swagger_ui_status" = "200" ]; then
        print_success "Swagger UI accessible at /swagger-ui.html"
    else
        print_info "Swagger UI might not be accessible (status: $swagger_ui_status)"
    fi
    
    # Test H2 Console if available
    curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/h2-console" > /tmp/h2_status
    local h2_status=$(cat /tmp/h2_status)
    
    if [ "$h2_status" = "200" ] || [ "$h2_status" = "302" ]; then
        print_success "H2 Console accessible at /h2-console"
    else
        print_info "H2 Console might not be accessible (status: $h2_status)"
    fi
}

# Generate test report
generate_report() {
    print_header "TEST EXECUTION SUMMARY"
    
    echo -e "${BLUE}Total Tests Run: $TOTAL_TESTS${NC}"
    echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
    
    local success_rate=$((TESTS_PASSED * 100 / TOTAL_TESTS))
    echo -e "${BLUE}Success Rate: $success_rate%${NC}"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "\n${GREEN}🎉 ALL TESTS PASSED! The Payment Service is fully functional.${NC}"
        exit 0
    else
        echo -e "\n${YELLOW}⚠️  Some tests failed. Please review the output above.${NC}"
        exit 1
    fi
}

# Main execution
main() {
    echo -e "${BLUE}
╔══════════════════════════════════════════════════════════════════╗
║                    Payment Service API Test Suite                ║
║                                                                  ║
║  Testing Java Spring Boot Payment MCP Server                     ║
║  Base URL: $BASE_URL                            ║
╚══════════════════════════════════════════════════════════════════╝
${NC}"
    
    # Check if service is running
    if ! curl -s -f "$BASE_URL/api/v1/transactions?page=0&size=1" > /dev/null 2>&1; then
        echo -e "${RED}❌ Payment service is not running or not accessible at $BASE_URL${NC}"
        echo -e "${YELLOW}Please start the service with: java -jar target/payments-service-1.0.0.jar${NC}"
        exit 1
    fi
    
    # Run test suites
    check_service_health
    test_transactions
    test_payment_links
    test_advanced_features
    test_error_handling
    test_data_integrity
    test_performance
    test_documentation
    
    # Generate final report
    generate_report
}

# Script entry point
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Payment Service API Test Suite"
    echo ""
    echo "Usage: $0 [base_url]"
    echo ""
    echo "Arguments:"
    echo "  base_url    Base URL of the payment service (default: http://localhost:8080)"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Test local service"
    echo "  $0 http://localhost:8080              # Test specific local port"
    echo "  $0 https://api.example.com            # Test remote service"
    echo ""
    echo "This script tests all REST API endpoints of the Payment MCP Server:"
    echo "  - Transaction CRUD operations"
    echo "  - Payment Link management"
    echo "  - Search and filtering"
    echo "  - Pagination and sorting"
    echo "  - Error handling"
    echo "  - Data integrity"
    echo "  - Performance basics"
    echo "  - API documentation accessibility"
    exit 0
fi

# Run the main function
main "$@"
