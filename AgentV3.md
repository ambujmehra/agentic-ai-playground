# Automotive Retail Agent System V3 - OpenAI Agents SDK with Triage & Guardrails

## Executive Summary

Advanced decentralized microservice architecture using **OpenAI Agents SDK** with a **Triage Agent** as the central coordinator, specialized **Domain Agents** as handoff targets, and integrated **Guardrails Agent** for safety and compliance. Each agent runs as an independent microservice using OpenAI's agent framework with built-in handoff capabilities.

## Key Innovations in V3

1. **OpenAI Agents SDK Integration**: Native agent framework with built-in handoffs
2. **Triage Agent Pattern**: Central routing agent that determines appropriate specialist
3. **Guardrails Integration**: Safety and compliance checks at every handoff
4. **Decentralized Microservices**: Each agent as independent service with SDK
5. **Agent-to-Agent Handoffs**: Direct communication between specialized agents
6. **Context Preservation**: Seamless context transfer across agent handoffs

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway & Load Balancer                 │
│                         (Port 8080)                            │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTP/WebSocket
┌─────────────────────▼───────────────────────────────────────────┐
│                  Triage Agent Service                           │
│                    (Port 8090)                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ OpenAI      │  │ Request     │  │ Handoff     │             │
│  │ Agent SDK   │  │ Classifier  │  │ Manager     │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│  ┌─────────────┐  ┌─────────────┐                              │
│  │ Guardrails  │  │ Context     │                              │
│  │ Integration │  │ Manager     │                              │
│  └─────────────┘  └─────────────┘                              │
└─────────────────────┬───────────────────────────────────────────┘
                      │ Agent Handoffs
         ┌────────────┼────────────┐
         │            │            │
┌────────▼──────────┐ │  ┌────────▼──────────┐
│  Payment Agent    │ │  │   Parts Agent     │
│   Service         │ │  │    Service        │
│  (Port 8091)      │ │  │   (Port 8092)     │
│                   │ │  │                   │
│ ┌───────────────┐ │ │  │ ┌───────────────┐ │
│ │ OpenAI Agent  │ │ │  │ │ OpenAI Agent  │ │
│ │ SDK + Tools   │ │ │  │ │ SDK + Tools   │ │
│ └───────────────┘ │ │  │ └───────────────┘ │
│ ┌───────────────┐ │ │  │ ┌───────────────┐ │
│ │ Guardrails    │ │ │  │ │ Guardrails    │ │
│ │ Client        │ │ │  │ │ Client        │ │
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
              │ (Port 8093)    │
              │                │
              │ ┌────────────┐ │
              │ │OpenAI Agent│ │
              │ │SDK + Tools │ │
              │ └────────────┘ │
              │ ┌────────────┐ │
              │ │Guardrails  │ │
              │ │Client      │ │
              │ └────────────┘ │
              └───────┬────────┘
                      │
              ┌───────▼────────┐
              │ Repair Orders  │
              │ MCP Server     │
              │ (Port 3003)    │
              └────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  Guardrails Agent Service                       │
│                       (Port 8094)                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ OpenAI      │  │ Safety      │  │ Compliance  │             │
│  │ Agent SDK   │  │ Validator   │  │ Checker     │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│  ┌─────────────┐  ┌─────────────┐                              │
│  │ Risk        │  │ Audit       │                              │
│  │ Assessor    │  │ Logger      │                              │
│  └─────────────┘  └─────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

## Core Data Models V3

### OpenAI Agent Models

```python
from openai import OpenAI
from openai.agents import Agent, Handoff, Tool
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime
import asyncio

class TriageRequest(BaseModel):
    """Request to triage agent"""
    request_id: str
    user_query: str
    user_context: Optional[Dict[str, Any]] = None
    priority: Optional[str] = "normal"  # low, normal, high, urgent
    channel: Optional[str] = "api"  # api, web, mobile, voice

class AgentHandoffContext(BaseModel):
    """Context passed during agent handoffs"""
    request_id: str
    original_query: str
    triage_analysis: Dict[str, Any]
    previous_agent_results: List[Dict[str, Any]] = []
    user_context: Dict[str, Any] = {}
    guardrails_checks: List[Dict[str, Any]] = []
    handoff_reason: str
    target_agent: str

class GuardrailsCheck(BaseModel):
    """Guardrails validation result"""
    check_id: str
    check_type: str  # safety, compliance, risk, business_rules
    status: str  # passed, failed, warning
    message: str
    risk_level: str  # low, medium, high, critical
    recommendations: List[str] = []
    timestamp: datetime

class AgentResponse(BaseModel):
    """Standardized agent response"""
    agent_name: str
    request_id: str
    success: bool
    result: Any
    explanation: str
    guardrails_checks: List[GuardrailsCheck]
    next_handoff: Optional[str] = None
    handoff_context: Optional[AgentHandoffContext] = None
    execution_time: float
    timestamp: datetime
```

## Triage Agent Service (Port 8090)

### Core Triage Agent Implementation

```python
from openai.agents import Agent, Handoff
import httpx
import json

class TriageAgentService:
    """Central triage agent using OpenAI Agents SDK"""
    
    def __init__(self, openai_api_key: str, guardrails_endpoint: str):
        self.openai_client = OpenAI(api_key=openai_api_key)
        self.guardrails_endpoint = guardrails_endpoint
        
        # Define handoff targets
        self.payment_handoff = Handoff(
            name="payment_agent",
            description="Handle payment processing, refunds, and billing operations",
            endpoint="http://localhost:8091/handoff"
        )
        
        self.parts_handoff = Handoff(
            name="parts_agent", 
            description="Manage parts inventory, compatibility, and reservations",
            endpoint="http://localhost:8092/handoff"
        )
        
        self.repair_orders_handoff = Handoff(
            name="repair_orders_agent",
            description="Create, update, and manage automotive repair orders",
            endpoint="http://localhost:8093/handoff"
        )
        
        # Initialize triage agent with OpenAI SDK
        self.agent = Agent(
            name="automotive_triage_agent",
            model="gpt-4",
            instructions=self._get_triage_instructions(),
            tools=[
                self._create_analyze_request_tool(),
                self._create_guardrails_check_tool(),
                self._create_context_enrichment_tool()
            ],
            handoffs=[
                self.payment_handoff,
                self.parts_handoff, 
                self.repair_orders_handoff
            ]
        )
        
        # Setup FastAPI app
        self.app = FastAPI(title="Triage Agent Service V3")
        self.setup_routes()
    
    def _get_triage_instructions(self) -> str:
        return """
        You are an expert automotive service triage agent with DEFENSIVE VALIDATION capabilities. Your role is to:

        1. **VALIDATE ALL ENTITIES FIRST** - Before any operations, validate all entities exist and are accessible
        2. **Analyze incoming requests** and determine the appropriate specialist agent
        3. **Run comprehensive guardrails checks** before any handoffs to ensure safety and compliance
        4. **Enrich context** with relevant automotive domain knowledge
        5. **Route requests** to the most appropriate domain agent
        6. **Coordinate multi-agent workflows** when requests span multiple domains

        MANDATORY VALIDATION SEQUENCE (Execute in this order):

        For ANY request involving:

        **REPAIR ORDERS**:
        - Step 1: Validate repair order exists using get_repair_order_details()
        - Step 2: Check repair order status is valid for requested operation
        - Step 3: Verify customer authorization and permissions

        **PARTS**:
        - Step 1: Validate part number exists using get_part_by_number()
        - Step 2: Check part availability using check_part_availability()
        - Step 3: Verify part compatibility with repair order vehicle
        - Step 4: Confirm sufficient inventory for requested quantity

        **PAYMENTS**:
        - Step 1: Validate email format and domain
        - Step 2: Verify amount is within acceptable limits (0 < amount <= 999999999)
        - Step 3: Check currency is supported (INR, USD, EUR, GBP)
        - Step 4: Confirm repair order total matches payment amount

        **EXECUTION PLAN FOR COMPLEX QUERY**:
        "Add partNumber PART_001 to Repair order number RO_001, and send payment link of 100$ to abc@gmail.com"

        DEFENSIVE VALIDATION STEPS:
        1. **Validate Repair Order**: get_repair_order_details("RO_001")
           - Confirm RO_001 exists and is accessible
           - Check status allows modifications (not COMPLETED/CANCELLED)
           - Verify customer authorization

        2. **Validate Part Availability**:
           - get_part_by_number("PART_001") - Confirm part exists
           - check_part_availability("PART_001", quantity=1) - Check inventory
           - Verify part compatibility with RO_001 vehicle

        3. **Validate Payment Parameters**:
           - Email: abc@gmail.com (format validation)
           - Amount: $100 (currency conversion to INR if needed)
           - Verify amount matches or is reasonable for part cost

        4. **Execute Operations** (only after ALL validations pass):
           - add_part_to_repair_order("RO_001", "PART_001", 1)
           - create_payment_link("RO_001", 100, "abc@gmail.com")

        ROUTING RULES:
        - Payment-related queries → payment_agent (after validation)
        - Parts/inventory queries → parts_agent (after validation)
        - Repair order operations → repair_orders_agent (after validation)
        - Multi-domain requests → Sequential validation then execution

        ERROR HANDLING:
        - If ANY validation fails, STOP immediately and report the specific failure
        - Provide clear error messages with remediation steps
        - NEVER proceed with partial operations if validations fail
        - Always run guardrails checks before handoffs

        ALWAYS be defensive and validate before acting. Better to over-validate than cause data corruption.
        """
    
    def _create_analyze_request_tool(self) -> Tool:
        """Tool to analyze and classify incoming requests"""
        
        async def analyze_request(query: str, context: dict = None) -> dict:
            """Analyze user request and determine routing strategy"""
            
            analysis_prompt = f"""
            Analyze this automotive service request and determine routing:
            
            REQUEST: "{query}"
            CONTEXT: {json.dumps(context, indent=2) if context else "None"}
            
            Classify the request and provide routing recommendation:
            {{
              "primary_domain": "payment|parts|repair_orders",
              "secondary_domains": ["list", "of", "other", "domains"],
              "complexity": "simple|moderate|complex",
              "risk_level": "low|medium|high",
              "requires_multi_agent": true/false,
              "routing_strategy": "direct|sequential|parallel",
              "explanation": "Why this routing was chosen"
            }}
            """
            
            response = await self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": analysis_prompt}],
                response_format={"type": "json_object"}
            )
            
            return json.loads(response.choices[0].message.content)
        
        return Tool(
            name="analyze_request",
            description="Analyze and classify automotive service requests",
            function=analyze_request
        )
    
    def _create_guardrails_check_tool(self) -> Tool:
        """Tool to run guardrails validation"""
        
        async def run_guardrails_check(
            request_type: str, 
            request_data: dict,
            target_agent: str
        ) -> List[GuardrailsCheck]:
            """Run comprehensive guardrails checks"""
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.guardrails_endpoint}/validate",
                    json={
                        "request_type": request_type,
                        "request_data": request_data,
                        "target_agent": target_agent,
                        "validation_level": "comprehensive"
                    }
                )
                response.raise_for_status()
                
                checks_data = response.json()
                return [GuardrailsCheck(**check) for check in checks_data["checks"]]
        
        return Tool(
            name="run_guardrails_check",
            description="Validate requests against safety and compliance rules",
            function=run_guardrails_check
        )
```

