package com.roservice.config;

import com.roservice.model.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Thread-local context provider for multitenancy support
 */
public class ContextProvider {
    private static final Logger logger = LoggerFactory.getLogger(ContextProvider.class);
    
    private static final ThreadLocal<TenantContext> CONTEXT_HOLDER = new ThreadLocal<>();

    /**
     * Set the tenant context for the current thread
     */
    public static void setContext(TenantContext context) {
        if (context == null) {
            logger.warn("Attempting to set null tenant context");
            return;
        }
        CONTEXT_HOLDER.set(context);
        logger.debug("Tenant context set: {}", context);
    }

    /**
     * Get the tenant context for the current thread
     */
    public static TenantContext getContext() {
        return CONTEXT_HOLDER.get();
    }

    /**
     * Check if tenant context is available
     */
    public static boolean hasContext() {
        return CONTEXT_HOLDER.get() != null;
    }

    /**
     * Clear the tenant context for the current thread
     */
    public static void clearContext() {
        TenantContext context = CONTEXT_HOLDER.get();
        if (context != null) {
            logger.debug("Clearing tenant context: {}", context);
            CONTEXT_HOLDER.remove();
        }
    }

    /**
     * Get tenant ID from current context
     */
    public static String getTenantId() {
        TenantContext context = getContext();
        return context != null ? context.getTenantId() : null;
    }

    /**
     * Get dealer ID from current context
     */
    public static String getDealerId() {
        TenantContext context = getContext();
        return context != null ? context.getDealerId() : null;
    }

    /**
     * Get user ID from current context
     */
    public static String getUserId() {
        TenantContext context = getContext();
        return context != null ? context.getUserId() : null;
    }

    /**
     * Get locale from current context
     */
    public static String getLocale() {
        TenantContext context = getContext();
        return context != null ? context.getLocale() : "en-US";
    }
}
