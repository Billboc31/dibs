import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/auth/logout - Déconnexion
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

    // Invalider le token (côté client, le token sera supprimé)
    // Note: Supabase Auth gère automatiquement l'invalidation des sessions
    
    console.log(`✅ User logged out: ${user.id}`)
    
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })
  } catch (error: any) {
    console.error('❌ Error in POST /api/auth/logout:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}


