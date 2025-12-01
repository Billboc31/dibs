import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/wallet/transactions - Historique des transactions du wallet
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

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const type = searchParams.get('type') // 'recharge', 'payment', 'refund'

    // Construire la requête
    let query = supabaseAdmin
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filtrer par type si spécifié
    if (type) {
      query = query.eq('type', type)
    }

    const { data: transactions, error: transactionsError } = await query

    if (transactionsError) {
      console.error('❌ Error fetching transactions:', transactionsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch transactions' },
        { status: 500 }
      )
    }

    // Compter le total des transactions
    let countQuery = supabaseAdmin
      .from('wallet_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (type) {
      countQuery = countQuery.eq('type', type)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('❌ Error counting transactions:', countError)
    }

    console.log(`✅ Fetched ${transactions?.length || 0} transactions for user ${user.id}`)

    return NextResponse.json({
      success: true,
      data: {
        transactions: transactions || [],
        pagination: {
          total: count || 0,
          limit,
          offset,
          has_more: (count || 0) > offset + limit
        }
      }
    })
  } catch (error: any) {
    console.error('❌ Error in GET /api/wallet/transactions:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
