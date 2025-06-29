package com.partservice.config;

import com.partservice.model.TenantContext;

/**
 * Thread-local context provider for tenant information.
 * Manages tenant context per request thread to ensure proper isolation
 * in multithreaded environments.
 */
public class ContextProvider {
    
    private static final ThreadLocal<TenantContext> CONTEXT_HOLDER = new ThreadLocal<>();
    
    /**
     * Set the tenant context for the current thread
     * @param context The tenant context to set
     */
    public static void setContext(TenantContext context) {
        CONTEXT_HOLDER.set(context);
    }
    
    /**
     * Get the tenant context for the current thread
     * @return The tenant context or null if not set
     */
    public static TenantContext getContext() {
        return CONTEXT_HOLDER.get();
    }
    
    /**
     * Get the tenant ID from the current context
     * @return The tenant ID or null if context is not set
     */
    public static String getTenantId() {
        TenantContext context = getContext();
        return context != null ? context.getTenantId() : null;
    }
    
    /**
     * Get the dealer ID from the current context
     * @return The dealer ID or null if context is not set
     */
    public static String getDealerId() {
        TenantContext context = getContext();
        return context != null ? context.getDealerId() : null;
    }
    
    /**
     * Get the user ID from the current context
     * @return The user ID or null if context is not set
     */
    public static String getUserId() {
        TenantContext context = getContext();
        return context != null ? context.getUserId() : null;
    }
    
    /**
     * Get the locale from the current context
     * @return The locale or "en-US" if context is not set
     */
    public static String getLocale() {
        TenantContext context = getContext();
        return context != null ? context.getLocale() : "en-US";
    }
    
    /**
     * Clear the tenant context for the current thread
     * Should be called after each request to prevent context leakage
     */
    public static void clearContext() {
        CONTEXT_HOLDER.remove();
    }
    
    /**
     * Check if tenant context is available for the current thread
     * @return true if context is set, false otherwise
     */
    public static boolean hasContext() {
        return getContext() != null;
    }
}
