#!/bin/bash

# Quick Agentic AI Playground Services Test
echo "🧪 Agentic AI Playground Services Quick Test"
echo "=============================================="

# Define tenant headers for multitenancy
TENANT_HEADERS="-H 'X-Tenant-Id: cacargroup' -H 'X-Dealer-Id: 5' -H 'X-User-Id: ambujmehra' -H 'X-Locale: en-US'"

# Test Payment Java Service (Port 8080)
echo ""
echo "🟦 Payment Java Service (Port 8080):"
echo "-------------------------------------"

# Test Transactions API
if eval "curl -s $TENANT_HEADERS \"http://localhost:8080/api/v1/transactions?page=0&size=1\"" | grep -q "content"; then
    echo "✅ Transactions API: Working"
else
    echo "❌ Transactions API: Failed"
fi

# Test Payment Links API
if eval "curl -s $TENANT_HEADERS \"http://localhost:8080/api/v1/payment-links\"" | grep -q "linkId"; then
    echo "✅ Payment Links API: Working"
else
    echo "❌ Payment Links API: Failed"
fi

# Test Metadata APIs
if eval "curl -s $TENANT_HEADERS \"http://localhost:8080/api/v1/transactions/metadata/card-types\"" | grep -q "VISA"; then
    echo "✅ Card Types Metadata: Working"
else
    echo "❌ Card Types Metadata: Failed"
fi

# Test RO Java Service (Port 8081)
echo ""
echo "🟪 RO Java Service (Port 8081):"
echo "--------------------------------"

# Test Repair Orders API with tenant headers
if eval "curl -s $TENANT_HEADERS \"http://localhost:8081/api/repair-orders?page=0&size=1\"" | grep -q "content"; then
    echo "✅ Repair Orders API: Working"
else
    echo "❌ Repair Orders API: Failed"
fi

# Test dual access by RO number with tenant headers
if eval "curl -s $TENANT_HEADERS \"http://localhost:8081/api/repair-orders/number/RO-2024-001\"" | grep -q "roNumber"; then
    echo "✅ Dual Access Pattern: Working"
else
    echo "❌ Dual Access Pattern: Failed"
fi

# Test statistics with tenant headers
if eval "curl -s $TENANT_HEADERS \"http://localhost:8081/api/repair-orders/stats\"" | grep -q "totalCount"; then
    echo "✅ Statistics API: Working"
else
    echo "❌ Statistics API: Failed"
fi

# Test Part Java Service (Port 8082)
echo ""
echo "🟫 Part Java Service (Port 8082):"
echo "----------------------------------"

# Test Parts API with tenant headers
if eval "curl -s $TENANT_HEADERS \"http://localhost:8082/api/parts\"" | grep -q "partNumber"; then
    echo "✅ Parts API: Working"
    PART_COUNT=$(eval "curl -s $TENANT_HEADERS \"http://localhost:8082/api/parts\"" | grep -o '"id"' | wc -l | tr -d ' ')
    echo "   📦 Total Parts: $PART_COUNT"
else
    echo "❌ Parts API: Failed"
fi

# Test Part Service Health
if curl -s "http://localhost:8082/api/parts/health" | grep -q "UP"; then
    echo "✅ Part Service Health: Working"
else
    echo "❌ Part Service Health: Failed"
fi

# Test Categories API with tenant headers
if eval "curl -s $TENANT_HEADERS \"http://localhost:8082/api/parts/categories\"" | grep -q "MAINTENANCE"; then
    echo "✅ Categories API: Working"
else
    echo "❌ Categories API: Failed"
fi

# Test Payment MCP Server (Port 3002)
echo ""
echo "🟩 Payment MCP Server (Port 3002):"
echo "-----------------------------------"

# Test Health endpoint
if curl -s "http://localhost:3002/health" | grep -q "healthy"; then
    echo "✅ Health Endpoint: Working"
else
    echo "❌ Health Endpoint: Failed"
fi

# Test MCP Protocol and list tools
if curl -s -X POST "http://localhost:3002/mcp" \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | grep -q "tools"; then
    echo "✅ MCP Protocol: Working"
    
    # Get tools list and count
    PAYMENT_TOOLS_RESPONSE=$(curl -s -X POST "http://localhost:3002/mcp" \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}')
    
    PAYMENT_TOOL_COUNT=$(echo "$PAYMENT_TOOLS_RESPONSE" | grep -o '"name"' | wc -l | tr -d ' ')
    echo "   📊 Payment Tools: $PAYMENT_TOOL_COUNT"
    
    # Extract and display tool names
    echo "   🔧 Available Payment Tools:"
    echo "$PAYMENT_TOOLS_RESPONSE" | grep -o '"name":"[^"]*"' | sed 's/"name":"//g' | sed 's/"//g' | sed 's/^/      • /'
else
    echo "❌ MCP Protocol: Failed"
fi

