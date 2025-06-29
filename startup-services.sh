#!/bin/bash

# Agentic AI Playground Services Startup Script
echo "🚀 Starting Agentic AI Playground Services"
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -ti :$port >/dev/null 2>&1; then
        return 1  # Port is in use
    else
        return 0  # Port is free
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local timeout=${3:-60}
    local count=0
    
    echo "   ⏳ Waiting for $service_name to be ready..."
    while [ $count -lt $timeout ]; do
        if curl -s --connect-timeout 2 "$url" >/dev/null 2>&1; then
            echo -e "   ${GREEN}✅ $service_name is ready${NC}"
            return 0
        fi
        sleep 2
        count=$((count + 2))
        printf "."
    done
    echo -e "\n   ${RED}❌ $service_name failed to start within ${timeout}s${NC}"
    return 1
}

# Function to start Java service
start_java_service() {
    local service_dir=$1
    local port=$2
    local service_name=$3
    local health_endpoint=$4
    
    echo -e "\n${BLUE}🟦 Starting $service_name (Port $port)${NC}"
    echo "----------------------------------------"
    
    # Check if port is already in use
    if ! check_port $port; then
        echo -e "   ${YELLOW}⚠️  Port $port is already in use. Skipping $service_name${NC}"
        return 0
    fi
    
    cd "$service_dir" || {
        echo -e "   ${RED}❌ Directory $service_dir not found${NC}"
        return 1
    }
    
    echo "   📂 Starting from: $(pwd)"
    echo "   🔨 Building and starting $service_name..."
    
    # Start the service in background
    local log_name=$(echo "$service_name" | tr '[:upper:]' '[:lower:]' | tr '-' '_')
    nohup mvn spring-boot:run > "logs/${log_name}_startup.log" 2>&1 &
    local pid=$!
    echo "   🆔 Started with PID: $pid"
    
    # Wait for service to be ready
    wait_for_service "$health_endpoint" "$service_name" 120
    
    cd - >/dev/null
}

# Function to start Node.js MCP server
start_mcp_server() {
    local service_dir=$1
    local port=$2
    local service_name=$3
    local health_endpoint=$4
    
    echo -e "\n${GREEN}🟩 Starting $service_name (Port $port)${NC}"
    echo "----------------------------------------"
    
    # Check if port is already in use
    if ! check_port $port; then
        echo -e "   ${YELLOW}⚠️  Port $port is already in use. Skipping $service_name${NC}"
        return 0
    fi
    
    cd "$service_dir" || {
        echo -e "   ${RED}❌ Directory $service_dir not found${NC}"
        return 1
    }
    
    echo "   📂 Starting from: $(pwd)"
    echo "   📦 Installing dependencies..."
    npm install >/dev/null 2>&1
    
    echo "   🔨 Building TypeScript..."
    npm run build >/dev/null 2>&1
    
    echo "   🚀 Starting $service_name..."
    
    # Create logs directory if it doesn't exist
    mkdir -p logs
    
    # Start the service in background
    local log_name=$(echo "$service_name" | tr '[:upper:]' '[:lower:]' | tr '-' '_')
    nohup npm start > "logs/${log_name}_startup.log" 2>&1 &
    local pid=$!
    echo "   🆔 Started with PID: $pid"
    
    # Wait for service to be ready
    wait_for_service "$health_endpoint" "$service_name" 45
    
    cd - >/dev/null
}

echo ""
echo "🔍 Pre-startup checks..."
echo "------------------------"

# Check if required directories exist
required_dirs=(
    "paymentservice"
    "roservice" 
    "partservice"
    "payment-mcp-server"
    "ro-mcp-server"
    "part-mcp-server"
)

for dir in "${required_dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo "   ✅ $dir directory found"
    else
        echo -e "   ${RED}❌ $dir directory not found${NC}"
        exit 1
    fi
done

