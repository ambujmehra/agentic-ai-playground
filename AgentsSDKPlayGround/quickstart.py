"""
OpenAI Agents SDK Quickstart Implementation
This implements the complete quickstart guide from https://openai.github.io/openai-agents-python/quickstart/
with API key loaded from config.py instead of environment variables
"""

import os
import asyncio
from agents import Agent, InputGuardrail, GuardrailFunctionOutput, Runner
from agents.exceptions import InputGuardrailTripwireTriggered
from pydantic import BaseModel

# Import configuration
from config import OPENAI_API_KEY

# Set the OpenAI API key from config
os.environ['OPENAI_API_KEY'] = OPENAI_API_KEY

class HomeworkOutput(BaseModel):
    is_homework: bool
    reasoning: str

# Define the guardrail agent
guardrail_agent = Agent(
    name="Guardrail check",
    instructions="Check if the user is asking about homework.",
    output_type=HomeworkOutput,
)

# Define specialist agents
math_tutor_agent = Agent(
    name="Math Tutor",
    handoff_description="Specialist agent for math questions",
    instructions="You provide help with math problems. Explain your reasoning at each step and include examples",
)

history_tutor_agent = Agent(
    name="History Tutor",
    handoff_description="Specialist agent for historical questions",
    instructions="You provide assistance with historical queries. Explain important events and context clearly.",
)

# Define the guardrail function
async def homework_guardrail(ctx, agent, input_data):
    result = await Runner.run(guardrail_agent, input_data, context=ctx.context)
    final_output = result.final_output_as(HomeworkOutput)
    return GuardrailFunctionOutput(
        output_info=final_output,
        tripwire_triggered=not final_output.is_homework,
    )

# Define the triage agent with handoffs and guardrails
triage_agent = Agent(
    name="Triage Agent",
    instructions="You determine which agent to use based on the user's homework question",
    handoffs=[history_tutor_agent, math_tutor_agent],
    input_guardrails=[
        InputGuardrail(guardrail_function=homework_guardrail),
    ],
)

async def main():
    """Main function to run the agent orchestration"""
    print("OpenAI Agents SDK Quickstart Demo")
    print("=" * 40)
    
    # Test with a history question
    print("\n1. Testing with a history question:")
    print("Question: 'Who was the first president of the United States?'")
    result = await Runner.run(triage_agent, "who was the first president of the united states?")
    print("Response:", result.final_output)
    
    # Test with a non-homework question (should trigger guardrail)
    print("\n2. Testing with a non-homework question:")
    print("Question: 'What is life?'")
    result = await Runner.run(triage_agent, "what is life")
    print("Response:", result.final_output)
    
    # Test with a math question
    print("\n3. Testing with a math question:")
    print("Question: 'What is 2 + 2 and how do you solve it?'")
    result = await Runner.run(triage_agent, "What is 2 + 2 and how do you solve it?")
    print("Response:", result.final_output)

if __name__ == "__main__":
    asyncio.run(main())
