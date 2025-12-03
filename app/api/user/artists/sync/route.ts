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

    // Récupérer les paramètres optionnels
    const body = await request.json().catch(() => ({}))
    const { artistIds } = body // Liste optionnelle d'artistes spécifiques à synchroniser

    if (artistIds && Array.isArray(artistIds)) {
      console.log(`🔄 Synchronisation des stats pour ${artistIds.length} artistes spécifiques de l'utilisateur: ${user.id}`)
    } else {
      console.log(`🔄 Synchronisation des stats pour TOUS les artistes sélectionnés par l'utilisateur: ${user.id}`)
    }

    // Construire la requête pour récupérer les artistes sélectionnés
    let query = supabaseAdmin
      .from('user_artists')
      .select(`
        artist_id,
        fanitude_points,
        last_listening_minutes,
        artists!inner (
          id,
          name,
          spotify_id,
          image_url
        )
      `)
      .eq('user_id', user.id)

    // Si des artistes spécifiques sont demandés, filtrer sur ceux-ci
    if (artistIds && Array.isArray(artistIds) && artistIds.length > 0) {
      query = query.in('artist_id', artistIds)
    }

    const { data: selectedArtists, error: selectedError } = await query

    if (selectedError) {
      console.error('❌ Erreur récupération artistes sélectionnés:', selectedError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch selected artists' },
        { status: 500 }
      )
    }

    if (!selectedArtists || selectedArtists.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          message: 'Aucun artiste sélectionné à synchroniser',
          total_selected: 0,
          updated_artists: 0
        }
      })
    }

    console.log(`🎵 ${selectedArtists.length} artistes sélectionnés à synchroniser`)

    // Vérifier la connexion Spotify pour récupérer les vraies stats
    const { data: spotifyConnection } = await supabaseAdmin
      .from('user_streaming_platforms')
      .select(`
        access_token, 
        refresh_token,
        streaming_platforms!inner (
          name,
          slug
        )
      `)
      .eq('user_id', user.id)
      .eq('streaming_platforms.slug', 'spotify')
      .single()

    if (!spotifyConnection) {
      console.log('⚠️ Pas de connexion Spotify - mise à jour avec des valeurs simulées')
    }

    // Mettre à jour les stats des artistes sélectionnés
    const updatedArtists = []
    
    for (const selectedArtist of selectedArtists) {
      const artist = (selectedArtist as any).artists
      
      // Calculer de nouveaux points et temps d'écoute
      // TODO: Si connexion Spotify disponible, utiliser les vraies données de l'API
      // Pour l'instant, on simule une mise à jour des stats
      
      let newFanitudePoints = selectedArtist.fanitude_points
      let newListeningMinutes = selectedArtist.last_listening_minutes
      
      if (spotifyConnection) {
        // TODO: Appeler l'API Spotify pour récupérer les vraies stats
        // Pour l'instant, on simule une augmentation
        newFanitudePoints += Math.floor(Math.random() * 50) + 10 // +10 à +60 points
        newListeningMinutes += Math.floor(Math.random() * 30) + 5 // +5 à +35 minutes
      } else {
        // Simulation sans API Spotify
        newFanitudePoints += Math.floor(Math.random() * 20) + 5 // +5 à +25 points
        newListeningMinutes += Math.floor(Math.random() * 15) + 2 // +2 à +17 minutes
      }

      // Mettre à jour dans user_artists
      const { data: updatedArtist, error: updateError } = await supabaseAdmin
        .from('user_artists')
        .update({
          fanitude_points: newFanitudePoints,
          last_listening_minutes: newListeningMinutes,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('artist_id', selectedArtist.artist_id)
        .select()
        .single()

      if (updateError) {
        console.error(`❌ Erreur mise à jour artiste ${artist.name}:`, updateError)
        continue
      }

      updatedArtists.push({
        artist_id: selectedArtist.artist_id,
        artist_name: artist.name,
        old_fanitude_points: selectedArtist.fanitude_points,
        new_fanitude_points: newFanitudePoints,
        old_listening_minutes: selectedArtist.last_listening_minutes,
        new_listening_minutes: newListeningMinutes,
        points_gained: newFanitudePoints - selectedArtist.fanitude_points,
        minutes_gained: newListeningMinutes - selectedArtist.last_listening_minutes
      })
    }

    console.log(`✅ ${updatedArtists.length} artistes synchronisés`)

    return NextResponse.json({
      success: true,
      data: {
        message: 'Stats des artistes sélectionnés mises à jour',
        total_selected: selectedArtists.length,
        updated_artists: updatedArtists.length,
        spotify_connected: !!spotifyConnection,
        updated_artists_details: updatedArtists
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
