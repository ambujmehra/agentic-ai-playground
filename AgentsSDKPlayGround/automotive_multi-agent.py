"""
Multi-Agent Workflow Implementation with Agent Loop
Demonstrates how the Triage Agent works with LLM in a loop to handle complex multi-domain requests
Based on AgentV3.md design with OpenAI Agents SDK
"""

import os
import asyncio
from agents import Agent, Runner, function_tool
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json

# Import configuration
from config import OPENAI_API_KEY

# Set the OpenAI API key from config
os.environ['OPENAI_API_KEY'] = OPENAI_API_KEY

# Data Models for Multi-Domain Operations
class WorkflowStep(BaseModel):
    step_id: str
    agent_type: str  # repair_orders, parts, payment
    action: str
    parameters: Dict[str, Any]
    dependencies: List[str] = []  # step_ids this step depends on
    status: str = "pending"  # pending, in_progress, completed, failed

class WorkflowPlan(BaseModel):
    request_id: str
    original_query: str
    steps: List[WorkflowStep]
    execution_order: List[str]  # step_ids in execution order
    parallel_groups: List[List[str]] = []  # groups of steps that can run in parallel

class WorkflowResult(BaseModel):
    step_id: str
    success: bool
    result: Any
    error_message: Optional[str] = None

# Mock MCP Tools (simulating the actual MCP servers with correct endpoints)
@function_tool
def get_repair_order_details(ro_number: str) -> Dict[str, Any]:
    """Get details of a repair order - VALIDATION STEP"""
    # Simulate MCP server response format
    if ro_number == "RO_001":
        return {
            "success": True,
            "tool": "get_repair_order_details",
            "result": {
                "roNumber": ro_number,
                "status": "IN_PROGRESS",
                "customerId": "CUST_001",
                "vehicleId": "VEH_001",
                "customerEmail": "customer@example.com",
                "totalAmount": 145.99,
                "parts": [],
                "canModify": True,
                "createdDate": "2025-01-15"
            },
            "timestamp": "2025-01-15T10:30:00Z",
            "mcp_server": "repair-orders-server-3003"
        }
    else:
        return {
            "success": False,
            "error": "Repair Order Not Found",
            "message": f"Repair order {ro_number} not found",
            "tool": "get_repair_order_details",
            "mcp_server": "repair-orders-server-3003"
        }

@function_tool
def get_part_by_number(part_number: str) -> Dict[str, Any]:
    """Get part details by part number - VALIDATION STEP"""
    # Simulate MCP server response format
    if part_number == "PART_001":
        return {
            "success": True,
            "tool": "get_part_by_number",
            "result": {
                "partNumber": part_number,
                "description": "Brake Pad Set - Front",
                "category": "BRAKES",
                "unitPrice": 45.99,
                "currency": "INR",
                "brand": "OEM",
                "inStock": True,
                "availableQuantity": 25,
                "compatibility": ["Honda Civic", "Honda Accord"]
            },
            "timestamp": "2025-01-15T10:30:00Z",
            "mcp_server": "parts-server-3005"
        }
    else:
        return {
            "success": False,
            "error": "Part Not Found",
            "message": f"Part {part_number} not found in catalog",
            "tool": "get_part_by_number",
            "mcp_server": "parts-server-3005"
        }

    """Check part availability - VALIDATION STEP"""
    # Simulate MCP server response format
    if part_number == "PART_001":
        available_qty = 25
        can_fulfill = quantity <= available_qty
        return {
            "success": True,
            "tool": "check_part_availability",
            "result": {
                "partNumber": part_number,
                "requestedQuantity": quantity,
                "availableQuantity": available_qty,
                "canFulfill": can_fulfill,
                "unitPrice": 45.99,
                "totalPrice": 45.99 * quantity,
                "currency": "INR",
                "estimatedDelivery": "2025-01-16",
                "reservationExpiry": "2025-01-15T18:00:00Z"
            },
            "timestamp": "2025-01-15T10:30:00Z",
            "mcp_server": "parts-server-3005"
        }
    else:
        return {
            "success": False,
            "error": "Part Not Available",
            "message": f"Part {part_number} is not available",
            "tool": "check_part_availability",
            "mcp_server": "parts-server-3005"
        }


    """Validate that a part can be added to a specific repair order - VALIDATION STEP"""
    # Simulate comprehensive validation of part-order compatibility
    if ro_number == "RO_001" and part_number == "PART_001":
        return {
            "success": True,
            "tool": "validate_part_order",
            "result": {
                "roNumber": ro_number,
                "partNumber": part_number,
                "quantity": quantity,
                "compatibility": "COMPATIBLE",
                "vehicleMatch": True,
                "partFitsVehicle": True,
                "roStatus": "IN_PROGRESS",
                "canAddParts": True,
                "estimatedInstallTime": "2 hours",
                "requiredTools": ["Standard brake tools"],
                "warningMessages": [],
                "validationChecks": {
                    "vehicleCompatibility": "PASS",
                    "partAvailability": "PASS",
                    "roStatus": "PASS",
                    "customerAuthorization": "PASS"
                }
            },
            "timestamp": "2025-01-15T10:30:00Z",
            "message": f"Part {part_number} is compatible with repair order {ro_number}",
            "mcp_server": "parts-server-3005"
        }
    elif ro_number != "RO_001":
        return {
            "success": False,
            "error": "Invalid Repair Order",
            "message": f"Repair order {ro_number} not found or not accessible",
            "tool": "validate_part_order",
            "mcp_server": "parts-server-3005"
        }
    elif part_number != "PART_001":
        return {
            "success": False,
            "error": "Part Not Compatible",
            "message": f"Part {part_number} is not compatible with repair order {ro_number}",
            "tool": "validate_part_order",
            "mcp_server": "parts-server-3005"
        }
    else:
        return {
            "success": False,
            "error": "Validation Failed",
            "message": f"Part {part_number} cannot be added to repair order {ro_number}",
            "tool": "validate_part_order",
            "mcp_server": "parts-server-3005"
        }

