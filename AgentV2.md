# Automotive Retail Agent System V2 - Natural Language Orchestration

## Executive Summary

Enhanced microservice architecture where the Agent Orchestrator communicates with stateless agents using **natural language queries** instead of specific tool calls. The Workflow Planning LLM breaks down user requests into natural language steps, and each agent uses its own LLM to interpret and execute these natural language instructions using available MCP tools.

## Key Improvements in V2

1. **Natural Language Communication**: Orchestrator sends human-readable queries to agents
2. **Agent Autonomy**: Each agent interprets natural language and chooses appropriate tools
3. **Stateless Agent Design**: Agents don't maintain conversation state between requests
4. **Enhanced Workflow Planning**: LLM creates natural language workflow steps
5. **Tool Discovery Abstraction**: Agents abstract their tool capabilities for planning

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                Agent Orchestrator Service                   │
│                    (Port 8086)                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │Tool Discovery│  │ Workflow    │  │ Natural     │         │
│  │   Manager    │  │  Planner    │  │ Language    │         │
│  │              │  │    LLM      │  │ Formatter   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP REST API (Natural Language)
         ┌────────────┼────────────┐
         │            │            │
┌────────▼──────────┐ │  ┌────────▼──────────┐
│  Payment Agent    │ │  │   Parts Agent     │
│   Service         │ │  │    Service        │
│  (Port 8083)      │ │  │   (Port 8085)     │
│                   │ │  │                   │
│ ┌───────────────┐ │ │  │ ┌───────────────┐ │
│ │ Agent LLM     │ │ │  │ │ Agent LLM     │ │
│ │ + Tool Router │ │ │  │ │ + Tool Router │ │
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
              │ │Agent LLM   │ │
              │ │+Tool Router│ │
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

## Core Data Models V2

### Natural Language Request Models

```python
class NaturalLanguageRequest(BaseModel):
    """Natural language request to stateless agents"""
    request_id: str
    query: str  # Natural language query
    context: Optional[Dict[str, Any]] = None  # Contextual data from previous steps
    priority: Optional[int] = 1
    timeout: Optional[int] = 30

class NaturalLanguageResponse(BaseModel):
    """Natural language response from stateless agents"""
    request_id: str
    success: bool
    result: Any
    explanation: str  # Natural language explanation of what was done
    tools_used: List[str]  # List of MCP tools that were called
    error: Optional[str] = None
    execution_time: float
    timestamp: datetime

class AgentCapability(BaseModel):
    """Agent capability description for workflow planning"""
    domain: str  # "payments", "parts", "repair_orders"
    description: str  # Natural language description of what agent can do
    example_queries: List[str]  # Example natural language queries
    available_tools: List[str]  # List of MCP tool names
    limitations: List[str]  # What the agent cannot do
```

## Enhanced Workflow Planning LLM

### Workflow Planner V2

```python
class WorkflowPlannerV2:
    """Enhanced workflow planner using natural language steps"""
    
    def __init__(self, api_key: str):
        self.llm_client = OpenAI(api_key=api_key)
        self.model = "gpt-4"
        self.temperature = 0.1  # Low temperature for consistent planning
    
    async def create_natural_language_workflow(
        self, 
        user_request: str, 
        agent_capabilities: Dict[str, AgentCapability]
    ) -> Dict[str, Any]:
        """Create workflow plan with natural language steps"""
        
        capabilities_summary = self._format_capabilities_for_planning(agent_capabilities)
        
        planning_prompt = self._build_planning_prompt_v2(
            user_request, 
            capabilities_summary
        )
        
        response = await self.llm_client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": planning_prompt}],
            temperature=self.temperature,
            response_format={"type": "json_object"}
        )
        
        return json.loads(response.choices[0].message.content)
    
    def _format_capabilities_for_planning(self, capabilities: Dict[str, AgentCapability]) -> str:
        """Format agent capabilities for planning prompt"""
        formatted = []
        for agent_name, capability in capabilities.items():
            formatted.append(f"""
AGENT: {agent_name.upper()}
Domain: {capability.domain}
Description: {capability.description}
Example Queries:
{chr(10).join(f"  - {query}" for query in capability.example_queries)}
Limitations: {', '.join(capability.limitations)}
""")
        return "\n".join(formatted)
```

