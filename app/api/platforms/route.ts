import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'


// Force dynamic rendering pour éviter les erreurs de build Vercel
export const dynamic = 'force-dynamic'

// GET /api/platforms - Liste de toutes les plateformes
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

    // Récupérer toutes les plateformes
    const { data: platforms, error: platformsError } = await supabaseAdmin
      .from('streaming_platforms')
      .select('*')
      .order('name')

    if (platformsError) {
      console.error('❌ Error fetching platforms:', platformsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch platforms' },
        { status: 500 }
      )
    }

    console.log(`✅ Fetched ${platforms?.length || 0} platforms`)
    
    return NextResponse.json({
      success: true,
      data: platforms || []
    })
  } catch (error: any) {
    console.error('❌ Error in GET /api/platforms:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}


