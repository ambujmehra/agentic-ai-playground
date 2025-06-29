package com.roservice.filter;

import com.roservice.config.ContextProvider;
import com.roservice.model.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * Filter to validate tenant headers and set up tenant context
 */
@Component
@Order(1)
public class MultitenancyFilter implements Filter {
    private static final Logger logger = LoggerFactory.getLogger(MultitenancyFilter.class);
    
    private static final String TENANT_ID_HEADER = "X-Tenant-Id";
    private static final String DEALER_ID_HEADER = "X-Dealer-Id";
    private static final String USER_ID_HEADER = "X-User-Id";
    private static final String LOCALE_HEADER = "X-Locale";

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        try {
            // Skip validation for health checks and actuator endpoints
            String requestURI = httpRequest.getRequestURI();
            if (isExcludedPath(requestURI)) {
                chain.doFilter(request, response);
                return;
            }

            // Extract headers
            String tenantId = httpRequest.getHeader(TENANT_ID_HEADER);
            String dealerId = httpRequest.getHeader(DEALER_ID_HEADER);
            String userId = httpRequest.getHeader(USER_ID_HEADER);
            String locale = httpRequest.getHeader(LOCALE_HEADER);

            logger.debug("Processing request with headers - TenantId: {}, DealerId: {}, UserId: {}, Locale: {}", 
                        tenantId, dealerId, userId, locale);

            // Validate mandatory headers
            ValidationResult validation = validateHeaders(tenantId, dealerId, userId);
            if (!validation.isValid()) {
                logger.warn("Tenant validation failed: {}", validation.getErrorMessage());
                sendErrorResponse(httpResponse, validation.getErrorMessage());
                return;
            }

            // Set up tenant context
            TenantContext context = new TenantContext(tenantId, dealerId, userId, locale);
            ContextProvider.setContext(context);

            logger.info("Tenant context established for request: {}", context);

            // Continue with the request
            chain.doFilter(request, response);

        } finally {
            // Always clear context after request processing
            ContextProvider.clearContext();
        }
    }

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
               requestURI.endsWith("/repair-orders/health");
    }

    private ValidationResult validateHeaders(String tenantId, String dealerId, String userId) {
        if (!StringUtils.hasText(tenantId)) {
            return ValidationResult.invalid("Missing or empty X-Tenant-Id header");
        }
        
        if (!StringUtils.hasText(dealerId)) {
            return ValidationResult.invalid("Missing or empty X-Dealer-Id header");
        }
        
        if (!StringUtils.hasText(userId)) {
            return ValidationResult.invalid("Missing or empty X-User-Id header");
        }

        // Additional validation can be added here (format, length, etc.)
        if (tenantId.length() > 50 || dealerId.length() > 50 || userId.length() > 50) {
            return ValidationResult.invalid("Header values exceed maximum length of 50 characters");
        }

        return ValidationResult.valid();
    }

    private void sendErrorResponse(HttpServletResponse response, String errorMessage) throws IOException {
        response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        
        String jsonResponse = String.format(
            "{\"error\":\"Tenant Validation Failed\",\"message\":\"%s\",\"code\":\"MT001\",\"timestamp\":\"%s\"}", 
            errorMessage, 
            java.time.Instant.now().toString()
        );
        
        response.getWriter().write(jsonResponse);
    }

    /**
     * Inner class for validation results
     */
    private static class ValidationResult {
        private final boolean valid;
        private final String errorMessage;

        private ValidationResult(boolean valid, String errorMessage) {
            this.valid = valid;
            this.errorMessage = errorMessage;
        }

        public static ValidationResult valid() {
            return new ValidationResult(true, null);
        }

        public static ValidationResult invalid(String message) {
            return new ValidationResult(false, message);
        }

        public boolean isValid() {
            return valid;
        }

        public String getErrorMessage() {
            return errorMessage;
        }
    }
}