### Planning Prompt V2

```python
PLANNING_PROMPT_V2 = """
You are an Expert Automotive Service Workflow Planner that creates natural language workflows.

AVAILABLE AGENTS AND THEIR CAPABILITIES:
{capabilities_summary}

USER REQUEST: "{user_request}"

Create a workflow plan that breaks down the user request into natural language steps for each agent.

PLANNING PRINCIPLES:
1. **Natural Language Steps**: Each step should be a clear, natural language instruction
2. **Agent Autonomy**: Let agents decide which tools to use based on the natural language query
3. **Context Passing**: Include relevant context from previous steps
4. **Defensive Validation**: Include validation steps in natural language
5. **Business Logic**: Follow automotive service business rules

WORKFLOW STRUCTURE RULES:
- Each step targets ONE specific agent
- Steps should be self-contained natural language queries
- Include context from previous steps when needed
- Validate prerequisites before making changes
- Handle dependencies between steps

Respond with this JSON structure:
{
  "workflow_plan": {
    "plan_id": "unique_plan_id",
    "risk_level": "low|medium|high",
    "estimated_duration_seconds": number,
    "execution_steps": [
      {
        "step_id": "step_1",
        "step_order": 1,
        "target_agent": "payment|parts|repair_orders",
        "natural_language_query": "Clear instruction in natural language",
        "context_from_previous_steps": {
          "step_id": "data_key_to_pass"
        },
        "dependencies": ["step_ids_that_must_complete_first"],
        "parallel_group": "group_name_or_null",
        "failure_handling": "retry|skip|abort",
        "timeout_seconds": 30,
        "retry_attempts": 2,
        "expected_outcome": "What this step should accomplish"
      }
    ],
    "validation_summary": [
      "list_of_validations_in_natural_language"
    ],
    "success_criteria": "How to determine if the entire workflow succeeded"
  }
}

Generate the natural language workflow plan now:
"""
```

## Stateless Agent Architecture V2

### Base Agent Service V2

