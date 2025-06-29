"""
Simple Agent Example - Basic implementation from the quickstart guide
This shows how to create and run a single agent
"""

import os
import asyncio
from agents import Agent, Runner

# Import configuration
from config import OPENAI_API_KEY

# Set the OpenAI API key from config
os.environ['OPENAI_API_KEY'] = OPENAI_API_KEY

# Create your first agent
agent = Agent(
    name="Math Tutor",
    instructions="You provide help with math problems. Explain your reasoning at each step and include examples",
)

async def simple_demo():
    """Simple demo with a single agent"""
    print("Simple Agent Demo")
    print("=" * 20)
    
    question = "What is 15 * 8?"
    print(f"Question: {question}")
    
    result = await Runner.run(agent, question)
    print(f"Response: {result.final_output}")

if __name__ == "__main__":
    asyncio.run(simple_demo())