# Create logs directories
echo ""
echo "📁 Creating log directories..."
echo "------------------------------"
for dir in "${required_dirs[@]}"; do
    mkdir -p "$dir/logs"
    echo "   ✅ Created logs directory for $dir"
done

# Start Java Services
echo ""
echo -e "${BLUE}🏗️  Starting Java Services...${NC}"
echo "==============================="

start_java_service "paymentservice" 8080 "Payment-Service" "http://localhost:8080/api/v1/transactions/metadata/card-types"
start_java_service "roservice" 8081 "RO-Service" "http://localhost:8081/api/repair-orders/health"  
start_java_service "partservice" 8082 "Part-Service" "http://localhost:8082/api/parts/health"

# Start MCP Servers
echo ""
echo -e "${GREEN}🌐 Starting MCP Servers...${NC}"
echo "==========================="

start_mcp_server "payment-mcp-server" 3002 "Payment-MCP-Server" "http://localhost:3002/health"
start_mcp_server "ro-mcp-server" 3003 "RO-MCP-Server" "http://localhost:3003/health"
start_mcp_server "part-mcp-server" 3005 "Part-MCP-Server" "http://localhost:3005/health"

# Final verification
echo ""
echo "🔍 Final Service Verification..."
echo "================================"

services=(
    "8080|Payment Service|http://localhost:8080/api/v1/transactions/metadata/card-types"
    "8081|RO Service|http://localhost:8081/api/repair-orders/health" 
    "8082|Part Service|http://localhost:8082/api/parts/health"
    "3002|Payment MCP Server|http://localhost:3002/health"
    "3003|RO MCP Server|http://localhost:3003/health"
    "3005|Part MCP Server|http://localhost:3005/health"
)

all_running=true
for service_info in "${services[@]}"; do
    IFS='|' read -r port name url <<< "$service_info"
    
    if check_port $port; then
        echo -e "   ${RED}❌ $name (Port $port): Not running${NC}"
        all_running=false
    else
        if curl -s --connect-timeout 3 "$url" >/dev/null 2>&1; then
            echo -e "   ${GREEN}✅ $name (Port $port): Running and healthy${NC}"
        else
            echo -e "   ${YELLOW}⚠️  $name (Port $port): Running but not responding${NC}"
        fi
    fi
done

echo ""
echo "🎯 Startup Summary:"
echo "=================="

if [ "$all_running" = true ]; then
    echo -e "${GREEN}🎉 All 6 services started successfully!${NC}"
    echo ""
    echo "📍 Service URLs:"
    echo "   • Payment Service: http://localhost:8080"
    echo "   • RO Service: http://localhost:8081" 
    echo "   • Part Service: http://localhost:8082"
    echo "   • Payment MCP Server: http://localhost:3002"
    echo "   • RO MCP Server: http://localhost:3003"
    echo "   • Part MCP Server: http://localhost:3005"
    echo ""
    echo "📊 API Documentation:"
    echo "   • Payment API: http://localhost:8080/swagger-ui.html"
    echo "   • RO API: http://localhost:8081/swagger-ui.html"
    echo "   • Part API: http://localhost:8082/swagger-ui.html"
    echo ""
    echo "🧪 To test all services, run: ./quick-test.sh"
    echo -e "${GREEN}✨ All services ready for agentic AI development!${NC}"
else
    echo -e "${RED}⚠️  Some services failed to start. Check the logs in each service's logs/ directory.${NC}"
    echo ""
    echo "🛠️  Troubleshooting:"
    echo "   • Check logs in: paymentservice/logs/, roservice/logs/, partservice/logs/"
    echo "   • Check MCP logs in: *-mcp-server/logs/"
    echo "   • To stop all services: ./shutdown-services.sh"
    echo "   • To restart: ./shutdown-services.sh && ./startup-services.sh"
fi

echo ""
echo "🛑 To stop all services later, run: ./shutdown-services.sh"
