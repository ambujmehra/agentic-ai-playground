package com.partservice.controller;

import com.partservice.config.ContextProvider;
import com.partservice.exception.PartNotFoundException;
import com.partservice.model.Part;
import com.partservice.service.PartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/parts")
@CrossOrigin(origins = "*")
@Tag(name = "Parts Management", description = "APIs for managing automotive parts inventory. All endpoints require mandatory headers: X-Tenant-Id, X-Dealer-Id, X-User-Id. Optional header: X-Locale (defaults to en-US)")
public class PartController {
    
    private static final Logger logger = LoggerFactory.getLogger(PartController.class);
    
    @Autowired
    private PartService partService;
    
    // CRUD Endpoints
    @GetMapping
    @Operation(summary = "Get all parts", description = "Retrieve all parts in the inventory")
    public List<Part> getAllParts() {
        logger.info("Getting all parts for tenant: {}", ContextProvider.getTenantId());
        return partService.getAllParts();
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Get part by ID", description = "Retrieve a specific part by its ID")
    public ResponseEntity<Part> getPartById(@Parameter(description = "Part ID") @PathVariable String id) {
        logger.info("Getting part {} for tenant: {}", id, ContextProvider.getTenantId());
        try {
            Part part = partService.getPartById(id);
            return ResponseEntity.ok(part);
        } catch (PartNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/part-number/{partNumber}")
    public ResponseEntity<Part> getPartByPartNumber(@PathVariable String partNumber) {
        logger.info("Getting part by number {} for tenant: {}", partNumber, ContextProvider.getTenantId());
        try {
            Part part = partService.getPartByPartNumber(partNumber);
            return ResponseEntity.ok(part);
        } catch (PartNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @PostMapping
    @Operation(summary = "Create new part", description = "Add a new part to the inventory")
    public ResponseEntity<Part> createPart(@Valid @RequestBody Part part) {
        logger.info("Creating new part for tenant: {}", ContextProvider.getTenantId());
        Part createdPart = partService.createPart(part);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdPart);
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Update part", description = "Update an existing part's information")
    public ResponseEntity<Part> updatePart(@Parameter(description = "Part ID") @PathVariable String id, @Valid @RequestBody Part partDetails) {
        logger.info("Updating part {} for tenant: {}", id, ContextProvider.getTenantId());
        try {
            Part updatedPart = partService.updatePart(id, partDetails);
            return ResponseEntity.ok(updatedPart);
        } catch (PartNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePart(@PathVariable String id) {
        logger.info("Deleting part {} for tenant: {}", id, ContextProvider.getTenantId());
        try {
            partService.deletePart(id);
            return ResponseEntity.ok().build();
        } catch (PartNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    // Search and Filter Endpoints
    @GetMapping("/category/{category}")
    public List<Part> getPartsByCategory(@PathVariable String category) {
        logger.info("Getting parts by category {} for tenant: {}", category, ContextProvider.getTenantId());
        return partService.getPartsByCategory(category);
    }
    
    @GetMapping("/brand/{brand}")
    public List<Part> getPartsByBrand(@PathVariable String brand) {
        logger.info("Getting parts by brand {} for tenant: {}", brand, ContextProvider.getTenantId());
        return partService.getPartsByBrand(brand);
    }
    
    @GetMapping("/search")
    public List<Part> searchParts(@RequestParam String term) {
        logger.info("Searching parts with term '{}' for tenant: {}", term, ContextProvider.getTenantId());
        return partService.searchParts(term);
    }
    
    @GetMapping("/price-range")
    public List<Part> getPartsByPriceRange(
            @RequestParam BigDecimal minPrice,
            @RequestParam BigDecimal maxPrice) {
        logger.info("Getting parts by price range {}-{} for tenant: {}", minPrice, maxPrice, ContextProvider.getTenantId());
        return partService.getPartsByPriceRange(minPrice, maxPrice);
    }
    
    @GetMapping("/low-stock")
    public List<Part> getLowStockParts(@RequestParam(defaultValue = "10") Integer threshold) {
        return partService.getLowStockParts(threshold);
    }
    
    @GetMapping("/out-of-stock")
    public List<Part> getOutOfStockParts() {
        return partService.getOutOfStockParts();
    }
    
    @GetMapping("/categories")
    public List<String> getAllCategories() {
        return partService.getAllCategories();
    }
    
    @GetMapping("/brands")
    public List<String> getAllBrands() {
        return partService.getAllBrands();
    }
    
    @GetMapping("/compatible-vehicle")
    public List<Part> getPartsByCompatibleVehicle(@RequestParam String vehicle) {
        return partService.getPartsByCompatibleVehicle(vehicle);
    }
    
    @GetMapping("/oem")
    public List<Part> getOemParts() {
        return partService.getOemParts();
    }
    
    @GetMapping("/aftermarket")
    public List<Part> getAftermarketParts() {
        return partService.getAftermarketParts();
    }
    
    // Inventory Management Endpoints
    @PutMapping("/{id}/stock")
    public ResponseEntity<Part> updateStock(@PathVariable String id, @RequestBody Map<String, Integer> request) {
        try {
            Integer newQuantity = request.get("quantity");
            Part updatedPart = partService.updateStock(id, newQuantity);
            return ResponseEntity.ok(updatedPart);
        } catch (PartNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/adjust-stock")
    public ResponseEntity<Part> adjustStock(@PathVariable String id, @RequestBody Map<String, Integer> request) {
        try {
            Integer adjustment = request.get("adjustment");
            Part updatedPart = partService.adjustStock(id, adjustment);
            return ResponseEntity.ok(updatedPart);
        } catch (PartNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{id}/availability")
    public ResponseEntity<Map<String, Boolean>> checkAvailability(
            @PathVariable String id,
            @RequestParam Integer requiredQuantity) {
        try {
            boolean available = partService.checkAvailability(id, requiredQuantity);
            return ResponseEntity.ok(Map.of("available", available));
        } catch (PartNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    // Health Check
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "partservice",
                "timestamp", java.time.LocalDateTime.now().toString()
        ));
    }
}
