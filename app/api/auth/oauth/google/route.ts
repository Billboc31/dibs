import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { redirectTo } = await request.json()

    // URL de redirection par défaut (deep link de l'app mobile)
    const defaultRedirectTo = redirectTo || 'dibs://auth/callback'

    // Initier l'OAuth Google avec Supabase
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: defaultRedirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) {
      console.error('❌ Erreur OAuth Google:', error.message)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 400 })
    }

    console.log('✅ OAuth Google initié')

    return NextResponse.json({
      success: true,
      data: {
        url: data.url,
        provider: 'google',
        message: 'Redirection vers Google OAuth'
      }
    })

  } catch (error: any) {
    console.error('❌ Erreur endpoint OAuth Google:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 })
  }
}

// Endpoint pour traiter le callback OAuth (optionnel)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      console.error('❌ Erreur OAuth callback:', error)
      return NextResponse.json({
        success: false,
        error: 'Erreur d\'authentification OAuth'
      }, { status: 400 })
    }

    if (!code) {
      return NextResponse.json({
        success: false,
        error: 'Code d\'autorisation manquant'
      }, { status: 400 })
    }

    // Échanger le code contre une session
    const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

    if (sessionError) {
      console.error('❌ Erreur échange code:', sessionError.message)
      return NextResponse.json({
        success: false,
        error: sessionError.message
      }, { status: 400 })
    }

    console.log('✅ OAuth Google callback traité')

    return NextResponse.json({
      success: true,
      data: {
        user: data.user,
        session: data.session
      }
    })

  } catch (error: any) {
    console.error('❌ Erreur callback OAuth Google:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 })
  }
}
