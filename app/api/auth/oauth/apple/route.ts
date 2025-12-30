import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'


// Force dynamic rendering pour éviter les erreurs de build Vercel
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { redirectTo } = await request.json()

    // URL de redirection par défaut (deep link de l'app mobile)
    const defaultRedirectTo = redirectTo || 'dibs://auth/callback'

    // Initier l'OAuth Apple avec Supabase
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: defaultRedirectTo,
        queryParams: {
          response_mode: 'form_post',
        },
      },
    })

    if (error) {
      console.error('❌ Erreur OAuth Apple:', error.message)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 400 })
    }

    console.log('✅ OAuth Apple initié')

    return NextResponse.json({
      success: true,
      data: {
        url: data.url,
        provider: 'apple',
        message: 'Redirection vers Apple OAuth'
      }
    })

  } catch (error: any) {
    console.error('❌ Erreur endpoint OAuth Apple:', error)
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

    console.log('✅ OAuth Apple callback traité')

    return NextResponse.json({
      success: true,
      data: {
        user: data.user,
        session: data.session
      }
    })

  } catch (error: any) {
    console.error('❌ Erreur callback OAuth Apple:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 })
  }
}

