import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'


// Force dynamic rendering pour éviter les erreurs de build Vercel
export const dynamic = 'force-dynamic'

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

    // Invalider le token côté Supabase
    const { error: signOutError } = await supabaseAdmin.auth.admin.signOut(user.id)
    
    if (signOutError) {
      console.error('❌ Erreur invalidation token Supabase:', signOutError)
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la déconnexion'
      }, { status: 500 })
    }
    
    console.log(`✅ User logged out and token invalidated: ${user.id}`)
    
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully - Token invalidated'
    })
  } catch (error: any) {
    console.error('❌ Error in POST /api/auth/logout:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}


