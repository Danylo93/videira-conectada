// Development configuration for local testing without migrations
// This file provides environment-specific configurations

export const DEV_CONFIG = {
  // Mock tenant configuration
  MOCK_TENANT: {
    id: 'mock-tenant-id',
    slug: 'local-test',
    name: 'Igreja Local Test',
    owner_profile_id: 'mock-profile-id',
    active: true,
  },
  
  // Mock billing configuration
  MOCK_BILLING: {
    tenant_id: 'mock-tenant-id',
    stripe_customer_id: 'mock-customer-id',
    plan: 'standard' as const,
    status: 'active' as const,
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    payment_method_type: 'card' as const,
  },
  
  // Mock user configuration
  MOCK_USER: {
    id: 'mock-user-id',
    email: 'test@example.com',
    name: 'Usuário Teste',
  },
  
  // Development flags
  ENABLE_MOCK_DATA: process.env.NODE_ENV === 'development',
  ENABLE_BILLING_BYPASS: process.env.NODE_ENV === 'development',
  ENABLE_TENANT_BYPASS: process.env.NODE_ENV === 'development',
}

/**
 * Check if we should use mock data
 */
export function shouldUseMockData(): boolean {
  return DEV_CONFIG.ENABLE_MOCK_DATA
}

/**
 * Check if we should bypass billing checks
 */
export function shouldBypassBilling(): boolean {
  return DEV_CONFIG.ENABLE_BILLING_BYPASS
}

/**
 * Check if we should bypass tenant checks
 */
export function shouldBypassTenant(): boolean {
  return DEV_CONFIG.ENABLE_TENANT_BYPASS
}
