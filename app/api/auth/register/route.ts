import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password, display_name } = await request.json()

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email et mot de passe requis'
      }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({
        success: false,
        error: 'Le mot de passe doit contenir au moins 6 caractères'
      }, { status: 400 })
    }

    // Inscription avec Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: display_name || null
        }
      }
    })

    if (error) {
      console.error('❌ Erreur inscription Supabase:', error.message)
      
      // Messages d'erreur plus clairs
      let errorMessage = error.message
      if (error.message.includes('already registered')) {
        errorMessage = 'Cette adresse email est déjà utilisée'
      } else if (error.message.includes('invalid email')) {
        errorMessage = 'Adresse email invalide'
      } else if (error.message.includes('weak password')) {
        errorMessage = 'Mot de passe trop faible'
      }

      return NextResponse.json({
        success: false,
        error: errorMessage
      }, { status: 400 })
    }

    if (!data.user) {
      return NextResponse.json({
        success: false,
        error: 'Échec de l\'inscription'
      }, { status: 400 })
    }

    // Créer le profil utilisateur dans la table users
    if (data.user.id) {
      const { error: profileError } = await supabaseAdmin
        .from('users')
        .upsert({
          id: data.user.id,
          email: data.user.email,
          display_name: display_name || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (profileError) {
        console.error('❌ Erreur création profil:', profileError.message)
      } else {
        console.log('✅ Profil utilisateur créé')
      }
    }

    console.log('✅ Inscription réussie pour:', email)

    // Si l'inscription nécessite une confirmation email
    if (!data.session) {
      return NextResponse.json({
        success: true,
        data: {
          user: {
            id: data.user.id,
            email: data.user.email,
            display_name: display_name || null,
            email_confirmed: false
          },
          message: 'Inscription réussie. Vérifiez votre email pour confirmer votre compte.'
        }
      })
    }

    // Si l'inscription est immédiate (pas de confirmation email)
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          display_name: display_name || null,
          email_confirmed: true,
          created_at: data.user.created_at
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
          expires_in: data.session.expires_in
        }
      }
    })

  } catch (error: any) {
    console.error('❌ Erreur endpoint register:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 })
  }
}

