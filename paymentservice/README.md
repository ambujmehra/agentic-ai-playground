# Payment Service

A Spring Boot Java microservice providing comprehensive payment processing APIs with transaction management, payment links, and database integration.

## 🚀 Quick Start

```bash
# Build and run the service
mvn clean install
mvn spring-boot:run

# Service will be available at http://localhost:8080
```

## 🏗️ Technology Stack

- **Java 11**
- **Spring Boot 2.7.18**
- **H2 Database** (in-memory for development)
- **Maven** for dependency management
- **Swagger/OpenAPI** for API documentation

## 📁 Project Structure

```
paymentservice/
├── src/main/java/com/paymentservice/
│   ├── PaymentServiceApplication.java    # Main application class
│   ├── controller/                       # REST controllers
│   ├── service/                         # Business logic
│   ├── repository/                      # Data access layer
│   ├── entity/                          # JPA entities
│   ├── dto/                             # Data transfer objects
│   ├── config/                          # Configuration classes
│   ├── exception/                       # Custom exceptions
│   └── enums/                           # Enumerations
├── src/main/resources/
│   └── application.properties           # Application configuration
└── pom.xml                              # Maven configuration
```

## 🔧 Configuration

### Application Properties
- **Port**: 8080
- **Database**: H2 (in-memory)
- **H2 Console**: Available at `/h2-console`
- **Swagger UI**: Available at `/swagger-ui.html`

### Environment Variables
```bash
SERVER_PORT=8080                    # Server port (default: 8080)
SPRING_DATASOURCE_URL=...          # Database URL (optional)
SPRING_DATASOURCE_USERNAME=...     # Database username (optional)
SPRING_DATASOURCE_PASSWORD=...     # Database password (optional)
```

## 📊 API Endpoints

### Transactions
- `GET /api/v1/transactions` - List all transactions
- `GET /api/v1/transactions/{id}` - Get transaction by ID
- `POST /api/v1/transactions` - Create new transaction
- `PUT /api/v1/transactions/{id}` - Update transaction
- `DELETE /api/v1/transactions/{id}` - Delete transaction

### Payment Links
- `GET /api/v1/payment-links` - List payment links
- `GET /api/v1/payment-links/{id}` - Get payment link by ID
- `POST /api/v1/payment-links` - Create payment link
- `PUT /api/v1/payment-links/{id}` - Update payment link
- `GET /api/v1/payment-links/status/{status}` - Get links by status

## 🧪 Testing

### API Testing Scripts
```bash
# Quick API test
./quick-test.sh

# Comprehensive endpoint testing
./test-api-endpoints.sh

# Full test suite
./run-tests.sh
```

### Maven Tests
```bash
# Run unit tests
mvn test

# Run integration tests
mvn verify

# Generate test reports
mvn surefire-report:report
```

## 🛠️ Development

### Build and Run
```bash
# Clean build
mvn clean compile

# Run with Maven
mvn spring-boot:run

# Run with Java
mvn clean package
java -jar target/paymentservice-1.0.0.jar
```

### Database Access
- **H2 Console**: http://localhost:8080/h2-console
- **JDBC URL**: `jdbc:h2:mem:testdb`
- **Username**: `sa`
- **Password**: (empty)

### API Documentation
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **OpenAPI JSON**: http://localhost:8080/v3/api-docs

## 🔍 Monitoring and Health

### Health Checks
```bash
# Application health
curl http://localhost:8080/actuator/health

# Application info
curl http://localhost:8080/actuator/info
```

### Metrics
- **Actuator Endpoints**: Available at `/actuator/*`
- **Metrics**: Available at `/actuator/metrics`

## 🏗️ Architecture

### Design Patterns
- **Repository Pattern**: Data access abstraction
- **Service Layer**: Business logic separation
- **DTO Pattern**: Data transfer between layers
- **Global Exception Handling**: Centralized error management

### Key Components
- **Controllers**: Handle HTTP requests/responses
- **Services**: Implement business logic
- **Repositories**: Data persistence layer
- **Entities**: JPA domain models
- **DTOs**: Request/response objects

## 🚀 Deployment

### Production Checklist
- [ ] Configure external database
- [ ] Set production profile
- [ ] Configure security settings
- [ ] Set up monitoring
- [ ] Configure logging
- [ ] Set resource limits

### Docker Support
```bash
# Build Docker image
docker build -t paymentservice:latest .

# Run container
docker run -p 8080:8080 paymentservice:latest
```

## 🐛 Troubleshooting

### Common Issues
1. **Port 8080 already in use**:
   ```bash
   lsof -ti:8080 | xargs kill -9
   ```

2. **Database connection errors**:
   - Check H2 console accessibility
   - Verify application.properties configuration

3. **Maven build failures**:
   ```bash
   mvn clean
   mvn dependency:resolve
   ```

### Logs
- **Application logs**: Available in console output
- **Spring Boot logs**: Configure in `application.properties`

## 🔗 Integration

### MCP Server Integration
This service integrates with the `payment-mcp-server` component:
- **Base URL**: http://localhost:8080
- **API Version**: v1
- **Content Type**: application/json

### Client Integration
Compatible with:
- `my-mcp-client` React application
- Direct HTTP API calls
- MCP protocol via `payment-mcp-server`

---

**Note**: This service uses an in-memory H2 database by default. Configure an external database for production use.