```python
class BaseAgentServiceV2(ABC):
    """Base class for stateless agents with natural language processing"""
    
    def __init__(self, service_name: str, port: int, mcp_endpoint: str, 
                 domain: str, openai_api_key: str):
        self.service_name = service_name
        self.domain = domain
        self.mcp_endpoint = mcp_endpoint
        self.llm_client = OpenAI(api_key=openai_api_key)
        self.available_tools = []
        
        # Initialize FastAPI app and MCP client
        self.app = FastAPI(title=f"{service_name} Agent V2")
        self.setup_routes()
    
    def setup_routes(self):
        """Setup FastAPI routes for V2 architecture"""
        
        @self.app.get("/health")
        async def health_check():
            return {"status": "healthy", "service": self.service_name}
        
        @self.app.get("/capabilities")
        async def get_capabilities():
            return await self.get_agent_capabilities()
        
        @self.app.post("/process", response_model=NaturalLanguageResponse)
        async def process_natural_language(request: NaturalLanguageRequest):
            return await self.process_natural_language_query(request)
    
    async def get_agent_capabilities(self) -> AgentCapability:
        """Return agent capabilities for workflow planning"""
        return AgentCapability(
            domain=self.domain,
            description=await self.get_domain_description(),
            example_queries=await self.get_example_queries(),
            available_tools=self.available_tools,
            limitations=await self.get_limitations()
        )
    
    async def process_natural_language_query(
        self, 
        request: NaturalLanguageRequest
    ) -> NaturalLanguageResponse:
        """Process natural language query and execute appropriate tools"""
        
        start_time = time.time()
        
        try:
            # Step 1: Understand the query and select tools
            tool_plan = await self._analyze_query_and_plan_tools(
                request.query, 
                request.context
            )
            
            # Step 2: Execute the planned tools
            execution_result = await self._execute_tool_plan(tool_plan)
            
            # Step 3: Format natural language response
            explanation = await self._generate_explanation(
                request.query, 
                tool_plan, 
                execution_result
            )
            
            return NaturalLanguageResponse(
                request_id=request.request_id,
                success=True,
                result=execution_result,
                explanation=explanation,
                tools_used=[tool["name"] for tool in tool_plan],
                execution_time=time.time() - start_time,
                timestamp=datetime.now()
            )
            
        except Exception as e:
            return NaturalLanguageResponse(
                request_id=request.request_id,
                success=False,
                result=None,
                explanation=f"Failed to process query: {str(e)}",
                tools_used=[],
                error=str(e),
                execution_time=time.time() - start_time,
                timestamp=datetime.now()
            )
    
    async def _analyze_query_and_plan_tools(
        self, 
        query: str, 
        context: Optional[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Use LLM to analyze query and plan tool execution"""
        
        tools_description = await self._get_tools_description()
        
        analysis_prompt = f"""
You are a {self.domain} specialist agent. Analyze this natural language query and create a tool execution plan.

AVAILABLE TOOLS:
{tools_description}

QUERY: "{query}"

CONTEXT FROM PREVIOUS STEPS:
{json.dumps(context, indent=2) if context else "None"}

Create a tool execution plan. Respond with JSON:
{{
  "tool_plan": [
    {{
      "name": "tool_name",
      "parameters": {{"param": "value"}},
      "reason": "Why this tool is needed"
    }}
  ],
  "reasoning": "Overall reasoning for the plan"
}}
"""
        
        response = await self.llm_client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": analysis_prompt}],
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        
        plan = json.loads(response.choices[0].message.content)
        return plan["tool_plan"]
    
    @abstractmethod
    async def get_domain_description(self) -> str:
        """Get natural language description of agent's domain"""
        pass
    
    @abstractmethod
    async def get_example_queries(self) -> List[str]:
        """Get example natural language queries this agent can handle"""
        pass
    
    @abstractmethod
    async def get_limitations(self) -> List[str]:
        """Get list of limitations for this agent"""
        pass

## Individual Agent Services V2

### 1. Payment Agent Service V2 (Port 8083)

```python
class PaymentAgentServiceV2(BaseAgentServiceV2):
    """Payment Agent with natural language processing"""

    def __init__(self, openai_api_key: str):
        super().__init__(
            service_name="payment-agent-v2",
            port=8083,
            mcp_endpoint="http://localhost:3002/mcp",
            domain="payments",
            openai_api_key=openai_api_key
        )

    async def get_domain_description(self) -> str:
        return """I handle all payment-related operations for automotive services.
        I can create payment links, check payment status, process refunds,
        send payment notifications, and validate payment data."""

    async def get_example_queries(self) -> List[str]:
        return [
            "Create a payment link for repair order RO-1234 for $150.50 and send it to customer@email.com",
            "Check if payment for repair order RO-1234 has been completed",
            "Process a refund of $75.25 for repair order RO-1234 due to cancelled service",
            "Send a payment reminder to customer@email.com for repair order RO-1234",
            "Validate if the email address customer@email.com is properly formatted",
            "Get available payment methods for customer ID 12345"
        ]

    async def get_limitations(self) -> List[str]:
        return [
            "Cannot process payments without valid repair order ID",
            "Cannot send payment links to invalid email addresses",
            "Cannot refund more than the original payment amount",
            "Cannot access customer data outside of payment context"
        ]

    async def _get_tools_description(self) -> str:
        return """
AVAILABLE PAYMENT TOOLS:
1. create_payment_link - Generate payment URLs for repair orders
   Parameters: repair_order_id, amount, customer_email, currency

2. check_payment_status - Verify payment completion status
   Parameters: payment_id or repair_order_id

3. process_refund - Handle refund requests
   Parameters: payment_id, refund_amount, reason_code

4. send_payment_notification - Email/SMS payment reminders
   Parameters: customer_email, repair_order_id, message_type

5. get_payment_methods - Retrieve customer payment options
   Parameters: customer_id

6. validate_payment_data - Local validation of payment parameters
   Parameters: email, amount, currency, repair_order_id
"""

### 2. Parts Agent Service V2 (Port 8085)

