import asyncio
import uuid
import os
import logging
from typing import Literal, Optional, List
from pydantic import BaseModel
from agents import Agent, Runner, trace, ModelSettings

# Import configuration
from config import OPENAI_API_KEY

# Set the OpenAI API key from config
os.environ['OPENAI_API_KEY'] = OPENAI_API_KEY

# Disable httpx INFO logs to hide OpenAI API calls
logging.getLogger("httpx").setLevel(logging.WARNING)

"""
Simple handoffs/routing pattern using structured outputs. All messages go through the triage agent, 
which uses structured responses to determine routing decisions for single or multiple language requests.
"""

# Structured output models
class TriageDecision(BaseModel):
    """Decision from triage agent about next action"""
    action: Literal["handoff_to_french", "handoff_to_spanish", "handoff_to_german", "complete"]
    message: str
    remaining_languages: List[str] = []

class TranslationResponse(BaseModel):
    """Response from a specialist translation agent"""
    translated_text: str
    source_language: str
    target_language: str
    message: str

def create_agents(llm_config=None):
    # Convert dict config to ModelSettings if needed
    model_settings = None
    model_name = None

    if llm_config:
        if isinstance(llm_config, dict):
            # Extract model name separately
            model_name = llm_config.get("model")

            # Create ModelSettings with supported parameters
            model_settings = ModelSettings(
                temperature=llm_config.get("temperature"),
                max_tokens=llm_config.get("max_tokens"),
                top_p=llm_config.get("top_p"),
                frequency_penalty=llm_config.get("frequency_penalty"),
                presence_penalty=llm_config.get("presence_penalty"),
                tool_choice=llm_config.get("tool_choice"),
                parallel_tool_calls=llm_config.get("parallel_tool_calls"),
            )
        else:
            # Assume it's already a ModelSettings object
            model_settings = llm_config

    # Create specialist agents with optional LLM config
    french_agent = Agent(
        name="french_agent",
        instructions="""You are a French language expert.
                        - ALWAYS do TWO things in every response:
                        1. Provide the French translation clearly
                        2. Immediately call transfer_to_triage_agent tool to hand back control
                        - Translate the given text to French accurately and naturally.
                        CRITICAL: Always include both the translation AND the handoff tool call in the same response.""",
        model=model_name,  # Pass model name
        model_settings=model_settings or ModelSettings(),  # Pass ModelSettings
        handoffs=[],  # Will be set after triage_agent is defined
    )

    spanish_agent = Agent(
        name="spanish_agent",
        instructions="""You are a Spanish language expert.
                        - ALWAYS do TWO things in every response:
                        1. Provide the Spanish translation clearly
                        2. Immediately call transfer_to_triage_agent tool to hand back control
                        - Translate the given text to Spanish accurately and naturally.
                        CRITICAL: Always include both the translation AND the handoff tool call in the same response.""",
        model=model_name,  # Pass model name
        model_settings=model_settings or ModelSettings(),  # Pass ModelSettings
        handoffs=[],  # Will be set after triage_agent is defined
    )

    german_agent = Agent(
        name="german_agent",
        instructions="""You are a German language expert.
                        - ALWAYS do TWO things in every response:
                        1. Provide the German translation clearly
                        2. Immediately call transfer_to_triage_agent tool to hand back control
                        - Translate the given text to German accurately and naturally.
                        CRITICAL: Always include both the translation AND the handoff tool call in the same response.""",
        model=model_name,  # Pass model name
        model_settings=model_settings or ModelSettings(),  # Pass ModelSettings
        handoffs=[],  # Will be set after triage_agent is defined
    )

    # Triage agent handles all routing decisions
    triage_agent = Agent(
        name="triage_agent",
        instructions="""You are a triage agent that ALWAYS does TWO things in every response:

                    1. FIRST: Provide TriageDecision structured output with your routing decision
                    2. SECOND: Immediately call the appropriate handoff tool based on your decision

                    CRITICAL: You must do BOTH actions in the same response:
                    - If action="handoff_to_french" → call transfer_to_french_agent tool
                    - If action="handoff_to_spanish" → call transfer_to_spanish_agent tool  
                    - If action="complete" → do NOT call any tools
                    - ONLY ONE TOOL CAN BE CALLED IN CASE OF MULTIPLE remaining_languages
                    - Keep track of languages remaining to be translated in remaining_languages
                    - You can choose any language to start with, but must complete all requested languages

                    Example response pattern:
                    - Structured output: {"action": "handoff_to_french", "message": "...", "remaining_languages": ["spanish"]}
                    - Tool call: transfer_to_french_agent()
                    """,
        output_type=TriageDecision,
        model=model_name,  # Pass model name
        model_settings=model_settings or ModelSettings(),  # Pass ModelSettings
        handoffs=[french_agent, spanish_agent, german_agent],
    )

    # Set up bidirectional handoffs after all agents are defined
    # Specialist agents automatically hand back to triage after providing translation
    french_agent.handoffs = [triage_agent]
    spanish_agent.handoffs = [triage_agent]
    german_agent.handoffs = [triage_agent]

    return triage_agent, french_agent, spanish_agent, german_agent

