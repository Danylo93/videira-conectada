import { createClient } from '@/lib/supabase/server'
import { getTenantFromRequest, isTenantBillingActive } from '@/lib/tenant'
import { redirect } from 'next/navigation'

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
 * Get authenticated user and tenant context
 */
export async function getAuthContext(): Promise<{
  user: AuthUser | null
  tenant: TenantContext | null
  billingActive: boolean
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, tenant: null, billingActive: false }
  }

  const tenant = await getTenantFromRequest()
  if (!tenant) {
    return { user: { id: user.id, email: user.email! }, tenant: null, billingActive: false }
  }

  const billingActive = await isTenantBillingActive(tenant.id)

  return {
    user: { id: user.id, email: user.email! },
    tenant: {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      billingActive,
    },
    billingActive,
  }
}

/**
 * Require authentication - redirect to login if not authenticated
 */
export async function requireAuth(): Promise<AuthUser> {
  const { user } = await getAuthContext()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  return user
}

/**
 * Require tenant - redirect to onboarding if no tenant
 */
export async function requireTenant(): Promise<TenantContext> {
  const { user, tenant } = await getAuthContext()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  if (!tenant) {
    redirect('/onboarding')
  }
  
  return tenant
}

/**
 * Require active billing - redirect to billing page if not active
 */
export async function requireActiveBilling(): Promise<{ user: AuthUser; tenant: TenantContext }> {
  const { user, tenant, billingActive } = await getAuthContext()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  if (!tenant) {
    redirect('/onboarding')
  }
  
  if (!billingActive) {
    redirect('/app/billing')
  }
  
  return { user, tenant }
}

/**
 * Check if user has specific role in tenant
 */
export async function requireTenantRole(requiredRole: string): Promise<{ user: AuthUser; tenant: TenantContext }> {
  const { user, tenant } = await requireActiveBilling()
  
  const supabase = await createClient()
  const { data: membership } = await supabase
    .from('profile_tenants')
    .select('role')
    .eq('tenant_id', tenant.id)
    .eq('profile_id', user.id)
    .single()

  if (!membership || membership.role !== requiredRole) {
    redirect('/app/dashboard')
  }
  
  return { user, tenant }
}

/**
 * Get user's role in current tenant
 */
export async function getUserTenantRole(): Promise<string | null> {
  const { user, tenant } = await getAuthContext()
  
  if (!user || !tenant) {
    return null
  }
  
  const supabase = await createClient()
  const { data: membership } = await supabase
    .from('profile_tenants')
    .select('role')
    .eq('tenant_id', tenant.id)
    .eq('profile_id', user.id)
    .single()

  return membership?.role || null
}
