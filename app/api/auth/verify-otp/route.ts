import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, token } = await request.json()

    if (!email || !token) {
      return NextResponse.json({
        success: false,
        error: 'Email et code de vérification requis'
      }, { status: 400 })
    }

    // Vérifier le code OTP
    const { data, error } = await supabase.auth.verifyOtp({
      email: email,
      token: token,
      type: 'email'
    })

    if (error) {
      console.error('❌ Erreur vérification OTP:', error.message)
      
      let errorMessage = error.message
      if (error.message.includes('invalid')) {
        errorMessage = 'Code de vérification invalide ou expiré'
      } else if (error.message.includes('expired')) {
        errorMessage = 'Code de vérification expiré. Demandez un nouveau Magic Link.'
      }

      return NextResponse.json({
        success: false,
        error: errorMessage
      }, { status: 400 })
    }

    if (!data.user || !data.session) {
      return NextResponse.json({
        success: false,
        error: 'Échec de la vérification'
      }, { status: 400 })
    }

    console.log('✅ OTP vérifié pour:', data.user.email)

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          display_name: data.user.user_metadata?.display_name || null,
          avatar_url: data.user.user_metadata?.avatar_url || null,
          created_at: data.user.created_at
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
          expires_in: data.session.expires_in
        },
        message: 'Connexion réussie !'
      }
    })

  } catch (error: any) {
    console.error('❌ Erreur endpoint verify-otp:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 })
  }
}