# Create default agents (can be overridden by calling create_agents with custom LLM config)
triage_agent, french_agent, spanish_agent, german_agent = create_agents()


async def main(llm_config=None):
    triage_agent, french_agent, spanish_agent, german_agent = create_agents(llm_config)

    # Create conversation ID for tracing
    conversation_id = str(uuid.uuid4().hex[:16])

    print("🌐 Multi-Language Agent System")
    print("=" * 50)
    print("I can help you with German, French, and Spanish!")
    print("All messages go through the triage agent for routing.\n")

    # Start with triage agent
    agent = triage_agent
    
    # Get first message
    msg = input("How can I help you today? ")
    
    # Main conversation loop
    while True:
        # Start fresh inputs for each conversation
        inputs = [{"content": msg, "role": "user"}]
        
        # Process the entire conversation under a single trace
        with trace("Multi-Language Conversation", group_id=conversation_id):
            # Continue processing until conversation is complete
            while True:
                # Process current message through current agent
                print("Agent running :: ", agent.name)
                result = await Runner.run(agent, input=inputs)

                # Print the output directly
                print(result.final_output)
                print("\n")
                
                inputs = result.to_input_list()
                agent = result.last_agent

                # Check if we're back at triage agent and use structured output to determine next action
                if agent == triage_agent:
                    # Get the structured response from triage agent
                    try:
                        triage_response = result.final_output
                        if isinstance(triage_response, TriageDecision):
                            print(f"Triage decision: {triage_response.action}, remaining: {triage_response.remaining_languages}")
                            if triage_response.action == "complete":
                                print("✅ Translation workflow completed!")
                                # Conversation is complete, break out of inner loop
                                break
                            # If not complete, the handoff will continue automatically
                        else:
                            print(f"Unexpected triage response type: {type(triage_response)}")
                            # Fallback: break if we can't parse the structured output
                            break
                    except Exception as e:
                        print(f"Error parsing triage decision: {e}")
                        break

                # Safety check: prevent infinite loops by limiting iterations
                # This shouldn't be needed with proper logic, but provides safety
                if len(inputs) > 20:  # Arbitrary limit
                    print("⚠️  Too many iterations, breaking to prevent infinite loop")
                    break
                
                # If we're not at triage agent, keep processing
        
        # After conversation is complete, ask for new input
        print("\n" + "="*50)
        user_msg = input("\nEnter a message (or 'quit' to exit): ")
        
        if user_msg.lower() in ['quit', 'exit', 'bye']:
            print("👋 Goodbye!")
            break
            
        # Set up for next conversation - inputs are reset fresh for each conversation
        msg = user_msg
        agent = triage_agent  # Always start with triage agent for new conversations


def create_custom_llm_config():
    # Example configurations you can tune:
    custom_config = {
        "model": "gpt-4o",          # Model selection (gpt-4o supports structured outputs)
        "temperature": 0.3,         # Lower for more deterministic responses
        "max_tokens": 1500,          # Limit response length
        "top_p": 0.9,              # Nucleus sampling
        "frequency_penalty": 0.1,   # Reduce repetition
        "presence_penalty": 0.1,    # Encourage topic diversity
    }
    # Return the config you want to use
    return custom_config  # Change this to fast_config or creative_config as needed

if __name__ == "__main__":
    # Example 1: Run with default configuration
    # asyncio.run(main())

    # Example 2: Run with custom LLM configuration
    custom_llm_config = create_custom_llm_config()
    asyncio.run(main(custom_llm_config))

    # Example 3: Run with inline configuration
    # asyncio.run(main({"model": "gpt-3.5-turbo", "temperature": 0.1, "max_tokens": 300}))