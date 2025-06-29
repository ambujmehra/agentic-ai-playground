#!/bin/bash

# Agentic AI Playground Services Shutdown Script
echo "🛑 Shutting down Agentic AI Playground Services"
echo "================================================"

# Function to kill process on specific port
kill_process_on_port() {
    local port=$1
    local service_name=$2
    
    echo "🔍 Checking for $service_name on port $port..."
    local pid=$(lsof -ti :$port)
    
    if [ ! -z "$pid" ]; then
        echo "   ⚡ Stopping $service_name (PID: $pid)"
        kill -15 $pid 2>/dev/null
        sleep 2
        
        # Force kill if still running
        if kill -0 $pid 2>/dev/null; then
            echo "   💀 Force killing $service_name"
            kill -9 $pid 2>/dev/null
        fi
        
        echo "   ✅ $service_name stopped"
    else
        echo "   ℹ️  $service_name not running"
    fi
}

# Function to kill processes by name pattern
kill_processes_by_pattern() {
    local pattern=$1
    local service_name=$2
    
    echo "🔍 Checking for $service_name processes..."
    local pids=$(ps aux | grep -E "$pattern" | grep -v grep | awk '{print $2}')
    
    if [ ! -z "$pids" ]; then
        echo "   ⚡ Stopping $service_name processes"
        echo "$pids" | xargs kill -15 2>/dev/null
        sleep 2
        
        # Force kill if still running
        local remaining_pids=$(ps aux | grep -E "$pattern" | grep -v grep | awk '{print $2}')
        if [ ! -z "$remaining_pids" ]; then
            echo "   💀 Force killing $service_name"
            echo "$remaining_pids" | xargs kill -9 2>/dev/null
        fi
        
        echo "   ✅ $service_name stopped"
    else
        echo "   ℹ️  $service_name not running"
    fi
}

echo ""
echo "🟦 Stopping Java Services..."
echo "-----------------------------"

# Stop Java Payment Service (Port 8080)
kill_process_on_port 8080 "Payment Service"

# Stop Java RO Service (Port 8081)
kill_process_on_port 8081 "RO Service"

# Stop Java Part Service (Port 8082)
kill_process_on_port 8082 "Part Service"

echo ""
echo "🟩 Stopping MCP Servers..."
echo "---------------------------"

# Stop Payment MCP Server (Port 3002)
kill_process_on_port 3002 "Payment MCP Server"

# Stop RO MCP Server (Port 3003)
kill_process_on_port 3003 "RO MCP Server"

# Stop Part MCP Server (Port 3005)
kill_process_on_port 3005 "Part MCP Server"

echo ""
echo "🧹 Cleaning up additional processes..."
echo "--------------------------------------"

# Kill any remaining Maven processes
kill_processes_by_pattern "mvn.*spring-boot:run" "Maven Spring Boot"

# Kill any remaining Node.js MCP processes
kill_processes_by_pattern "node.*mcp.*server" "Node MCP Servers"
kill_processes_by_pattern "ts-node.*mcp.*server" "TypeScript MCP Servers"

# Kill any remaining npm processes related to MCP servers
kill_processes_by_pattern "npm.*start.*mcp" "NPM MCP Processes"

echo ""
echo "🔍 Final verification..."
echo "------------------------"

# Check if any services are still running
echo "Port status after shutdown:"
for port in 8080 8081 8082 3002 3003 3005; do
    if lsof -ti :$port >/dev/null 2>&1; then
        echo "   ❌ Port $port still in use"
    else
        echo "   ✅ Port $port free"
    fi
done

echo ""
echo "🎯 Shutdown Summary:"
echo "===================="
echo "All Agentic AI Playground services have been stopped."
echo "Ports 8080, 8081, 8082, 3002, 3003, 3005 should now be free."
echo ""
echo "To restart services, run: ./startup-services.sh"
echo "✨ Shutdown complete!"