```python
class PartsAgentServiceV2(BaseAgentServiceV2):
    """Parts Agent with natural language processing"""

    def __init__(self, openai_api_key: str):
        super().__init__(
            service_name="parts-agent-v2",
            port=8085,
            mcp_endpoint="http://localhost:3005/mcp",
            domain="parts",
            openai_api_key=openai_api_key
        )

    async def get_domain_description(self) -> str:
        return """I manage all automotive parts operations including searching,
        availability checking, reservations, compatibility verification,
        and inventory management."""

    async def get_example_queries(self) -> List[str]:
        return [
            "Find brake pads compatible with 2020 Honda Civic",
            "Check if part number BP-2020-HC is available in stock",
            "Reserve 2 units of part number BP-2020-HC for repair order RO-1234",
            "Get detailed specifications and pricing for part number BP-2020-HC",
            "Find alternative parts for BP-2020-HC if it's out of stock",
            "Verify if part BP-2020-HC is compatible with 2019 Honda Accord",
            "Update stock quantity for part BP-2020-HC by reducing 2 units"
        ]

    async def get_limitations(self) -> List[str]:
        return [
            "Cannot create new parts in the system",
            "Cannot modify part specifications or pricing",
            "Cannot reserve parts without valid repair order ID",
            "Cannot check compatibility without vehicle model and year"
        ]

### 3. Repair Orders Agent Service V2 (Port 8084)

```python
class RepairOrdersAgentServiceV2(BaseAgentServiceV2):
    """Repair Orders Agent with natural language processing"""

    def __init__(self, openai_api_key: str):
        super().__init__(
            service_name="repair-orders-agent-v2",
            port=8084,
            mcp_endpoint="http://localhost:3003/mcp",
            domain="repair_orders",
            openai_api_key=openai_api_key
        )

    async def get_domain_description(self) -> str:
        return """I manage automotive repair orders including creation, status updates,
        technician assignments, progress tracking, and repair history management."""

    async def get_example_queries(self) -> List[str]:
        return [
            "Create a new repair order for customer ID 12345 with vehicle ID V-789 for brake service",
            "Update repair order RO-1234 status to 'in_progress'",
            "Get complete details for repair order RO-1234 including current status and history",
            "Assign technician ID T-456 to repair order RO-1234",
            "Add repair notes to RO-1234: 'Replaced brake pads, tested braking system'",
            "Get the complete repair history for repair order RO-1234",
            "Check if repair order RO-1234 can be transitioned from 'pending' to 'in_progress'"
        ]

    async def get_limitations(self) -> List[str]:
        return [
            "Cannot create repair orders without valid customer and vehicle IDs",
            "Cannot assign non-existent technicians to repair orders",
            "Cannot transition repair order status if business rules are violated",
            "Cannot modify completed or closed repair orders"
        ]

## Agent Orchestrator Service V2

### Enhanced Orchestrator

