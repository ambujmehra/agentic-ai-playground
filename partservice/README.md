# Parts Service

A Spring Boot REST API service for managing automotive parts in the Agentic AI Playground ecosystem.

## Overview

The Parts Service provides comprehensive parts management capabilities including:
- Complete CRUD operations for automotive parts
- Advanced search and filtering
- Inventory management
- Integration with repair order service
- 100 pre-loaded automotive parts across 5 categories

## Features

### API Endpoints

#### CRUD Operations
- `GET /api/parts` - Get all parts
- `GET /api/parts/{id}` - Get part by ID
- `GET /api/parts/part-number/{partNumber}` - Get part by part number
- `POST /api/parts` - Create new part
- `PUT /api/parts/{id}` - Update part
- `DELETE /api/parts/{id}` - Delete part

#### Search & Filter
- `GET /api/parts/category/{category}` - Get parts by category
- `GET /api/parts/brand/{brand}` - Get parts by brand
- `GET /api/parts/repair-order/{repairOrderId}` - Get parts by repair order
- `GET /api/parts/search?term={searchTerm}` - Search parts
- `GET /api/parts/price-range?minPrice={min}&maxPrice={max}` - Filter by price
- `GET /api/parts/compatible-vehicle?vehicle={vehicle}` - Filter by vehicle
- `GET /api/parts/oem` - Get OEM parts only
- `GET /api/parts/aftermarket` - Get aftermarket parts only

#### Inventory Management
- `GET /api/parts/low-stock?threshold={number}` - Get low stock parts
- `GET /api/parts/out-of-stock` - Get out of stock parts
- `PUT /api/parts/{id}/stock` - Update stock quantity
- `PUT /api/parts/{id}/adjust-stock` - Adjust stock by amount
- `GET /api/parts/{id}/availability?requiredQuantity={number}` - Check availability

#### Metadata
- `GET /api/parts/categories` - Get all categories
- `GET /api/parts/brands` - Get all brands
- `GET /api/parts/health` - Health check

## Data Model

### Part Entity
- **id**: Unique identifier
- **partNumber**: Unique part number
- **name**: Part name
- **description**: Detailed description
- **category**: Part category (Engine, Brakes, Suspension, Electrical, Transmission)
- **brand**: Manufacturer brand
- **price**: Part price
- **quantityInStock**: Current inventory
- **location**: Warehouse location
- **weightKg**: Weight in kilograms
- **dimensions**: Physical dimensions
- **compatibleVehicles**: Compatible vehicle models
- **supplier**: Supplier name
- **supplierPartNumber**: Supplier's part number
- **warrantyMonths**: Warranty period
- **isOem**: OEM vs aftermarket flag
- **repairOrderId**: Associated repair order ID
- **createdAt**: Creation timestamp
- **updatedAt**: Last update timestamp

## Categories

1. **Engine** (20 parts) - Oil filters, air filters, spark plugs, timing belts, etc.
2. **Brakes** (20 parts) - Brake pads, rotors, calipers, brake fluid, etc.
3. **Suspension** (20 parts) - Shocks, struts, springs, control arms, etc.
4. **Electrical** (20 parts) - Alternators, starters, batteries, ignition coils, etc.
5. **Transmission** (20 parts) - Clutch kits, CV joints, transmission fluid, etc.

## Configuration

- **Port**: 8082
- **Database**: H2 in-memory
- **Console**: http://localhost:8082/h2-console
- **Health Check**: http://localhost:8082/api/parts/health

## Running the Service

```bash
# Build the service
mvn clean compile

# Run the service
mvn spring-boot:run

# Access the API
curl http://localhost:8082/api/parts
```

## Integration

This service integrates with:
- **RO Service** (port 8081) - Parts can be associated with repair orders
- **Payment Service** (port 8080) - For parts pricing and billing
- **Part MCP Server** (port 3004) - MCP protocol interface

## Database Schema

The service uses H2 database with automatic schema creation. Data is initialized on startup with 100 parts that reference repair orders from the RO service.

## Testing

The service includes comprehensive integration with the test suite in `test-services.sh` for full ecosystem validation.
