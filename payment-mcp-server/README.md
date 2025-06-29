# Payment MCP Server

A comprehensive Model Context Protocol (MCP) server for payment management with HTTP transport capabilities. This server exposes payment transaction and payment link management functionality through MCP tools, with full CORS support for browser clients.

## Features

### Core Capabilities
- **MCP Protocol Support**: Full implementation of Model Context Protocol with latest SDK
- **HTTP Transport**: Express.js server with CORS support on port 3002
- **Dual Mode Operation**: Can run as pure MCP server (stdio) or HTTP server with MCP capabilities
- **Comprehensive Payment Management**: 16 tools covering all transaction and payment link operations

### Payment Management Tools

#### Transaction Management (9 tools)
- `get_transactions_list` - Paginated list of transactions with sorting/filtering
- `get_transaction_by_id` - Detailed transaction information
- `create_transaction` - Create new transactions
- `update_transaction_status` - Update transaction status
- `process_transaction` - Process transactions (mark as captured)
- `get_transactions_by_customer` - Filter by customer email
- `get_transactions_by_status` - Filter by transaction status
- `get_transactions_by_payment_type` - Filter by payment type (CREDIT_CARD, DEBIT_CARD, UPI, etc.)
- `get_transactions_by_card_type` - Filter by card type (VISA, MASTERCARD, RUPAY, etc.)

#### Payment Link Management (7 tools)
- `get_payment_links_list` - Paginated list of payment links
- `get_payment_link_by_id` - Detailed payment link information
- `create_payment_link` - Create new payment links with expiry and notifications
- `update_payment_link` - Update payment link details
- `process_payment_link` - Mark payment link as paid
- `cancel_payment_link` - Cancel active payment links
- `get_payment_links_by_status` - Filter by status (ACTIVE, PAID, EXPIRED, CANCELLED)

### Technical Features
- **Input Validation**: Comprehensive Zod-based validation with business rules
- **Error Handling**: Multi-layered error handling with custom error types
- **Caching**: NodeCache integration with TTL and invalidation strategies
- **Logging**: Winston-based structured logging with file rotation
- **Health Monitoring**: Health check endpoints for service monitoring
- **Rate Limiting**: Express rate limiting for API protection
- **Security**: Helmet.js security headers and CORS configuration

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Java Spring Boot payments service running on port 8080
- Git

### Installation

1. **Navigate to the project directory:**
   ```bash
   cd payment-mcp-hosted
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Build the project:**
   ```bash
   npm run build
   ```

5. **Start the server:**
   ```bash
   # HTTP mode (default) - includes MCP capabilities
   npm start
   
   # Or MCP stdio mode only
   npm run start:mcp
   
   # Development mode with auto-reload
   npm run dev
   ```

### Environment Configuration

Create a `.env` file based on `.env.example`:

```env
# Server Configuration
NODE_ENV=development
PORT=3002

# Java API Integration
JAVA_API_BASE_URL=http://localhost:8080/api

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Cache Configuration
CACHE_TTL_SECONDS=300
CACHE_MAX_KEYS=1000

# Logging
LOG_LEVEL=info
```

## Usage

### HTTP Mode (Default)
When running in HTTP mode, the server provides:

- **Root endpoint**: `GET /` - Server information
- **Health check**: `GET /health` - Service health status
- **MCP info**: `GET /mcp` - MCP server information and capabilities
- **Tools listing**: `GET /mcp/tools` - Available MCP tools
- **Tool execution**: `POST /mcp/tools/:toolName` - Execute specific tools
- **Cache management**: `DELETE /api/cache`, `GET /api/cache/stats`

### MCP Stdio Mode
For pure MCP integration:
```bash
npm run start:mcp
```

### Testing Tools via HTTP API

Example tool execution:
```bash
# Get transactions list
curl -X POST http://localhost:3002/mcp/tools/get_transactions_list \
  -H "Content-Type: application/json" \
  -d '{"page": 0, "size": 10, "sortBy": "createdAt", "sortDirection": "desc"}'

