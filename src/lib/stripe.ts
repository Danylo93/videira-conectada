import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})

export const STRIPE_PRICES = {
  starter: process.env.STRIPE_PRICE_STARTER || 'price_starter',
  standard: process.env.STRIPE_PRICE_STANDARD || 'price_standard', 
  pro: process.env.STRIPE_PRICE_PRO || 'price_pro',
} as const

export const PLAN_AMOUNTS = {
  starter: 2900, // R$ 29.00 in cents
  standard: 4900, // R$ 49.00 in cents
  pro: 9900, // R$ 99.00 in cents
} as const

export type PlanType = keyof typeof STRIPE_PRICES

export interface CreateCheckoutSessionParams {
  tenantId: string
  mode: 'subscription' | 'payment'
  priceId?: string
  amountCents?: number
  successUrl: string
  cancelUrl: string
}

export async function createCheckoutSession({
  tenantId,
  mode,
  priceId,
  amountCents,
  successUrl,
  cancelUrl,
}: CreateCheckoutSessionParams) {
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      tenant_id: tenantId,
    },
    allow_promotion_codes: true,
  }

  if (mode === 'subscription') {
    if (!priceId) {
      throw new Error('priceId is required for subscription mode')
    }
    
    sessionParams.line_items = [
      {
        price: priceId,
        quantity: 1,
      },
    ]
    sessionParams.subscription_data = {
      metadata: {
        tenant_id: tenantId,
      },
    }
  } else {
    if (!amountCents) {
      throw new Error('amountCents is required for payment mode')
    }
    
    sessionParams.line_items = [
      {
        price_data: {
          currency: 'brl',
          product_data: {
            name: 'Videira Conectada - Plano Mensal',
            description: 'Acesso ao sistema por 30 dias',
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ]
    sessionParams.payment_method_types = ['card', 'pix']
  }

  return await stripe.checkout.sessions.create(sessionParams)
}

export async function createOrGetStripeCustomer(tenantId: string, email: string) {
  // First check if customer already exists
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  })

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0]
  }

  // Create new customer
  return await stripe.customers.create({
    email,
    metadata: {
      tenant_id: tenantId,
    },
  })
}

export async function getStripeCustomer(customerId: string) {
  return await stripe.customers.retrieve(customerId)
}

export async function getStripeSubscription(subscriptionId: string) {
  return await stripe.subscriptions.retrieve(subscriptionId)
}

export async function getStripeInvoice(invoiceId: string) {
  return await stripe.invoices.retrieve(invoiceId)
}

export async function cancelStripeSubscription(subscriptionId: string) {
  return await stripe.subscriptions.cancel(subscriptionId)
}

export async function createBillingPortalSession(customerId: string, returnUrl: string) {
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}
