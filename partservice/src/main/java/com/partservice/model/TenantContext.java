package com.partservice.model;

/**
 * Immutable data container for tenant-specific information.
 * Provides context for multitenancy support including tenant ID, dealer ID, user ID, and locale.
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        TenantContext that = (TenantContext) o;

        if (!tenantId.equals(that.tenantId)) return false;
        if (!dealerId.equals(that.dealerId)) return false;
        if (!userId.equals(that.userId)) return false;
        return locale.equals(that.locale);
    }

    @Override
    public int hashCode() {
        int result = tenantId.hashCode();
        result = 31 * result + dealerId.hashCode();
        result = 31 * result + userId.hashCode();
        result = 31 * result + locale.hashCode();
        return result;
    }
}
