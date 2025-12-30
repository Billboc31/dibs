import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'


// Force dynamic rendering pour éviter les erreurs de build Vercel
export const dynamic = 'force-dynamic'

// GET /api/qr/history - Historique des scans QR
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

    // Récupérer l'historique des scans
    const { data: scans, error: scansError } = await supabaseAdmin
      .from('qr_scans')
      .select(`
        id,
        scanned_at,
        points_earned,
        qr_codes (
          code,
          item_type,
          item_name,
          artist_id,
          points_value
        )
      `)
      .eq('user_id', user.id)
      .order('scanned_at', { ascending: false })

    if (scansError) {
      console.error('❌ Error fetching scan history:', scansError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch scan history' },
        { status: 500 }
      )
    }

    console.log(`✅ Fetched ${scans?.length || 0} scans for user ${user.id}`)
    
    return NextResponse.json({
      success: true,
      data: scans || []
    })
  } catch (error: any) {
    console.error('❌ Error in GET /api/qr/history:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}


