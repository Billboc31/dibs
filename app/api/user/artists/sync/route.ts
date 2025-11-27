import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/user/artists/sync - Synchroniser les artistes Spotify vers user_artists
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

    console.log(`🔄 Synchronisation artistes pour user: ${user.id}`)

    // Vérifier s'il y a des artistes Spotify dans la DB
    const { data: spotifyArtists, error: spotifyError } = await supabaseAdmin
      .from('artists')
      .select('id, name, spotify_id, image_url')
      .not('spotify_id', 'is', null)

    if (spotifyError) {
      console.error('❌ Erreur récupération artistes Spotify:', spotifyError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch Spotify artists' },
        { status: 500 }
      )
    }

    if (!spotifyArtists || spotifyArtists.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Aucun artiste Spotify trouvé. Connectez-vous d\'abord à Spotify via /connect-platform'
      })
    }

    console.log(`🎵 ${spotifyArtists.length} artistes Spotify trouvés`)

    // Vérifier quels artistes ne sont pas encore dans user_artists
    const { data: existingUserArtists } = await supabaseAdmin
      .from('user_artists')
      .select('artist_id')
      .eq('user_id', user.id)

    const existingArtistIds = new Set(existingUserArtists?.map(ua => ua.artist_id) || [])
    const newArtists = spotifyArtists.filter(artist => !existingArtistIds.has(artist.id))

    if (newArtists.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          message: 'Tous les artistes Spotify sont déjà synchronisés',
          total_artists: spotifyArtists.length,
          new_artists: 0
        }
      })
    }

    // Ajouter les nouveaux artistes à user_artists
    const userArtistsToInsert = newArtists.map(artist => ({
      user_id: user.id,
      artist_id: artist.id,
      fanitude_points: Math.floor(Math.random() * 500) + 100, // Points aléatoires entre 100-600
      last_listening_minutes: Math.floor(Math.random() * 1000) + 50 // Minutes aléatoires
    }))

    const { error: insertError } = await supabaseAdmin
      .from('user_artists')
      .insert(userArtistsToInsert)

    if (insertError) {
      console.error('❌ Erreur insertion user_artists:', insertError)
      return NextResponse.json(
        { success: false, error: 'Failed to sync artists' },
        { status: 500 }
      )
    }

    console.log(`✅ ${newArtists.length} nouveaux artistes synchronisés`)

    return NextResponse.json({
      success: true,
      data: {
        message: `${newArtists.length} artistes synchronisés avec succès`,
        total_artists: spotifyArtists.length,
        new_artists: newArtists.length,
        synced_artists: newArtists.map(a => ({ name: a.name, spotify_id: a.spotify_id }))
      }
    })

  } catch (error: any) {
    console.error('❌ Error in POST /api/user/artists/sync:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
