# OpenAI Agents SDK Playground

This folder contains implementations of the OpenAI Agents SDK quickstart guide with a configuration-based approach for API key management.

## Setup

1. **Install dependencies:**
   ```bash
   cd AgentsSDKPlayGround
   pip install -r requirements.txt
   ```

2. **Configure your API key:**
   - Open `config.py`
   - Replace `"sk-your-openai-api-key-here"` with your actual OpenAI API key
   - If you don't have an API key, follow [these instructions](https://platform.openai.com/docs/quickstart#create-and-export-an-api-key)

## Files

- **`config.py`** - Configuration file where you set your OpenAI API key
- **`requirements.txt`** - Python dependencies
- **`simple_agent.py`** - Basic single agent example
- **`quickstart.py`** - Complete quickstart implementation with multiple agents, handoffs, and guardrails

## Running the Examples

### Simple Agent Example
```bash
python simple_agent.py
```

### Complete Quickstart Example
```bash
python quickstart.py
```

## Features Implemented

The quickstart implementation includes:

1. **Multiple Agents:**
   - Triage Agent (routes questions to specialists)
   - Math Tutor Agent (handles math questions)
   - History Tutor Agent (handles history questions)
   - Guardrail Agent (checks if questions are homework-related)

2. **Handoffs:**
   - Automatic routing between specialist agents based on question type

3. **Guardrails:**
   - Input validation to ensure questions are homework-related
   - Custom guardrail function with structured output

4. **Configuration-based API Key:**
   - API key stored in `config.py` instead of environment variables
   - Easy to modify and version control (remember to keep your actual key private)

## Key Differences from Original Guide

- **API Key Management:** Uses `config.py` instead of `export OPENAI_API_KEY=...`
- **Enhanced Examples:** Added more test cases and better output formatting
- **Modular Structure:** Separated simple and complex examples into different files

## Viewing Traces

To review what happened during your agent runs, navigate to the [Trace viewer in the OpenAI Dashboard](https://platform.openai.com/traces).

## Next Steps

- Explore the [full documentation](https://openai.github.io/openai-agents-python/)
- Learn about [tools](https://openai.github.io/openai-agents-python/tools/)
- Experiment with [custom models](https://openai.github.io/openai-agents-python/models/)
- Try [voice agents](https://openai.github.io/openai-agents-python/voice/quickstart/)