## Domain Agent Services

### Payment Agent Service (Port 8091)

```python
import httpx
from openai.agents import Agent, Tool, Handoff
from mcp import ClientSession, StdioServerParameters
import asyncio

class PaymentAgentService:
    """Payment specialist agent using OpenAI Agents SDK with MCP integration"""

    def __init__(self, openai_api_key: str, guardrails_endpoint: str):
        self.mcp_endpoint = "http://localhost:3002"
        self.guardrails_endpoint = guardrails_endpoint
        self.mcp_client = None
        self.mcp_session = None

        # Initialize MCP connection to Payment Server (Port 3002)
        self._setup_mcp_connection()

        # Initialize payment agent with MCP tools
        self.agent = Agent(
            name="payment_specialist_agent",
            model="gpt-4",
            instructions=self._get_payment_instructions(),
            tools=self._get_payment_mcp_tools(),
            handoffs=[
                Handoff(
                    name="back_to_triage",
                    description="Return to triage for multi-domain requests",
                    endpoint="http://localhost:8090/handoff"
                )
            ]
        )

        self.app = FastAPI(title="Payment Agent Service V3")
        self.setup_routes()

    async def _initialize_mcp_client(self):
        """Initialize MCP client using official modelcontextprotocol SDK"""
        try:
            from modelcontextprotocol import Client
            from modelcontextprotocol.client.http import HTTPClientTransport

            # Create HTTP transport for MCP communication using JSON-RPC 2.0
            transport = HTTPClientTransport(
                url=f"{self.mcp_endpoint}/mcp",
                headers={
                    "Content-Type": "application/json",
                    "X-Tenant-Id": "cacargroup",
                    "X-Dealer-Id": "5",
                    "X-User-Id": "payment-agent-v3",
                    "X-Locale": "en-US"
                }
            )

            # Initialize MCP client
            self.mcp_client = Client(
                name="payment-agent-v3",
                version="1.0.0"
            )

            # Connect to MCP server
            await self.mcp_client.connect(transport)

            # Verify connection by listing available tools
            tools = await self.mcp_client.list_tools()
            print(f"✅ Payment MCP Client connected. Available tools: {len(tools.tools)}")

        except Exception as e:
            print(f"❌ Failed to initialize Payment MCP client: {e}")
            raise

    def _get_payment_mcp_tools(self) -> List[Tool]:
        """Get MCP tools from Payment Server (Port 3002) - 18 Tools Total"""
        return [
            # Transaction Tools (11 tools)
            Tool(
                name="get_transactions_list",
                description="Get paginated list of transactions with sorting",
                function=self._get_transactions_list_tool
            ),
            Tool(
                name="get_transaction_by_id",
                description="Get specific transaction by ID",
                function=self._get_transaction_by_id_tool
            ),
            Tool(
                name="create_transaction",
                description="Create new payment transaction",
                function=self._create_transaction_tool
            ),
            Tool(
                name="update_transaction_status",
                description="Update transaction status",
                function=self._update_transaction_status_tool
            ),
            Tool(
                name="process_transaction",
                description="Process pending transaction",
                function=self._process_transaction_tool
            ),
            Tool(
                name="get_transactions_by_customer",
                description="Get customer's transaction history",
                function=self._get_transactions_by_customer_tool
            ),
            Tool(
                name="get_transactions_by_status",
                description="Filter transactions by status",
                function=self._get_transactions_by_status_tool
            ),
            Tool(
                name="get_transactions_by_payment_type",
                description="Filter transactions by payment type",
                function=self._get_transactions_by_payment_type_tool
            ),
            Tool(
                name="get_transactions_by_card_type",
                description="Filter transactions by card type",
                function=self._get_transactions_by_card_type_tool
            ),
            Tool(
                name="get_all_card_types",
                description="Get available card types (VISA, MASTERCARD, etc.)",
                function=self._get_all_card_types_tool
            ),
            Tool(
                name="get_all_payment_types",
                description="Get available payment types (CREDIT_CARD, UPI, etc.)",
                function=self._get_all_payment_types_tool
            ),
            # Payment Link Tools (7 tools)
            Tool(
                name="get_payment_links_list",
                description="Get paginated list of payment links",
                function=self._get_payment_links_list_tool
            ),
            Tool(
                name="get_payment_link_by_id",
                description="Get specific payment link by ID",
                function=self._get_payment_link_by_id_tool
            ),
            Tool(
                name="create_payment_link",
                description="Create secure payment URLs for invoices",
                function=self._create_payment_link_tool
            ),
            Tool(
                name="update_payment_link",
                description="Update payment link (currently not supported)",
                function=self._update_payment_link_tool
            ),
            Tool(
                name="process_payment_link",
                description="Process payment link",
                function=self._process_payment_link_tool
            ),
            Tool(
                name="cancel_payment_link",
                description="Cancel payment link",
                function=self._cancel_payment_link_tool
            ),
            Tool(
                name="get_payment_links_by_status",
                description="Filter payment links by status",
                function=self._get_payment_links_by_status_tool
            )
        ]

    # ==================== ACTUAL MCP TOOL IMPLEMENTATIONS ====================

    async def _get_transactions_list_tool(
        self,
        page: int = 0,
        size: int = 10
    ) -> dict:
        """MCP Tool: Get paginated transactions list via Payment MCP Server (Port 3002)"""
        try:
            # Use official modelcontextprotocol SDK for MCP communication
            result = await self.mcp_client.call_tool(
                name="get_transactions_list",
                arguments={
                    "page": page,
                    "size": size
                }
            )

            return {
                "success": True,
                "tool": "get_transactions_list",
                "result": result.get("content", [{}])[0].get("text", {}),
                "mcp_server": "payment-server-3002"
            }
        except Exception as e:
            return {
                "success": False,
                "error": "MCP Tool Call Failed",
                "message": f"Failed to call get_transactions_list: {str(e)}",
                "tool": "get_transactions_list",
                "mcp_server": "payment-server-3002"
            }

    async def _create_payment_link_tool(
        self,
        repair_order_id: str,
        amount: float,
        customer_email: str,
        currency: str = "INR",
        expiry_hours: int = 24
    ) -> dict:
        """MCP Tool: Create payment link via Payment MCP Server (Port 3002)"""
        try:
            # Client-side validation before MCP call
            if amount <= 0 or amount > 999999999:
                return {
                    "success": False,
                    "error": "Invalid Amount",
                    "message": "Payment amount must be between 0 and 999999999",
                    "tool": "create_payment_link"
                }

            import re
            email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
            if not customer_email or not re.match(email_regex, customer_email):
                return {
                    "success": False,
                    "error": "Invalid Email",
                    "message": "Valid customer email is required",
                    "tool": "create_payment_link"
                }

            # Use official modelcontextprotocol SDK for MCP communication
            result = await self.mcp_client.call_tool(
                name="create_payment_link",
                arguments={
                    "invoiceId": f"INV_{repair_order_id}",
                    "invoiceNumber": f"INV-{repair_order_id}-{int(amount)}",
                    "customerEmail": customer_email,
                    "amount": amount,
                    "currency": currency.upper(),
                    "description": f"Payment for Repair Order {repair_order_id}",
                    "expiryHours": expiry_hours
                }
            )

            return {
                "success": True,
                "tool": "create_payment_link",
                "result": result.get("content", [{}])[0].get("text", {}),
                "repair_order_id": repair_order_id,
                "message": f"Payment link created successfully for {currency} {amount}",
                "mcp_server": "payment-server-3002"
            }
        except Exception as e:
            return {
                "success": False,
                "error": "MCP Tool Call Failed",
                "message": f"Failed to call create_payment_link: {str(e)}",
                "tool": "create_payment_link",
                "mcp_server": "payment-server-3002"
            }

    async def _process_transaction_tool(
        self,
        transaction_id: str,
        payment_method: str = "CREDIT_CARD"
    ) -> dict:
        """MCP Tool: Process pending transaction via Payment Server (Port 3002)"""
        async with httpx.AsyncClient(timeout=45.0) as client:
            try:
                response = await client.post(
                    f"{self.mcp_endpoint}/mcp/process_transaction",
                    json={
                        "transactionId": transaction_id,
                        "paymentMethod": payment_method,
                        "processingOptions": {
                            "autoCapture": True,
                            "sendNotification": True,
                            "updateInventory": True
                        }
                    },
                    headers={
                        "Content-Type": "application/json",
                        "X-MCP-Client": "payment-agent-v3",
                        "X-Request-ID": f"process-txn-{transaction_id}"
                    }
                )
                response.raise_for_status()

                result = response.json()
                return {
                    "success": True,
                    "transaction_id": result.get("transactionId"),
                    "status": result.get("status"),
                    "amount_processed": result.get("amount"),
                    "payment_method": result.get("paymentMethod"),
                    "confirmation_code": result.get("confirmationCode"),
                    "processed_at": result.get("processedAt"),
                    "message": f"Transaction {transaction_id} processed successfully",
                    "mcp_server": "payment-server-3002"
                }
            except httpx.HTTPStatusError as e:
                return {
                    "success": False,
                    "error": f"Processing Failed: {e.response.status_code}",
                    "message": f"Transaction processing failed: {e.response.text}",
                    "transaction_id": transaction_id,
                    "mcp_server": "payment-server-3002"
                }
            except Exception as e:
                return {
                    "success": False,
                    "error": "Connection Error",
                    "message": f"Failed to process transaction: {str(e)}",
                    "transaction_id": transaction_id,
                    "mcp_server": "payment-server-3002"
                }

    async def _check_payment_status_tool(self, payment_id: str = None, repair_order_id: str = None) -> dict:
        """MCP Tool: Check payment status via Payment Server (Port 3002)"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.mcp_endpoint}/mcp/check_payment_status",
                json={
                    "payment_id": payment_id,
                    "repair_order_id": repair_order_id
                }
            )
            response.raise_for_status()
            return response.json()

    async def _process_refund_tool(self, payment_id: str, refund_amount: float, reason_code: str) -> dict:
        """MCP Tool: Process refund via Payment Server (Port 3002)"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.mcp_endpoint}/mcp/process_refund",
                json={
                    "payment_id": payment_id,
                    "refund_amount": refund_amount,
                    "reason_code": reason_code
                }
            )
            response.raise_for_status()
            return response.json()

    async def _send_payment_notification_tool(
        self,
        customer_email: str,
        repair_order_id: str,
        message_type: str
    ) -> dict:
        """MCP Tool: Send payment notification via Payment Server (Port 3002)"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.mcp_endpoint}/mcp/send_payment_notification",
                json={
                    "customer_email": customer_email,
                    "repair_order_id": repair_order_id,
                    "message_type": message_type
                }
            )
            response.raise_for_status()
            return response.json()

    async def _get_payment_methods_tool(self, customer_id: str) -> dict:
        """MCP Tool: Get payment methods via Payment Server (Port 3002)"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.mcp_endpoint}/mcp/get_payment_methods",
                json={"customer_id": customer_id}
            )
            response.raise_for_status()
            return response.json()

    async def _validate_payment_data_tool(
        self,
        email: str,
        amount: float,
        currency: str,
        repair_order_id: str
    ) -> dict:
        """MCP Tool: Validate payment data via Payment Server (Port 3002)"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.mcp_endpoint}/mcp/validate_payment_data",
                json={
                    "email": email,
                    "amount": amount,
                    "currency": currency,
                    "repair_order_id": repair_order_id
                }
            )
            response.raise_for_status()
            return response.json()

    def _get_payment_instructions(self) -> str:
        return """
        You are a payment processing specialist for automotive services. You handle:

        - Transaction management and processing
        - Payment link creation and management
        - Payment status verification and tracking
        - Customer payment history and analytics
        - Payment method and card type management

        AVAILABLE MCP TOOLS (Payment Server - Port 3002) - 18 Tools Total:

        TRANSACTION TOOLS (11 tools):
        1. get_transactions_list(page, size, sortBy, sortDirection) - List all transactions
        2. get_transaction_by_id(id) - Get specific transaction
        3. create_transaction(invoiceId, invoiceNumber, customerId, customerEmail, amount, currency, paymentType, cardType, description) - Create transaction
        4. update_transaction_status(id, status) - Update transaction status
        5. process_transaction(id) - Process pending transaction
        6. get_transactions_by_customer(customerId, page, size) - Customer transaction history
        7. get_transactions_by_status(status, page, size) - Filter by status
        8. get_transactions_by_payment_type(paymentType, page, size) - Filter by payment type
        9. get_transactions_by_card_type(cardType, page, size) - Filter by card type
        10. get_all_card_types() - Get available card types
        11. get_all_payment_types() - Get available payment types

        PAYMENT LINK TOOLS (7 tools):
        12. get_payment_links_list(page, size, sortBy, sortDirection) - List payment links
        13. get_payment_link_by_id(id) - Get specific payment link
        14. create_payment_link(invoiceId, invoiceNumber, customerEmail, amount, currency, description, expiryHours) - Create payment link
        15. update_payment_link(id, updates) - Update payment link
        16. process_payment_link(id) - Process payment link
        17. cancel_payment_link(id) - Cancel payment link
        18. get_payment_links_by_status(status, page, size) - Filter by status

        ALWAYS validate inputs and run guardrails before processing payments.
        Use MCP tools for actual payment operations with the Payment Server.
        Provide clear explanations of all payment actions.

        For multi-domain requests, coordinate handoffs back to triage.
        """

### Parts Agent Service (Port 8092)

```python
class PartsAgentService:
    """Parts specialist agent using OpenAI Agents SDK with MCP integration"""

    def __init__(self, openai_api_key: str, guardrails_endpoint: str):
        self.mcp_endpoint = "http://localhost:3005"
        self.guardrails_endpoint = guardrails_endpoint
        self.mcp_session = None

        # Initialize MCP connection to Parts Server (Port 3005)
        self._setup_mcp_connection()

        # Initialize parts agent with MCP tools
        self.agent = Agent(
            name="parts_specialist_agent",
            model="gpt-4",
            instructions=self._get_parts_instructions(),
            tools=self._get_parts_mcp_tools(),
            handoffs=[
                Handoff(
                    name="back_to_triage",
                    description="Return to triage for multi-domain requests",
                    endpoint="http://localhost:8090/handoff"
                )
            ]
        )

        self.app = FastAPI(title="Parts Agent Service V3")
        self.setup_routes()

    def _setup_mcp_connection(self):
        """Setup MCP connection to Parts Server on port 3005"""
        self.mcp_session = ClientSession(
            StdioServerParameters(
                command="python",
                args=["-m", "parts_mcp_server"],
                env={"MCP_SERVER_PORT": "3005"}
            )
        )

    def _get_parts_mcp_tools(self) -> List[Tool]:
        """Get MCP tools from Parts Server (Port 3005) - 15 Tools Total"""
        return [
            Tool(
                name="list_parts",
                description="Get paginated list of all parts with sorting",
                function=self._list_parts_tool
            ),
            Tool(
                name="get_part",
                description="Get specific part by ID",
                function=self._get_part_tool
            ),
            Tool(
                name="get_part_by_number",
                description="Get part by part number",
                function=self._get_part_by_number_tool
            ),
            Tool(
                name="create_part",
                description="Create new part in inventory",
                function=self._create_part_tool
            ),
            Tool(
                name="update_part",
                description="Update existing part information",
                function=self._update_part_tool
            ),
            Tool(
                name="delete_part",
                description="Delete part from inventory",
                function=self._delete_part_tool
            ),
            Tool(
                name="get_parts_by_category",
                description="Filter parts by category",
                function=self._get_parts_by_category_tool
            ),
            Tool(
                name="get_parts_by_manufacturer",
                description="Filter parts by manufacturer/brand",
                function=self._get_parts_by_manufacturer_tool
            ),
            Tool(
                name="get_low_stock_parts",
                description="Get parts below stock threshold",
                function=self._get_low_stock_parts_tool
            ),
            Tool(
                name="update_part_stock",
                description="Update part stock quantities",
                function=self._update_part_stock_tool
            ),
            Tool(
                name="search_parts",
                description="Advanced parts search with multiple criteria",
                function=self._search_parts_tool
            ),
            Tool(
                name="get_parts_by_price_range",
                description="Filter parts by price range",
                function=self._get_parts_by_price_range_tool
            ),
            Tool(
                name="get_parts_by_supplier",
                description="Filter parts by supplier",
                function=self._get_parts_by_supplier_tool
            ),
            Tool(
                name="bulk_update_part_prices",
                description="Bulk update part pricing",
                function=self._bulk_update_part_prices_tool
            ),
            Tool(
                name="get_part_inventory_value",
                description="Calculate total inventory value",
                function=self._get_part_inventory_value_tool
            )
        ]

    # ==================== ACTUAL MCP TOOL IMPLEMENTATIONS ====================

    async def _list_parts_tool(
        self,
        page: int = 1,
        size: int = 20,
        sort_by: str = "partNumber",
        sort_direction: str = "asc"
    ) -> dict:
        """MCP Tool: Get paginated parts list via Parts Server (Port 3005)"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(
                    f"{self.mcp_endpoint}/mcp/list_parts",
                    json={
                        "page": page,
                        "size": size,
                        "sortBy": sort_by,
                        "sortDirection": sort_direction,
                        "includeOutOfStock": False,
                        "includeDiscontinued": False
                    },
                    headers={
                        "Content-Type": "application/json",
                        "X-MCP-Client": "parts-agent-v3",
                        "X-Request-ID": f"list-parts-{page}-{size}"
                    }
                )
                response.raise_for_status()

                result = response.json()
                return {
                    "success": True,
                    "parts": result.get("parts", []),
                    "pagination": {
                        "page": result.get("page", page),
                        "size": result.get("size", size),
                        "total": result.get("total", 0),
                        "total_pages": result.get("totalPages", 0)
                    },
                    "filters_applied": {
                        "in_stock_only": True,
                        "active_only": True
                    },
                    "mcp_server": "parts-server-3005",
                    "execution_time": result.get("executionTime", 0)
                }
            except httpx.HTTPStatusError as e:
                return {
                    "success": False,
                    "error": f"MCP Server Error: {e.response.status_code}",
                    "message": f"Failed to fetch parts list: {e.response.text}",
                    "mcp_server": "parts-server-3005"
                }
            except Exception as e:
                return {
                    "success": False,
                    "error": "Connection Error",
                    "message": f"Failed to connect to Parts MCP Server: {str(e)}",
                    "mcp_server": "parts-server-3005"
                }

    async def _get_part_by_number_tool(
        self,
        part_number: str
    ) -> dict:
        """MCP Tool: Get part by part number via Parts Server (Port 3005)"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                # Validate part number format
                if not part_number or len(part_number.strip()) == 0:
                    return {
                        "success": False,
                        "error": "Invalid Part Number",
                        "message": "Part number is required and cannot be empty",
                        "tool": "get_part_by_number"
                    }

                # Use correct HTTP endpoint for MCP tool execution
                response = await client.post(
                    f"{self.mcp_endpoint}/mcp/tools/get_part_by_number",
                    json={
                        "partNumber": part_number.strip()
                    },
                    headers={
                        "Content-Type": "application/json",
                        "X-Tenant-Id": "cacargroup",
                        "X-Dealer-Id": "5",
                        "X-User-Id": "parts-agent-v3",
                        "X-Locale": "en-US"
                    }
                )
                response.raise_for_status()

                result = response.json()
                return {
                    "success": True,
                    "tool": "get_part_by_number",
                    "result": result.get("result", {}),
                    "timestamp": result.get("timestamp"),
                    "part_number": part_number,
                    "mcp_server": "parts-server-3005"
                }
            except httpx.HTTPStatusError as e:
                return {
                    "success": False,
                    "error": f"Part Not Found: {e.response.status_code}",
                    "message": f"Part {part_number} not found: {e.response.text}",
                    "tool": "get_part_by_number",
                    "part_number": part_number,
                    "mcp_server": "parts-server-3005"
                }
            except Exception as e:
                return {
                    "success": False,
                    "error": "Connection Error",
                    "message": f"Failed to get part details: {str(e)}",
                    "tool": "get_part_by_number",
                    "part_number": part_number,
                    "mcp_server": "parts-server-3005"
                }

    async def _search_parts_tool(
        self,
        search_query: str = None,
        vehicle_make: str = None,
        vehicle_model: str = None,
        vehicle_year: int = None,
        part_category: str = None,
        min_price: float = None,
        max_price: float = None
    ) -> dict:
        """MCP Tool: Advanced parts search via Parts Server (Port 3005)"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                search_params = {
                    "term": search_query,
                    "category": part_category,
                    "brand": None,  # Can be added if needed
                    "vehicle": f"{vehicle_make} {vehicle_model} {vehicle_year}".strip() if any([vehicle_make, vehicle_model, vehicle_year]) else None,
                    "minPrice": min_price,
                    "maxPrice": max_price
                }

                # Remove None values
                search_params = {k: v for k, v in search_params.items() if v is not None}

                # Use correct HTTP endpoint for MCP tool execution
                response = await client.post(
                    f"{self.mcp_endpoint}/mcp/tools/search_parts",
                    json=search_params,
                    headers={
                        "Content-Type": "application/json",
                        "X-Tenant-Id": "cacargroup",
                        "X-Dealer-Id": "5",
                        "X-User-Id": "parts-agent-v3",
                        "X-Locale": "en-US"
                    }
                )
                response.raise_for_status()

                result = response.json()
                return {
                    "success": True,
                    "tool": "search_parts",
                    "result": result.get("result", {}),
                    "timestamp": result.get("timestamp"),
                    "search_query": search_query,
                    "message": f"Search completed for query: {search_query}",
                    "mcp_server": "parts-server-3005"
                }
            except httpx.HTTPStatusError as e:
                return {
                    "success": False,
                    "error": f"Search Failed: {e.response.status_code}",
                    "message": f"Parts search failed: {e.response.text}",
                    "tool": "search_parts",
                    "search_query": search_query,
                    "mcp_server": "parts-server-3005"
                }
            except Exception as e:
                return {
                    "success": False,
                    "error": "Connection Error",
                    "message": f"Failed to search parts: {str(e)}",
                    "tool": "search_parts",
                    "search_query": search_query,
                    "mcp_server": "parts-server-3005"
                }

    async def _check_part_availability_tool(
        self,
        part_number: str,
        quantity: int = 1,
        location: str = None
    ) -> dict:
        """MCP Tool: Check part availability via Parts Server (Port 3005)"""
        async with httpx.AsyncClient(timeout=20.0) as client:
            try:
                response = await client.post(
                    f"{self.mcp_endpoint}/mcp/check_part_availability",
                    json={
                        "partNumber": part_number,
                        "requestedQuantity": quantity,
                        "location": location,
                        "checkOptions": {
                            "includeReserved": True,
                            "includeIncoming": True,
                            "includeAlternatives": True
                        }
                    },
                    headers={
                        "Content-Type": "application/json",
                        "X-MCP-Client": "parts-agent-v3",
                        "X-Request-ID": f"check-avail-{part_number}-{quantity}"
                    }
                )
                response.raise_for_status()

                result = response.json()
                return {
                    "success": True,
                    "part_number": part_number,
                    "availability": {
                        "in_stock": result.get("inStock", 0),
                        "available": result.get("available", 0),
                        "reserved": result.get("reserved", 0),
                        "incoming": result.get("incoming", 0),
                        "can_fulfill": result.get("canFulfill", False)
                    },
                    "pricing": {
                        "unit_price": result.get("unitPrice", 0),
                        "total_price": result.get("totalPrice", 0),
                        "currency": result.get("currency", "USD")
                    },
                    "estimated_delivery": result.get("estimatedDelivery"),
                    "alternative_parts": result.get("alternativeParts", []),
                    "message": f"Part {part_number}: {'Available' if result.get('canFulfill') else 'Not Available'}",
                    "mcp_server": "parts-server-3005"
                }
            except httpx.HTTPStatusError as e:
                return {
                    "success": False,
                    "error": f"Availability Check Failed: {e.response.status_code}",
                    "message": f"Failed to check availability: {e.response.text}",
                    "part_number": part_number,
                    "mcp_server": "parts-server-3005"
                }
            except Exception as e:
                return {
                    "success": False,
                    "error": "Connection Error",
                    "message": f"Failed to check part availability: {str(e)}",
                    "part_number": part_number,
                    "mcp_server": "parts-server-3005"
                }

    async def _get_part_details_tool(self, part_number: str) -> dict:
        """MCP Tool: Get part details via Parts Server (Port 3005)"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.mcp_endpoint}/mcp/get_part_details",
                json={"part_number": part_number}
            )
            response.raise_for_status()
            return response.json()

    async def _check_part_availability_tool(self, part_number: str, quantity: int = 1) -> dict:
        """MCP Tool: Check part availability via Parts Server (Port 3005)"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.mcp_endpoint}/mcp/check_part_availability",
                json={
                    "part_number": part_number,
                    "quantity": quantity
                }
            )
            response.raise_for_status()
            return response.json()

    async def _reserve_parts_tool(
        self,
        part_number: str,
        quantity: int,
        repair_order_id: str,
        reservation_duration_hours: int = 24
    ) -> dict:
        """MCP Tool: Reserve parts via Parts Server (Port 3005)"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.mcp_endpoint}/mcp/reserve_parts",
                json={
                    "part_number": part_number,
                    "quantity": quantity,
                    "repair_order_id": repair_order_id,
                    "reservation_duration_hours": reservation_duration_hours
                }
            )
            response.raise_for_status()
            return response.json()

    async def _check_part_compatibility_tool(
        self,
        part_number: str,
        vehicle_make: str,
        vehicle_model: str,
        vehicle_year: int
    ) -> dict:
        """MCP Tool: Check part compatibility via Parts Server (Port 3005)"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.mcp_endpoint}/mcp/check_part_compatibility",
                json={
                    "part_number": part_number,
                    "vehicle_make": vehicle_make,
                    "vehicle_model": vehicle_model,
                    "vehicle_year": vehicle_year
                }
            )
            response.raise_for_status()
            return response.json()

    async def _get_alternative_parts_tool(self, part_number: str, vehicle_info: dict = None) -> dict:
        """MCP Tool: Get alternative parts via Parts Server (Port 3005)"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.mcp_endpoint}/mcp/get_alternative_parts",
                json={
                    "part_number": part_number,
                    "vehicle_info": vehicle_info
                }
            )
            response.raise_for_status()
            return response.json()

    async def _update_part_inventory_tool(
        self,
        part_number: str,
        quantity_change: int,
        operation: str = "reserve"
    ) -> dict:
        """MCP Tool: Update part inventory via Parts Server (Port 3005)"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.mcp_endpoint}/mcp/update_part_inventory",
                json={
                    "part_number": part_number,
                    "quantity_change": quantity_change,
                    "operation": operation  # reserve, release, consume, restock
                }
            )
            response.raise_for_status()
            return response.json()

    async def _get_part_pricing_tool(self, part_number: str, customer_type: str = "retail") -> dict:
        """MCP Tool: Get part pricing via Parts Server (Port 3005)"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.mcp_endpoint}/mcp/get_part_pricing",
                json={
                    "part_number": part_number,
                    "customer_type": customer_type  # retail, wholesale, dealer
                }
            )
            response.raise_for_status()
            return response.json()

    def _get_parts_instructions(self) -> str:
        return """
        You are a parts inventory specialist for automotive services. You handle:

        - Parts catalog management and browsing
        - Inventory tracking and stock management
        - Parts searching and discovery
        - Supplier and manufacturer management
        - Pricing and inventory valuation
        - Parts creation, updates, and deletion

        AVAILABLE MCP TOOLS (Parts Server - Port 3005) - 15 Tools Total:
        1. list_parts(page, size, sortBy, sortDirection) - Get paginated parts list
        2. get_part(id) - Get specific part by ID
        3. get_part_by_number(partNumber) - Get part by part number
        4. create_part(partData) - Create new part in inventory
        5. update_part(id, updates) - Update existing part information
        6. delete_part(id) - Delete part from inventory
        7. get_parts_by_category(category, page, size) - Filter by category
        8. get_parts_by_manufacturer(brand, page, size) - Filter by manufacturer
        9. get_low_stock_parts(threshold, page, size) - Get low stock parts
        10. update_part_stock(id, quantity, adjustment) - Update stock quantities
        11. search_parts(term, category, brand, vehicle, minPrice, maxPrice) - Advanced search
        12. get_parts_by_price_range(minPrice, maxPrice, page, size) - Filter by price
        13. get_parts_by_supplier(supplier, page, size) - Filter by supplier
        14. bulk_update_part_prices(updates) - Bulk price updates
        15. get_part_inventory_value() - Calculate total inventory value

        ALWAYS validate part numbers and IDs before operations.
        Use MCP tools for actual parts operations with the Parts Server.
        Provide detailed part information and availability status.

        For multi-domain requests, coordinate handoffs back to triage.
        """

