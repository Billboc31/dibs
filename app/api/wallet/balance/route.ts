import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering pour éviter les erreurs de build Vercel
export const dynamic = 'force-dynamic'

// GET /api/wallet/balance - Obtenir le solde du wallet
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

    // Récupérer le wallet de l'utilisateur
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('user_wallets')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (walletError && walletError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Error fetching wallet:', walletError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch wallet' },
        { status: 500 }
      )
    }

    // Si pas de wallet, créer un avec solde 0
    if (!wallet) {
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

      console.log(`✅ Created new wallet for user ${user.id}`)
      
      return NextResponse.json({
        success: true,
        data: {
          balance_cents: 0,
          balance_euros: 0,
          currency: 'EUR',
          created_at: newWallet.created_at
        }
      })
    }

    console.log(`✅ Wallet balance for user ${user.id}: ${wallet.balance_cents} cents`)

    return NextResponse.json({
      success: true,
      data: {
        balance_cents: wallet.balance_cents,
        balance_euros: wallet.balance_cents / 100,
        currency: wallet.currency,
        created_at: wallet.created_at,
        updated_at: wallet.updated_at
      }
    })
  } catch (error: any) {
    console.error('❌ Error in GET /api/wallet/balance:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
