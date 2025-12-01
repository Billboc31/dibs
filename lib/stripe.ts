/**
 * Stripe Configuration for DIBS Payment System
 */

import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required')
}

// Initialize Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
})

// Stripe configuration constants
export const STRIPE_CONFIG = {
  currency: 'eur',
  payment_method_types: ['card'],
  success_url_template: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/cancel`,
  webhook_endpoint_secret: process.env.STRIPE_WEBHOOK_SECRET,
}

/**
 * Create a Stripe customer for a user
 */
export async function createStripeCustomer(user: { id: string; email: string; name?: string }) {
  try {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name || user.email,
      metadata: {
        user_id: user.id,
        source: 'dibs_app'
      }
    })

    console.log(`✅ Stripe customer created: ${customer.id} for user ${user.id}`)
    return customer
  } catch (error) {
    console.error('❌ Error creating Stripe customer:', error)
    throw error
  }
}

/**
 * Create a checkout session for wallet recharge
 */
export async function createWalletRechargeSession(params: {
  customerId: string
  amount: number // in cents
  userId: string
  email: string
  description?: string
}) {
  try {
    const { customerId, amount, userId, email, description = 'Recharge Wallet DIBS' } = params

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: STRIPE_CONFIG.payment_method_types,
      line_items: [
        {
          price_data: {
            currency: STRIPE_CONFIG.currency,
            product_data: {
              name: description,
              description: `Recharge de ${amount / 100}€ pour votre wallet DIBS`,
              images: [`${process.env.NEXT_PUBLIC_BASE_URL}/logo-dibs.png`], // Optionnel
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: STRIPE_CONFIG.success_url_template,
      cancel_url: STRIPE_CONFIG.cancel_url,
      metadata: {
        user_id: userId,
        email: email,
        type: 'wallet_recharge',
        amount: amount.toString(),
      },
      // Configuration pour mobile
      payment_intent_data: {
        metadata: {
          user_id: userId,
          type: 'wallet_recharge',
        },
      },
      // Expiration après 30 minutes
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60),
    })

    console.log(`💳 Stripe checkout session created:`)
    console.log(`  - Session ID: ${session.id}`)
    console.log(`  - Customer: ${customerId}`)
    console.log(`  - Amount: ${amount / 100}€`)
    console.log(`  - User: ${email}`)

    return session
  } catch (error) {
    console.error('❌ Error creating Stripe checkout session:', error)
    throw error
  }
}

/**
 * Create a subscription for automatic wallet recharge
 */
export async function createWalletSubscription(params: {
  customerId: string
  amount: number // in cents
  frequency: 'weekly' | 'monthly' | 'yearly'
  userId: string
  email: string
}) {
  try {
    const { customerId, amount, frequency, userId, email } = params

    // Créer le produit pour l'abonnement
    const product = await stripe.products.create({
      name: 'Recharge Automatique Wallet DIBS',
      description: `Recharge automatique de ${amount / 100}€ ${frequency === 'monthly' ? 'par mois' : frequency === 'weekly' ? 'par semaine' : 'par an'}`,
      metadata: {
        type: 'wallet_subscription',
        user_id: userId,
      },
    })

    // Créer le prix récurrent
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: amount,
      currency: STRIPE_CONFIG.currency,
      recurring: {
        interval: frequency === 'yearly' ? 'year' : frequency === 'weekly' ? 'week' : 'month',
      },
      metadata: {
        user_id: userId,
        type: 'wallet_subscription',
      },
    })

    // Créer l'abonnement
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: price.id }],
      metadata: {
        user_id: userId,
        email: email,
        type: 'wallet_subscription',
        frequency: frequency,
      },
      // Première facturation immédiate
      proration_behavior: 'none',
    })

    console.log(`🔄 Stripe subscription created:`)
    console.log(`  - Subscription ID: ${subscription.id}`)
    console.log(`  - Customer: ${customerId}`)
    console.log(`  - Amount: ${amount / 100}€`)
    console.log(`  - Frequency: ${frequency}`)

    return { subscription, product, price }
  } catch (error) {
    console.error('❌ Error creating Stripe subscription:', error)
    throw error
  }
}

/**
 * Retrieve a checkout session
 */
export async function getCheckoutSession(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'customer'],
    })
    return session
  } catch (error) {
    console.error(`❌ Error retrieving checkout session ${sessionId}:`, error)
    throw error
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(body: string, signature: string): Stripe.Event {
  if (!STRIPE_CONFIG.webhook_endpoint_secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is required')
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_CONFIG.webhook_endpoint_secret
    )
    return event
  } catch (error) {
    console.error('❌ Webhook signature verification failed:', error)
    throw error
  }
}

/**
 * Handle successful payment
 */
export async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  const { metadata } = session
  
  if (!metadata) {
    throw new Error('No metadata found in session')
  }

  const { user_id, type, amount } = metadata

  if (type === 'wallet_recharge') {
    console.log(`💰 Processing wallet recharge:`)
    console.log(`  - User: ${user_id}`)
    console.log(`  - Amount: ${amount} cents`)
    console.log(`  - Session: ${session.id}`)

    return {
      user_id,
      amount: parseInt(amount),
      type: 'wallet_recharge',
      session_id: session.id,
      payment_intent_id: session.payment_intent,
    }
  }

  throw new Error(`Unknown payment type: ${type}`)
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.cancel(subscriptionId)
    console.log(`🚫 Subscription cancelled: ${subscriptionId}`)
    return subscription
  } catch (error) {
    console.error(`❌ Error cancelling subscription ${subscriptionId}:`, error)
    throw error
  }
}

/**
 * Pause a subscription
 */
export async function pauseSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      pause_collection: {
        behavior: 'keep_as_draft',
      },
    })
    console.log(`⏸️ Subscription paused: ${subscriptionId}`)
    return subscription
  } catch (error) {
    console.error(`❌ Error pausing subscription ${subscriptionId}:`, error)
    throw error
  }
}

/**
 * Resume a subscription
 */
export async function resumeSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      pause_collection: null,
    })
    console.log(`▶️ Subscription resumed: ${subscriptionId}`)
    return subscription
  } catch (error) {
    console.error(`❌ Error resuming subscription ${subscriptionId}:`, error)
    throw error
  }
}
