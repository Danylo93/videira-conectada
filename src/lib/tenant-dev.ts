// Development version of tenant functions that work without migrations
// This file provides mock implementations for local testing

import { getTenantFromRequestMock, getTenantBillingMock, isTenantBillingActiveMock, getTenantInvoicesMock, userHasTenantAccessMock, getUserTenantRoleMock } from './tenant-mock'

// Re-export mock functions for development
export const getTenantFromRequest = getTenantFromRequestMock
export const getTenantBilling = getTenantBillingMock
export const isTenantBillingActive = isTenantBillingActiveMock
export const getTenantInvoices = getTenantInvoicesMock
export const userHasTenantAccess = userHasTenantAccessMock
export const getUserTenantRole = getUserTenantRoleMock

// Mock function to create tenant (for onboarding)
export async function createTenant(
  slug: string,
  name: string,
  ownerProfileId: string
): Promise<any> {
  if (process.env.NODE_ENV === 'development') {
    return {
      id: 'mock-tenant-id',
      slug,
      name,
      owner_profile_id: ownerProfileId,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }
  return null
}

// Mock function to validate tenant slug
export function validateTenantSlug(slug: string): boolean {
  const regex = /^[a-z0-9-]{3,50}$/
  return regex.test(slug)
}
