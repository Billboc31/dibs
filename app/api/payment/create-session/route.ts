import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createWalletRechargeSession, createStripeCustomer } from '@/lib/stripe'

// POST /api/payment/create-session - Créer une session de paiement Stripe
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

    const { amount, type = 'wallet_recharge', description } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      )
    }

    // Récupérer ou créer le profil utilisateur complet
    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Récupérer ou créer le customer Stripe
    let stripeCustomerId = userProfile.stripe_customer_id

    if (!stripeCustomerId) {
      console.log(`🔄 Creating Stripe customer for user ${user.id}`)
      
      const stripeCustomer = await createStripeCustomer({
        id: user.id,
        email: user.email!,
        name: userProfile.display_name || user.email!
      })

      stripeCustomerId = stripeCustomer.id

      // Sauvegarder l'ID customer dans la base
      await supabaseAdmin
        .from('users')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', user.id)

      console.log(`✅ Stripe customer ID saved: ${stripeCustomerId}`)
    }

    // Créer la session de checkout Stripe
    const session = await createWalletRechargeSession({
      customerId: stripeCustomerId,
      amount: amount, // montant en centimes
      userId: user.id,
      email: user.email!,
      description: description || `Recharge Wallet DIBS - ${amount / 100}€`
    })

    console.log(`💳 Stripe payment session created:`)
    console.log(`  - Session ID: ${session.id}`)
    console.log(`  - User: ${user.email}`)
    console.log(`  - Amount: ${amount / 100}€`)
    console.log(`  - Type: ${type}`)
    console.log(`  - Checkout URL: ${session.url}`)

    return NextResponse.json({
      success: true,
      data: {
        session_id: session.id,
        checkout_url: session.url,
        amount,
        type,
        expires_at: new Date(session.expires_at * 1000).toISOString(),
        stripe_customer_id: stripeCustomerId
      }
    })
  } catch (error: any) {
    console.error('❌ Error creating Stripe payment session:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