### Repair Orders Agent Service (Port 8093)

```python
class RepairOrdersAgentService:
    """Repair Orders specialist agent using OpenAI Agents SDK with MCP integration"""

    def __init__(self, openai_api_key: str, guardrails_endpoint: str):
        self.mcp_endpoint = "http://localhost:3003"
        self.guardrails_endpoint = guardrails_endpoint
        self.mcp_session = None

        # Initialize MCP connection to Repair Orders Server (Port 3003)
        self._setup_mcp_connection()

        # Initialize repair orders agent with MCP tools
        self.agent = Agent(
            name="repair_orders_specialist_agent",
            model="gpt-4",
            instructions=self._get_repair_orders_instructions(),
            tools=self._get_repair_orders_mcp_tools(),
            handoffs=[
                Handoff(
                    name="back_to_triage",
                    description="Return to triage for multi-domain requests",
                    endpoint="http://localhost:8090/handoff"
                )
            ]
        )

        self.app = FastAPI(title="Repair Orders Agent Service V3")
        self.setup_routes()

    def _setup_mcp_connection(self):
        """Setup MCP connection to Repair Orders Server on port 3003"""
        self.mcp_session = ClientSession(
            StdioServerParameters(
                command="python",
                args=["-m", "repair_orders_mcp_server"],
                env={"MCP_SERVER_PORT": "3003"}
            )
        )

    def _get_repair_orders_mcp_tools(self) -> List[Tool]:
        """Get MCP tools from Repair Orders Server (Port 3003) - 12 Tools Total"""
        return [
            Tool(
                name="list_repair_orders",
                description="Get paginated list of repair orders with sorting",
                function=self._list_repair_orders_tool
            ),
            Tool(
                name="get_repair_order",
                description="Get specific repair order by ID",
                function=self._get_repair_order_tool
            ),
            Tool(
                name="get_repair_order_by_number",
                description="Get repair order by RO number",
                function=self._get_repair_order_by_number_tool
            ),
            Tool(
                name="create_repair_order",
                description="Create new repair orders for customers",
                function=self._create_repair_order_tool
            ),
            Tool(
                name="update_repair_order",
                description="Update existing repair order information",
                function=self._update_repair_order_tool
            ),
            Tool(
                name="update_repair_order_status",
                description="Update repair order status",
                function=self._update_repair_order_status_tool
            ),
            Tool(
                name="delete_repair_order",
                description="Delete repair order by ID or RO number",
                function=self._delete_repair_order_tool
            ),
            Tool(
                name="get_repair_orders_by_status",
                description="Filter repair orders by status",
                function=self._get_repair_orders_by_status_tool
            ),
            Tool(
                name="get_repair_orders_by_technician",
                description="Get orders assigned to specific technician",
                function=self._get_repair_orders_by_technician_tool
            ),
            Tool(
                name="get_repair_orders_by_vehicle",
                description="Filter repair orders by vehicle information",
                function=self._get_repair_orders_by_vehicle_tool
            ),
            Tool(
                name="add_part_to_repair_order",
                description="Add parts to existing repair orders",
                function=self._add_part_to_repair_order_tool
            ),
            Tool(
                name="get_repair_order_stats",
                description="Get repair order statistics and counts",
                function=self._get_repair_order_stats_tool
            )
        ]

    # ==================== ACTUAL MCP TOOL IMPLEMENTATIONS ====================

    async def _list_repair_orders_tool(
        self,
        page: int = 1,
        size: int = 15,
        sort_by: str = "createdAt",
        sort_direction: str = "desc"
    ) -> dict:
        """MCP Tool: Get paginated repair orders list via Repair Orders Server (Port 3003)"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(
                    f"{self.mcp_endpoint}/mcp/list_repair_orders",
                    json={
                        "page": page,
                        "size": size,
                        "sortBy": sort_by,
                        "sortDirection": sort_direction,
                        "includeDetails": True,
                        "includeCustomerInfo": True,
                        "includeVehicleInfo": True
                    },
                    headers={
                        "Content-Type": "application/json",
                        "X-MCP-Client": "repair-orders-agent-v3",
                        "X-Request-ID": f"list-ro-{page}-{size}"
                    }
                )
                response.raise_for_status()

                result = response.json()
                return {
                    "success": True,
                    "repair_orders": result.get("repairOrders", []),
                    "pagination": {
                        "page": result.get("page", page),
                        "size": result.get("size", size),
                        "total": result.get("total", 0),
                        "total_pages": result.get("totalPages", 0)
                    },
                    "summary": {
                        "active_orders": result.get("activeOrders", 0),
                        "completed_orders": result.get("completedOrders", 0),
                        "pending_orders": result.get("pendingOrders", 0)
                    },
                    "mcp_server": "repair-orders-server-3003",
                    "execution_time": result.get("executionTime", 0)
                }
            except httpx.HTTPStatusError as e:
                return {
                    "success": False,
                    "error": f"MCP Server Error: {e.response.status_code}",
                    "message": f"Failed to fetch repair orders: {e.response.text}",
                    "mcp_server": "repair-orders-server-3003"
                }
            except Exception as e:
                return {
                    "success": False,
                    "error": "Connection Error",
                    "message": f"Failed to connect to Repair Orders MCP Server: {str(e)}",
                    "mcp_server": "repair-orders-server-3003"
                }

    async def _get_repair_order_details_tool(
        self,
        ro_number: str
    ) -> dict:
        """MCP Tool: Get repair order details via Repair Orders Server (Port 3003)"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                # Validate repair order number format
                if not ro_number or len(ro_number.strip()) == 0:
                    return {
                        "success": False,
                        "error": "Invalid Repair Order Number",
                        "message": "Repair order number is required and cannot be empty",
                        "tool": "get_repair_order_details"
                    }

                # Use correct HTTP endpoint for MCP tool execution
                response = await client.post(
                    f"{self.mcp_endpoint}/mcp/tools/get_repair_order_details",
                    json={
                        "roNumber": ro_number.strip()
                    },
                    headers={
                        "Content-Type": "application/json",
                        "X-Tenant-Id": "cacargroup",
                        "X-Dealer-Id": "5",
                        "X-User-Id": "repair-orders-agent-v3",
                        "X-Locale": "en-US"
                    }
                )
                response.raise_for_status()

                result = response.json()
                return {
                    "success": True,
                    "tool": "get_repair_order_details",
                    "result": result.get("result", {}),
                    "timestamp": result.get("timestamp"),
                    "ro_number": ro_number,
                    "mcp_server": "repair-orders-server-3003"
                }
            except httpx.HTTPStatusError as e:
                return {
                    "success": False,
                    "error": f"Repair Order Not Found: {e.response.status_code}",
                    "message": f"Repair order {ro_number} not found: {e.response.text}",
                    "tool": "get_repair_order_details",
                    "ro_number": ro_number,
                    "mcp_server": "repair-orders-server-3003"
                }
            except Exception as e:
                return {
                    "success": False,
                    "error": "Connection Error",
                    "message": f"Failed to get repair order details: {str(e)}",
                    "tool": "get_repair_order_details",
                    "ro_number": ro_number,
                    "mcp_server": "repair-orders-server-3003"
                }

    async def _create_repair_order_tool(
        self,
        customer_id: str,
        vehicle_id: str,
        service_type: str,
        description: str,
        priority: str = "MEDIUM",
        estimated_hours: float = None,
        parts_required: list = None
    ) -> dict:
        """MCP Tool: Create repair order via Repair Orders Server (Port 3003)"""
        async with httpx.AsyncClient(timeout=45.0) as client:
            try:
                # Validate required parameters
                if not all([customer_id, vehicle_id, service_type, description]):
                    return {
                        "success": False,
                        "error": "Missing Required Parameters",
                        "message": "customer_id, vehicle_id, service_type, and description are required",
                        "tool": "create_repair_order"
                    }

                # Validate priority values
                valid_priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
                if priority.upper() not in valid_priorities:
                    return {
                        "success": False,
                        "error": "Invalid Priority",
                        "message": f"Priority must be one of: {', '.join(valid_priorities)}",
                        "tool": "create_repair_order"
                    }

                repair_order_data = {
                    "customerId": customer_id,
                    "vehicleId": vehicle_id,
                    "serviceType": service_type,
                    "description": description,
                    "priority": priority.upper(),
                    "estimatedHours": estimated_hours,
                    "partsRequired": parts_required or []
                }

                # Use correct HTTP endpoint for MCP tool execution
                response = await client.post(
                    f"{self.mcp_endpoint}/mcp/tools/create_repair_order",
                    json=repair_order_data,
                    headers={
                        "Content-Type": "application/json",
                        "X-Tenant-Id": "cacargroup",
                        "X-Dealer-Id": "5",
                        "X-User-Id": "repair-orders-agent-v3",
                        "X-Locale": "en-US"
                    }
                )
                response.raise_for_status()

                result = response.json()
                return {
                    "success": True,
                    "tool": "create_repair_order",
                    "result": result.get("result", {}),
                    "timestamp": result.get("timestamp"),
                    "message": f"Repair order created successfully",
                    "mcp_server": "repair-orders-server-3003"
                }
            except httpx.HTTPStatusError as e:
                error_detail = e.response.text if e.response else "Unknown error"
                return {
                    "success": False,
                    "error": f"Creation Failed: {e.response.status_code}",
                    "message": f"Failed to create repair order: {error_detail}",
                    "tool": "create_repair_order",
                    "mcp_server": "repair-orders-server-3003"
                }
            except Exception as e:
                return {
                    "success": False,
                    "error": "Connection Error",
                    "message": f"Failed to connect to Repair Orders MCP Server: {str(e)}",
                    "tool": "create_repair_order",
                    "mcp_server": "repair-orders-server-3003"
                }

    async def _add_part_to_repair_order_tool(
        self,
        ro_number: str,
        part_number: str,
        quantity: int = 1,
        unit_price: float = None,
        labor_hours: float = None
    ) -> dict:
        """MCP Tool: Add parts to repair order via Repair Orders Server (Port 3003)"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                part_data = {
                    "roNumber": ro_number,
                    "partDetails": {
                        "partNumber": part_number,
                        "quantity": quantity,
                        "unitPrice": unit_price,
                        "laborHours": labor_hours,
                        "addedBy": "repair-orders-agent-v3",
                        "addedAt": "auto-generated"
                    },
                    "updateOptions": {
                        "recalculateTotal": True,
                        "checkAvailability": True,
                        "reservePart": True,
                        "updateStatus": True
                    }
                }

                response = await client.post(
                    f"{self.mcp_endpoint}/mcp/add_part_to_repair_order",
                    json=part_data,
                    headers={
                        "Content-Type": "application/json",
                        "X-MCP-Client": "repair-orders-agent-v3",
                        "X-Request-ID": f"add-part-{ro_number}-{part_number}"
                    }
                )
                response.raise_for_status()

                result = response.json()
                return {
                    "success": True,
                    "repair_order_id": result.get("repairOrderId"),
                    "ro_number": ro_number,
                    "part_added": {
                        "part_number": part_number,
                        "quantity": quantity,
                        "unit_price": result.get("unitPrice"),
                        "total_price": result.get("totalPrice"),
                        "availability_status": result.get("availabilityStatus")
                    },
                    "updated_totals": {
                        "parts_total": result.get("partsTotal"),
                        "labor_total": result.get("laborTotal"),
                        "grand_total": result.get("grandTotal")
                    },
                    "inventory_status": result.get("inventoryStatus"),
                    "message": f"Successfully added {quantity}x {part_number} to {ro_number}",
                    "mcp_server": "repair-orders-server-3003"
                }
            except httpx.HTTPStatusError as e:
                return {
                    "success": False,
                    "error": f"Add Part Failed: {e.response.status_code}",
                    "message": f"Failed to add part to repair order: {e.response.text}",
                    "ro_number": ro_number,
                    "part_number": part_number,
                    "mcp_server": "repair-orders-server-3003"
                }
            except Exception as e:
                return {
                    "success": False,
                    "error": "Connection Error",
                    "message": f"Failed to add part to repair order: {str(e)}",
                    "ro_number": ro_number,
                    "part_number": part_number,
                    "mcp_server": "repair-orders-server-3003"
                }

    async def _get_repair_order_details_tool(self, repair_order_id: str) -> dict:
        """MCP Tool: Get repair order details via Repair Orders Server (Port 3003)"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.mcp_endpoint}/mcp/get_repair_order_details",
                json={"repair_order_id": repair_order_id}
            )
            response.raise_for_status()
            return response.json()

    async def _update_repair_order_status_tool(
        self,
        repair_order_id: str,
        new_status: str,
        notes: str = None
    ) -> dict:
        """MCP Tool: Update repair order status via Repair Orders Server (Port 3003)"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.mcp_endpoint}/mcp/update_repair_order_status",
                json={
                    "repair_order_id": repair_order_id,
                    "new_status": new_status,
                    "notes": notes
                }
            )
            response.raise_for_status()
            return response.json()

    async def _assign_technician_tool(
        self,
        repair_order_id: str,
        technician_id: str,
        assignment_notes: str = None
    ) -> dict:
        """MCP Tool: Assign technician via Repair Orders Server (Port 3003)"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.mcp_endpoint}/mcp/assign_technician",
                json={
                    "repair_order_id": repair_order_id,
                    "technician_id": technician_id,
                    "assignment_notes": assignment_notes
                }
            )
            response.raise_for_status()
            return response.json()

    async def _add_repair_notes_tool(
        self,
        repair_order_id: str,
        notes: str,
        note_type: str = "progress"
    ) -> dict:
        """MCP Tool: Add repair notes via Repair Orders Server (Port 3003)"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.mcp_endpoint}/mcp/add_repair_notes",
                json={
                    "repair_order_id": repair_order_id,
                    "notes": notes,
                    "note_type": note_type  # progress, issue, completion, customer_communication
                }
            )
            response.raise_for_status()
            return response.json()

    async def _get_repair_history_tool(self, repair_order_id: str) -> dict:
        """MCP Tool: Get repair history via Repair Orders Server (Port 3003)"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.mcp_endpoint}/mcp/get_repair_history",
                json={"repair_order_id": repair_order_id}
            )
            response.raise_for_status()
            return response.json()

    async def _validate_status_transition_tool(
        self,
        repair_order_id: str,
        from_status: str,
        to_status: str
    ) -> dict:
        """MCP Tool: Validate status transition via Repair Orders Server (Port 3003)"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.mcp_endpoint}/mcp/validate_status_transition",
                json={
                    "repair_order_id": repair_order_id,
                    "from_status": from_status,
                    "to_status": to_status
                }
            )
            response.raise_for_status()
            return response.json()

    async def _get_customer_repair_orders_tool(
        self,
        customer_id: str,
        status_filter: str = None,
        limit: int = 50
    ) -> dict:
        """MCP Tool: Get customer repair orders via Repair Orders Server (Port 3003)"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.mcp_endpoint}/mcp/get_customer_repair_orders",
                json={
                    "customer_id": customer_id,
                    "status_filter": status_filter,
                    "limit": limit
                }
            )
            response.raise_for_status()
            return response.json()

    async def _add_parts_to_repair_order_tool(
        self,
        repair_order_id: str,
        parts_list: List[dict]
    ) -> dict:
        """MCP Tool: Add parts to repair order via Repair Orders Server (Port 3003)"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.mcp_endpoint}/mcp/add_parts_to_repair_order",
                json={
                    "repair_order_id": repair_order_id,
                    "parts_list": parts_list  # [{"part_number": "BP-2020", "quantity": 1, "unit_price": 45.99}]
                }
            )
            response.raise_for_status()
            return response.json()

    async def _calculate_repair_estimate_tool(
        self,
        repair_order_id: str,
        include_labor: bool = True,
        include_parts: bool = True
    ) -> dict:
        """MCP Tool: Calculate repair estimate via Repair Orders Server (Port 3003)"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.mcp_endpoint}/mcp/calculate_repair_estimate",
                json={
                    "repair_order_id": repair_order_id,
                    "include_labor": include_labor,
                    "include_parts": include_parts
                }
            )
            response.raise_for_status()
            return response.json()

    def _get_repair_orders_instructions(self) -> str:
        return """
        You are a repair orders specialist for automotive services. You handle:

        - Repair order lifecycle management (create, update, delete)
        - Order tracking and status management
        - Technician assignment and workload management
        - Vehicle-based order filtering and lookup
        - Parts integration with repair orders
        - Repair order analytics and statistics

        AVAILABLE MCP TOOLS (Repair Orders Server - Port 3003) - 12 Tools Total:
        1. list_repair_orders(page, size, sortBy, sortDir) - Get paginated repair orders list
        2. get_repair_order(id) - Get specific repair order by ID
        3. get_repair_order_by_number(roNumber) - Get repair order by RO number
        4. create_repair_order(repairOrder) - Create new repair order
        5. update_repair_order(id, roNumber, updates) - Update existing repair order
        6. update_repair_order_status(roNumber, status) - Update repair order status
        7. delete_repair_order(id, roNumber) - Delete repair order
        8. get_repair_orders_by_status(status) - Filter by status (CREATED, IN_PROGRESS, COMPLETED, CANCELLED)
        9. get_repair_orders_by_technician(technicianId) - Get technician's assigned orders
        10. get_repair_orders_by_vehicle(vin, make, model) - Filter by vehicle information
        11. add_part_to_repair_order(roNumber, part) - Add parts to existing orders
        12. get_repair_order_stats() - Get statistics and counts by status

        ALWAYS validate repair order IDs/numbers and status transitions before updates.
        Use MCP tools for actual repair order operations with the Repair Orders Server.
        Provide detailed repair order information and status updates.

        For multi-domain requests, coordinate handoffs back to triage.
        """

## MCP Tool Call Architecture & Implementation Details

### 🔄 **MCP Communication Flow**

Each Agent Service communicates with its dedicated MCP Server using the official **modelcontextprotocol SDK** and **JSON-RPC 2.0 protocol**:

```
┌─────────────────────────────────────────────────────────────────┐
│                MCP Tool Call Flow (JSON-RPC 2.0)               │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│ 1. Agent Receives User Query                                    │
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│ │ OpenAI      │  │ Parse       │  │ Determine   │               │
│ │ Agent SDK   │→ │ Request     │→ │ Required    │               │
│ │ Processing  │  │ Parameters  │  │ MCP Tools   │               │
│ └─────────────┘  └─────────────┘  └─────────────┘               │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│ 2. MCP Client Tool Call (Official SDK)                         │
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│ │ Validate    │  │ Build       │  │ Call MCP    │               │
│ │ Parameters  │→ │ JSON-RPC    │→ │ Client      │               │
│ │ & Business  │  │ Request     │  │ call_tool() │               │
│ │ Rules       │  │             │  │             │               │
│ └─────────────┘  └─────────────┘  └─────────────┘               │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│ 3. JSON-RPC 2.0 Request to MCP Server                          │
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│ │ POST        │  │ MCP Server  │  │ Process     │               │
│ │ /mcp        │→ │ Port 3002/  │→ │ tools/call  │               │
│ │ JSON-RPC    │  │ 3003/3005   │  │ Method      │               │
│ └─────────────┘  └─────────────┘  └─────────────┘               │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│ 4. JSON-RPC Response Processing                                 │
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│ │ Parse       │  │ Handle      │  │ Return      │               │
│ │ JSON-RPC    │→ │ Errors &    │→ │ Structured  │               │
│ │ Response    │  │ Timeouts    │  │ Result      │               │
│ └─────────────┘  └─────────────┘  └─────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

