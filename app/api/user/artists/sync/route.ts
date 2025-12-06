import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { refreshSpotifyToken, disconnectRevokedSpotifyUser } from '@/lib/spotify-api'

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

    // Helper function pour faire des appels Spotify avec refresh automatique
    const fetchSpotifyWithRefresh = async (url: string, accessToken: string, refreshToken: string): Promise<any> => {
      const makeRequest = async (token: string) => {
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (response.status === 401) {
          throw new Error('TOKEN_EXPIRED')
        }
        
        if (!response.ok) {
          throw new Error(`Spotify API error: ${response.status}`)
        }
        
        return response.json()
      }

      try {
        return await makeRequest(accessToken)
      } catch (error: any) {
        if (error.message === 'TOKEN_EXPIRED') {
          console.log('🔄 Token Spotify expiré, refresh en cours...')
          
          try {
            const newAccessToken = await refreshSpotifyToken(refreshToken)
            if (!newAccessToken) {
              throw new Error('Failed to refresh Spotify token')
            }
            
            // Mettre à jour le token dans la base
            await supabaseAdmin
              .from('user_streaming_platforms')
              .update({ access_token: newAccessToken })
              .eq('user_id', user.id)
              .eq('streaming_platforms.slug', 'spotify')
            
            console.log('✅ Token Spotify refreshé avec succès')
            return await makeRequest(newAccessToken)
          } catch (refreshError: any) {
            if (refreshError.message === 'SPOTIFY_TOKEN_REVOKED') {
              console.log('🚨 Token Spotify révoqué, nettoyage en cours...')
              await disconnectRevokedSpotifyUser(user.id)
              throw new Error('SPOTIFY_TOKEN_REVOKED')
            }
            throw refreshError
          }
        }
        throw error
      }
    }

    // Récupérer les données Spotify si connexion disponible
    let spotifyTopArtists: any[] = []
    let spotifyRecentTracks: any[] = []
    
    if (spotifyConnection?.access_token && spotifyConnection?.refresh_token) {
      console.log('🎵 Récupération des données Spotify en temps réel...')
      
      try {
        // Récupérer les top artists et recent tracks en parallèle
        const [topArtistsData, recentTracksData] = await Promise.all([
          fetchSpotifyWithRefresh(
            'https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=50',
            spotifyConnection.access_token,
            spotifyConnection.refresh_token
          ).catch(() => ({ items: [] })),
          
          fetchSpotifyWithRefresh(
            'https://api.spotify.com/v1/me/player/recently-played?limit=50',
            spotifyConnection.access_token,
            spotifyConnection.refresh_token
          ).catch(() => ({ items: [] }))
        ])
        
        spotifyTopArtists = topArtistsData.items || []
        spotifyRecentTracks = recentTracksData.items || []
        
        console.log(`✅ Données Spotify récupérées: ${spotifyTopArtists.length} top artists, ${spotifyRecentTracks.length} recent tracks`)
      } catch (error) {
        console.log('⚠️ Erreur récupération données Spotify:', error)
      }
    }

    // Mettre à jour les stats des artistes sélectionnés
    const updatedArtists = []
    
    for (const selectedArtist of selectedArtists) {
      const artist = (selectedArtist as any).artists
      
      // Calculer les nouveaux points et temps d'écoute basés sur les vraies données Spotify
      // IMPORTANT: Les points de fanitude sont basés UNIQUEMENT sur le temps d'écoute
      // pour être comparables entre tous les utilisateurs (1 point = 1 minute)
      // À chaque sync, on REPART DE 0 pour avoir une vision actuelle de l'écoute
      let newFanitudePoints = 0 // Remise à zéro à chaque sync
      let newListeningMinutes = 0 // Remise à zéro à chaque sync
      
      if (spotifyConnection?.access_token) {
        // Calculer les minutes d'écoute basées sur les vraies données Spotify récentes
        let minutesFromRecentTracks = 0
        
        // Minutes basées sur les pistes récemment écoutées (dernières 50 écoutes)
        const recentArtistTracks = spotifyRecentTracks.filter((track: any) => 
          track.track?.artists?.some((a: any) => a.id === artist.spotify_id)
        )
        
        if (recentArtistTracks.length > 0) {
          // Chaque écoute récente = ~3 minutes en moyenne
          minutesFromRecentTracks = recentArtistTracks.length * 3
          console.log(`🎧 ${artist.name} écouté ${recentArtistTracks.length} fois récemment: ${minutesFromRecentTracks} minutes au total`)
        }
        
        // Calculer les points de fanitude basés UNIQUEMENT sur le temps d'écoute récent
        // Formule : 1 point = 1 minute d'écoute (pour être comparable entre utilisateurs)
        newFanitudePoints = minutesFromRecentTracks
        newListeningMinutes = minutesFromRecentTracks
        
        if (newFanitudePoints > 0) {
          console.log(`📊 ${artist.name}: ${newFanitudePoints} points de fanitude (= ${newListeningMinutes} minutes d'écoute récente)`)
        } else {
          console.log(`📊 ${artist.name}: Aucune écoute récente détectée`)
        }
        
      } else {
        // Fallback: simulation si pas de connexion Spotify
        console.log(`⚠️ Pas de connexion Spotify pour ${artist.name}, utilisation de valeurs simulées`)
        const simulatedMinutes = Math.floor(Math.random() * 60) + 10 // 10 à 70 minutes
        newFanitudePoints = simulatedMinutes
        newListeningMinutes = simulatedMinutes
        console.log(`📊 ${artist.name}: ${newFanitudePoints} points simulés (= ${newListeningMinutes} minutes simulées)`)
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
        points_change: newFanitudePoints - selectedArtist.fanitude_points,
        minutes_change: newListeningMinutes - selectedArtist.last_listening_minutes,
        sync_type: 'reset_to_current' // Indique qu'on repart de 0 à chaque sync
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
    
    // Gestion spéciale pour les tokens révoqués
    if (error.message === 'SPOTIFY_TOKEN_REVOKED') {
      return NextResponse.json({
        success: false,
        error: 'SPOTIFY_TOKEN_REVOKED',
        message: 'Votre connexion Spotify a été révoquée. Veuillez vous reconnecter.',
        action_required: 'reconnect_spotify'
      }, { status: 401 })
    }
    
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
