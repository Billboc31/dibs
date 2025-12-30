import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createWalletSubscription, cancelSubscription, pauseSubscription, resumeSubscription } from '@/lib/stripe'


// Force dynamic rendering pour éviter les erreurs de build Vercel
export const dynamic = 'force-dynamic'

// POST /api/payment/subscription - Créer un abonnement de recharge automatique
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Authorization header required' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const { amount, frequency = 'monthly' } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      )
    }

    if (!['weekly', 'monthly', 'yearly'].includes(frequency)) {
      return NextResponse.json(
        { success: false, error: 'Invalid frequency' },
        { status: 400 }
      )
    }

    // Récupérer le profil utilisateur
    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!userProfile?.stripe_customer_id) {
      return NextResponse.json(
        { success: false, error: 'Stripe customer not found. Please create a payment session first.' },
        { status: 400 }
      )
    }

    // Vérifier s'il y a déjà un abonnement actif
    const { data: existingSubscription } = await supabaseAdmin
      .from('wallet_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (existingSubscription) {
      return NextResponse.json(
        { success: false, error: 'User already has an active subscription' },
        { status: 400 }
      )
    }

    // Créer l'abonnement Stripe
    const { subscription, product, price } = await createWalletSubscription({
      customerId: userProfile.stripe_customer_id,
      amount,
      frequency,
      userId: user.id,
      email: user.email!
    })

    // Calculer la prochaine facturation (30 jours par défaut)
    const nextChargeDate = new Date()
    if (frequency === 'weekly') {
      nextChargeDate.setDate(nextChargeDate.getDate() + 7)
    } else if (frequency === 'yearly') {
      nextChargeDate.setFullYear(nextChargeDate.getFullYear() + 1)
    } else {
      // monthly par défaut
      nextChargeDate.setMonth(nextChargeDate.getMonth() + 1)
    }

    // Sauvegarder l'abonnement dans la base
    const { data: dbSubscription, error: dbError } = await supabaseAdmin
      .from('wallet_subscriptions')
      .insert({
        user_id: user.id,
        amount_cents: amount,
        frequency,
        external_subscription_id: subscription.id,
        status: 'active',
        next_charge_at: nextChargeDate.toISOString()
      })
      .select()
      .single()

    if (dbError) {
      console.error('❌ Error saving subscription to database:', dbError)
      // Annuler l'abonnement Stripe si la sauvegarde échoue
      await cancelSubscription(subscription.id)
      throw dbError
    }

    console.log(`🔄 Wallet subscription created:`)
    console.log(`  - User: ${user.email}`)
    console.log(`  - Amount: ${amount / 100}€`)
    console.log(`  - Frequency: ${frequency}`)
    console.log(`  - Stripe ID: ${subscription.id}`)

    return NextResponse.json({
      success: true,
      data: {
        subscription_id: dbSubscription.id,
        stripe_subscription_id: subscription.id,
        amount,
        frequency,
        status: 'active',
        next_charge_at: dbSubscription.next_charge_at,
        created_at: dbSubscription.created_at
      }
    })
  } catch (error: any) {
    console.error('❌ Error creating wallet subscription:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// GET /api/payment/subscription - Récupérer l'abonnement de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Authorization header required' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Récupérer l'abonnement de l'utilisateur
    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from('wallet_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      console.error('❌ Error fetching subscription:', subscriptionError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch subscription' },
        { status: 500 }
      )
    }

    if (!subscription) {
      return NextResponse.json({
        success: true,
        data: null
      })
    }

    console.log(`✅ Subscription found for user ${user.id}: ${subscription.status}`)

    return NextResponse.json({
      success: true,
      data: {
        subscription_id: subscription.id,
        stripe_subscription_id: subscription.external_subscription_id,
        amount_cents: subscription.amount_cents,
        amount_euros: subscription.amount_cents / 100,
        frequency: subscription.frequency,
        status: subscription.status,
        next_charge_at: subscription.next_charge_at,
        last_charge_at: subscription.last_charge_at,
        created_at: subscription.created_at,
        updated_at: subscription.updated_at
      }
    })
  } catch (error: any) {
    console.error('❌ Error in GET /api/payment/subscription:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/payment/subscription - Annuler l'abonnement
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Authorization header required' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Récupérer l'abonnement actif
    const { data: subscription } = await supabaseAdmin
      .from('wallet_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'No active subscription found' },
        { status: 404 }
      )
    }

    // Annuler l'abonnement Stripe
    await cancelSubscription(subscription.external_subscription_id)

    // Mettre à jour le statut dans la base
    await supabaseAdmin
      .from('wallet_subscriptions')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id)

    console.log(`🚫 Subscription cancelled for user ${user.id}`)

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully'
    })
  } catch (error: any) {
    console.error('❌ Error cancelling subscription:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PATCH /api/payment/subscription - Mettre en pause/reprendre l'abonnement
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Authorization header required' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const { action } = await request.json() // 'pause' ou 'resume'

    if (!['pause', 'resume'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "pause" or "resume"' },
        { status: 400 }
      )
    }

    // Récupérer l'abonnement
    const { data: subscription } = await supabaseAdmin
      .from('wallet_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'paused'])
      .single()

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'No subscription found' },
        { status: 404 }
      )
    }

    let newStatus: string
    
    if (action === 'pause') {
      if (subscription.status === 'paused') {
        return NextResponse.json(
          { success: false, error: 'Subscription is already paused' },
          { status: 400 }
        )
      }
      
      await pauseSubscription(subscription.external_subscription_id)
      newStatus = 'paused'
    } else {
      if (subscription.status === 'active') {
        return NextResponse.json(
          { success: false, error: 'Subscription is already active' },
          { status: 400 }
        )
      }
      
      await resumeSubscription(subscription.external_subscription_id)
      newStatus = 'active'
    }

    // Mettre à jour le statut dans la base
    await supabaseAdmin
      .from('wallet_subscriptions')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id)

    console.log(`${action === 'pause' ? '⏸️' : '▶️'} Subscription ${action}d for user ${user.id}`)

    return NextResponse.json({
      success: true,
      message: `Subscription ${action}d successfully`,
      data: { status: newStatus }
    })
  } catch (error: any) {
    console.error('❌ Error managing subscription:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
