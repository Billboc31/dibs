import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/user/artists/followed - Liste des artistes suivis par l'utilisateur avec sync automatique
export async function GET(request: NextRequest) {
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

    console.log(`🔍 Récupération des artistes suivis pour l'utilisateur: ${user.id}`)

    // D'abord, déclencher un sync pour mettre à jour les stats
    console.log(`🔄 Déclenchement du sync automatique...`)
    try {
      const syncResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/user/artists/sync`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({}) // Sync tous les artistes sélectionnés
      })
      
      if (syncResponse.ok) {
        console.log(`✅ Sync automatique terminé`)
      } else {
        console.log(`⚠️ Erreur lors du sync automatique: ${syncResponse.status}`)
      }
    } catch (syncError) {
      console.log(`⚠️ Erreur appel sync automatique:`, syncError)
    }

    // Récupérer les artistes suivis avec leurs stats mises à jour
    const { data: followedArtists, error: followedError } = await supabaseAdmin
      .from('user_artists')
      .select(`
        artist_id,
        fanitude_points,
        last_listening_minutes,
        created_at,
        updated_at,
        artists (
          id,
          name,
          spotify_id,
          apple_music_id,
          deezer_id,
          image_url
        )
      `)
      .eq('user_id', user.id)
      .order('fanitude_points', { ascending: false }) // Trier par points de fanitude (plus élevé en premier)

    if (followedError) {
      console.error('❌ Erreur récupération artistes suivis:', followedError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch followed artists' },
        { status: 500 }
      )
    }

    // Formater les données pour la réponse
    const artists = followedArtists?.map(ua => {
      const artist = ua.artists as any // Cast pour éviter les erreurs TypeScript
      return {
        id: artist.id,
        name: artist.name,
        spotify_id: artist.spotify_id,
        apple_music_id: artist.apple_music_id,
        deezer_id: artist.deezer_id,
        image_url: artist.image_url,
        fanitude_points: ua.fanitude_points,
        last_listening_minutes: ua.last_listening_minutes,
        followed_since: ua.created_at,
        last_updated: ua.updated_at
      }
    }) || []

    // Calculer les statistiques
    const totalPoints = artists.reduce((sum, artist) => sum + (artist.fanitude_points || 0), 0)
    const totalMinutes = artists.reduce((sum, artist) => sum + (artist.last_listening_minutes || 0), 0)
    const averagePoints = artists.length > 0 ? Math.round(totalPoints / artists.length) : 0

    console.log(`✅ ${artists.length} artistes suivis récupérés pour l'utilisateur ${user.id}`)
    console.log(`📊 Stats: ${totalPoints} points total, ${totalMinutes} minutes total, ${averagePoints} points moyenne`)

    return NextResponse.json({
      success: true,
      data: {
        artists,
        stats: {
          total_followed: artists.length,
          total_fanitude_points: totalPoints,
          total_listening_minutes: totalMinutes,
          average_fanitude_points: averagePoints
        },
        sync_performed: true
      }
    })

  } catch (error: any) {
    console.error('❌ Error in GET /api/user/artists/followed:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
