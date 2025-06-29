package com.partservice.service;

import com.partservice.exception.PartNotFoundException;
import com.partservice.model.Part;
import com.partservice.repository.PartRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class PartService {
    
    @Autowired
    private PartRepository partRepository;
    
    // CRUD Operations
    public List<Part> getAllParts() {
        return partRepository.findAll();
    }
    
    public Part getPartById(String id) {
        return partRepository.findById(id)
                .orElseThrow(() -> new PartNotFoundException("Part not found with id: " + id));
    }
    
    public Part getPartByPartNumber(String partNumber) {
        return partRepository.findByPartNumber(partNumber)
                .orElseThrow(() -> new PartNotFoundException("Part not found with part number: " + partNumber));
    }
    
    public Part createPart(Part part) {
        return partRepository.save(part);
    }
    
    public Part updatePart(String id, Part partDetails) {
        Part part = getPartById(id);

        part.setPartNumber(partDetails.getPartNumber());
        part.setName(partDetails.getName());
        part.setDescription(partDetails.getDescription());
        part.setCategory(partDetails.getCategory());
        part.setBrand(partDetails.getBrand());
        part.setPrice(partDetails.getPrice());
        part.setQuantityInStock(partDetails.getQuantityInStock());
        part.setLocation(partDetails.getLocation());
        part.setWeightKg(partDetails.getWeightKg());
        part.setDimensions(partDetails.getDimensions());
        part.setCompatibleVehicles(partDetails.getCompatibleVehicles());
        part.setSupplier(partDetails.getSupplier());
        part.setSupplierPartNumber(partDetails.getSupplierPartNumber());
        part.setWarrantyMonths(partDetails.getWarrantyMonths());
        part.setIsOem(partDetails.getIsOem());

        return partRepository.save(part);
    }

    public void deletePart(String id) {
        Part part = getPartById(id);
        partRepository.delete(part);
    }
    
    // Search and Filter Operations
    public List<Part> getPartsByCategory(String category) {
        return partRepository.findByCategory(category);
    }
    
    public List<Part> getPartsByBrand(String brand) {
        return partRepository.findByBrand(brand);
    }
    
    public List<Part> searchParts(String searchTerm) {
        return partRepository.searchByTerm(searchTerm);
    }
    
    public List<Part> getPartsByPriceRange(BigDecimal minPrice, BigDecimal maxPrice) {
        return partRepository.findByPriceRange(minPrice, maxPrice);
    }
    
    public List<Part> getLowStockParts(Integer threshold) {
        return partRepository.findLowStockParts(threshold);
    }
    
    public List<Part> getOutOfStockParts() {
        return partRepository.findOutOfStockParts();
    }
    
    public List<String> getAllCategories() {
        return partRepository.findDistinctCategories();
    }
    
    public List<String> getAllBrands() {
        return partRepository.findDistinctBrands();
    }
    
    public List<Part> getPartsByCompatibleVehicle(String vehicle) {
        return partRepository.findByCompatibleVehicle(vehicle);
    }
    
    public List<Part> getOemParts() {
        return partRepository.findByOemStatus(true);
    }
    
    public List<Part> getAftermarketParts() {
        return partRepository.findByOemStatus(false);
    }
    
    // Inventory Management
    public Part updateStock(String id, Integer newQuantity) {
        Part part = getPartById(id);
        part.setQuantityInStock(newQuantity);
        return partRepository.save(part);
    }

    public Part adjustStock(String id, Integer adjustment) {
        Part part = getPartById(id);
        int newQuantity = part.getQuantityInStock() + adjustment;
        if (newQuantity < 0) {
            throw new IllegalArgumentException("Stock quantity cannot be negative");
        }
        part.setQuantityInStock(newQuantity);
        return partRepository.save(part);
    }

    public boolean checkAvailability(String id, Integer requiredQuantity) {
        Part part = getPartById(id);
        return part.getQuantityInStock() >= requiredQuantity;
    }
}