```python
class AgentOrchestratorServiceV2:
    """Enhanced orchestrator with natural language workflow execution"""

    def __init__(self, openai_api_key: str):
        self.openai_api_key = openai_api_key
        self.workflow_planner = WorkflowPlannerV2(openai_api_key)
        self.service_registry = ServiceRegistryV2()
        self.workflow_executor = WorkflowExecutorV2(self.service_registry)

        self.app = FastAPI(title="Agent Orchestrator V2")
        self.setup_routes()

    def setup_routes(self):
        """Setup FastAPI routes for V2 orchestrator"""

        @self.app.post("/orchestrate", response_model=OrchestratorResponse)
        async def orchestrate_request(request: OrchestratorRequest):
            return await self.process_user_request(request)

        @self.app.get("/agents")
        async def get_agent_capabilities():
            return await self.service_registry.get_all_capabilities()

    async def process_user_request(self, request: OrchestratorRequest) -> OrchestratorResponse:
        """Process user request with natural language workflow"""

        start_time = time.time()
        request_id = request.request_id or f"req_{int(time.time())}"

        try:
            # Step 1: Get agent capabilities
            agent_capabilities = await self.service_registry.get_all_capabilities()

            # Step 2: Create natural language workflow plan
            workflow_plan = await self.workflow_planner.create_natural_language_workflow(
                request.user_request,
                agent_capabilities
            )

            # Step 3: Execute workflow with natural language steps
            execution_results = await self.workflow_executor.execute_natural_language_workflow(
                workflow_plan
            )

            # Step 4: Generate final natural language summary
            final_result = await self._generate_final_summary(
                request.user_request,
                workflow_plan,
                execution_results
            )

            return OrchestratorResponse(
                request_id=request_id,
                success=True,
                workflow_plan=workflow_plan,
                execution_results=execution_results,
                final_result=final_result,
                execution_time=time.time() - start_time,
                timestamp=datetime.now()
            )

        except Exception as e:
            return OrchestratorResponse(
                request_id=request_id,
                success=False,
                workflow_plan={},
                execution_results={},
                final_result=f"Failed to process request: {str(e)}",
                execution_time=time.time() - start_time,
                timestamp=datetime.now()
            )

    async def _generate_final_summary(
        self,
        user_request: str,
        workflow_plan: Dict[str, Any],
        execution_results: Dict[str, Any]
    ) -> str:
        """Generate natural language summary of workflow execution"""

        summary_prompt = f"""
Create a user-friendly summary of the automotive service workflow execution.

ORIGINAL REQUEST: "{user_request}"

WORKFLOW PLAN: {json.dumps(workflow_plan, indent=2)}

EXECUTION RESULTS: {json.dumps(execution_results, indent=2)}

Create a clear, professional summary that explains:
1. What was requested
2. What steps were taken
3. What was accomplished
4. Any important details or next steps

Format as a friendly automotive service summary with emojis and clear sections.
"""

        response = await self.workflow_planner.llm_client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": summary_prompt}],
            temperature=0.3
        )

        return response.choices[0].message.content

### Workflow Executor V2

```python
class WorkflowExecutorV2:
    """Execute natural language workflows across agents"""

    def __init__(self, service_registry: ServiceRegistryV2):
        self.service_registry = service_registry

    async def execute_natural_language_workflow(
        self,
        workflow_plan: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute workflow with natural language steps"""

        execution_results = {}
        context_data = {}

        steps = workflow_plan["workflow_plan"]["execution_steps"]

        # Sort steps by execution order
        sorted_steps = sorted(steps, key=lambda x: x["step_order"])

        for step in sorted_steps:
            step_id = step["step_id"]

            try:
                # Check dependencies
                if not self._dependencies_satisfied(step["dependencies"], execution_results):
                    execution_results[step_id] = {
                        "success": False,
                        "error": "Dependencies not satisfied"
                    }
                    continue

                # Prepare context from previous steps
                step_context = self._prepare_step_context(
                    step.get("context_from_previous_steps", {}),
                    context_data
                )

                # Execute natural language query
                agent_response = await self._execute_natural_language_step(
                    step["target_agent"],
                    step["natural_language_query"],
                    step_context
                )

                execution_results[step_id] = {
                    "success": agent_response.success,
                    "result": agent_response.result,
                    "explanation": agent_response.explanation,
                    "tools_used": agent_response.tools_used,
                    "error": agent_response.error
                }

                # Store result data for future steps
                if agent_response.success and agent_response.result:
                    context_data[step_id] = agent_response.result

            except Exception as e:
                execution_results[step_id] = {
                    "success": False,
                    "error": str(e)
                }

        return execution_results

    async def _execute_natural_language_step(
        self,
        target_agent: str,
        natural_language_query: str,
        context: Dict[str, Any]
    ) -> NaturalLanguageResponse:
        """Execute a single natural language step"""

        agent_url = self.service_registry.get_agent_url(target_agent)

        request = NaturalLanguageRequest(
            request_id=f"step_{int(time.time())}",
            query=natural_language_query,
            context=context
        )

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{agent_url}/process",
                json=request.dict(),
                timeout=30.0
            )
            response.raise_for_status()

            return NaturalLanguageResponse(**response.json())

## Example Workflow Execution V2

### Input Request
```
"Add part number 1234 to RO number 1234, and send payment link of 100$ to ambujmehra16@gmail.com"
```

### Generated Natural Language Workflow Plan V2
```json
{
  "workflow_plan": {
    "plan_id": "wf_v2_20250625_104145_001",
    "risk_level": "medium",
    "estimated_duration_seconds": 45,
    "execution_steps": [
      {
        "step_id": "validate_repair_order",
        "step_order": 1,
        "target_agent": "repair_orders",
        "natural_language_query": "Check if repair order RO-1234 exists and get its current details including customer information and status",
        "context_from_previous_steps": {},
        "dependencies": [],
        "parallel_group": "validation_group",
        "failure_handling": "abort",
        "timeout_seconds": 30,
        "retry_attempts": 2,
        "expected_outcome": "Confirm repair order exists and retrieve details"
      },
      {
        "step_id": "validate_part",
        "step_order": 2,
        "target_agent": "parts",
        "natural_language_query": "Check if part number 1234 exists, get its details, and verify it's available in stock",
        "context_from_previous_steps": {},
        "dependencies": [],
        "parallel_group": "validation_group",
        "failure_handling": "abort",
        "timeout_seconds": 30,
        "retry_attempts": 2,
        "expected_outcome": "Confirm part exists and is available"
      },
      {
        "step_id": "add_part_to_repair_order",
        "step_order": 3,
        "target_agent": "parts",
        "natural_language_query": "Reserve part number 1234 for repair order RO-1234 and update the inventory to reflect this reservation",
        "context_from_previous_steps": {
          "validate_repair_order": "repair_order_details",
          "validate_part": "part_details"
        },
        "dependencies": ["validate_repair_order", "validate_part"],
        "parallel_group": null,
        "failure_handling": "retry",
        "timeout_seconds": 30,
        "retry_attempts": 2,
        "expected_outcome": "Part reserved for repair order and inventory updated"
      },
      {
        "step_id": "create_payment_link",
        "step_order": 4,
        "target_agent": "payment",
        "natural_language_query": "Create a payment link for $100 USD for repair order RO-1234 and send it to the email address ambujmehra16@gmail.com",
        "context_from_previous_steps": {
          "validate_repair_order": "repair_order_details"
        },
        "dependencies": ["validate_repair_order"],
        "parallel_group": null,
        "failure_handling": "retry",
        "timeout_seconds": 30,
        "retry_attempts": 2,
        "expected_outcome": "Payment link created and sent to customer"
      }
    ],
    "validation_summary": [
      "Verify repair order RO-1234 exists and is in valid state",
      "Confirm part 1234 exists and is available in inventory",
      "Validate email address format for ambujmehra16@gmail.com",
      "Ensure payment amount $100 is valid and positive"
    ],
    "success_criteria": "Part successfully reserved for repair order and payment link sent to customer"
  }
}
```

### Agent Execution Examples V2

#### Step 1: Repair Orders Agent Processing
```
Natural Language Query: "Check if repair order RO-1234 exists and get its current details including customer information and status"

Agent LLM Analysis:
- Tool Plan: [{"name": "get_repair_order_details", "parameters": {"repair_order_id": "RO-1234"}}]
- Reasoning: "Need to retrieve repair order details to validate existence and get customer info"

MCP Tool Execution:
- Called: get_repair_order_details(repair_order_id="RO-1234")
- Result: {"repair_order_id": "RO-1234", "status": "scheduled", "customer_id": "C-456", "customer_email": "ambujmehra16@gmail.com"}

Agent Response:
- Success: true
- Explanation: "Found repair order RO-1234. It's currently scheduled and belongs to customer C-456 with email ambujmehra16@gmail.com"
- Tools Used: ["get_repair_order_details"]
```

#### Step 2: Parts Agent Processing
```
Natural Language Query: "Check if part number 1234 exists, get its details, and verify it's available in stock"

Agent LLM Analysis:
- Tool Plan: [{"name": "get_part_details", "parameters": {"part_number": "1234"}}]
- Reasoning: "Need to get part details which includes availability information"

MCP Tool Execution:
- Called: get_part_details(part_number="1234")
- Result: {"part_number": "1234", "name": "Brake Pad Set", "price": 45.99, "quantity_in_stock": 15, "available": true}

Agent Response:
- Success: true
- Explanation: "Part 1234 (Brake Pad Set) exists and is available with 15 units in stock at $45.99 each"
- Tools Used: ["get_part_details"]
```

### Expected Output V2
```
🚗 AUTOMOTIVE SERVICE EXECUTION SUMMARY

📋 Original Request: Add part number 1234 to RO number 1234, and send payment link of 100$ to ambujmehra16@gmail.com

🎯 Workflow Completed Successfully!

📝 EXECUTION STEPS:
   ✅ Step 1: Repair Order Validation
      Agent: Repair Orders
      Action: Found repair order RO-1234. It's currently scheduled and belongs to customer C-456 with email ambujmehra16@gmail.com
      Tools Used: get_repair_order_details

   ✅ Step 2: Part Validation
      Agent: Parts
      Action: Part 1234 (Brake Pad Set) exists and is available with 15 units in stock at $45.99 each
      Tools Used: get_part_details

   ✅ Step 3: Part Reservation
      Agent: Parts
      Action: Successfully reserved 1 unit of part 1234 for repair order RO-1234. Inventory updated to 14 units remaining.
      Tools Used: reserve_parts, update_stock

   ✅ Step 4: Payment Link Creation
      Agent: Payment
      Action: Created payment link for $100 USD and sent to ambujmehra16@gmail.com. Payment link: https://pay.automotive.com/RO-1234
      Tools Used: create_payment_link, send_payment_notification

🔒 VALIDATIONS COMPLETED:
   ✓ Repair order RO-1234 exists and is in valid state
   ✓ Part 1234 exists and is available in inventory
   ✓ Email address ambujmehra16@gmail.com is properly formatted
   ✓ Payment amount $100 is valid and positive

🎉 SUMMARY:
Part 1234 (Brake Pad Set) has been successfully reserved for repair order RO-1234. The customer has been sent a payment link for $100 to complete the transaction. The repair order is ready to proceed with the brake service.

💡 NEXT STEPS:
- Customer can pay using the link sent to their email
- Technician can begin work once payment is confirmed
- Part 1234 is reserved and ready for installation
```

## Key Improvements in V2 vs V1

### Communication Model
| Aspect | V1 (Tool-Based) | V2 (Natural Language) |
|--------|----------------|----------------------|
| **Orchestrator → Agent** | Specific tool calls with parameters | Natural language queries |
| **Agent Processing** | Direct tool mapping | LLM interprets query and selects tools |
| **Agent Autonomy** | Limited to predefined operations | Full autonomy in tool selection |
| **Flexibility** | Rigid tool-parameter mapping | Flexible natural language understanding |

### Workflow Planning
| Aspect | V1 | V2 |
|--------|----|----|
| **Planning Output** | Tool calls with parameters | Natural language instructions |
| **Agent Instructions** | `{"operation": "create_payment_link", "parameters": {...}}` | `"Create a payment link for $100 and send it to customer@email.com"` |
| **Context Passing** | Structured parameter passing | Natural language context + structured data |
| **Error Handling** | Tool-specific error codes | Natural language explanations |

### Agent Intelligence
| Capability | V1 | V2 |
|------------|----|----|
| **Query Understanding** | Parameter validation only | Full natural language comprehension |
| **Tool Selection** | Predefined operation mapping | Dynamic tool selection based on query |
| **Response Generation** | Structured data only | Natural language explanations + data |
| **Adaptability** | Fixed operation set | Flexible interpretation of requests |

### Benefits of V2 Architecture

1. **Enhanced Flexibility**: Agents can handle variations in natural language queries
2. **Better User Experience**: Natural language responses are more understandable
3. **Improved Maintainability**: Less rigid coupling between orchestrator and agents
4. **Scalability**: Easy to add new capabilities without changing orchestrator
5. **Fault Tolerance**: Agents can adapt to unexpected query variations
6. **Context Awareness**: Better handling of contextual information from previous steps

### Implementation Considerations

1. **LLM Costs**: Each agent now uses LLM for query processing
2. **Response Time**: Additional LLM calls may increase latency
3. **Consistency**: Need careful prompt engineering for consistent behavior
4. **Error Handling**: More complex error scenarios with natural language processing
5. **Testing**: Requires testing of natural language variations

This V2 architecture provides a more intelligent, flexible, and user-friendly system while maintaining the microservice benefits of the original design.
```
```