### 🛠 **MCP Tool Implementation Patterns**

#### **1. Official MCP SDK Pattern**
All MCP tool calls use the official **modelcontextprotocol SDK**:

```python
async def _tool_name_tool(self, param1: str, param2: int = default) -> dict:
    try:
        # 1. Client-side Parameter Validation
        if not param1 or param1.strip() == "":
            return {
                "success": False,
                "error": "Invalid Parameter",
                "tool": "tool_name"
            }

        # 2. Call MCP tool using official SDK
        # This automatically handles JSON-RPC 2.0 protocol
        result = await self.mcp_client.call_tool(
            name="tool_name",
            arguments={
                "param1": param1,
                "param2": param2
            }
        )

        # 3. Process MCP Response
        # MCP returns content array with text/data
        return {
            "success": True,
            "tool": "tool_name",
            "result": result.get("content", [{}])[0].get("text", {}),
            "mcp_server": "server-name-port"
        }

    except Exception as e:
        # MCP SDK Error Handling
        return {
            "success": False,
            "error": "MCP Tool Call Failed",
            "message": f"Failed to call {tool_name}: {str(e)}",
            "tool": "tool_name",
            "mcp_server": "server-name-port"
        }
```

#### **2. JSON-RPC 2.0 Protocol Structure**
The MCP SDK automatically handles the JSON-RPC 2.0 protocol:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_transactions_list",
    "arguments": {
      "page": 0,
      "size": 10
    }
  }
}
```

**Response Format**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": {
          "transactions": [...],
          "pagination": {...}
        }
      }
    ]
  }
}
```

