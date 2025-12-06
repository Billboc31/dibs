import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/wallet/demo/add-funds - Ajouter des fonds virtuels (DEMO uniquement)
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

    const { amount } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid amount required (minimum 1€)' },
        { status: 400 }
      )
    }

    // Limiter les montants pour la démo
    if (amount > 500) {
      return NextResponse.json(
        { success: false, error: 'Maximum 500€ pour la démo' },
        { status: 400 }
      )
    }

    // Récupérer ou créer le wallet
    let { data: wallet } = await supabaseAdmin
      .from('user_wallets')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!wallet) {
      // Créer le wallet s'il n'existe pas
      const { data: newWallet, error: createError } = await supabaseAdmin
        .from('user_wallets')
        .insert({
          user_id: user.id,
          balance_cents: 0,
          currency: 'EUR'
        })
        .select()
        .single()

      if (createError) {
        console.error('❌ Error creating wallet:', createError)
        return NextResponse.json(
          { success: false, error: 'Failed to create wallet' },
          { status: 500 }
        )
      }
      wallet = newWallet
    }

    // Ajouter les fonds (simulation)
    const newBalance = wallet.balance_cents + (amount * 100)
    
    await supabaseAdmin
      .from('user_wallets')
      .update({ balance_cents: newBalance })
      .eq('user_id', user.id)

    // Enregistrer la transaction
    await supabaseAdmin
      .from('wallet_transactions')
      .insert({
        user_id: user.id,
        type: 'recharge',
        amount_cents: amount * 100,
        description: `💳 Recharge DEMO - ${amount}€`,
        external_transaction_id: `demo_${Date.now()}`,
        status: 'completed'
      })

    console.log(`💰 DEMO: Added ${amount}€ to user ${user.id} wallet`)

    return NextResponse.json({
      success: true,
      message: '🎉 Fonds ajoutés avec succès (DEMO)',
      data: {
        amount_added_euros: amount,
        amount_added_cents: amount * 100,
        new_balance_cents: newBalance,
        new_balance_euros: newBalance / 100,
        currency: 'EUR',
        transaction_type: 'DEMO_RECHARGE'
      }
    })

  } catch (error: any) {
    console.error('❌ Error in POST /api/wallet/demo/add-funds:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
