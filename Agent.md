# Automotive Retail Agent System - Microservice Architecture

## Executive Summary

Enhanced microservice architecture where each agent (Payment, Parts, Repair Orders) runs as an independent Python service, with a separate Agent Orchestrator microservice. This design provides better scalability, fault isolation, and independent deployment capabilities while maintaining intelligent workflow planning and execution.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                Agent Orchestrator Service                   │
│                    (Port 8086)                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │Tool Discovery│  │ Workflow    │  │ Validation  │         │
│  │   Manager    │  │  Planner    │  │  Engine     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP REST API
         ┌────────────┼────────────┐
         │            │            │
┌────────▼──────────┐ │  ┌────────▼──────────┐
│  Payment Agent    │ │  │   Parts Agent     │
│   Service         │ │  │    Service        │
│  (Port 8083)      │ │  │   (Port 8085)     │
│                   │ │  │                   │
│ ┌───────────────┐ │ │  │ ┌───────────────┐ │
│ │ Agent Core    │ │ │  │ │ Agent Core    │ │
│ │ + REST API    │ │ │  │ │ + REST API    │ │
│ └───────────────┘ │ │  │ └───────────────┘ │
│ ┌───────────────┐ │ │  │ ┌───────────────┐ │
│ │ MCP Client    │ │ │  │ │ MCP Client    │ │
│ └───────────────┘ │ │  │ └───────────────┘ │
└─────────┬─────────┘ │  └─────────┬─────────┘
          │           │            │
  ┌───────▼────────┐  │    ┌───────▼────────┐
  │ Payment MCP    │  │    │  Parts MCP     │
  │ Server         │  │    │  Server        │
  │ (Port 3002)    │  │    │  (Port 3005)   │
  └────────────────┘  │    └────────────────┘
                      │
              ┌───────▼────────┐
              │ Repair Orders  │
              │ Agent Service  │
              │ (Port 8084)    │
              │                │
              │ ┌────────────┐ │
              │ │Agent Core  │ │
              │ │+ REST API  │ │
              │ └────────────┘ │
              │ ┌────────────┐ │
              │ │MCP Client  │ │
              │ └────────────┘ │
              └───────┬────────┘
                      │
              ┌───────▼────────┐
              │ Repair Orders  │
              │ MCP Server     │
              │ (Port 3003)    │
              └────────────────┘
```

## Microservice Design Patterns

### Service Registry & Discovery
- **Service Discovery**: Orchestrator discovers agent services at startup
- **Health Checks**: Regular health monitoring of all services
- **Load Balancing**: Support for multiple instances of each agent service

### Communication Patterns
- **Synchronous**: HTTP REST API for request-response operations
- **Asynchronous**: Event-driven communication for notifications
- **Fault Tolerance**: Retry mechanisms for service communication

### Data Management
- **Service-Specific Databases**: Each service manages its own data

## Core Data Models

### Request/Response Models

```python
class AgentServiceRequest(BaseModel):
    """Standard request format for agent services"""
    request_id: str
    operation: str
    parameters: Dict[str, Any]
    context: Optional[Dict[str, Any]] = None
    timeout: Optional[int] = 30
    callback_url: Optional[str] = None

class AgentServiceResponse(BaseModel):
    """Standard response format for agent services"""
    request_id: str
    success: bool
    result: Any
    error: Optional[str] = None
    execution_time: float
    metadata: Dict[str, Any]
    timestamp: datetime
```

### Orchestrator Models

```python
class OrchestratorRequest(BaseModel):
    """Request format for orchestrator"""
    request_id: Optional[str] = None
    user_request: str
    priority: Optional[int] = 1
    callback_url: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class OrchestratorResponse(BaseModel):
    """Response format from orchestrator"""
    request_id: str
    success: bool
    workflow_plan: Dict[str, Any]
    execution_results: Dict[str, Any]
    final_result: str
    execution_time: float
    timestamp: datetime