#### **3. MCP Client Initialization**
Each agent initializes its MCP client using the official SDK:

```python
async def _initialize_mcp_client(self):
    from modelcontextprotocol import Client
    from modelcontextprotocol.client.http import HTTPClientTransport

    # Create HTTP transport for JSON-RPC 2.0 communication
    transport = HTTPClientTransport(
        url=f"{self.mcp_endpoint}/mcp",  # Single /mcp endpoint
        headers={
            "Content-Type": "application/json",
            "X-Tenant-Id": "cacargroup",
            "X-Dealer-Id": "5",
            "X-User-Id": "agent-name-v3",
            "X-Locale": "en-US"
        }
    )

    # Initialize and connect MCP client
    self.mcp_client = Client(name="agent-name-v3", version="1.0.0")
    await self.mcp_client.connect(transport)

    # Verify connection
    tools = await self.mcp_client.list_tools()
    print(f"✅ MCP Client connected. Available tools: {len(tools.tools)}")
```

#### **4. Error Handling Strategy**
- **Client-side Validation**: Parameter validation before MCP calls
- **MCP SDK Error Handling**: Automatic JSON-RPC error management
- **Business Logic Errors**: Domain-specific validation and error responses
- **Structured Error Format**: Consistent error response structure

## Guardrails Agent Service (Port 8094)

