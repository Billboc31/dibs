import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, redirectTo } = await request.json()

    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email requis'
      }, { status: 400 })
    }

    // Valider le format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        error: 'Format d\'email invalide'
      }, { status: 400 })
    }

    // URL de redirection par défaut (pour l'app mobile)
    const defaultRedirectTo = redirectTo || 'dibs://auth/callback'

    // Envoyer le Magic Link avec Supabase
    const { data, error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: defaultRedirectTo,
        shouldCreateUser: true, // Créer l'utilisateur s'il n'existe pas
      }
    })

    if (error) {
      console.error('❌ Erreur Magic Link:', error.message)
      
      // Messages d'erreur plus clairs
      let errorMessage = error.message
      if (error.message.includes('rate limit')) {
        errorMessage = 'Trop de tentatives. Veuillez attendre avant de réessayer.'
      } else if (error.message.includes('invalid email')) {
        errorMessage = 'Adresse email invalide'
      }

      return NextResponse.json({
        success: false,
        error: errorMessage
      }, { status: 400 })
    }

    console.log('✅ Magic Link envoyé à:', email)

    return NextResponse.json({
      success: true,
      data: {
        email: email,
        message: 'Magic Link envoyé ! Vérifiez votre boîte email.',
        message_id: data?.messageId || null,
        redirect_to: defaultRedirectTo
      }
    })

  } catch (error: any) {
    console.error('❌ Erreur endpoint Magic Link:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 })
  }
}

// Endpoint pour vérifier le token du Magic Link (callback)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type')
    const next = searchParams.get('next') || '/home'

    if (!token_hash || type !== 'magiclink') {
      return NextResponse.json({
        success: false,
        error: 'Token Magic Link manquant ou invalide'
      }, { status: 400 })
    }

    // Vérifier le token Magic Link
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: 'magiclink'
    })

    if (error) {
      console.error('❌ Erreur vérification Magic Link:', error.message)
      return NextResponse.json({
        success: false,
        error: 'Magic Link invalide ou expiré'
      }, { status: 400 })
    }

    if (!data.user || !data.session) {
      return NextResponse.json({
        success: false,
        error: 'Échec de la vérification du Magic Link'
      }, { status: 400 })
    }

    console.log('✅ Magic Link vérifié pour:', data.user.email)

    // Redirection vers l'app mobile ou page suivante
    if (next.startsWith('dibs://')) {
      // Deep link vers l'app mobile
      return NextResponse.redirect(next)
    } else {
      // Redirection web avec les tokens en query params (pour debug)
      const redirectUrl = new URL(next, request.url)
      redirectUrl.searchParams.set('access_token', data.session.access_token)
      redirectUrl.searchParams.set('refresh_token', data.session.refresh_token)
      return NextResponse.redirect(redirectUrl.toString())
    }

  } catch (error: any) {
    console.error('❌ Erreur callback Magic Link:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 })
  }
}
