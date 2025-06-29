package com.roservice.model;

/**
 * Tenant context data holder for multitenancy support
 */
public class TenantContext {
    private final String tenantId;
    private final String dealerId;
    private final String userId;
    private final String locale;

    public TenantContext(String tenantId, String dealerId, String userId, String locale) {
        this.tenantId = tenantId;
        this.dealerId = dealerId;
        this.userId = userId;
        this.locale = locale != null ? locale : "en-US";
    }

    public String getTenantId() {
        return tenantId;
    }

    public String getDealerId() {
        return dealerId;
    }

    public String getUserId() {
        return userId;
    }

    public String getLocale() {
        return locale;
    }

    @Override
    public String toString() {
        return "TenantContext{" +
                "tenantId='" + tenantId + '\'' +
                ", dealerId='" + dealerId + '\'' +
                ", userId='" + userId + '\'' +
                ", locale='" + locale + '\'' +
                '}';
    }
}
