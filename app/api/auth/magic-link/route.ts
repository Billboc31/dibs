import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

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

    // Envoyer le Magic Link avec Supabase (sans redirection compliquée)
    const { data, error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
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
        message: 'Magic Link envoyé ! Cliquez sur le lien dans votre email pour vous connecter.',
        message_id: data?.messageId || null,
        instructions: 'L\'utilisateur doit cliquer sur le lien dans l\'email. Supabase gérera automatiquement l\'authentification.'
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