# Create a transaction
curl -X POST http://localhost:3002/mcp/tools/create_transaction \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceId": "INV-001",
    "invoiceNumber": "INV-001", 
    "customerId": "CUST-001",
    "customerEmail": "customer@example.com",
    "amount": 150.00,
    "currency": "INR",
    "paymentType": "CREDIT_CARD",
    "cardType": "VISA",
    "description": "Product purchase"
  }'

# Get payment links by status
curl -X POST http://localhost:3002/mcp/tools/get_payment_links_by_status \
  -H "Content-Type: application/json" \
  -d '{"status": "ACTIVE", "page": 0, "size": 5}'
```

## Development

### Project Structure
```
src/
├── config/           # Configuration and constants
├── mcp/             # MCP protocol implementation
│   ├── tools/       # Tool definitions and handlers
│   ├── types.ts     # TypeScript types and schemas
│   └── server.ts    # MCP server implementation
├── services/        # External service clients
├── server/          # Express HTTP server
├── utils/           # Utilities (validation, errors, logging)
└── index.ts         # Application entry point

tests/
├── tools/           # Tool-specific tests
├── integration/     # Integration tests
└── setup.ts         # Test configuration
```

### Available Scripts

```bash
# Development
npm run dev          # Start with auto-reload
npm run build        # TypeScript compilation
npm run type-check   # Type checking only

# Production
npm start            # Start HTTP server
npm run start:mcp    # Start MCP stdio server

# Testing
npm test             # Run test suite
npm run test:watch   # Watch mode testing
npm run test:coverage # Coverage report

# Code Quality
npm run lint         # ESLint checking
npm run lint:fix     # Auto-fix linting issues

# Utilities
npm run clean        # Clean build artifacts
```

### Testing

The project includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch

# Run specific test file
npm test -- transactionTools.test.ts
```

## API Integration

The server integrates with a Java Spring Boot payments API. Required endpoints:

### Transaction Endpoints
- `GET /api/transactions` - List transactions
- `GET /api/transactions/{id}` - Get transaction by ID
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/{id}/status` - Update status
- `POST /api/transactions/{id}/process` - Process transaction
- `GET /api/transactions/customer/{email}` - By customer
- `GET /api/transactions/status/{status}` - By status
- `GET /api/transactions/payment-type/{type}` - By payment type
- `GET /api/transactions/card-type/{type}` - By card type

### Payment Link Endpoints
- `GET /api/payment-links` - List payment links
- `GET /api/payment-links/{id}` - Get payment link by ID
- `POST /api/payment-links` - Create payment link
- `PUT /api/payment-links/{id}` - Update payment link
- `POST /api/payment-links/{id}/process` - Process payment
- `POST /api/payment-links/{id}/cancel` - Cancel payment link
- `GET /api/payment-links/status/{status}` - By status

## Production Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure proper `JAVA_API_BASE_URL`
3. Set appropriate `CORS_ORIGINS`
4. Configure logging levels
5. Set up process manager (PM2, systemd, etc.)

### Security Considerations
- Use HTTPS in production
- Configure proper CORS origins
- Set up API rate limiting
- Enable request logging
- Monitor health endpoints
- Secure environment variables

### Monitoring
- Health check endpoint: `/health`
- Cache statistics: `/api/cache/stats`
- Structured logging with Winston
- Error tracking and alerting

## Troubleshooting

### Common Issues

1. **Connection to Java API fails**
   - Verify `JAVA_API_BASE_URL` in `.env`
   - Check if Java service is running on port 8080
   - Test connectivity: `curl http://localhost:8080/api/health`

2. **CORS errors in browser**
   - Add your domain to `CORS_ORIGINS` in `.env`
   - Restart the server after environment changes

3. **Port already in use**
   - Change `PORT` in `.env` file
   - Kill existing process: `lsof -ti:3002 | xargs kill`

4. **Cache issues**
   - Clear cache: `curl -X DELETE http://localhost:3002/api/cache`
   - Check cache stats: `curl http://localhost:3002/api/cache/stats`

### Debugging
- Enable debug logging: Set `LOG_LEVEL=debug` in `.env`
- Check logs in `logs/` directory
- Use health endpoint for service status
- Test individual tools via HTTP API

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Update documentation
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the logs in `logs/` directory
3. Test health endpoints
4. Submit an issue with detailed error information
