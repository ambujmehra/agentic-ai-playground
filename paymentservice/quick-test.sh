#!/bin/bash

# Quick API Test Script
# A lightweight version for quick testing

BASE_URL=${1:-"http://localhost:8080"}
API_BASE="$BASE_URL/api/v1"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🚀 Quick Payment Service API Test${NC}"
echo "Testing: $BASE_URL"
echo

# Test 1: Health Check
echo -n "1. Health Check: "
if curl -s -f "$API_BASE/transactions?page=0&size=1" > /dev/null; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL - Service not accessible${NC}"
    exit 1
fi

# Test 2: Get Transactions
echo -n "2. Get Transactions: "
response=$(curl -s -w "%{http_code}" -X GET "$API_BASE/transactions" -H "Accept: application/json" -o /tmp/test_response)
if [ "$response" = "200" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL (HTTP $response)${NC}"
fi

# Test 3: Get Payment Links
echo -n "3. Get Payment Links: "
response=$(curl -s -w "%{http_code}" -X GET "$API_BASE/payment-links" -H "Accept: application/json" -o /tmp/test_response)
if [ "$response" = "200" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL (HTTP $response)${NC}"
fi

# Test 4: Create Transaction
echo -n "4. Create Transaction: "
transaction_data='{
    "invoiceId": "INV-QUICK-TEST",
    "invoiceNumber": "INV-2025-QUICK-TEST",
    "customerId": "CUST-QUICK-TEST",
    "customerEmail": "quicktest@example.com",
    "amount": 100.00,
    "currency": "INR",
    "paymentType": "CREDIT",
    "cardType": "VISA",
    "description": "Quick test transaction"
}'

response=$(curl -s -w "%{http_code}" -X POST "$API_BASE/transactions" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -d "$transaction_data" -o /tmp/test_response)

if [ "$response" = "201" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL (HTTP $response)${NC}"
fi

# Test 5: Create Payment Link
echo -n "5. Create Payment Link: "
payment_link_data='{
    "invoiceId": "INV-QUICK-LINK-TEST",
    "invoiceNumber": "INV-2025-QUICK-LINK-TEST",
    "amount": 200.00,
    "currency": "INR",
    "customerEmail": "quicklinktest@example.com",
    "description": "Quick test payment link",
    "expiryHours": 24
}'

response=$(curl -s -w "%{http_code}" -X POST "$API_BASE/payment-links" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -d "$payment_link_data" -o /tmp/test_response)

if [ "$response" = "201" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL (HTTP $response)${NC}"
fi

# Test 6: Error Handling
echo -n "6. Error Handling (404): "
response=$(curl -s -w "%{http_code}" -X GET "$API_BASE/transactions/999" -H "Accept: application/json" -o /tmp/test_response)
if [ "$response" = "404" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL (Expected 404, got $response)${NC}"
fi

echo
echo -e "${YELLOW}🎉 Quick test completed!${NC}"
echo "For comprehensive testing, run: ./test-api-endpoints.sh"