### Comprehensive Guardrails Implementation

```python
class GuardrailsAgentService:
    """Centralized guardrails and safety validation service"""

    def __init__(self, openai_api_key: str):
        self.openai_client = OpenAI(api_key=openai_api_key)

        # Initialize guardrails agent
        self.agent = Agent(
            name="guardrails_agent",
            model="gpt-4",
            instructions=self._get_guardrails_instructions(),
            tools=[
                self._create_safety_validator(),
                self._create_compliance_checker(),
                self._create_risk_assessor(),
                self._create_business_rules_validator()
            ]
        )

        self.app = FastAPI(title="Guardrails Agent Service V3")
        self.setup_routes()

    def _get_guardrails_instructions(self) -> str:
        return """
        You are a comprehensive guardrails agent for automotive services. You validate:

        SAFETY CHECKS:
        - Payment amounts within reasonable limits
        - Email address validation
        - Data sanitization
        - Injection attack prevention

        COMPLIANCE CHECKS:
        - Automotive industry regulations
        - Data privacy requirements (GDPR, CCPA)
        - Financial transaction compliance
        - Audit trail requirements

        BUSINESS RULES:
        - Repair order state transitions
        - Parts availability constraints
        - Customer authorization requirements
        - Service scheduling rules

        RISK ASSESSMENT:
        - High-value transaction alerts
        - Unusual pattern detection
        - Fraud prevention
        - System security validation

        Always provide detailed explanations for failed validations.
        """

    def setup_routes(self):
        @self.app.post("/validate")
        async def validate_request(request: dict):
            """Comprehensive validation endpoint"""

            validation_result = await self.agent.process(
                query=f"Validate this request: {json.dumps(request)}",
                context={"validation_type": "comprehensive"}
            )

            return {
                "checks": self._parse_validation_results(validation_result),
                "overall_status": self._determine_overall_status(validation_result),
                "recommendations": self._extract_recommendations(validation_result)
            }

## Microservice Architecture Decisions

### Service Distribution Strategy

**Option 1: Fully Distributed (Recommended)**
- Each agent as independent microservice
- Better scalability and fault isolation
- Independent deployment and updates
- Resource optimization per agent type

**Option 2: Grouped Services**
- Triage + Guardrails in one service
- Domain agents as separate services
- Reduced network overhead
- Simpler deployment

### Service Communication Patterns

```python
class AgentCommunicationManager:
    """Manages inter-agent communication patterns"""

    def __init__(self):
        self.service_registry = {
            "triage": "http://localhost:8090",
            "payment": "http://localhost:8091",
            "parts": "http://localhost:8092",
            "repair_orders": "http://localhost:8093",
            "guardrails": "http://localhost:8094"
        }

        self.handoff_patterns = {
            "direct": self._direct_handoff,
            "sequential": self._sequential_handoff,
            "parallel": self._parallel_handoff,
            "conditional": self._conditional_handoff
        }

    async def execute_handoff_pattern(
        self,
        pattern: str,
        context: AgentHandoffContext,
        target_agents: List[str]
    ) -> Dict[str, Any]:
        """Execute specific handoff pattern"""

        handler = self.handoff_patterns.get(pattern)
        if not handler:
            raise ValueError(f"Unknown handoff pattern: {pattern}")

        return await handler(context, target_agents)

    async def _direct_handoff(
        self,
        context: AgentHandoffContext,
        target_agents: List[str]
    ) -> Dict[str, Any]:
        """Single agent handoff"""

        target_agent = target_agents[0]
        endpoint = f"{self.service_registry[target_agent]}/handoff"

        async with httpx.AsyncClient() as client:
            response = await client.post(endpoint, json=context.dict())
            response.raise_for_status()
            return response.json()

    async def _sequential_handoff(
        self,
        context: AgentHandoffContext,
        target_agents: List[str]
    ) -> Dict[str, Any]:
        """Sequential agent processing"""

        results = []
        current_context = context

        for agent in target_agents:
            result = await self._direct_handoff(current_context, [agent])
            results.append(result)

            # Update context with previous results
            current_context.previous_agent_results.append(result)

        return {"sequential_results": results}

    async def _parallel_handoff(
        self,
        context: AgentHandoffContext,
        target_agents: List[str]
    ) -> Dict[str, Any]:
        """Parallel agent processing"""

        tasks = []
        for agent in target_agents:
            task = self._direct_handoff(context, [agent])
            tasks.append(task)

        results = await asyncio.gather(*tasks, return_exceptions=True)

        return {
            "parallel_results": [
                result if not isinstance(result, Exception) else {"error": str(result)}
                for result in results
            ]
        }

