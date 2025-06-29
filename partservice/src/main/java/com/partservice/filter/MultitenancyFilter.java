package com.partservice.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.partservice.config.ContextProvider;
import com.partservice.model.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Filter for handling multitenancy validation and context setup.
 * Validates required tenant headers and sets up tenant context for each request.
 */
@Component
@Order(1)
public class MultitenancyFilter implements Filter {
    
    private static final Logger logger = LoggerFactory.getLogger(MultitenancyFilter.class);
    
    private static final String TENANT_ID_HEADER = "X-Tenant-Id";
    private static final String DEALER_ID_HEADER = "X-Dealer-Id";
    private static final String USER_ID_HEADER = "X-User-Id";
    private static final String LOCALE_HEADER = "X-Locale";
    
    private static final String ERROR_CODE = "MT001";
    private static final int MAX_HEADER_LENGTH = 50;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) 
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        
        try {
            // Skip multitenancy validation for excluded paths
            if (isExcludedPath(httpRequest.getRequestURI())) {
                chain.doFilter(request, response);
                return;
            }
            
            // Extract and validate tenant headers
            String tenantId = httpRequest.getHeader(TENANT_ID_HEADER);
            String dealerId = httpRequest.getHeader(DEALER_ID_HEADER);
            String userId = httpRequest.getHeader(USER_ID_HEADER);
            String locale = httpRequest.getHeader(LOCALE_HEADER);
            
            // Validate required headers
            String validationError = validateHeaders(tenantId, dealerId, userId);
            if (validationError != null) {
                sendErrorResponse(httpResponse, validationError);
                return;
            }
            
            // Create and set tenant context
            TenantContext tenantContext = new TenantContext(tenantId, dealerId, userId, locale);
            ContextProvider.setContext(tenantContext);
            
            logger.debug("Tenant context set: {}", tenantContext);
            
            // Continue with the request
            chain.doFilter(request, response);
            
        } finally {
            // Always clear the context after request processing
            ContextProvider.clearContext();
        }
    }
    
    /**
     * Check if the request path should be excluded from tenant validation
     */
    private boolean isExcludedPath(String requestURI) {
        return requestURI.contains("/actuator") || 
               requestURI.contains("/health") || 
               requestURI.contains("/swagger") ||
               requestURI.contains("/v3/api-docs") ||
               requestURI.contains("/api-docs") ||
               requestURI.contains("/swagger-ui") ||
               requestURI.contains("/swagger-resources") ||
               requestURI.contains("/webjars") ||
               requestURI.contains("/h2-console") ||
               requestURI.endsWith("/parts/health");
    }
    
    /**
     * Validate tenant headers
     */
    private String validateHeaders(String tenantId, String dealerId, String userId) {
        if (tenantId == null || tenantId.trim().isEmpty()) {
            return "Missing or empty " + TENANT_ID_HEADER + " header";
        }
        if (dealerId == null || dealerId.trim().isEmpty()) {
            return "Missing or empty " + DEALER_ID_HEADER + " header";
        }
        if (userId == null || userId.trim().isEmpty()) {
            return "Missing or empty " + USER_ID_HEADER + " header";
        }
        
        // Validate header lengths
        if (tenantId.length() > MAX_HEADER_LENGTH) {
            return TENANT_ID_HEADER + " header too long (max " + MAX_HEADER_LENGTH + " characters)";
        }
        if (dealerId.length() > MAX_HEADER_LENGTH) {
            return DEALER_ID_HEADER + " header too long (max " + MAX_HEADER_LENGTH + " characters)";
        }
        if (userId.length() > MAX_HEADER_LENGTH) {
            return USER_ID_HEADER + " header too long (max " + MAX_HEADER_LENGTH + " characters)";
        }
        
        return null; // All validations passed
    }
    
    /**
     * Send standardized error response for tenant validation failures
     */
    private void sendErrorResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("error", "Tenant Validation Failed");
        errorResponse.put("message", message);
        errorResponse.put("code", ERROR_CODE);
        errorResponse.put("timestamp", LocalDateTime.now().toString());
        
        String jsonResponse = objectMapper.writeValueAsString(errorResponse);
        response.getWriter().write(jsonResponse);
        
        logger.warn("Tenant validation failed: {}", message);
    }
    
    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        logger.info("MultitenancyFilter initialized");
    }
    
    @Override
    public void destroy() {
        logger.info("MultitenancyFilter destroyed");
    }
}
