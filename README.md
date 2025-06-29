# Agentic AI Playground

A comprehensive multi-language playground for exploring agentic AI patterns and implementations across different technologies and frameworks.

## 🚀 Overview

This repository contains various experiments, implementations, and examples of agentic AI systems using multiple programming languages and frameworks:

- **Python**: OpenAI Agents SDK implementations
- **Java**: Spring Boot microservices for backend systems
- **TypeScript/Node.js**: MCP (Model Context Protocol) servers and client applications

## 📁 Project Structure

```
agentic-ai-playground/
├── AgentsSDKPlayGround/          # Python-based agent implementations
│   ├── handoff.py               # Multi-language translation handoff system
│   ├── automotive_multi-agent.py # Automotive industry multi-agent workflow
│   ├── trading_agent.py         # Financial trading agent
│   └── simple_agent.py          # Basic agent examples
├── partservice/                 # Java Spring Boot service for parts management
├── paymentservice/              # Java Spring Boot service for payments
├── roservice/                   # Java Spring Boot service for return orders
├── part-mcp-server/             # TypeScript MCP server for parts
├── payment-mcp-server/          # TypeScript MCP server for payments
└── ro-mcp-server/               # TypeScript MCP server for return orders
```

## 🛠 Technologies Used

### Python
- OpenAI Agents SDK
- Pydantic for structured outputs
- AsyncIO for asynchronous operations
- Logging and tracing capabilities

### Java
- Spring Boot 3.x
- Maven build system
- RESTful API development
- Microservices architecture

### TypeScript/Node.js
- Model Context Protocol (MCP)
- Express.js servers
- Jest testing framework
- Modern ES modules

## 🔧 Getting Started

### Prerequisites
- Python 3.11+
- Java 17+
- Node.js 18+
- Maven 3.6+
- Git

### Setup Instructions

#### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/agentic-ai-playground.git
cd agentic-ai-playground
```

#### 2. Python Environment Setup
```bash
cd AgentsSDKPlayGround
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

#### 3. Java Services Setup
```bash
# For any Java service (example with partservice)
cd partservice
mvn clean install
mvn spring-boot:run
```

#### 4. TypeScript/Node.js Setup
```bash
# For any MCP server (example with part-mcp-server)
cd part-mcp-server
npm install
npm run build
npm start
```

## 🧪 Key Examples

### Multi-Language Translation Agent
A sophisticated handoff system that coordinates multiple specialist agents for translation tasks:

```bash
cd AgentsSDKPlayGround
source .venv/bin/activate
python handoff.py
```

**Example interaction:**
```
User: "Translate Hello to French and Spanish"
Expected flow: Triage → French → Triage → Spanish → Triage → Complete
```

### Automotive Multi-Agent Workflow
Demonstrates complex multi-agent interactions in an automotive context:

```bash
cd AgentsSDKPlayGround
python automotive_multi-agent.py
```

### MCP Server Integration
Model Context Protocol servers for seamless AI integration:

```bash
cd part-mcp-server
npm start
# Server runs on configured port with MCP protocol
```

## 🏗 Architecture Patterns

### Agent Handoff Pattern
- **Triage Agent**: Routes requests to specialist agents
- **Specialist Agents**: Handle domain-specific tasks
- **Structured Outputs**: Use Pydantic models for type safety
- **Bidirectional Communication**: Agents can hand control back and forth

### Microservices Pattern
- **Service Separation**: Each domain has its own service
- **REST APIs**: Standard HTTP interfaces
- **Database Per Service**: Independent data storage
- **Event-Driven**: Asynchronous communication where needed

### MCP Integration Pattern
- **Protocol Compliance**: Follows MCP specifications
- **Tool Registration**: Dynamic tool discovery
- **Structured Communication**: JSON-RPC based messaging
- **Client-Server Architecture**: Clear separation of concerns

## 🔐 Configuration

### Environment Variables
Create appropriate `.env` files for each service:

```bash
# AgentsSDKPlayGround/.env
OPENAI_API_KEY=your_openai_api_key_here

# Java services (application.properties)
server.port=8080
spring.datasource.url=jdbc:h2:mem:testdb

# MCP servers
MCP_SERVER_PORT=3000
LOG_LEVEL=info
```

## 🧪 Testing

### Python Tests
```bash
cd AgentsSDKPlayGround
python -m pytest tests/
```

### Java Tests
```bash
cd partservice
mvn test
```

### TypeScript Tests
```bash
cd part-mcp-server
npm test
```

## 📝 Documentation

- [Agent Patterns](Agent.md) - Detailed agent implementation patterns
- [Multi-Agent Workflows](AgentV2.md) - Complex workflow examples
- [Advanced Patterns](AgentV3.md) - Advanced implementation techniques

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for the Agents SDK
- Model Context Protocol community
- Spring Boot team
- TypeScript community

## 📞 Support

For questions and support, please open an issue in the GitHub repository.

---

**Happy experimenting with agentic AI! 🤖✨**
