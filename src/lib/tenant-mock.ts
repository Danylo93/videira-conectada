// Mock functions for local development without migrations
// These functions simulate the tenant system for testing

export interface MockTenant {
  id: string
  slug: string
  name: string
  owner_profile_id: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface MockTenantBilling {
  tenant_id: string
  stripe_customer_id: string | null
  plan: 'free' | 'starter' | 'standard' | 'pro'
  status: 'active' | 'inactive' | 'past_due' | 'canceled' | 'unpaid'
  current_period_end: string | null
  payment_method_type: 'card' | 'pix' | null
  created_at: string
  updated_at: string
}

// Mock tenant data for local development
const MOCK_TENANT: MockTenant = {
  id: 'mock-tenant-id',
  slug: 'local-test',
  name: 'Igreja Local Test',
  owner_profile_id: 'mock-profile-id',
  active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const MOCK_BILLING: MockTenantBilling = {
  tenant_id: 'mock-tenant-id',
  stripe_customer_id: 'mock-customer-id',
  plan: 'standard',
  status: 'active',
  current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  payment_method_type: 'card',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

/**
 * Mock function to get tenant from request
 * In local development, always returns the mock tenant
 */
export async function getTenantFromRequestMock(): Promise<MockTenant | null> {
  // In local development, always return mock tenant
  if (process.env.NODE_ENV === 'development') {
    return MOCK_TENANT
  }
  return null
}

/**
 * Mock function to get tenant billing
 */
export async function getTenantBillingMock(tenantId: string): Promise<MockTenantBilling | null> {
  if (process.env.NODE_ENV === 'development' && tenantId === MOCK_TENANT.id) {
    return MOCK_BILLING
  }
  return null
}

/**
 * Mock function to check if tenant billing is active
 */
export async function isTenantBillingActiveMock(tenantId: string): Promise<boolean> {
  if (process.env.NODE_ENV === 'development' && tenantId === MOCK_TENANT.id) {
    return MOCK_BILLING.status === 'active' && 
           MOCK_BILLING.current_period_end && 
           new Date(MOCK_BILLING.current_period_end) > new Date()
  }
  return false
}

/**
 * Mock function to get tenant invoices
 */
export async function getTenantInvoicesMock(tenantId: string): Promise<any[]> {
  if (process.env.NODE_ENV === 'development' && tenantId === MOCK_TENANT.id) {
    return [
      {
        id: 'mock-invoice-1',
        tenant_id: tenantId,
        stripe_invoice_id: 'in_mock123',
        amount: 4900, // R$ 49.00
        currency: 'BRL',
        status: 'paid',
        hosted_invoice_url: null,
        paid_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }
    ]
  }
  return []
}

/**
 * Mock function to check user tenant access
 */
export async function userHasTenantAccessMock(tenantId: string): Promise<boolean> {
  if (process.env.NODE_ENV === 'development' && tenantId === MOCK_TENANT.id) {
    return true
  }
  return false
}

/**
 * Mock function to get user tenant role
 */
export async function getUserTenantRoleMock(tenantId: string): Promise<string | null> {
  if (process.env.NODE_ENV === 'development' && tenantId === MOCK_TENANT.id) {
    return 'owner'
  }
  return null
}