@function_tool
def add_part_to_repair_order(ro_number: str, part_number: str, quantity: int = 1) -> Dict[str, Any]:
    """Add a part to an existing repair order - EXECUTION STEP"""
    return {
        "success": True,
        "tool": "add_part_to_repair_order",
        "result": {
            "roNumber": ro_number,
            "partAdded": {
                "partNumber": part_number,
                "quantity": quantity,
                "unitPrice": 45.99,
                "totalPrice": 45.99 * quantity
            },
            "updatedTotals": {
                "partsTotal": 45.99 * quantity,
                "laborTotal": 100.00,
                "grandTotal": (45.99 * quantity) + 100.00
            },
            "inventoryReserved": True
        },
        "timestamp": "2025-01-15T10:30:00Z",
        "message": f"Successfully added {quantity}x {part_number} to repair order {ro_number}",
        "mcp_server": "repair-orders-server-3003"
    }

@function_tool
def create_payment_link(ro_number: str, amount: float, customer_email: str, currency: str = "INR") -> Dict[str, Any]:
    """Create a payment link for a repair order - EXECUTION STEP"""
    # Email validation
    import re
    email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    if not re.match(email_regex, customer_email):
        return {
            "success": False,
            "error": "Invalid Email",
            "message": "Valid customer email is required",
            "tool": "create_payment_link"
        }

    # Amount validation
    if amount <= 0 or amount > 999999999:
        return {
            "success": False,
            "error": "Invalid Amount",
            "message": "Payment amount must be between 0 and 999999999",
            "tool": "create_payment_link"
        }

    payment_link_id = f"PL_{ro_number}_{int(amount)}"
    return {
        "success": True,
        "tool": "create_payment_link",
        "result": {
            "paymentLinkId": payment_link_id,
            "paymentUrl": f"https://payments.cacargroup.com/pay/{payment_link_id}",
            "amount": amount,
            "currency": currency,
            "customerEmail": customer_email,
            "roNumber": ro_number,
            "expiresAt": "2025-01-16T10:30:00Z",
            "status": "ACTIVE"
        },
        "timestamp": "2025-01-15T10:30:00Z",
        "message": f"Payment link created for {currency} {amount} sent to {customer_email}",
        "mcp_server": "payment-server-3002"
    }

