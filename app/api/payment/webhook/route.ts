import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { notifyPaymentSuccess, notifyPaymentFailure, notifyPaymentCancelled } from '@/lib/payment-websocket'
import { verifyWebhookSignature, handleSuccessfulPayment, getCheckoutSession } from '@/lib/stripe'


// Force dynamic rendering pour éviter les erreurs de build Vercel
export const dynamic = 'force-dynamic'

// POST /api/payment/webhook - Webhook Stripe pour recevoir les notifications de paiement
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { success: false, error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // Vérifier la signature Stripe
    let event
    try {
      event = verifyWebhookSignature(body, signature)
    } catch (error: any) {
      console.error('❌ Webhook signature verification failed:', error.message)
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 400 }
      )
    }

    console.log(`📡 Stripe webhook received: ${event.type}`)

    // Traiter les différents types d'événements Stripe
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object)
        break

      case 'checkout.session.expired':
        await handleCheckoutSessionExpired(event.data.object)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object)
        break

      case 'invoice.payment_succeeded':
        // Pour les abonnements récurrents
        await handleSubscriptionPayment(event.data.object)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(event.data.object)
        break

      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ success: true, received: true })
  } catch (error: any) {
    console.error('❌ Error processing Stripe webhook:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * Gérer une session de checkout complétée
 */
async function handleCheckoutSessionCompleted(session: any) {
  try {
    console.log(`✅ Checkout session completed: ${session.id}`)

    const paymentData = await handleSuccessfulPayment(session)
    const { user_id, amount, session_id } = paymentData

    // Mettre à jour le wallet de l'utilisateur
    await updateUserWallet(user_id, amount)

    // Enregistrer la transaction
    await recordTransaction({
      user_id,
      type: 'recharge',
      amount_cents: amount,
      description: 'Recharge wallet via Stripe',
      external_transaction_id: session.payment_intent,
      status: 'completed'
    })

    // Notifier via WebSocket
    const newBalance = await getUserWalletBalance(user_id)
    notifyPaymentSuccess(session_id, {
      amount,
      user_id,
      new_balance: newBalance,
      payment_intent_id: session.payment_intent
    })

    console.log(`💰 Wallet recharged: ${amount} cents for user ${user_id}`)
  } catch (error) {
    console.error('❌ Error handling checkout session completed:', error)
  }
}

/**
 * Gérer une session de checkout expirée
 */
async function handleCheckoutSessionExpired(session: any) {
  try {
    console.log(`⏰ Checkout session expired: ${session.id}`)
    
    notifyPaymentCancelled(session.id)
  } catch (error) {
    console.error('❌ Error handling checkout session expired:', error)
  }
}

/**
 * Gérer un paiement échoué
 */
async function handlePaymentFailed(paymentIntent: any) {
  try {
    console.log(`❌ Payment failed: ${paymentIntent.id}`)
    
    // Récupérer la session associée
    const session = await getCheckoutSession(paymentIntent.metadata?.session_id)
    
    if (session) {
      notifyPaymentFailure(session.id, 'Payment failed')
    }
  } catch (error) {
    console.error('❌ Error handling payment failed:', error)
  }
}

/**
 * Gérer un paiement d'abonnement réussi
 */
async function handleSubscriptionPayment(invoice: any) {
  try {
    console.log(`🔄 Subscription payment succeeded: ${invoice.id}`)
    
    const subscription = invoice.subscription
    const customerId = invoice.customer
    const amount = invoice.amount_paid

    // Récupérer l'utilisateur via le customer ID
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (user) {
      // Mettre à jour le wallet
      await updateUserWallet(user.id, amount)

      // Enregistrer la transaction
      await recordTransaction({
        user_id: user.id,
        type: 'recharge',
        amount_cents: amount,
        description: 'Recharge automatique via abonnement',
        external_transaction_id: invoice.id,
        status: 'completed'
      })

      console.log(`🔄 Subscription recharge: ${amount} cents for user ${user.id}`)
    }
  } catch (error) {
    console.error('❌ Error handling subscription payment:', error)
  }
}

/**
 * Gérer l'annulation d'un abonnement
 */
async function handleSubscriptionCancelled(subscription: any) {
  try {
    console.log(`🚫 Subscription cancelled: ${subscription.id}`)
    
    // Mettre à jour le statut dans la base
    await supabaseAdmin
      .from('wallet_subscriptions')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('external_subscription_id', subscription.id)
  } catch (error) {
    console.error('❌ Error handling subscription cancelled:', error)
  }
}

/**
 * Mettre à jour le wallet de l'utilisateur
 */
async function updateUserWallet(userId: string, amount: number) {
  try {
    // Vérifier si l'utilisateur a déjà un wallet
    const { data: existingWallet } = await supabaseAdmin
      .from('user_wallets')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (existingWallet) {
      // Mettre à jour le solde existant
      const { error } = await supabaseAdmin
        .from('user_wallets')
        .update({
          balance_cents: existingWallet.balance_cents + amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (error) throw error
    } else {
      // Créer un nouveau wallet
      const { error } = await supabaseAdmin
        .from('user_wallets')
        .insert({
          user_id: userId,
          balance_cents: amount,
          currency: 'EUR'
        })

      if (error) throw error
    }

    console.log(`✅ Wallet updated for user ${userId}: +${amount} cents`)
  } catch (error) {
    console.error(`❌ Error updating wallet for user ${userId}:`, error)
    throw error
  }
}

/**
 * Enregistrer une transaction
 */
async function recordTransaction(transaction: {
  user_id: string
  type: string
  amount_cents: number
  description: string
  external_transaction_id?: string
  status: string
}) {
  try {
    const { error } = await supabaseAdmin
      .from('wallet_transactions')
      .insert(transaction)

    if (error) throw error

    console.log(`📝 Transaction recorded: ${transaction.type} ${transaction.amount_cents} cents for user ${transaction.user_id}`)
  } catch (error) {
    console.error('❌ Error recording transaction:', error)
    throw error
  }
}

/**
 * Obtenir le solde du wallet d'un utilisateur
 */
async function getUserWalletBalance(userId: string): Promise<number> {
  try {
    const { data: wallet } = await supabaseAdmin
      .from('user_wallets')
      .select('balance_cents')
      .eq('user_id', userId)
      .single()

    return wallet?.balance_cents || 0
  } catch (error) {
    console.error(`❌ Error getting wallet balance for user ${userId}:`, error)
    return 0
  }
}
