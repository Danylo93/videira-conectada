import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession, createOrGetStripeCustomer } from '@/lib/stripe'
import { getTenantFromRequest } from '@/lib/tenant'
import { z } from 'zod'

const createCheckoutSchema = z.object({
  mode: z.enum(['subscription', 'payment']),
  priceId: z.string().optional(),
  amountCents: z.number().optional(),
  plan: z.enum(['starter', 'standard', 'pro']).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenant = await getTenantFromRequest()
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const body = await request.json()
    const { mode, priceId, amountCents, plan } = createCheckoutSchema.parse(body)

    // Get tenant billing info
    const { data: billing } = await supabase
      .from('tenant_billing')
      .select('*')
      .eq('tenant_id', tenant.id)
      .single()

    if (!billing) {
      return NextResponse.json({ error: 'Billing not found' }, { status: 404 })
    }

    // Get user profile for email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Create or get Stripe customer
    let customerId = billing.stripe_customer_id
    if (!customerId) {
      const customer = await createOrGetStripeCustomer(tenant.id, profile.email)
      customerId = customer.id

      // Update billing record with customer ID
      await supabase
        .from('tenant_billing')
        .update({ stripe_customer_id: customerId })
        .eq('tenant_id', tenant.id)
    }

    // Determine price/amount based on mode and plan
    let finalPriceId = priceId
    let finalAmountCents = amountCents

    if (mode === 'subscription') {
      if (!finalPriceId && plan) {
        // Map plan to price ID
        const priceMap = {
          starter: process.env.STRIPE_PRICE_STARTER,
          standard: process.env.STRIPE_PRICE_STANDARD,
          pro: process.env.STRIPE_PRICE_PRO,
        }
        finalPriceId = priceMap[plan]
      }
      
      if (!finalPriceId) {
        return NextResponse.json({ error: 'Price ID or plan required for subscription' }, { status: 400 })
      }
    } else {
      if (!finalAmountCents && plan) {
        // Map plan to amount
        const amountMap = {
          starter: 2900, // R$ 29.00
          standard: 4900, // R$ 49.00
          pro: 9900, // R$ 99.00
        }
        finalAmountCents = amountMap[plan]
      }
      
      if (!finalAmountCents) {
        return NextResponse.json({ error: 'Amount or plan required for payment' }, { status: 400 })
      }
    }

    // Create checkout session
    const session = await createCheckoutSession({
      tenantId: tenant.id,
      mode,
      priceId: finalPriceId,
      amountCents: finalAmountCents,
      successUrl: `${request.nextUrl.origin}/app/billing?success=true`,
      cancelUrl: `${request.nextUrl.origin}/app/billing?canceled=true`,
    })

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    })

  } catch (error) {
    console.error('Error creating checkout session:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: error.errors 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
