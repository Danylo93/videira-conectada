import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutSessionCompleted(session, supabase)
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaid(invoice, supabase)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentFailed(invoice, supabase)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription, supabase)
        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentIntentSucceeded(paymentIntent, supabase)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Log the event
    await logWebhookEvent(event, supabase)

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, supabase: any) {
  const tenantId = session.metadata?.tenant_id
  if (!tenantId) {
    console.error('No tenant_id in session metadata')
    return
  }

  if (session.mode === 'subscription') {
    // Handle subscription checkout
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
    
    // Update tenant billing
    await supabase
      .from('tenant_billing')
      .update({
        plan: getPlanFromPriceId(subscription.items.data[0].price.id),
        status: 'active',
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        payment_method_type: 'card',
        stripe_customer_id: session.customer as string,
      })
      .eq('tenant_id', tenantId)

    // Create invoice record
    if (subscription.latest_invoice) {
      const invoice = await stripe.invoices.retrieve(subscription.latest_invoice as string)
      await createInvoiceRecord(invoice, tenantId, supabase)
    }
  } else {
    // Handle one-time payment (Pix)
    const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string)
    
    if (paymentIntent.status === 'succeeded') {
      // Grant 30 days access for Pix payment
      const currentPeriodEnd = new Date()
      currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30)

      await supabase
        .from('tenant_billing')
        .update({
          status: 'active',
          current_period_end: currentPeriodEnd.toISOString(),
          payment_method_type: 'pix',
          stripe_customer_id: session.customer as string,
        })
        .eq('tenant_id', tenantId)

      // Create invoice record for Pix payment
      await supabase
        .from('tenant_invoices')
        .insert({
          tenant_id: tenantId,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
    }
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice, supabase: any) {
  const customerId = invoice.customer as string
  const subscription = invoice.subscription as string

  if (!subscription) return

  const sub = await stripe.subscriptions.retrieve(subscription)
  const tenantId = sub.metadata?.tenant_id

  if (!tenantId) return

  // Update tenant billing
  await supabase
    .from('tenant_billing')
    .update({
      status: 'active',
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    })
    .eq('tenant_id', tenantId)

  // Create/update invoice record
  await createInvoiceRecord(invoice, tenantId, supabase)
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice, supabase: any) {
  const customerId = invoice.customer as string
  const subscription = invoice.subscription as string

  if (!subscription) return

  const sub = await stripe.subscriptions.retrieve(subscription)
  const tenantId = sub.metadata?.tenant_id

  if (!tenantId) return

  // Update tenant billing status
  await supabase
    .from('tenant_billing')
    .update({
      status: 'past_due',
    })
    .eq('tenant_id', tenantId)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription, supabase: any) {
  const tenantId = subscription.metadata?.tenant_id
  if (!tenantId) return

  // Update tenant billing status
  await supabase
    .from('tenant_billing')
    .update({
      status: 'canceled',
    })
    .eq('tenant_id', tenantId)
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent, supabase: any) {
  // This is handled in checkout.session.completed for our use case
  // But we can add additional logic here if needed
}

async function createInvoiceRecord(invoice: Stripe.Invoice, tenantId: string, supabase: any) {
  await supabase
    .from('tenant_invoices')
    .upsert({
      tenant_id: tenantId,
      stripe_invoice_id: invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: invoice.status,
      hosted_invoice_url: invoice.hosted_invoice_url,
      paid_at: invoice.status_transitions?.paid_at 
        ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
        : null,
    }, {
      onConflict: 'stripe_invoice_id'
    })
}

async function logWebhookEvent(event: Stripe.Event, supabase: any) {
  const tenantId = event.data.object?.metadata?.tenant_id || null

  await supabase
    .from('audit_payments')
    .insert({
      tenant_id: tenantId,
      event_type: event.type,
      payload_json: event,
    })
}

function getPlanFromPriceId(priceId: string): string {
  if (priceId === process.env.STRIPE_PRICE_STARTER) return 'starter'
  if (priceId === process.env.STRIPE_PRICE_STANDARD) return 'standard'
  if (priceId === process.env.STRIPE_PRICE_PRO) return 'pro'
  return 'starter' // default
}