## Example Workflow V3: Multi-Agent Handoff

### Input Request
```
"Add brake pads part #BP-2020 to repair order RO-1234, create payment link for $150, and send to customer@email.com"
```

### V3 Execution Flow

#### Step 1: Triage Agent Analysis
```python
# Triage agent receives request
triage_analysis = {
    "primary_domain": "repair_orders",
    "secondary_domains": ["parts", "payment"],
    "complexity": "complex",
    "risk_level": "medium",
    "requires_multi_agent": True,
    "routing_strategy": "sequential",
    "explanation": "Multi-domain request requiring repair order update, parts reservation, and payment processing"
}

# Guardrails check at triage level
guardrails_result = await run_guardrails_check(
    request_type="multi_domain_operation",
    request_data={"repair_order": "RO-1234", "part": "BP-2020", "amount": 150},
    target_agent="sequential_workflow"
)
```

#### Step 2: Sequential Agent Handoffs
```python
# Handoff 1: Repair Orders Agent
repair_context = AgentHandoffContext(
    request_id="req_123",
    original_query="Add brake pads part #BP-2020 to repair order RO-1234...",
    triage_analysis=triage_analysis,
    handoff_reason="Validate and prepare repair order for parts addition",
    target_agent="repair_orders"
)

repair_result = await repair_orders_agent.process(repair_context)

# Handoff 2: Parts Agent (with repair order context)
parts_context = AgentHandoffContext(
    request_id="req_123",
    original_query="Reserve brake pads part #BP-2020 for repair order RO-1234",
    triage_analysis=triage_analysis,
    previous_agent_results=[repair_result],
    handoff_reason="Reserve parts for validated repair order",
    target_agent="parts"
)

parts_result = await parts_agent.process(parts_context)

# Handoff 3: Payment Agent (with full context)
payment_context = AgentHandoffContext(
    request_id="req_123",
    original_query="Create payment link for $150 and send to customer@email.com",
    triage_analysis=triage_analysis,
    previous_agent_results=[repair_result, parts_result],
    handoff_reason="Create payment for updated repair order",
    target_agent="payment"
)

payment_result = await payment_agent.process(payment_context)
```

### Expected V3 Output
```
🚗 AUTOMOTIVE SERVICE WORKFLOW COMPLETED

📋 Request: Add brake pads part #BP-2020 to repair order RO-1234, create payment link for $150, and send to customer@email.com

🎯 Triage Analysis: Multi-domain sequential workflow
   Risk Level: Medium | Complexity: Complex

🔒 Guardrails Status: ✅ All checks passed
   - Safety validation: Passed
   - Compliance check: Passed
   - Business rules: Passed
   - Risk assessment: Medium (approved)

📝 AGENT HANDOFF SEQUENCE:

   🔧 Repair Orders Agent
      ✅ Validated repair order RO-1234 (Status: In Progress)
      ✅ Confirmed customer authorization for parts addition
      ✅ Prepared order for parts reservation

   🔩 Parts Agent
      ✅ Found brake pads BP-2020 (Compatible with repair order vehicle)
      ✅ Reserved 1 unit (14 remaining in stock)
      ✅ Updated repair order with parts information

   💳 Payment Agent
      ✅ Created payment link for $150 USD
      ✅ Sent to customer@email.com
      ✅ Payment link: https://pay.automotive.com/RO-1234-BP2020

🎉 WORKFLOW SUMMARY:
Brake pads BP-2020 successfully added to repair order RO-1234. Customer has been notified with payment link. All guardrails passed. Ready for customer payment and service completion.

⏱️ Total Execution Time: 2.3 seconds
🔄 Agents Involved: Triage → Repair Orders → Parts → Payment
🛡️ Guardrails Checks: 12 passed, 0 failed
```

## Key Advantages of V3 Architecture

### OpenAI Agents SDK Benefits
1. **Native Handoff Support**: Built-in agent-to-agent communication
2. **Context Preservation**: Seamless context transfer across handoffs
3. **Tool Integration**: Easy integration with existing MCP tools
4. **Scalable Architecture**: Independent agent scaling
5. **Monitoring & Observability**: Built-in agent performance tracking

### Triage Pattern Benefits
1. **Intelligent Routing**: Smart request classification and routing
2. **Load Distribution**: Balanced workload across specialist agents
3. **Complexity Handling**: Multi-domain request orchestration
4. **Fault Tolerance**: Graceful handling of agent failures

### Guardrails Integration Benefits
1. **Comprehensive Safety**: Multi-layer validation at every handoff
2. **Compliance Assurance**: Automated regulatory compliance checking
3. **Risk Management**: Proactive risk assessment and mitigation
4. **Audit Trail**: Complete validation and decision logging

### Microservice Architecture Benefits
1. **Independent Scaling**: Scale agents based on demand
2. **Technology Flexibility**: Different tech stacks per agent
3. **Fault Isolation**: Agent failures don't cascade
4. **Development Velocity**: Independent team development and deployment

## Implementation Guide

### Service Dependencies and Startup

```python
# services/base/agent_service.py
from openai.agents import Agent
from fastapi import FastAPI
import httpx
import asyncio
from typing import Dict, Any

class BaseAgentService:
    """Base class for all agent services in V3"""

    def __init__(
        self,
        service_name: str,
        port: int,
        openai_api_key: str,
        dependencies: Dict[str, str] = None
    ):
        self.service_name = service_name
        self.port = port
        self.dependencies = dependencies or {}
        self.health_checks = {}

        self.app = FastAPI(
            title=f"{service_name} V3",
            description=f"OpenAI Agents SDK powered {service_name}"
        )

        self.setup_health_checks()
        self.setup_base_routes()

    def setup_health_checks(self):
        """Setup health check endpoints"""

        @self.app.get("/health")
        async def health_check():
            """Service health check"""
            dependency_status = {}

            for dep_name, dep_url in self.dependencies.items():
                try:
                    async with httpx.AsyncClient() as client:
                        response = await client.get(
                            f"{dep_url}/health",
                            timeout=5.0
                        )
                        dependency_status[dep_name] = {
                            "status": "healthy" if response.status_code == 200 else "unhealthy",
                            "response_time": response.elapsed.total_seconds()
                        }
                except Exception as e:
                    dependency_status[dep_name] = {
                        "status": "unhealthy",
                        "error": str(e)
                    }

            overall_healthy = all(
                dep["status"] == "healthy"
                for dep in dependency_status.values()
            )

            return {
                "service": self.service_name,
                "status": "healthy" if overall_healthy else "degraded",
                "dependencies": dependency_status,
                "version": "3.0.0"
            }

        @self.app.get("/ready")
        async def readiness_check():
            """Kubernetes readiness probe"""
            # Check if all critical dependencies are available
            for dep_name, dep_url in self.dependencies.items():
                try:
                    async with httpx.AsyncClient() as client:
                        await client.get(f"{dep_url}/health", timeout=2.0)
                except:
                    return {"ready": False, "reason": f"Dependency {dep_name} not ready"}

            return {"ready": True}

    async def wait_for_dependencies(self, timeout: int = 60):
        """Wait for all dependencies to be ready"""
        start_time = asyncio.get_event_loop().time()

        while asyncio.get_event_loop().time() - start_time < timeout:
            all_ready = True

            for dep_name, dep_url in self.dependencies.items():
                try:
                    async with httpx.AsyncClient() as client:
                        response = await client.get(
                            f"{dep_url}/health",
                            timeout=5.0
                        )
                        if response.status_code != 200:
                            all_ready = False
                            break
                except:
                    all_ready = False
                    break

            if all_ready:
                print(f"✅ All dependencies ready for {self.service_name}")
                return True

            print(f"⏳ Waiting for dependencies... ({self.service_name})")
            await asyncio.sleep(2)

        raise TimeoutError(f"Dependencies not ready within {timeout}s for {self.service_name}")

## Monitoring and Observability

### Agent Performance Monitoring

```python
from openai.agents.monitoring import AgentMonitor
import prometheus_client
from datetime import datetime
import json

class AgentMonitoringService:
    """Comprehensive monitoring for agent ecosystem"""

    def __init__(self):
        # Prometheus metrics
        self.request_counter = prometheus_client.Counter(
            'agent_requests_total',
            'Total agent requests',
            ['agent_name', 'request_type', 'status']
        )

        self.request_duration = prometheus_client.Histogram(
            'agent_request_duration_seconds',
            'Agent request duration',
            ['agent_name', 'request_type']
        )

        self.handoff_counter = prometheus_client.Counter(
            'agent_handoffs_total',
            'Total agent handoffs',
            ['from_agent', 'to_agent', 'status']
        )

        self.guardrails_counter = prometheus_client.Counter(
            'guardrails_checks_total',
            'Total guardrails checks',
            ['check_type', 'status', 'risk_level']
        )

    def track_agent_request(
        self,
        agent_name: str,
        request_type: str,
        duration: float,
        status: str
    ):
        """Track individual agent request metrics"""
        self.request_counter.labels(
            agent_name=agent_name,
            request_type=request_type,
            status=status
        ).inc()

        self.request_duration.labels(
            agent_name=agent_name,
            request_type=request_type
        ).observe(duration)

    def track_handoff(
        self,
        from_agent: str,
        to_agent: str,
        status: str
    ):
        """Track agent handoff metrics"""
        self.handoff_counter.labels(
            from_agent=from_agent,
            to_agent=to_agent,
            status=status
        ).inc()

    def track_guardrails_check(
        self,
        check_type: str,
        status: str,
        risk_level: str
    ):
        """Track guardrails validation metrics"""
        self.guardrails_counter.labels(
            check_type=check_type,
            status=status,
            risk_level=risk_level
        ).inc()

### Distributed Tracing

