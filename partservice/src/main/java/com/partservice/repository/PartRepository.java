package com.partservice.repository;

import com.partservice.model.Part;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface PartRepository extends JpaRepository<Part, String> {
    
    Optional<Part> findByPartNumber(String partNumber);
    
    List<Part> findByCategory(String category);
    
    List<Part> findByBrand(String brand);
    
    @Query("SELECT p FROM Part p WHERE p.name LIKE %:searchTerm% OR p.description LIKE %:searchTerm% OR p.partNumber LIKE %:searchTerm%")
    List<Part> searchByTerm(@Param("searchTerm") String searchTerm);
    
    @Query("SELECT p FROM Part p WHERE p.price BETWEEN :minPrice AND :maxPrice")
    List<Part> findByPriceRange(@Param("minPrice") BigDecimal minPrice, @Param("maxPrice") BigDecimal maxPrice);
    
    @Query("SELECT p FROM Part p WHERE p.quantityInStock <= :threshold")
    List<Part> findLowStockParts(@Param("threshold") Integer threshold);
    
    @Query("SELECT p FROM Part p WHERE p.quantityInStock = 0")
    List<Part> findOutOfStockParts();
    
    @Query("SELECT DISTINCT p.category FROM Part p ORDER BY p.category")
    List<String> findDistinctCategories();
    
    @Query("SELECT DISTINCT p.brand FROM Part p ORDER BY p.brand")
    List<String> findDistinctBrands();
    
    @Query("SELECT p FROM Part p WHERE p.compatibleVehicles LIKE %:vehicle%")
    List<Part> findByCompatibleVehicle(@Param("vehicle") String vehicle);
    
    @Query("SELECT p FROM Part p WHERE p.isOem = :isOem")
    List<Part> findByOemStatus(@Param("isOem") Boolean isOem);
}
