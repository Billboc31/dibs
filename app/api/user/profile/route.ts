import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/user/profile - Récupérer le profil utilisateur
export async function GET(request: NextRequest) {
  try {
    // Récupérer l'userId depuis le header Authorization
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Authorization header required' },
        { status: 401 }
      )
    }

    // Extraire le token JWT
    const token = authHeader.replace('Bearer ', '')
    
    // Vérifier le token avec Supabase Auth
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Récupérer le profil depuis la table users
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('❌ Error fetching profile:', profileError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    console.log(`✅ Profile fetched for user ${user.id}`)
    return NextResponse.json({ success: true, data: profile })
  } catch (error: any) {
    console.error('❌ Error in GET /api/user/profile:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT /api/user/profile - Mettre à jour le profil
export async function PUT(request: NextRequest) {
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

    // Récupérer les données à mettre à jour
    const body = await request.json()
    const { display_name, avatar_url, city, country } = body

    // Mettre à jour le profil
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        display_name,
        avatar_url,
        city,
        country,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating profile:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    console.log(`✅ Profile updated for user ${user.id}`)
    return NextResponse.json({ success: true, data: updatedProfile })
  } catch (error: any) {
    console.error('❌ Error in PUT /api/user/profile:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}