@function_tool
def analyze_multi_domain_request(query: str) -> WorkflowPlan:
    """Analyze a complex query and create a DEFENSIVE workflow plan with comprehensive validation"""
    # This simulates the LLM's analysis of the request with defensive validation
    if "add part" in query.lower() and "payment link" in query.lower():
        steps = [
            # VALIDATION PHASE - All entities must be validated first
            WorkflowStep(
                step_id="validate_1",
                agent_type="repair_orders",
                action="validate_repair_order",
                parameters={"ro_number": "RO_001"}
            ),
            WorkflowStep(
                step_id="validate_2",
                agent_type="parts",
                action="validate_part_exists",
                parameters={"part_number": "PART_001"},
                dependencies=["validate_1"]
            ),
            # EXECUTION PHASE - Only after ALL validations pass
            WorkflowStep(
                step_id="execute_1",
                agent_type="parts",
                action="add_part_to_order",
                parameters={"ro_number": "RO_001", "part_number": "PART_001", "quantity": 1},
                dependencies=["validate_5"]
            ),
            WorkflowStep(
                step_id="execute_2",
                agent_type="payment",
                action="create_payment_link",
                parameters={"ro_number": "RO_001", "amount": 100.0, "customer_email": "abc@gmail.com", "currency": "USD"},
                dependencies=["execute_1"]
            )
        ]

        return WorkflowPlan(
            request_id="REQ_001_DEFENSIVE",
            original_query=query,
            steps=steps,
            execution_order=["validate_1", "validate_2", "execute_1", "execute_2"]
        )
    
    # Default single-step plan
    return WorkflowPlan(
        request_id="REQ_002",
        original_query=query,
        steps=[WorkflowStep(
            step_id="step_1",
            agent_type="general",
            action="handle_query",
            parameters={"query": query}
        )],
        execution_order=["step_1"]
    )

# Triage Agent - Define first to avoid circular reference issues
triage_agent = Agent(
    name="Automotive Triage Agent",
    instructions="""You are an automotive service triage agent.

    Your role:
    1. Analyze incoming requests to determine if they require multi-domain operations
    2. For multi-domain queries, use the tools to create a workflow plan
    3. Hand off to appropriate specialist agents (repair orders, parts, payment) for execution
    4. In case of multi-step Workflow, orchestrate on the Specialist Agents handoff response and execute the next step
    5, In case of multi-step Workflow, handoff to single agent at a time""",
    tools=[analyze_multi_domain_request],
    handoffs=[]  # Will be set after other agents are defined
)

# Specialized Domain Agents
repair_orders_agent = Agent(
    name="Repair Orders Specialist",
    instructions="""You are a repair orders specialist. You handle:
    - Verifying repair order existence and status
    - Adding parts to repair orders
    - Updating repair order information
    - You can execute only 1 tool at a time and then you handoff to triage Agent with your output""",
    tools=[get_repair_order_details, add_part_to_repair_order],
    handoffs=[triage_agent]
)

parts_agent = Agent(
    name="Parts Specialist",
    instructions="""You are a parts inventory specialist. You handle:
    - Validating part existence and details
    - You can execute only 1 tool at a time and then you handoff to triage Agent with your output""",
    tools=[get_part_by_number],
    handoffs=[triage_agent]
)

payment_agent = Agent(
    name="Payment Specialist",
    instructions="""You are a payment processing specialist. You handle:
    - Creating payment links
    - You can execute only 1 tool at a time and then you handoff to triage Agent with your output
    Always validate email addresses and amounts.""",
    tools=[create_payment_link],
    handoffs=[triage_agent]
)

# Update triage agent handoffs now that other agents are defined
triage_agent.handoffs = [repair_orders_agent, parts_agent, payment_agent]

async def execute_multi_domain_workflow(query: str, max_turns: int = 5) -> Dict[str, Any]:
    """Execute a multi-domain workflow with the triage agent"""
    print(f"🔄 Starting Multi-Domain Workflow Analysis")
    print(f"Query: {query}")
    print(f"Max Turns: {max_turns}")
    print("=" * 60)
    
    # Use the triage agent with max_turns to analyze and plan the workflow
    result = await Runner.run(
        triage_agent, 
        f"Analyze this request and create a workflow plan: {query}",
        max_turns=max_turns
    )
    
    print(f"🧠 Triage Agent Analysis Complete")
    print(f"Agent Response: {result.final_output}")
    print("=" * 60)
    
 
async def main():
    """Main function demonstrating multi-agent workflow with agent loop"""
    print("🚗 Automotive Multi-Agent Workflow Demo")
    print("OpenAI Agents SDK with Agent Loop and Workflow Planning")
    print("=" * 60)
    
    # Complex multi-domain query
    complex_query = "Add partNumber PART_001 to Repair order number RO_001, and send payment link of 100$ to abc@gmail.com"
    
    # Execute with max_turns=5 to allow the agent loop to work
    await execute_multi_domain_workflow(complex_query, max_turns=10)
    
if __name__ == "__main__":
    asyncio.run(main())
