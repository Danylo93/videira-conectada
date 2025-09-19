import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export interface Tenant {
  id: string
  slug: string
  name: string
  owner_profile_id: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface TenantBilling {
  tenant_id: string
  stripe_customer_id: string | null
  plan: 'free' | 'starter' | 'standard' | 'pro'
  status: 'active' | 'inactive' | 'past_due' | 'canceled' | 'unpaid'
  current_period_end: string | null
  payment_method_type: 'card' | 'pix' | null
  created_at: string
  updated_at: string
}

export interface TenantInvoice {
  id: string
  tenant_id: string
  stripe_invoice_id: string | null
  amount: number
  currency: string
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'
  hosted_invoice_url: string | null
  paid_at: string | null
  created_at: string
}

/**
 * Get tenant from request (subdomain or cookie)
 */
export async function getTenantFromRequest(): Promise<Tenant | null> {
  const cookieStore = await cookies()
  const tenantSlug = cookieStore.get('x-tenant')?.value

  if (!tenantSlug) {
    return null
  }

  return getTenantBySlug(tenantSlug)
}

/**
 * Get tenant by slug
 */
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .single()

  if (error || !data) {
    return null
  }

  return data as Tenant
}

/**
 * Get tenant billing information
 */
export async function getTenantBilling(tenantId: string): Promise<TenantBilling | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('tenant_billing')
    .select('*')
    .eq('tenant_id', tenantId)
    .single()

  if (error || !data) {
    return null
  }

  return data as TenantBilling
}

/**
 * Get tenant invoices
 */
export async function getTenantInvoices(tenantId: string): Promise<TenantInvoice[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('tenant_invoices')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (error || !data) {
    return []
  }

  return data as TenantInvoice[]
}

/**
 * Check if user has access to tenant
 */
export async function userHasTenantAccess(tenantId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return false
  }

  const { data, error } = await supabase
    .from('profile_tenants')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('profile_id', user.id)
    .single()

  return !error && !!data
}

/**
 * Check if tenant billing is active
 */
export async function isTenantBillingActive(tenantId: string): Promise<boolean> {
  const billing = await getTenantBilling(tenantId)
  
  if (!billing) {
    return false
  }

  if (billing.status !== 'active') {
    return false
  }

  if (!billing.current_period_end) {
    return false
  }

  const now = new Date()
  const periodEnd = new Date(billing.current_period_end)
  
  return periodEnd > now
}

/**
 * Get user's role in tenant
 */
export async function getUserTenantRole(tenantId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from('profile_tenants')
    .select('role')
    .eq('tenant_id', tenantId)
    .eq('profile_id', user.id)
    .single()

  if (error || !data) {
    return null
  }

  return data.role
}

/**
 * Create a new tenant
 */
export async function createTenant(
  slug: string,
  name: string,
  ownerProfileId: string
): Promise<Tenant | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('tenants')
    .insert({
      slug,
      name,
      owner_profile_id: ownerProfileId,
      active: true
    })
    .select()
    .single()

  if (error || !data) {
    return null
  }

  // Add owner to profile_tenants
  await supabase
    .from('profile_tenants')
    .insert({
      profile_id: ownerProfileId,
      tenant_id: data.id,
      role: 'owner'
    })

  // Create billing record
  await supabase
    .from('tenant_billing')
    .insert({
      tenant_id: data.id,
      plan: 'free',
      status: 'inactive'
    })

  return data as Tenant
}

/**
 * Validate tenant slug format
 */
export function validateTenantSlug(slug: string): boolean {
  // Only allow alphanumeric characters and hyphens
  // Must be 3-50 characters long
  const regex = /^[a-z0-9-]{3,50}$/
  return regex.test(slug)
}
