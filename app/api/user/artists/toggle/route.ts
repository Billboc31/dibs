import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/user/artists/toggle - Sélectionner/désélectionner un artiste
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

    // Récupérer les paramètres
    const body = await request.json()
    const { artistId, selected } = body

    if (!artistId) {
      return NextResponse.json(
        { success: false, error: 'artistId is required' },
        { status: 400 }
      )
    }

    console.log(`🔄 Toggle artist ${artistId} to ${selected ? 'selected' : 'unselected'} for user ${user.id}`)

    // Vérifier si l'artiste existe
    const { data: artist, error: artistError } = await supabaseAdmin
      .from('artists')
      .select('id, name')
      .eq('id', artistId)
      .single()

    if (artistError || !artist) {
      return NextResponse.json(
        { success: false, error: 'Artist not found' },
        { status: 404 }
      )
    }

    // Vérifier si l'artiste est déjà dans user_artists
    const { data: existingUserArtist } = await supabaseAdmin
      .from('user_artists')
      .select('*')
      .eq('user_id', user.id)
      .eq('artist_id', artistId)
      .single()

    if (selected) {
      // Sélectionner l'artiste
      if (!existingUserArtist) {
        // Ajouter à user_artists
        const { error: insertError } = await supabaseAdmin
          .from('user_artists')
          .insert({
            user_id: user.id,
            artist_id: artistId,
            fanitude_points: Math.floor(Math.random() * 500) + 100,
            last_listening_minutes: Math.floor(Math.random() * 1000) + 50
          })

        if (insertError) {
          console.error('❌ Error selecting artist:', insertError)
          return NextResponse.json(
            { success: false, error: 'Failed to select artist' },
            { status: 500 }
          )
        }
        console.log(`✅ Artist ${artist.name} selected`)
      }
    } else {
      // Désélectionner l'artiste
      if (existingUserArtist) {
        // Supprimer de user_artists
        const { error: deleteError } = await supabaseAdmin
          .from('user_artists')
          .delete()
          .eq('user_id', user.id)
          .eq('artist_id', artistId)

        if (deleteError) {
          console.error('❌ Error unselecting artist:', deleteError)
          return NextResponse.json(
            { success: false, error: 'Failed to unselect artist' },
            { status: 500 }
          )
        }
        console.log(`✅ Artist ${artist.name} unselected`)
      }
    }

    // Compter le nombre total d'artistes sélectionnés
    const { count: selectedCount } = await supabaseAdmin
      .from('user_artists')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    return NextResponse.json({
      success: true,
      data: {
        artist: {
          id: artist.id,
          name: artist.name,
          selected: selected
        },
        total_selected: selectedCount || 0
      }
    })

  } catch (error: any) {
    console.error('❌ Error in POST /api/user/artists/toggle:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