```

## Base Agent Service Architecture

### BaseAgentService Class

```python
class BaseAgentService(ABC):
    """Base class for all agent microservices"""
    
    def __init__(self, service_name: str, port: int, mcp_endpoint: str, mcp_headers: Dict[str, str] = None):
        # Initialize service properties and FastAPI app
        # Setup MCP client connection
        # Configure routing and middleware
    
    def setup_routes(self):
        """Setup FastAPI routes for standard endpoints"""
        # GET /health - Health check endpoint
        # GET /capabilities - Service capabilities and operations
        # POST /execute - Synchronous operation execution
        # POST /execute-async - Asynchronous operation execution
        # GET /status/{task_id} - Async task status checking
    
    async def discover_mcp_tools(self) -> List[Dict[str, Any]]:
        """Discover available MCP tools from connected server"""
        # Connect to MCP server via JSON-RPC
        # Retrieve tools/list method
        # Parse and return tool definitions
    
    async def call_mcp_tool(self, tool_name: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Execute MCP tool call with parameters"""
        # Format JSON-RPC request for tools/call
        # Send to MCP server with headers
        # Handle response and errors
    
    async def send_callback(self, callback_url: str, response: AgentServiceResponse):
        """Send callback notification for async operations"""
        # HTTP POST to callback URL with response data
        # Handle callback delivery failures gracefully
    
    @abstractmethod
    async def get_available_operations(self) -> List[str]:
        """Get list of available operations for this service"""
    
    @abstractmethod
    async def validate_operation(self, operation: str, parameters: Dict[str, Any]) -> bool:
        """Validate operation and parameters before execution"""
    
    @abstractmethod
    async def execute_operation_impl(self, request: AgentServiceRequest) -> Any:
        """Execute the actual operation implementation"""
    
    def run(self):
        """Start the microservice with uvicorn"""
```

## Individual Agent Services

### 1. Payment Agent Service (Port 8083)

```python
class PaymentAgentService(BaseAgentService):
    """Payment Agent Microservice"""
    
    def __init__(self):
        # MCP endpoint: http://localhost:3002/mcp
        # Headers: X-Tenant-Id, X-Dealer-Id, X-User-Id
        # Service name: payment-agent
    
    async def get_available_operations(self) -> List[str]:
        """Available payment operations use the MCP server tools/list API and make the methods for all tool calls""" 
        return [
            "create_payment_link",      # Generate payment URLs for repair orders
            "check_payment_status",     # Verify payment completion status  
            "process_refund",          # Handle refund requests with reason codes
            "send_payment_notification", # Email/SMS payment reminders
            "get_payment_methods",     # Retrieve customer payment options
            "validate_payment_data"    # Local validation of payment parameters
        ]
    
    async def validate_operation(self, operation: str, parameters: Dict[str, Any]) -> bool:
        """Validate payment operation parameters"""
        # create_payment_link: requires repair_order_id, amount, customer_email
        # Email format validation with regex
        # Amount positive validation
        # Currency code validation
    
    async def _create_payment_link(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Create payment link via MCP tool call"""
        # Call MCP create_payment_link tool
        # Return payment_link, payment_id, expiry_date
    
    async def _check_payment_status(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Check payment status via MCP tool call"""
        # Call MCP check_payment_status tool
        # Return status, amount_paid, payment_date, transaction_id
    
    async def _validate_payment_data(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Local validation without MCP call"""
        # Email format validation
        # Amount and currency validation
        # Repair order format checking
        # Return validation results and errors
```

### 2. Parts Agent Service (Port 8085)

```python
class PartsAgentService(BaseAgentService):
    """Parts Agent Microservice"""
    
    def __init__(self):
        # MCP endpoint: http://localhost:3005/mcp
        # Headers: X-User-Id, X-Service
        # Service name: parts-agent
    
    async def get_available_operations(self) -> List[str]:
        """Available parts operations use the MCP server tools/list API and make the methods for all tool calls"""
        return [
            "search_parts",                # Find parts by name/vehicle/year
            "check_part_availability",     # Verify stock levels and availability
            "get_part_details",           # Retrieve specifications and pricing
            "reserve_parts",              # Hold parts for repair orders
            "check_vehicle_compatibility", # Verify part-vehicle compatibility
            "get_alternative_parts",      # Find compatible alternatives
            "validate_part_number"        # Local part number format validation
        ]
    
    async def validate_operation(self, operation: str, parameters: Dict[str, Any]) -> bool:
        """Validate parts operation parameters"""
        # search_parts: requires part_name
        # check_part_availability: requires part_number
        # reserve_parts: requires part_numbers, repair_order_id, quantity_map
        # check_vehicle_compatibility: requires part_number, vehicle_model, vehicle_year
    
    async def _search_parts(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Search parts via MCP tool call"""
        # Call MCP search_parts tool
        # Return matching parts with specifications
    
    async def _reserve_parts(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Reserve parts via MCP tool call"""
        # Call MCP reserve_parts tool
        # Return reservation_id, reserved_parts, expiry_time
    
    async def _get_alternative_parts(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Enhanced operation combining multiple MCP calls"""
        # Get part details first
        # Search for similar parts in same category
        # Return original part + alternatives list
    
    async def _validate_part_number(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Local part number format validation"""
        # Format validation (length, alphanumeric)
        # Special character checking
        # Return validation results
```

### 3. Repair Orders Agent Service (Port 8084)

```python
class RepairOrdersAgentService(BaseAgentService):
    """Repair Orders Agent Microservice"""
    
    def __init__(self):
        # MCP endpoint: http://localhost:3003/mcp
        # Headers: X-User-Id, X-Service
        # Service name: repair-orders-agent
    
    async def get_available_operations(self) -> List[str]:
        """Available repair orders operations use the MCP server tools/list API and make the methods for all tool calls"""
        return [
            "create_repair_order",             # Generate new work orders
            "update_repair_order_status",      # Modify status and progress
            "get_repair_order_details",        # Retrieve complete order info
            "assign_technician",               # Allocate technicians to work
            "add_repair_notes",               # Document repair progress
            "get_repair_history",             # Enhanced operation for complete history
            "validate_repair_order_transition" # Local status transition validation
        ]
    
    async def validate_operation(self, operation: str, parameters: Dict[str, Any]) -> bool:
        """Validate repair orders operation parameters"""
        # create_repair_order: requires customer_id, vehicle_id, service_description
        # update_repair_order_status: requires repair_order_id, new_status
        # assign_technician: requires repair_order_id, technician_id
    
    async def _update_repair_order_status(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Update repair order status with validation"""
        # Get current status first
        # Validate status transition before updating
        # Call MCP update_repair_order_status tool
    
    async def _get_repair_history(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Enhanced operation combining multiple data sources"""
        # Get repair order details
        # Combine status history, notes, resources
        # Return comprehensive timeline
    
    async def _validate_repair_order_transition(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Local status transition validation"""
        # Define valid transition matrix
        # Check current_status -> new_status validity
        # Return validation result and allowed transitions
        
        valid_transitions = {
            "pending": ["scheduled", "cancelled"],
            "scheduled": ["in_progress", "cancelled"],
            "in_progress": ["parts_ordered", "quality_check", "cancelled"],
            "parts_ordered": ["in_progress", "cancelled"],
            "quality_check": ["customer_approval", "in_progress"],
            "customer_approval": ["ready_for_pickup", "in_progress"],
            "ready_for_pickup": ["completed", "in_progress"],
            "completed": ["invoiced"],
            "invoiced": ["closed"],
            "cancelled": [],
            "closed": []
        }
```

## Agent Orchestrator Service (Port 8086)

### Service Registry

```python
class ServiceRegistry:
    """Service registry for agent services"""
    
    def __init__(self):
        # Track services: payment (8083), parts (8085), repair_orders (8084)
        # Monitor health status and capabilities
    
    async def discover_services(self):
        """Discover and register agent services"""
        # Health check each service endpoint
        # Retrieve capabilities from /capabilities endpoint
        # Update service registry with status and operations
    
    def get_healthy_services(self) -> List[str]:
        """Get list of currently healthy services"""
    
    def get_service_url(self, service_name: str) -> str:
        """Get service URL for communication"""
```

### Workflow Planner

```python
class WorkflowPlanner:
    """Enhanced workflow planner for microservice architecture"""
    
    def __init__(self, api_key: str):
        # Initialize OpenAI GPT-4 for workflow planning
        # Configure LLM with temperature=0 for consistency
    
    async def create_workflow_plan(self, request: str, service_capabilities: Dict[str, Any]) -> Dict[str, Any]:
        """Create workflow plan using service capabilities"""
        # Format service capabilities for LLM prompt
        # Send comprehensive planning prompt to LLM
        # Parse JSON response into workflow plan
        # Include fallback plan creation for errors
    
    def _format_capabilities_for_prompt(self, service_capabilities: Dict[str, Any]) -> str:
        """Format service capabilities for LLM prompt"""
        # Create structured summary of all services
        # List operations and MCP tools for each service
        # Format for optimal LLM understanding
```

#### LLM Planning Prompt

```python
PLANNING_PROMPT = """
You are an Expert Automotive Service Workflow Planner for a microservice architecture.

AVAILABLE SERVICES AND OPERATIONS:
{capabilities_summary}

USER REQUEST: "{request}"

Create a comprehensive workflow plan following these MANDATORY rules:
These rules are subject to Tool availability, If tool is not available don't force the rule. Be defensive but not restrictive.
1. DEFENSIVE VALIDATION FIRST:
   - ALWAYS validate entity existence before operations
   - Check data integrity and business rules before state changes
   - Verify prerequisites and permissions for each operation
   - Validate data formats before processing

2. SERVICE-BASED EXECUTION ORDER:
   - Plan operations across multiple services
   - Consider service dependencies and communication
   - Minimize inter-service calls where possible
   - Plan for service failure scenarios

3. MICROSERVICE COMMUNICATION:
   - Each step targets a specific service
   - Include retry logic for service calls
   - Handle service unavailability gracefully

4. AUTOMOTIVE BUSINESS LOGIC:
   - Parts must exist before Repair Order
   - Repair orders must exist before modification
   - Payment operations require ROnumber as invoice number
   - If a part is added to Repair order , update the stock quantity of part

Respond with a JSON workflow plan:
{
  "workflow_plan": {
    "plan_id": "unique_plan_id",
    "risk_level": "low|medium|high",
    "estimated_duration_seconds": number,
    "execution_steps": [
      {
        "step_id": "step_1",
        "step_order": 1,
        "service_name": "payment|parts|repair_orders",
        "operation": "operation_name",
        "parameters": {
          "param_name": "param_value"
        },
        "validation_checks": [
          "check_repair_order_exists",
          "validate_part_number_format"
        ],
        "dependencies": [
          "step_id_that_must_complete_first"
        ],
        "parallel_group": "group_name_or_null",
        "failure_handling": "retry|skip|abort",
        "timeout_seconds": 30,
        "retry_attempts": 2
      }
    ],
    "validation_summary": [
      "list_of_all_validations_performed"
    ],
    "service_dependencies": {
      "service_name": ["dependent_services"]
    }
  }
}

Generate the workflow plan now:
"""
```

### Workflow Executor

```python
class WorkflowExecutor:
    """Execute workflow plans across microservices"""
    
    def __init__(self, service_registry: ServiceRegistry):
        # Initialize with service registry for communication
    
    async def execute_workflow(self, workflow_plan: Dict[str, Any]) -> Dict[str, Any]:
        """Execute complete workflow plan"""
        # Sort steps by execution order
        # Check dependencies before executing each step
        # Handle step failures based on failure_handling policy
        # Track execution results and failed steps
        # Return comprehensive execution summary
    
    def _dependencies_satisfied(self, dependencies: List[str], execution_results: Dict[str, Any]) -> bool:
        """Check if step dependencies are satisfied"""
        # Verify all dependency steps completed successfully
        # Return boolean for dependency satisfaction
    
    async def _execute_step(self, step: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a single workflow step"""
        # Get target service URL from registry
        # Prepare AgentServiceRequest payload
        # Execute with retry logic based on step configuration
        # Handle HTTP communication errors
        # Return step execution result
```

### Main Orchestrator Service

```python
class AgentOrchestratorService:
    """Main orchestrator microservice"""
    
    def __init__(self, openai_api_key: str):
        # Initialize FastAPI app
        # Setup service registry, workflow planner, executor
        # Configure active workflow tracking
    
    def setup_routes(self):
        """Setup FastAPI routes"""
        # GET /health - Orchestrator health and service status
        # GET /services - Available services and capabilities
        # POST /orchestrate - Synchronous workflow execution
        # POST /orchestrate-async - Asynchronous workflow execution
        # GET /workflow/{request_id} - Async workflow status
    
    async def startup_event(self):
        """Initialize service discovery on startup"""
        # Discover all agent services
        # Start periodic health check task
    
    async def orchestrate_request(self, request: OrchestratorRequest) -> OrchestratorResponse:
        """Main orchestration endpoint"""
        # Create workflow plan using LLM
        # Execute workflow across services
        # Format final result for user
        # Handle callbacks if provided
    
    async def periodic_health_checks(self):
        """Periodic health checks for services"""
        # Run every 30 seconds
        # Update service registry with current status
        # Handle service failures gracefully
    
    def _format_final_result(self, user_request: str, workflow_plan: Dict[str, Any], execution_results: Dict[str, Any]) -> str:
        """Format final result for user presentation"""
        # Create automotive service execution summary
        # List step-by-step results with status indicators
        # Include validation summary
        # Format for user-friendly display
```

## Service Communication Flow

### 1. Service Discovery Process

```
1. Agent services start on ports 8083, 8085, 8084
2. Orchestrator starts on port 8086
3. Orchestrator calls GET /health on each agent service
4. Orchestrator calls GET /capabilities to discover operations
5. Service registry caches capabilities and health status
6. Periodic health checks maintain service status
```

### 2. Request Execution Flow

```
User Request → Orchestrator → LLM Planning → Multi-Service Execution → Result Aggregation

Example: "Add part 1234 to RO 1234, send $100 payment link to email"

1. POST /orchestrate to orchestrator (8086)
2. LLM creates workflow plan with validation steps
3. Step 1: GET repair order details from repair-orders service (8084)
4. Step 2: GET part details from parts service (8085) [parallel]
5. Step 3: POST reserve parts to parts service (8085) [depends on 1,2]
6. Step 4: POST create payment link to payment service (8083) [depends on 1]
7. Orchestrator aggregates results and returns summary
```

### 3. Error Handling Strategy

```python
# Service-level error handling
- Individual service errors returned in AgentServiceResponse
- Retry logic based on step configuration (retry_attempts)
- Failure handling policies: retry, skip, abort
- Service unavailability handled gracefully

# Orchestrator-level error handling
- Service discovery failures logged but non-blocking
- Workflow execution continues with available services
- Partial success scenarios handled appropriately
- Comprehensive error reporting in final results
```

## Configuration & Deployment

### Environment Variables

```bash
# LLM Configuration
OPENAI_API_KEY=your-openai-api-key-here
LLM_MODEL=gpt-4
LLM_TEMPERATURE=0.7

# Service Endpoints
PAYMENT_SERVICE_URL=http://localhost:8083
PARTS_SERVICE_URL=http://localhost:8085
REPAIR_ORDERS_SERVICE_URL=http://localhost:8084
ORCHESTRATOR_SERVICE_URL=http://localhost:8086

# MCP Server Endpoints
PAYMENT_MCP_ENDPOINT=http://localhost:3002/mcp
PARTS_MCP_ENDPOINT=http://localhost:3005/mcp
REPAIR_ORDERS_MCP_ENDPOINT=http://localhost:3003/mcp

# Business Context
TENANT_ID=TENANT_AUTOMOTIVE_RETAIL
DEALER_ID=DEALER_001_AUTOMOTIVE
USER_ID=ambujmehra

# Service Configuration
SERVICE_DISCOVERY_INTERVAL=30  # seconds
REQUEST_TIMEOUT=30  # seconds
RETRY_ATTEMPTS=2
HEALTH_CHECK_TIMEOUT=5  # seconds
```


## Example Workflow Execution

### Input Request
```
"Add part number 1234 to RO number 1234, and send payment link of 100$ to ambujmehra16@gmail.com"
```

### Generated Workflow Plan
```json
{
  "plan_id": "wf_20250625_104145_001",
  "risk_level": "medium",
  "estimated_duration_seconds": 45,
  "execution_steps": [
    {
      "step_id": "validate_ro_1",
      "step_order": 1,
      "service_name": "repair_orders",
      "operation": "get_repair_order_details",
      "parameters": {"repair_order_id": "1234"},
      "validation_checks": ["check_repair_order_exists"],
      "dependencies": [],
      "parallel_group": "validation_group",
      "failure_handling": "abort"
    },
    {
      "step_id": "validate_part_1", 
      "step_order": 2,
      "service_name": "parts",
      "operation": "get_part_details",
      "parameters": {"part_number": "1234"},
      "validation_checks": ["check_part_exists"],
      "dependencies": [],
      "parallel_group": "validation_group",
      "failure_handling": "abort"
    },
    {
      "step_id": "reserve_part_1",
      "step_order": 3,
      "service_name": "parts", 
      "operation": "reserve_parts",
      "parameters": {
        "part_numbers": ["1234"],
        "repair_order_id": "1234",
        "quantity_map": {"1234": 1}
      },
      "dependencies": ["validate_ro_1", "validate_part_1"],
      "failure_handling": "retry"
    },
    {
      "step_id": "create_payment_1",
      "step_order": 4,
      "service_name": "payment",
      "operation": "create_payment_link", 
      "parameters": {
        "repair_order_id": "1234",
        "amount": 100.0,
        "currency": "USD", 
        "customer_email": "ambujmehra16@gmail.com"
      },
      "dependencies": ["validate_ro_1"],
      "failure_handling": "retry"
    }
  ]
}
```

### Expected Output
```
🚗 AUTOMOTIVE SERVICE EXECUTION SUMMARY
📋 Request: Add part number 1234 to RO number 1234, and send payment link of 100$ to ambujmehra16@gmail.com
🔧 Workflow Plan: wf_20250625_104145_001
📊 Progress: 4/4 steps completed

📝 STEP-BY-STEP RESULTS:
   ✅ validate_ro_1: repair_orders.get_repair_order_details
      Result: {"repair_order_id": "1234", "status": "active", "customer": "ambujmehra"}
   ✅ validate_part_1: parts.get_part_details
      Result: {"part_number": "1234", "name": "Brake Pad Set", "available": true}
   ✅ reserve_part_1: parts.reserve_parts
      Result: {"reservation_id": "RES_001", "part_1234": "reserved"}
   ✅ create_payment_1: payment.create_payment_link
      Result: {"payment_link": "https://pay.automotive.com/RO_1234", "sent_to": "ambujmehra16@gmail.com"}

🔒 VALIDATION SUMMARY:
   ✓ repair_order_1234_existence_verified
   ✓ part_1234_availability_confirmed
   ✓ email_format_validated
   ✓ amount_100_USD_validated
```

## Implementation Checklist

### Prerequisites
- [ ] Python 3.8+ environment for all services
- [ ] OpenAI API key for orchestrator
- [ ] MCP servers running on ports 3002, 3005, 3003


This microservice architecture provides enhanced scalability, fault tolerance, and operational flexibility while maintaining the intelligent workflow planning capabilities of the original system.
