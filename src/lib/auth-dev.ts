// Development version of auth functions that work without migrations
// This file provides mock implementations for local testing

import { getTenantFromRequest, isTenantBillingActive } from './tenant-dev'

export interface AuthUser {
  id: string
  email: string
  name?: string
}

export interface TenantContext {
  id: string
  slug: string
  name: string
  billingActive: boolean
}

/**
 * Mock function to get authenticated user and tenant context
 */
export async function getAuthContext(): Promise<{
  user: AuthUser | null
  tenant: TenantContext | null
  billingActive: boolean
}> {
  // In development, simulate a logged-in user
  if (process.env.NODE_ENV === 'development') {
    const user: AuthUser = {
      id: 'mock-user-id',
      email: 'test@example.com',
      name: 'Usuário Teste'
    }

    const tenant = await getTenantFromRequest()
    if (!tenant) {
      return { user, tenant: null, billingActive: false }
    }

    const billingActive = await isTenantBillingActive(tenant.id)

    return {
      user,
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        billingActive,
      },
      billingActive,
    }
  }

  return { user: null, tenant: null, billingActive: false }
}

/**
 * Mock function to require authentication
 */
export async function requireAuth(): Promise<AuthUser> {
  const { user } = await getAuthContext()
  
  if (!user) {
    // In development, redirect to a mock login page
    if (process.env.NODE_ENV === 'development') {
      return {
        id: 'mock-user-id',
        email: 'test@example.com',
        name: 'Usuário Teste'
      }
    }
    throw new Error('Not authenticated')
  }
  
  return user
}

/**
 * Mock function to require tenant
 */
export async function requireTenant(): Promise<TenantContext> {
  const { user, tenant } = await getAuthContext()
  
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  if (!tenant) {
    // In development, return mock tenant
    if (process.env.NODE_ENV === 'development') {
      return {
        id: 'mock-tenant-id',
        slug: 'local-test',
        name: 'Igreja Local Test',
        billingActive: true,
      }
    }
    throw new Error('No tenant found')
  }
  
  return tenant
}

/**
 * Mock function to require active billing
 */
export async function requireActiveBilling(): Promise<{ user: AuthUser; tenant: TenantContext }> {
  const { user, tenant, billingActive } = await getAuthContext()
  
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  if (!tenant) {
    throw new Error('No tenant found')
  }
  
  if (!billingActive) {
    // In development, always allow access
    if (process.env.NODE_ENV === 'development') {
      return { user, tenant }
    }
    throw new Error('Billing not active')
  }
  
  return { user, tenant }
}

/**
 * Mock function to require tenant role
 */
export async function requireTenantRole(requiredRole: string): Promise<{ user: AuthUser; tenant: TenantContext }> {
  const { user, tenant } = await requireActiveBilling()
  
  // In development, always allow access
  if (process.env.NODE_ENV === 'development') {
    return { user, tenant }
  }
  
  throw new Error('Insufficient permissions')
}

/**
 * Mock function to get user's role in current tenant
 */
export async function getUserTenantRole(): Promise<string | null> {
  if (process.env.NODE_ENV === 'development') {
    return 'owner'
  }
  return null
}
