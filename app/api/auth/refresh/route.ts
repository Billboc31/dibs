import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { refresh_token } = await request.json()

    if (!refresh_token) {
      return NextResponse.json({
        success: false,
        error: 'Refresh token requis'
      }, { status: 400 })
    }

    // Rafraîchir la session avec Supabase
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token
    })

    if (error) {
      console.error('❌ Erreur refresh token:', error.message)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 401 })
    }

    if (!data.session) {
      return NextResponse.json({
        success: false,
        error: 'Impossible de rafraîchir la session'
      }, { status: 401 })
    }

    console.log('✅ Token rafraîchi avec succès')

    return NextResponse.json({
      success: true,
      data: {
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
          expires_in: data.session.expires_in
        },
        user: data.user
      }
    })

  } catch (error: any) {
    console.error('❌ Erreur endpoint refresh:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 })
  }
}