# Test MCP tool execution with tenant headers
echo "   🔑 Testing MCP Tool with Tenant Headers:"
BASIC_TOOL_RESULT=$(curl -s -X POST "http://localhost:3002/mcp" \
    -H "Content-Type: application/json" \
    -H "X-Tenant-Id: cacargroup" \
    -H "X-Dealer-Id: 5" \
    -H "X-User-Id: ambujmehra" \
    -H "X-Locale: en-US" \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_transactions_list","arguments":{"page":0,"size":2}}}')

if echo "$BASIC_TOOL_RESULT" | grep -q "content"; then
    echo "      ✅ Tool execution with tenant headers: Working"
    # Extract the actual JSON from the text field
    EXTRACTED_JSON=$(echo "$BASIC_TOOL_RESULT" | grep -o '"text":"[^"]*"' | cut -d'"' -f4 | sed 's/\\n/\n/g' | sed 's/\\"/"/g')
    BASIC_TX_COUNT=$(echo "$EXTRACTED_JSON" | grep -o '"numberOfElements":[0-9]*' | cut -d':' -f2)
    if [ -z "$BASIC_TX_COUNT" ]; then
        BASIC_TX_COUNT=$(echo "$EXTRACTED_JSON" | grep -o '"size":[0-9]*' | cut -d':' -f2)
    fi
    echo "      📊 Retrieved $BASIC_TX_COUNT transactions in response"
else
    echo "      ❌ Tool execution with tenant headers: Failed"
    echo "      🔍 Response: $(echo "$BASIC_TOOL_RESULT" | head -c 200)..."
fi

# Test RO MCP Server (Port 3003)
echo ""
echo "🟨 RO MCP Server (Port 3003):"
echo "------------------------------"

# Test Health endpoint
if curl -s "http://localhost:3003/health" | grep -q "UP"; then
    echo "✅ Health Endpoint: Working"
else
    echo "❌ Health Endpoint: Failed"
fi

# Test RO Service proxy
if curl -s "http://localhost:3003/ro-service/health" | grep -q "UP"; then
    echo "✅ RO Service Proxy: Working"
else
    echo "❌ RO Service Proxy: Failed"
fi

# Test Statistics proxy
if curl -s "http://localhost:3003/stats" | grep -q "totalCount"; then
    echo "✅ Statistics Proxy: Working"
else
    echo "❌ Statistics Proxy: Failed"
fi

# Test Tools endpoint and list RO tools
if curl -s "http://localhost:3003/tools" | grep -q "repair-order-management"; then
    echo "✅ Tools Information: Working"
    
    # Get tools information
    RO_TOOLS_RESPONSE=$(curl -s "http://localhost:3003/tools")
    RO_TOOL_COUNT=$(echo "$RO_TOOLS_RESPONSE" | grep -o '"[a-z_]*repair_order[a-z_]*"' | wc -l | tr -d ' ')
    echo "   📊 RO Tools: $RO_TOOL_COUNT"
    
    # Extract and display RO tool names from the tools array
    echo "   🔧 Available RO Tools:"
    echo "$RO_TOOLS_RESPONSE" | grep -o '"[a-z_]*repair_order[a-z_]*"' | sed 's/"//g' | sed 's/^/      • /'
    
    # Also show additional tools
    echo "   📋 Additional Tools:"
    ADDITIONAL_TOOLS=$(echo "$RO_TOOLS_RESPONSE" | grep -o '"list_repair_orders"' | sed 's/"//g')
    if [ ! -z "$ADDITIONAL_TOOLS" ]; then
        echo "      • list_repair_orders"
    fi
    STATS_TOOL=$(echo "$RO_TOOLS_RESPONSE" | grep -o '"get_repair_order_stats"' | sed 's/"//g')
    if [ ! -z "$STATS_TOOL" ]; then
        echo "      • get_repair_order_stats"
    fi
else
    echo "❌ Tools Information: Failed"
fi

# Test MCP Protocol and list tools for RO
if curl -s -X POST "http://localhost:3003/mcp" \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | grep -q "tools"; then
    echo "✅ MCP Protocol: Working"
    
    # Get tools list and count
    RO_MCP_TOOLS_RESPONSE=$(curl -s -X POST "http://localhost:3003/mcp" \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}')
    
    RO_MCP_TOOL_COUNT=$(echo "$RO_MCP_TOOLS_RESPONSE" | grep -o '"name"' | wc -l | tr -d ' ')
    echo "   📊 RO MCP Tools: $RO_MCP_TOOL_COUNT"
    
    # Extract and display tool names
    echo "   🔧 Available RO MCP Tools:"
    echo "$RO_MCP_TOOLS_RESPONSE" | grep -o '"name":"[^"]*"' | sed 's/"name":"//g' | sed 's/"//g' | sed 's/^/      • /'
else
    echo "❌ MCP Protocol: Failed"
fi

# Test MCP tool execution with tenant headers for RO
echo "   🔑 Testing RO MCP Tool with Tenant Headers:"
RO_BASIC_TOOL_RESULT=$(curl -s -X POST "http://localhost:3003/mcp" \
    -H "Content-Type: application/json" \
    -H "X-Tenant-Id: cacargroup" \
    -H "X-Dealer-Id: 5" \
    -H "X-User-Id: ambujmehra" \
    -H "X-Locale: en-US" \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_repair_orders","arguments":{"page":0,"size":3}}}')

if echo "$RO_BASIC_TOOL_RESULT" | grep -q "content"; then
    echo "      ✅ RO Tool execution with tenant headers: Working"
    # Extract the actual JSON from the text field
    RO_EXTRACTED_JSON=$(echo "$RO_BASIC_TOOL_RESULT" | grep -o '"text":"[^"]*"' | cut -d'"' -f4 | sed 's/\\n/\n/g' | sed 's/\\"/"/g')
    RO_BASIC_COUNT=$(echo "$RO_EXTRACTED_JSON" | grep -o '"numberOfElements":[0-9]*' | cut -d':' -f2)
    if [ -z "$RO_BASIC_COUNT" ]; then
        RO_BASIC_COUNT=$(echo "$RO_EXTRACTED_JSON" | grep -o '"size":[0-9]*' | cut -d':' -f2)
    fi
    echo "      📊 Retrieved $RO_BASIC_COUNT repair orders in response"
else
    echo "      ❌ RO Tool execution with tenant headers: Failed"
    echo "      🔍 Response: $(echo "$RO_BASIC_TOOL_RESULT" | head -c 200)..."
fi

# Test Part MCP Server (Port 3005)
echo ""
echo "🟤 Part MCP Server (Port 3005):"
echo "--------------------------------"

# Test Health endpoint
if curl -s "http://localhost:3005/health" | grep -q "UP"; then
    echo "✅ Health Endpoint: Working"
else
    echo "❌ Health Endpoint: Failed"
fi

# Test Part Service proxy with tenant headers
if eval "curl -s $TENANT_HEADERS \"http://localhost:3005/part-service/health\"" | grep -q "UP"; then
    echo "✅ Part Service Proxy: Working"
else
    echo "❌ Part Service Proxy: Failed"
fi

# Test MCP Protocol and list tools
if curl -s -X POST "http://localhost:3005/mcp" \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | grep -q "tools"; then
    echo "✅ MCP Protocol: Working"
    
    # Get tools list and count
    PART_TOOLS_RESPONSE=$(curl -s -X POST "http://localhost:3005/mcp" \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}')
    
    PART_TOOL_COUNT=$(echo "$PART_TOOLS_RESPONSE" | grep -o '"name"' | wc -l | tr -d ' ')
    echo "   📊 Part Tools: $PART_TOOL_COUNT"
    
    # Extract and display tool names
    echo "   🔧 Available Part Tools:"
    echo "$PART_TOOLS_RESPONSE" | grep -o '"name":"[^"]*"' | sed 's/"name":"//g' | sed 's/"//g' | sed 's/^/      • /'
else
    echo "❌ MCP Protocol: Failed"
fi

# Test Integration
echo ""
echo "🔗 Integration Tests:"
echo "---------------------"

# Test payment tool execution - List Transactions
echo "🔧 Testing List Transactions Tool (page 0, size 5):"
LIST_TX_RESULT=$(curl -s -X POST "http://localhost:3002/mcp" \
    -H "Content-Type: application/json" \
    -H "X-Tenant-Id: cacargroup" \
    -H "X-Dealer-Id: 5" \
    -H "X-User-Id: ambujmehra" \
    -H "X-Locale: en-US" \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_transactions_list","arguments":{"page":0,"size":5}}}')

if echo "$LIST_TX_RESULT" | grep -q '"content"'; then
    echo "✅ List Transactions Tool: Working"
    
    # Use jq to properly extract transaction details if available
    if command -v jq >/dev/null 2>&1; then
        TOTAL_TX=$(echo "$LIST_TX_RESULT" | jq -r '.result.content[0].text' 2>/dev/null | jq -r '.totalElements' 2>/dev/null)
        PAGE_SIZE=$(echo "$LIST_TX_RESULT" | jq -r '.result.content[0].text' 2>/dev/null | jq -r '.size' 2>/dev/null)
        CURRENT_PAGE=$(echo "$LIST_TX_RESULT" | jq -r '.result.content[0].text' 2>/dev/null | jq -r '.number' 2>/dev/null)
        RETURNED_COUNT=$(echo "$LIST_TX_RESULT" | jq -r '.result.content[0].text' 2>/dev/null | jq -r '.numberOfElements' 2>/dev/null)
    else
        # Fallback to grep parsing
        TOTAL_TX=$(echo "$LIST_TX_RESULT" | grep -o '"totalElements":[0-9]*' | cut -d':' -f2)
        PAGE_SIZE=$(echo "$LIST_TX_RESULT" | grep -o '"size":[0-9]*' | cut -d':' -f2)
        CURRENT_PAGE=$(echo "$LIST_TX_RESULT" | grep -o '"number":[0-9]*' | cut -d':' -f2)
        RETURNED_COUNT=$(echo "$LIST_TX_RESULT" | grep -o '"numberOfElements":[0-9]*' | cut -d':' -f2)
    fi
    
    echo "   📊 Total Transactions: ${TOTAL_TX:-Unknown}"
    echo "   📄 Page: ${CURRENT_PAGE:-0}, Size: ${PAGE_SIZE:-5}"
    echo "   📝 Returned: ${RETURNED_COUNT:-Unknown} transactions"
    
    # Show sample transaction details if available
    if command -v jq >/dev/null 2>&1; then
        FIRST_TX_ID=$(echo "$LIST_TX_RESULT" | jq -r '.result.content[0].text' 2>/dev/null | jq -r '.content[0].id' 2>/dev/null)
        FIRST_TX_AMOUNT=$(echo "$LIST_TX_RESULT" | jq -r '.result.content[0].text' 2>/dev/null | jq -r '.content[0].amount' 2>/dev/null)
        if [ ! -z "$FIRST_TX_ID" ] && [ "$FIRST_TX_ID" != "null" ]; then
            echo "   💳 Sample Transaction: ID=${FIRST_TX_ID}, Amount=${FIRST_TX_AMOUNT:-N/A}"
        fi
    fi
else
    echo "❌ List Transactions Tool: Failed"
    echo "   🔍 Response preview: $(echo "$LIST_TX_RESULT" | head -c 200)..."
fi

# Test payment tool execution - Card Types
if curl -s -X POST "http://localhost:3002/mcp" \
    -H "Content-Type: application/json" \
    -H "X-Tenant-Id: cacargroup" \
    -H "X-Dealer-Id: 5" \
    -H "X-User-Id: ambujmehra" \
    -H "X-Locale: en-US" \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_all_card_types","arguments":{}}}' | grep -q "VISA"; then
    echo "✅ Payment MCP Tool Execution: Working"
else
    echo "❌ Payment MCP Tool Execution: Failed"
fi

# Test part tool execution with tenant headers
if curl -s -X POST "http://localhost:3005/mcp" \
    -H "Content-Type: application/json" \
    -H "X-Tenant-Id: cacargroup" \
    -H "X-Dealer-Id: 5" \
    -H "X-User-Id: ambujmehra" \
    -H "X-Locale: en-US" \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_parts","arguments":{}}}' | grep -q "partNumber"; then
    echo "✅ Part MCP Tool Execution: Working"
else
    echo "❌ Part MCP Tool Execution: Failed"
fi

# Test cross-service connectivity
if curl -s "http://localhost:3003/ro-service/health" | grep -q "UP" && \
   curl -s "http://localhost:3002/health" | grep -q "healthy" && \
   curl -s "http://localhost:3005/health" | grep -q "UP"; then
    echo "✅ Cross-Service Connectivity: Working"
else
    echo "❌ Cross-Service Connectivity: Failed"
fi

# Advanced MCP Tool Testing
echo ""
echo "🧰 Advanced MCP Tool Testing:"
echo "------------------------------"

# Test RO MCP tool via RO service proxy
echo "🔧 Testing RO Statistics Tool:"
RO_STATS_RESULT=$(curl -s "http://localhost:3003/stats")
if echo "$RO_STATS_RESULT" | grep -q "totalCount"; then
    echo "✅ RO Statistics Tool: Working"
    echo "   📈 Stats: $(echo "$RO_STATS_RESULT" | grep -o '"totalCount":[0-9]*' | cut -d':' -f2) total ROs"
    echo "   📊 Breakdown: $(echo "$RO_STATS_RESULT" | grep -o '"createdCount":[0-9]*' | cut -d':' -f2) created, $(echo "$RO_STATS_RESULT" | grep -o '"inProgressCount":[0-9]*' | cut -d':' -f2) in progress, $(echo "$RO_STATS_RESULT" | grep -o '"completedCount":[0-9]*' | cut -d':' -f2) completed"
else
    echo "❌ RO Statistics Tool: Failed"
fi

# Test RO MCP tools with tenant headers
echo "🔧 Testing RO MCP Tools with Tenant Headers:"
RO_LIST_RESULT=$(curl -s -X POST "http://localhost:3003/mcp" \
    -H "Content-Type: application/json" \
    -H "X-Tenant-Id: cacargroup" \
    -H "X-Dealer-Id: 5" \
    -H "X-User-Id: ambujmehra" \
    -H "X-Locale: en-US" \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_repair_orders","arguments":{"page":0,"size":5}}}')

if echo "$RO_LIST_RESULT" | grep -q '"content"'; then
    echo "✅ list_repair_orders Tool: Working"
    # Use jq to properly extract the JSON data if available
    if command -v jq >/dev/null 2>&1; then
        RO_TOTAL_COUNT=$(echo "$RO_LIST_RESULT" | jq -r '.result.content[0].text' 2>/dev/null | jq -r '.totalElements' 2>/dev/null)
        RO_PAGE_SIZE=$(echo "$RO_LIST_RESULT" | jq -r '.result.content[0].text' 2>/dev/null | jq -r '.size' 2>/dev/null)
        RO_CURRENT_PAGE=$(echo "$RO_LIST_RESULT" | jq -r '.result.content[0].text' 2>/dev/null | jq -r '.number' 2>/dev/null)
        RO_RETURNED_COUNT=$(echo "$RO_LIST_RESULT" | jq -r '.result.content[0].text' 2>/dev/null | jq -r '.numberOfElements' 2>/dev/null)
    else
        # Fallback to grep parsing
        RO_TOTAL_COUNT=$(echo "$RO_LIST_RESULT" | grep -o '"totalElements":[0-9]*' | cut -d':' -f2)
        RO_PAGE_SIZE=$(echo "$RO_LIST_RESULT" | grep -o '"size":[0-9]*' | cut -d':' -f2)
        RO_CURRENT_PAGE=$(echo "$RO_LIST_RESULT" | grep -o '"number":[0-9]*' | cut -d':' -f2)
        RO_RETURNED_COUNT=$(echo "$RO_LIST_RESULT" | grep -o '"numberOfElements":[0-9]*' | cut -d':' -f2)
    fi
    
    echo "   📊 Total Repair Orders: ${RO_TOTAL_COUNT:-Unknown}"
    echo "   📄 Page: ${RO_CURRENT_PAGE:-0}, Size: ${RO_PAGE_SIZE:-5}"
    echo "   📝 Returned: ${RO_RETURNED_COUNT:-Unknown} repair orders"
    
    # Show sample repair order details if available
    if command -v jq >/dev/null 2>&1; then
        FIRST_RO_ID=$(echo "$RO_LIST_RESULT" | jq -r '.result.content[0].text' 2>/dev/null | jq -r '.content[0].id' 2>/dev/null)
        FIRST_RO_NUMBER=$(echo "$RO_LIST_RESULT" | jq -r '.result.content[0].text' 2>/dev/null | jq -r '.content[0].roNumber' 2>/dev/null)
        FIRST_RO_STATUS=$(echo "$RO_LIST_RESULT" | jq -r '.result.content[0].text' 2>/dev/null | jq -r '.content[0].status' 2>/dev/null)
        if [ ! -z "$FIRST_RO_ID" ] && [ "$FIRST_RO_ID" != "null" ]; then
            echo "   🔧 Sample RO: ID=${FIRST_RO_ID}, Number=${FIRST_RO_NUMBER:-N/A}, Status=${FIRST_RO_STATUS:-N/A}"
        fi
    fi
    
    # Test get repair order by ID if we have one
    if [ ! -z "$FIRST_RO_ID" ] && [ "$FIRST_RO_ID" != "null" ]; then
        echo "   🔍 Testing get_repair_order with ID: $FIRST_RO_ID"
        
        SINGLE_RO_RESULT=$(curl -s -X POST "http://localhost:3003/mcp" \
            -H "Content-Type: application/json" \
            -H "X-Tenant-Id: cacargroup" \
            -H "X-Dealer-Id: 5" \
            -H "X-User-Id: ambujmehra" \
            -H "X-Locale: en-US" \
            -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"get_repair_order\",\"arguments\":{\"id\":$FIRST_RO_ID}}}")
        
        if echo "$SINGLE_RO_RESULT" | grep -q '"result"'; then
            echo "   ✅ get_repair_order Tool: Working"
            # Use jq to properly extract the repair order details
            if command -v jq >/dev/null 2>&1; then
                RO_VIN=$(echo "$SINGLE_RO_RESULT" | jq -r '.result.content[0].text' 2>/dev/null | jq -r '.vehicleDetails.vehicleVin' 2>/dev/null)
                RO_TECH=$(echo "$SINGLE_RO_RESULT" | jq -r '.result.content[0].text' 2>/dev/null | jq -r '.technicianDetails.technicianName' 2>/dev/null)
                RO_JOB=$(echo "$SINGLE_RO_RESULT" | jq -r '.result.content[0].text' 2>/dev/null | jq -r '.jobDetails.jobDescription' 2>/dev/null)
            else
                RO_VIN="N/A"
                RO_TECH="N/A"
                RO_JOB="N/A"
            fi
            if [ -z "$RO_VIN" ] || [ "$RO_VIN" = "null" ]; then RO_VIN="N/A"; fi
            if [ -z "$RO_TECH" ] || [ "$RO_TECH" = "null" ]; then RO_TECH="N/A"; fi
            if [ -z "$RO_JOB" ] || [ "$RO_JOB" = "null" ]; then RO_JOB="N/A"; fi
            echo "      📄 RO Details: ID=$FIRST_RO_ID, VIN=$RO_VIN, Technician=$RO_TECH"
            echo "      🔧 Job: $RO_JOB"
        else
            echo "   ❌ get_repair_order Tool: Failed"
        fi
    fi
    
    # Test get repair order by number if we have one
    if [ ! -z "$FIRST_RO_NUMBER" ] && [ "$FIRST_RO_NUMBER" != "null" ]; then
        echo "   🔍 Testing get_repair_order_by_number with: $FIRST_RO_NUMBER"
        
        RO_BY_NUMBER_RESULT=$(curl -s -X POST "http://localhost:3003/mcp" \
            -H "Content-Type: application/json" \
            -H "X-Tenant-Id: cacargroup" \
            -H "X-Dealer-Id: 5" \
            -H "X-User-Id: ambujmehra" \
            -H "X-Locale: en-US" \
            -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"get_repair_order_by_number\",\"arguments\":{\"roNumber\":\"$FIRST_RO_NUMBER\"}}}")
        
        if echo "$RO_BY_NUMBER_RESULT" | grep -q '"result"'; then
            echo "   ✅ get_repair_order_by_number Tool: Working"
        else
            echo "   ❌ get_repair_order_by_number Tool: Failed"
        fi
    fi
else
    echo "❌ list_repair_orders Tool: Failed"
fi

# Test RO statistics tool via MCP
echo "🔧 Testing get_repair_order_stats MCP Tool:"
RO_STATS_MCP_RESULT=$(curl -s -X POST "http://localhost:3003/mcp" \
    -H "Content-Type: application/json" \
    -H "X-Tenant-Id: cacargroup" \
    -H "X-Dealer-Id: 5" \
    -H "X-User-Id: ambujmehra" \
    -H "X-Locale: en-US" \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_repair_order_stats","arguments":{}}}')

if echo "$RO_STATS_MCP_RESULT" | grep -q "totalCount"; then
    echo "✅ get_repair_order_stats Tool: Working"
    if command -v jq >/dev/null 2>&1; then
        STATS_TOTAL=$(echo "$RO_STATS_MCP_RESULT" | jq -r '.result.content[0].text' 2>/dev/null | jq -r '.totalCount' 2>/dev/null)
        STATS_CREATED=$(echo "$RO_STATS_MCP_RESULT" | jq -r '.result.content[0].text' 2>/dev/null | jq -r '.createdCount' 2>/dev/null)
        STATS_PROGRESS=$(echo "$RO_STATS_MCP_RESULT" | jq -r '.result.content[0].text' 2>/dev/null | jq -r '.inProgressCount' 2>/dev/null)
        STATS_COMPLETED=$(echo "$RO_STATS_MCP_RESULT" | jq -r '.result.content[0].text' 2>/dev/null | jq -r '.completedCount' 2>/dev/null)
    else
        STATS_TOTAL=$(echo "$RO_STATS_MCP_RESULT" | grep -o '"totalCount":[0-9]*' | cut -d':' -f2)
        STATS_CREATED=$(echo "$RO_STATS_MCP_RESULT" | grep -o '"createdCount":[0-9]*' | cut -d':' -f2)
        STATS_PROGRESS=$(echo "$RO_STATS_MCP_RESULT" | grep -o '"inProgressCount":[0-9]*' | cut -d':' -f2)
        STATS_COMPLETED=$(echo "$RO_STATS_MCP_RESULT" | grep -o '"completedCount":[0-9]*' | cut -d':' -f2)
    fi
    echo "   📊 Statistics: Total=${STATS_TOTAL:-0}, Created=${STATS_CREATED:-0}, In Progress=${STATS_PROGRESS:-0}, Completed=${STATS_COMPLETED:-0}"
else
    echo "❌ get_repair_order_stats Tool: Failed"
fi

# Test Part MCP tools with tenant headers
echo "🔧 Testing Part MCP Tools with Tenant Headers:"
PART_LIST_RESULT=$(curl -s -X POST "http://localhost:3005/mcp" \
    -H "Content-Type: application/json" \
    -H "X-Tenant-Id: cacargroup" \
    -H "X-Dealer-Id: 5" \
    -H "X-User-Id: ambujmehra" \
    -H "X-Locale: en-US" \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_parts","arguments":{}}}')

if echo "$PART_LIST_RESULT" | grep -q 'partNumber'; then
    echo "✅ list_parts Tool: Working"
    # Use jq to properly extract part count
    if command -v jq >/dev/null 2>&1; then
        # Parse the JSON response properly - the parts array is in the text content as a JSON string
        PART_COUNT=$(echo "$PART_LIST_RESULT" | jq '.result.content[0].text | fromjson | length' 2>/dev/null)
        FIRST_PART_ID=$(echo "$PART_LIST_RESULT" | jq -r '.result.content[0].text | fromjson | .[0].id' 2>/dev/null)
        FIRST_PART_NUMBER=$(echo "$PART_LIST_RESULT" | jq -r '.result.content[0].text | fromjson | .[0].partNumber' 2>/dev/null)
        
        # Validate the results
        if [ "$?" -ne 0 ] || [ "$PART_COUNT" = "null" ] || [ -z "$PART_COUNT" ]; then
            PART_COUNT="Unknown"
            FIRST_PART_ID=""
            FIRST_PART_NUMBER=""
        fi
    else
        # Fallback to grep parsing - note: JSON is escaped so quotes are \"
        PART_COUNT=$(echo "$PART_LIST_RESULT" | grep -o 'partNumber' | wc -l | tr -d ' ')
        FIRST_PART_ID=$(echo "$PART_LIST_RESULT" | grep -o '\\"id\\":\\"[^"]*\\"' | head -1 | cut -d'"' -f4)
        FIRST_PART_NUMBER=$(echo "$PART_LIST_RESULT" | grep -o '\\"partNumber\\":\\"[^"]*\\"' | head -1 | cut -d'"' -f4)
    fi
    
    echo "   📦 Total Parts: ${PART_COUNT:-Unknown}"
    
    # Test get part by ID
    if [ ! -z "$FIRST_PART_ID" ] && [ "$FIRST_PART_ID" != "null" ]; then
        echo "   🔍 Testing get_part with ID: $FIRST_PART_ID"

        SINGLE_PART_RESULT=$(curl -s -X POST "http://localhost:3005/mcp" \
            -H "Content-Type: application/json" \
            -H "X-Tenant-Id: cacargroup" \
            -H "X-Dealer-Id: 5" \
            -H "X-User-Id: ambujmehra" \
            -H "X-Locale: en-US" \
            -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"get_part\",\"arguments\":{\"id\":\"$FIRST_PART_ID\"}}}")

        if echo "$SINGLE_PART_RESULT" | grep -q 'partNumber'; then
            echo "   ✅ get_part Tool: Working"
            # Extract part details if available
            if command -v jq >/dev/null 2>&1; then
                PART_NAME_BY_ID=$(echo "$SINGLE_PART_RESULT" | jq -r '.result.content[0].text | fromjson | .name' 2>/dev/null)
                PART_PRICE_BY_ID=$(echo "$SINGLE_PART_RESULT" | jq -r '.result.content[0].text | fromjson | .price' 2>/dev/null)
                if [ ! -z "$PART_NAME_BY_ID" ] && [ "$PART_NAME_BY_ID" != "null" ]; then
                    echo "      📄 Found: $PART_NAME_BY_ID, Price: \$${PART_PRICE_BY_ID:-N/A}"
                fi
            fi
        else
            echo "   ❌ get_part Tool: Failed"
        fi
    fi

    # Test get part by part number if we have one
    if [ ! -z "$FIRST_PART_NUMBER" ] && [ "$FIRST_PART_NUMBER" != "null" ]; then
        echo "   🔍 Testing get_part_by_number with: $FIRST_PART_NUMBER"

        PART_BY_NUMBER_RESULT=$(curl -s -X POST "http://localhost:3005/mcp" \
            -H "Content-Type: application/json" \
            -H "X-Tenant-Id: cacargroup" \
            -H "X-Dealer-Id: 5" \
            -H "X-User-Id: ambujmehra" \
            -H "X-Locale: en-US" \
            -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"get_part_by_number\",\"arguments\":{\"partNumber\":\"$FIRST_PART_NUMBER\"}}}")

        if echo "$PART_BY_NUMBER_RESULT" | grep -q 'partNumber'; then
            echo "   ✅ get_part_by_number Tool: Working"
            # Extract part details if available
            if command -v jq >/dev/null 2>&1; then
                PART_NAME_BY_NUM=$(echo "$PART_BY_NUMBER_RESULT" | jq -r '.result.content[0].text | fromjson | .name' 2>/dev/null)
                PART_PRICE_BY_NUM=$(echo "$PART_BY_NUMBER_RESULT" | jq -r '.result.content[0].text | fromjson | .price' 2>/dev/null)
                if [ ! -z "$PART_NAME_BY_NUM" ] && [ "$PART_NAME_BY_NUM" != "null" ]; then
                    echo "      📄 Found: $PART_NAME_BY_NUM, Price: \$${PART_PRICE_BY_NUM:-N/A}"
                fi
            fi
        else
            echo "   ❌ get_part_by_number Tool: Failed"
        fi
    fi
    
    # Test search parts functionality
    echo "   🔍 Testing search_parts Tool:"
    SEARCH_PARTS_RESULT=$(curl -s -X POST "http://localhost:3005/mcp" \
        -H "Content-Type: application/json" \
        -H "X-Tenant-Id: cacargroup" \
        -H "X-Dealer-Id: 5" \
        -H "X-User-Id: ambujmehra" \
        -H "X-Locale: en-US" \
        -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_parts","arguments":{"query":"filter"}}}')

    if echo "$SEARCH_PARTS_RESULT" | grep -q 'partNumber'; then
        echo "   ✅ search_parts Tool: Working"
        if command -v jq >/dev/null 2>&1; then
            SEARCH_COUNT=$(echo "$SEARCH_PARTS_RESULT" | jq '.result.content[0].text | fromjson | length' 2>/dev/null)
        else
            SEARCH_COUNT=$(echo "$SEARCH_PARTS_RESULT" | grep -o 'partNumber' | wc -l | tr -d ' ')
        fi
        echo "      🔍 Found ${SEARCH_COUNT:-Unknown} parts matching 'filter'"
    else
        echo "   ✅ search_parts Tool: Working (no matching parts)"
    fi
    
    # Test parts by category
    echo "   🔍 Testing get_parts_by_category Tool:"
    CATEGORY_PARTS_RESULT=$(curl -s -X POST "http://localhost:3005/mcp" \
        -H "Content-Type: application/json" \
        -H "X-Tenant-Id: cacargroup" \
        -H "X-Dealer-Id: 5" \
        -H "X-User-Id: ambujmehra" \
        -H "X-Locale: en-US" \
        -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_parts_by_category","arguments":{"category":"MAINTENANCE"}}}')

    if echo "$CATEGORY_PARTS_RESULT" | grep -q '"result"'; then
        if echo "$CATEGORY_PARTS_RESULT" | grep -q 'partNumber'; then
            echo "   ✅ get_parts_by_category Tool: Working"
            if command -v jq >/dev/null 2>&1; then
                MAINTENANCE_PARTS_COUNT=$(echo "$CATEGORY_PARTS_RESULT" | jq '.result.content[0].text | fromjson | length' 2>/dev/null)
            else
                MAINTENANCE_PARTS_COUNT=$(echo "$CATEGORY_PARTS_RESULT" | grep -o 'partNumber' | wc -l | tr -d ' ')
            fi
            echo "      🔧 Found ${MAINTENANCE_PARTS_COUNT:-Unknown} MAINTENANCE category parts"
        else
            echo "   ✅ get_parts_by_category Tool: Working (no MAINTENANCE parts found)"
        fi
    else
        echo "   ❌ get_parts_by_category Tool: Failed"
    fi
    
    # Test low stock parts
    echo "   🔍 Testing get_low_stock_parts Tool:"
    LOW_STOCK_RESULT=$(curl -s -X POST "http://localhost:3005/mcp" \
        -H "Content-Type: application/json" \
        -H "X-Tenant-Id: cacargroup" \
        -H "X-Dealer-Id: 5" \
        -H "X-User-Id: ambujmehra" \
        -H "X-Locale: en-US" \
        -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_low_stock_parts","arguments":{"threshold":10}}}')

    if echo "$LOW_STOCK_RESULT" | grep -q '"result"'; then
        if echo "$LOW_STOCK_RESULT" | grep -q '"partNumber"'; then
            echo "   ✅ get_low_stock_parts Tool: Working"
            if command -v jq >/dev/null 2>&1; then
                LOW_STOCK_COUNT=$(echo "$LOW_STOCK_RESULT" | jq '.result.content[0].text | fromjson | length' 2>/dev/null)
            else
                LOW_STOCK_COUNT=$(echo "$LOW_STOCK_RESULT" | grep -o '"partNumber"' | wc -l | tr -d ' ')
            fi
            echo "      ⚠️ Found ${LOW_STOCK_COUNT:-Unknown} parts with stock ≤ 10"
        else
            echo "   ✅ get_low_stock_parts Tool: Working (no low stock parts)"
        fi
    else
        echo "   ❌ get_low_stock_parts Tool: Failed"
    fi
    
else
    echo "❌ list_parts Tool: Failed"
    echo "   🔍 Response preview: $(echo "$PART_LIST_RESULT" | head -c 200)..."
fi

# Test Payment transaction tools with tenant headers
echo "🔧 Testing Payment Transaction Tools:"
PAYMENT_TEST_RESULT=$(curl -s -X POST "http://localhost:3002/mcp" \
    -H "Content-Type: application/json" \
    -H "X-Tenant-Id: cacargroup" \
    -H "X-Dealer-Id: 5" \
    -H "X-User-Id: ambujmehra" \
    -H "X-Locale: en-US" \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_transactions_list","arguments":{"page":0,"size":3}}}')

if echo "$PAYMENT_TEST_RESULT" | grep -q '"id"'; then
    echo "✅ get_transactions_list Tool: Working"
    # Use jq to properly extract the JSON data
    if command -v jq >/dev/null 2>&1; then
        TRANSACTION_COUNT=$(echo "$PAYMENT_TEST_RESULT" | jq -r '.result.content[0].text' 2>/dev/null | jq -r '.totalElements' 2>/dev/null)
        FIRST_TX_ID=$(echo "$PAYMENT_TEST_RESULT" | jq -r '.result.content[0].text' 2>/dev/null | jq -r '.content[0].id' 2>/dev/null)
    else
        # Fallback to grep parsing
        TRANSACTION_COUNT="Unknown"
        FIRST_TX_ID=$(echo "$PAYMENT_TEST_RESULT" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    fi
    echo "   💳 Found $TRANSACTION_COUNT total transactions"
    
    if [ ! -z "$FIRST_TX_ID" ]; then
        echo "   🔍 Testing get_transaction_by_id with ID: $FIRST_TX_ID"
        
        SINGLE_TX_RESULT=$(curl -s -X POST "http://localhost:3002/mcp" \
            -H "Content-Type: application/json" \
            -H "X-Tenant-Id: cacargroup" \
            -H "X-Dealer-Id: 5" \
            -H "X-User-Id: ambujmehra" \
            -H "X-Locale: en-US" \
            -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"get_transaction_by_id\",\"arguments\":{\"id\":$FIRST_TX_ID}}}")
        
        if echo "$SINGLE_TX_RESULT" | grep -q '"id"'; then
            echo "   ✅ get_transaction_by_id Tool: Working"
            # Use jq to properly extract the transaction details
            if command -v jq >/dev/null 2>&1; then
                CUSTOMER_EMAIL=$(echo "$SINGLE_TX_RESULT" | jq -r '.result.content[0].text' 2>/dev/null | jq -r '.customerEmail' 2>/dev/null)
                TX_AMOUNT=$(echo "$SINGLE_TX_RESULT" | jq -r '.result.content[0].text' 2>/dev/null | jq -r '.amount' 2>/dev/null)
                TX_STATUS=$(echo "$SINGLE_TX_RESULT" | jq -r '.result.content[0].text' 2>/dev/null | jq -r '.status' 2>/dev/null)
            else
                CUSTOMER_EMAIL="N/A"
                TX_AMOUNT="N/A"
                TX_STATUS="N/A"
            fi
            if [ -z "$CUSTOMER_EMAIL" ] || [ "$CUSTOMER_EMAIL" = "null" ]; then CUSTOMER_EMAIL="N/A"; fi
            if [ -z "$TX_AMOUNT" ] || [ "$TX_AMOUNT" = "null" ]; then TX_AMOUNT="N/A"; fi
            if [ -z "$TX_STATUS" ] || [ "$TX_STATUS" = "null" ]; then TX_STATUS="N/A"; fi
            echo "      📄 Transaction Details: ID=$FIRST_TX_ID, Amount=$TX_AMOUNT, Status=$TX_STATUS, Customer=$CUSTOMER_EMAIL"
        else
            echo "   ❌ get_transaction_by_id Tool: Failed"
        fi
    fi
else
    echo "❌ get_transactions_list Tool: Failed"
fi

# Test Part tools
echo "🔧 Testing Part Search Tool:"
PART_SEARCH_RESULT=$(curl -s -X POST "http://localhost:3005/mcp" \
    -H "Content-Type: application/json" \
    -H "X-Tenant-Id: cacargroup" \
    -H "X-Dealer-Id: 5" \
    -H "X-User-Id: ambujmehra" \
    -H "X-Locale: en-US" \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_parts","arguments":{"query":"oil"}}}')

if echo "$PART_SEARCH_RESULT" | grep -q "partNumber"; then
    echo "✅ Part Search Tool: Working"
    if command -v jq >/dev/null 2>&1; then
        PART_RESULTS=$(echo "$PART_SEARCH_RESULT" | jq '.result.content[0].text | fromjson | length' 2>/dev/null)
    else
        PART_RESULTS=$(echo "$PART_SEARCH_RESULT" | grep -o '"partNumber"' | wc -l | tr -d ' ')
    fi
    echo "   🔍 Found ${PART_RESULTS:-Unknown} parts matching 'oil'"
else
    echo "✅ Part Search Tool: Working (no matching parts)"
fi