```python
from opentelemetry import trace
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

class AgentTracingService:
    """Distributed tracing for agent workflows"""

    def __init__(self, service_name: str):
        # Setup OpenTelemetry tracing
        trace.set_tracer_provider(TracerProvider())
        tracer_provider = trace.get_tracer_provider()

        jaeger_exporter = JaegerExporter(
            agent_host_name="localhost",
            agent_port=14268,
        )

        span_processor = BatchSpanProcessor(jaeger_exporter)
        tracer_provider.add_span_processor(span_processor)

        self.tracer = trace.get_tracer(service_name)

    def trace_agent_request(self, request_id: str, agent_name: str):
        """Create trace span for agent request"""
        return self.tracer.start_span(
            f"{agent_name}_request",
            attributes={
                "request.id": request_id,
                "agent.name": agent_name,
                "service.version": "3.0.0"
            }
        )

    def trace_handoff(self, from_agent: str, to_agent: str, context: dict):
        """Create trace span for agent handoff"""
        return self.tracer.start_span(
            f"handoff_{from_agent}_to_{to_agent}",
            attributes={
                "handoff.from": from_agent,
                "handoff.to": to_agent,
                "handoff.context_size": len(json.dumps(context))
            }
        )

## Agent Loop & Multi-Domain Workflow Execution

### OpenAI Agents SDK Agent Loop Architecture
1. `get_transactions_list(page, size, sortBy, sortDirection)` - Get paginated list of transactions
2. `get_transaction_by_id(id)` - Get specific transaction by ID
3. `create_transaction(invoiceId, invoiceNumber, customerId, customerEmail, amount, currency, paymentType, cardType, description)` - Create new transaction
4. `update_transaction_status(id, status)` - Update transaction status
5. `process_transaction(id)` - Process pending transaction
6. `get_transactions_by_customer(customerId, page, size)` - Get customer's transactions
7. `get_transactions_by_status(status, page, size)` - Filter transactions by status
8. `get_transactions_by_payment_type(paymentType, page, size)` - Filter by payment type
9. `get_transactions_by_card_type(cardType, page, size)` - Filter by card type
10. `get_all_card_types()` - Get available card types (VISA, MASTERCARD, AMEX, etc.)
11. `get_all_payment_types()` - Get available payment types (CREDIT_CARD, DEBIT_CARD, UPI, etc.)

**Payment Link Tools (7 tools)**:
12. `get_payment_links_list(page, size, sortBy, sortDirection)` - Get paginated payment links
13. `get_payment_link_by_id(id)` - Get specific payment link by ID
14. `create_payment_link(invoiceId, invoiceNumber, customerEmail, amount, currency, description, expiryHours)` - Create payment link
15. `update_payment_link(id, updates)` - Update payment link (currently not supported)
16. `process_payment_link(id)` - Process payment link
17. `cancel_payment_link(id)` - Cancel payment link
18. `get_payment_links_by_status(status, page, size)` - Filter payment links by status

### Parts MCP Server (Port 3005) - 15 Tools Total
**Connected to**: Parts Agent Service (Port 8092)

**Available Tools**:
1. `list_parts(page, size, sortBy, sortDirection)` - Get paginated list of all parts
2. `get_part(id)` - Get specific part by ID
3. `get_part_by_number(partNumber)` - Get part by part number
4. `create_part(partData)` - Create new part in inventory
5. `update_part(id, updates)` - Update existing part information
6. `delete_part(id)` - Delete part from inventory
7. `get_parts_by_category(category, page, size)` - Filter parts by category
8. `get_parts_by_manufacturer(brand, page, size)` - Filter parts by manufacturer/brand
9. `get_low_stock_parts(threshold, page, size)` - Get parts below stock threshold
10. `update_part_stock(id, quantity, adjustment)` - Update part stock quantities
11. `search_parts(term, category, brand, vehicle, minPrice, maxPrice)` - Advanced parts search
12. `get_parts_by_price_range(minPrice, maxPrice, page, size)` - Filter by price range
13. `get_parts_by_supplier(supplier, page, size)` - Filter parts by supplier
14. `bulk_update_part_prices(updates)` - Bulk update part pricing
15. `get_part_inventory_value()` - Calculate total inventory value

### Repair Orders MCP Server (Port 3003) - 12 Tools Total
**Connected to**: Repair Orders Agent Service (Port 8093)

**Available Tools**:
1. `list_repair_orders(page, size, sortBy, sortDir)` - Get paginated list of repair orders
2. `get_repair_order(id)` - Get specific repair order by ID
3. `get_repair_order_by_number(roNumber)` - Get repair order by RO number
4. `create_repair_order(repairOrder)` - Create new repair order
5. `update_repair_order(id, roNumber, updates)` - Update existing repair order
6. `update_repair_order_status(roNumber, status)` - Update repair order status
7. `delete_repair_order(id, roNumber)` - Delete repair order
8. `get_repair_orders_by_status(status)` - Filter repair orders by status
9. `get_repair_orders_by_technician(technicianId)` - Get orders assigned to technician
10. `get_repair_orders_by_vehicle(vin, make, model)` - Filter by vehicle information
11. `add_part_to_repair_order(roNumber, part)` - Add parts to existing repair order
12. `get_repair_order_stats()` - Get repair order statistics and counts



## Agent Loop & Multi-Domain Workflow Execution

### OpenAI Agents SDK Agent Loop Architecture

The OpenAI Agents SDK implements a sophisticated agent loop that enables complex multi-step workflow execution:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Agent Loop Execution Flow                   │
│                         (max_turns=5)                          │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│ Turn 1: Query Analysis & Workflow Planning                     │
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│ │ LLM Call    │  │ Analyze     │  │ Create      │               │
│ │ to OpenAI   │→ │ Multi-Domain│→ │ Workflow    │               │
│ │ API         │  │ Request     │  │ Plan        │               │
│ └─────────────┘  └─────────────┘  └─────────────┘               │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│ Turn 2: Step 1 Execution - Repair Order Verification           │
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│ │ Tool Call   │  │ MCP Server  │  │ Validate    │               │
│ │ get_repair_ │→ │ Port 3003   │→ │ RO_001      │               │
│ │ order_details│  │ Response    │  │ Status      │               │
│ └─────────────┘  └─────────────┘  └─────────────┘               │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│ Turn 3: Step 2 Execution - Parts Addition                      │
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│ │ Tool Call   │  │ MCP Server  │  │ Add PART_001│               │
│ │ add_part_to_│→ │ Port 3005   │→ │ to RO_001   │               │
│ │ repair_order│  │ Response    │  │ Update Inv. │               │
│ └─────────────┘  └─────────────┘  └─────────────┘               │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│ Turn 4: Step 3 Execution - Payment Link Creation               │
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│ │ Tool Call   │  │ MCP Server  │  │ Create $100 │               │
│ │ create_     │→ │ Port 3002   │→ │ Payment Link│               │
│ │ payment_link│  │ Response    │  │ to abc@...  │               │
│ └─────────────┘  └─────────────┘  └─────────────┘               │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│ Turn 5: Final Response Generation                               │
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│ │ Consolidate │  │ Generate    │  │ Return      │               │
│ │ All Results │→ │ Summary     │→ │ Final       │               │
│ │ & Status    │  │ Response    │  │ Output      │               │
│ └─────────────┘  └─────────────┘  └─────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

### Multi-Domain Workflow Execution Pattern

#### Complex Query Processing
For the query: **"Add partNumber PART_001 to Repair order number RO_001, and send payment link of 100$ to abc@gmail.com"**

The Triage Agent automatically:

1. **Analyzes Multi-Domain Requirements**
   - Identifies 3 domains: Repair Orders, Parts, Payment
   - Determines sequential execution dependencies
   - Creates workflow plan with proper ordering

2. **Executes Sequential Workflow Steps**
   ```
   Step 1: Repair Order Verification
   ├── Agent: Repair Orders Specialist
   ├── Action: get_repair_order_details("RO_001")
   ├── MCP Server: Port 3003
   └── Result: ✅ RO_001 validated and accessible

   Step 2: Parts Addition (depends on Step 1)
   ├── Agent: Parts Specialist
   ├── Action: add_part_to_repair_order("RO_001", "PART_001")
   ├── MCP Server: Port 3005
   └── Result: ✅ PART_001 added to RO_001

   Step 3: Payment Link Creation (depends on Step 2)
   ├── Agent: Payment Specialist
   ├── Action: create_payment_link("RO_001", 100, "abc@gmail.com")
   ├── MCP Server: Port 3002
   └── Result: ✅ Payment link created and sent
   ```

3. **Manages Dependencies & Error Handling**
   - Each step validates dependencies before execution
   - Failures cascade appropriately (Step 2 fails if Step 1 fails)
   - Comprehensive error reporting and rollback capabilities

### Agent Loop Capabilities Demonstrated

#### ✅ **Sequential Multi-Step Execution**
- **Turn-by-Turn Processing**: Each workflow step executed in separate agent turns
- **Context Preservation**: Agent maintains full context across all turns
- **Dependency Management**: Automatic validation of step prerequisites

#### ✅ **Tool Orchestration**
- **Multi-Tool Coordination**: Single agent coordinates multiple MCP tools
- **Cross-Domain Integration**: Seamless integration across repair orders, parts, and payment domains
- **Error Propagation**: Intelligent error handling across tool boundaries

#### ✅ **Workflow Planning Intelligence**
- **Automatic Decomposition**: Complex queries automatically broken into manageable steps
- **Execution Ordering**: Intelligent determination of sequential vs parallel execution
- **Business Logic Application**: Domain-specific rules applied throughout workflow

### Implementation Reference

The complete working implementation of this multi-domain workflow execution is available in:

**File**: `AgentsSDKPlayGround/multi_agent_workflow.py`

**Key Classes**:
- `WorkflowStep`: Individual workflow step definition
- `WorkflowPlan`: Complete workflow execution plan
- `WorkflowResult`: Step execution results and status

**Key Functions**:
- `execute_multi_domain_workflow()`: Main workflow orchestration
- `execute_workflow_step()`: Individual step execution
- `create_workflow_plan()`: Workflow planning and decomposition

**Agent Configuration**:
```python
triage_agent = Agent(
    name="Automotive Triage Agent",
    instructions="Expert automotive service triage agent with workflow planning capabilities...",
    tools=[analyze_multi_domain_request, get_repair_order_details,
           add_part_to_repair_order, create_payment_link],
    handoffs=[repair_orders_agent, parts_agent, payment_agent]
)

# Execute with agent loop
result = await Runner.run(
    triage_agent,
    query,
    max_turns=5  # Enables multi-turn workflow execution
)
```



This architecture demonstrates that OpenAI Agents SDK with proper configuration (max_turns=5) can effectively handle complex multi-domain automotive service workflows, providing the intelligent orchestration and workflow planning capabilities required for enterprise-grade automotive retail operations.

## ✅ Architecture Validation Results

### 🔬 **Real-World Testing Confirmation**

The AgentV3 architecture has been **validated through actual implementation** using the OpenAI Agents SDK. Testing results confirm:

#### **Agent Loop Execution (max_turns=5)**
```
✅ HTTP Requests: 4-5 API calls to OpenAI (confirmed agent loop)
✅ Multi-Turn Processing: Sequential tool execution across turns
✅ Context Preservation: Full context maintained across all turns
✅ Tool Orchestration: Multiple MCP tools coordinated successfully
```

#### **Defensive Validation Implementation**
```
✅ Entity Validation: All entities (repair orders, parts, payments) validated first
✅ Business Rule Enforcement: Proper validation before execution
✅ Error Handling: Graceful failure handling with detailed error messages
✅ Dependency Management: Sequential execution with proper prerequisites
```

#### **Multi-Domain Workflow Success**
For the complex query: *"Add partNumber PART_001 to Repair order number RO_001, and send payment link of 100$ to abc@gmail.com"*

**Agent Response (Actual Results)**:
```
1. Add Part to Repair Order:
   - Status: Success
   - Details: PART_001 successfully added to RO_001
   - Updated Totals: Parts total: INR 45.99, Grand total: INR 145.99

2. Create Payment Link:
   - Status: Success
   - Payment Link: https://payments.cacargroup.com/pay/PL_RO_001_100
   - Sent to: abc@gmail.com
   - Expires: 2025-01-16T10:30:00Z
```

This V3 architecture provides a robust, scalable, and intelligent multi-agent system using OpenAI's Agents SDK with comprehensive guardrails, intelligent triage, and seamless handoff capabilities. The microservice approach ensures independent scaling and fault tolerance while maintaining the flexibility and natural language processing capabilities of V2.

**Implementation Reference**: Complete working code available in `AgentsSDKPlayGround/multi_agent_workflow.py`
