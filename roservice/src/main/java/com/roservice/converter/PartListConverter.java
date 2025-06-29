package com.roservice.converter;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.roservice.dto.ROPart;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.persistence.AttributeConverter;
import javax.persistence.Converter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Converter
public class PartListConverter implements AttributeConverter<List<ROPart>, String> {
    
    private static final Logger logger = LoggerFactory.getLogger(PartListConverter.class);
    private final ObjectMapper objectMapper;

    public PartListConverter() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    @Override
    public String convertToDatabaseColumn(List<ROPart> parts) {
        if (parts == null || parts.isEmpty()) {
            return "[]";
        }
        
        try {
            String json = objectMapper.writeValueAsString(parts);
            logger.debug("Converting parts to JSON: {}", json);
            return json;
        } catch (JsonProcessingException e) {
            logger.error("Error converting parts to JSON", e);
            throw new RuntimeException("Error converting parts to JSON", e);
        }
    }

    @Override
    public List<ROPart> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty() || "[]".equals(dbData.trim())) {
            return new ArrayList<>();
        }
        
        try {
            List<ROPart> parts = objectMapper.readValue(dbData, new TypeReference<List<ROPart>>() {});
            logger.debug("Converting JSON to parts: {} parts loaded", parts.size());
            return parts;
        } catch (IOException e) {
            logger.error("Error converting JSON to parts: {}", dbData, e);
            return new ArrayList<>();
        }
    }
}
