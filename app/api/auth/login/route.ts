import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email et mot de passe requis'
      }, { status: 400 })
    }

    // Authentification avec Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error('❌ Erreur connexion Supabase:', error.message)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 401 })
    }

    if (!data.user || !data.session) {
      return NextResponse.json({
        success: false,
        error: 'Échec de la connexion'
      }, { status: 401 })
    }

    // Récupérer les infos utilisateur depuis la base
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      console.error('❌ Erreur récupération profil:', profileError.message)
    }

    console.log('✅ Connexion réussie pour:', email)

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          display_name: userProfile?.display_name || null,
          avatar_url: userProfile?.avatar_url || null,
          city: userProfile?.location_city || null,
          country: userProfile?.location_country || null,
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
    console.error('❌ Erreur endpoint login:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 })
  }
}

