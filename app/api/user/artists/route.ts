import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/user/artists - Liste des artistes suivis (paginée)
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

    // Récupérer les paramètres de pagination
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '0')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = page * limit

    console.log(`🔍 Recherche artistes pour user: ${user.id}`)

    // Récupérer toutes les plateformes connectées par l'utilisateur
    const { data: connectedPlatforms } = await supabaseAdmin
      .from('user_streaming_platforms')
      .select(`
        access_token, 
        refresh_token,
        platform_id,
        streaming_platforms!inner (
          id,
          name,
          slug
        )
      `)
      .eq('user_id', user.id)

    if (!connectedPlatforms || connectedPlatforms.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Aucune plateforme de streaming connectée. Connectez-vous d\'abord à une plateforme via /connect-platform'
      }, { status: 400 })
    }

    console.log(`🔗 Plateformes connectées: ${connectedPlatforms.map(p => (p.streaming_platforms as any).name).join(', ')}`)

    console.log(`📊 Récupération des artistes spécifiques à cet utilisateur...`)
    
    // Construire les filtres pour les plateformes connectées
    const platformFilters = connectedPlatforms.map(p => (p.streaming_platforms as any).slug)
    console.log(`🔍 Plateformes: ${platformFilters.join(', ')}`)

    // Récupérer les artistes spécifiques à cet utilisateur depuis les APIs des plateformes
    let userSpecificArtistIds: string[] = []
    
    // Pour Spotify : récupérer les artistes de l'utilisateur depuis l'API Spotify
    if (platformFilters.includes('spotify')) {
      console.log(`🎵 Récupération des artistes Spotify de l'utilisateur...`)
      try {
        // Récupérer le token Spotify de l'utilisateur
        const { data: connection } = await supabaseAdmin
          .from('user_streaming_platforms')
          .select('access_token')
          .eq('user_id', user.id)
          .eq('platform_id', connectedPlatforms.find(p => (p.streaming_platforms as any).slug === 'spotify')?.platform_id)
          .single()

        if (!connection?.access_token) {
          console.log('⚠️ Pas de token Spotify pour cet utilisateur')
        } else {
          // Récupérer les artistes depuis l'API Spotify
          console.log(`🔑 Récupération des artistes Spotify...`)
          
          const [topArtists, followedArtists, recentTracks] = await Promise.all([
            fetch(`https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=50`, {
              headers: { 'Authorization': `Bearer ${connection.access_token}` }
            }).then(res => res.json()).then(data => data.items || []).catch(() => []),
            
            fetch(`https://api.spotify.com/v1/me/following?type=artist&limit=50`, {
              headers: { 'Authorization': `Bearer ${connection.access_token}` }
            }).then(res => res.json()).then(data => data.artists?.items || []).catch(() => []),
            
            fetch(`https://api.spotify.com/v1/me/player/recently-played?limit=50`, {
              headers: { 'Authorization': `Bearer ${connection.access_token}` }
            }).then(res => res.json()).then(data => data.items || []).catch(() => [])
          ])

          // Combiner tous les artistes et dédupliquer avec vérifications de sécurité
          const artistsMap = new Map()
          
          // Ajouter top artists (vérification de sécurité)
          if (Array.isArray(topArtists)) {
            topArtists.forEach(artist => {
              if (artist && artist.id) {
                artistsMap.set(artist.id, artist)
              }
            })
          }
          
          // Ajouter followed artists (vérification de sécurité)
          if (Array.isArray(followedArtists)) {
            followedArtists.forEach(artist => {
              if (artist && artist.id) {
                artistsMap.set(artist.id, artist)
              }
            })
          }
          
          // Ajouter artistes des pistes récentes (vérification de sécurité)
          if (Array.isArray(recentTracks)) {
            recentTracks.forEach(track => {
              if (track && Array.isArray(track.artists)) {
                track.artists.forEach(artist => {
                  if (artist && artist.id && !artistsMap.has(artist.id)) {
                    artistsMap.set(artist.id, artist)
                  }
                })
              }
            })
          }

          const allSpotifyArtists = Array.from(artistsMap.values())
          console.log(`🎵 ${allSpotifyArtists.length} artistes Spotify uniques trouvés`)

          // D'abord, essayons la méthode simple : chercher les artistes existants
          if (allSpotifyArtists.length > 0) {
            const spotifyIds = allSpotifyArtists.map((a: any) => a.id)
            console.log(`🔍 Recherche de ${spotifyIds.length} artistes Spotify dans la base...`)
            console.log(`🎵 Premiers IDs Spotify: ${spotifyIds.slice(0, 3).join(', ')}...`)
            
            // Vérifier d'abord combien d'artistes existent dans la base
            const { count: totalArtistsInDB } = await supabaseAdmin
              .from('artists')
              .select('*', { count: 'exact', head: true })
              .not('spotify_id', 'is', null)
            
            console.log(`📊 Total artistes avec spotify_id dans la base: ${totalArtistsInDB}`)
            
            // Chercher les artistes existants
            const { data: existingArtists, error: searchError } = await supabaseAdmin
              .from('artists')
              .select('id, spotify_id, name')
              .in('spotify_id', spotifyIds)

            if (searchError) {
              console.error('❌ Erreur recherche artistes:', searchError)
            } else {
              console.log(`🔍 Artistes trouvés dans la base: ${existingArtists?.length || 0}`)
              if (existingArtists && existingArtists.length > 0) {
                console.log(`🎯 Premiers artistes trouvés: ${existingArtists.slice(0, 3).map(a => `${a.name} (${a.spotify_id})`).join(', ')}`)
                userSpecificArtistIds.push(...existingArtists.map(a => a.id))
              }
              
              // Si on n'a pas trouvé tous les artistes, upsert les manquants
              const foundSpotifyIds = new Set(existingArtists?.map(a => a.spotify_id) || [])
              const missingArtists = allSpotifyArtists.filter((artist: any) => !foundSpotifyIds.has(artist.id))
              
              if (missingArtists.length > 0) {
                console.log(`🔄 ${missingArtists.length} artistes manquants, ajout en cours...`)
                
                const artistsToUpsert = missingArtists.map((artist: any) => ({
                  spotify_id: artist.id,
                  name: artist.name,
                  image_url: artist.images?.[0]?.url || null
                }))

                const { data: newArtists, error: upsertError } = await supabaseAdmin
                  .from('artists')
                  .upsert(artistsToUpsert, { 
                    onConflict: 'spotify_id',
                    ignoreDuplicates: false 
                  })
                  .select('id, spotify_id, name')

                if (upsertError) {
                  console.error('❌ Erreur upsert nouveaux artistes:', upsertError)
                } else if (newArtists) {
                  userSpecificArtistIds.push(...newArtists.map(a => a.id))
                  console.log(`✅ ${newArtists.length} nouveaux artistes ajoutés`)
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('⚠️ Erreur récupération artistes Spotify:', error)
      }
    }

    // TODO: Ajouter Apple Music et Deezer quand les APIs seront disponibles
    // if (platformFilters.includes('apple_music')) { ... }
    // if (platformFilters.includes('deezer')) { ... }

    console.log(`📊 Total artistes spécifiques à l'utilisateur: ${userSpecificArtistIds.length}`)

    if (userSpecificArtistIds.length === 0) {
      console.log('❌ Aucun artiste trouvé pour cet utilisateur')
      return NextResponse.json({
        success: false,
        error: 'Impossible de récupérer les artistes Spotify. Vérifiez votre connexion Spotify ou réessayez plus tard.'
      }, { status: 400 })
    }

    // Récupérer les artistes de l'utilisateur avec pagination
    const { data: allArtists, error: artistsError } = await supabaseAdmin
      .from('artists')
      .select(`
        id,
        name,
        spotify_id,
        apple_music_id,
        deezer_id,
        image_url,
        created_at
      `)
      .in('id', userSpecificArtistIds)
      .order('name')
      .range(offset, offset + limit - 1)

    if (artistsError) {
      console.error('❌ Error fetching artists:', artistsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch artists' },
        { status: 500 }
      )
    }

    // Récupérer les artistes sélectionnés par l'utilisateur
    const { data: selectedArtists } = await supabaseAdmin
      .from('user_artists')
      .select('artist_id, fanitude_points, last_listening_minutes')
      .eq('user_id', user.id)

    // Créer un Map des artistes sélectionnés pour un accès rapide
    const selectedArtistsMap = new Map(
      selectedArtists?.map(ua => [ua.artist_id, ua]) || []
    )

    // Combiner les données : tous les artistes + flag de sélection SEULEMENT
    const artists = allArtists?.map(artist => {
      const userArtist = selectedArtistsMap.get(artist.id)
      return {
        id: artist.id,
        name: artist.name,
        spotify_id: artist.spotify_id,
        apple_music_id: artist.apple_music_id,
        deezer_id: artist.deezer_id,
        image_url: artist.image_url,
        selected: !!userArtist
      }
    }) || []

    // Calculer les statistiques avec les artistes spécifiques à l'utilisateur
    const totalUserArtists = userSpecificArtistIds.length
    const hasMore = totalUserArtists > offset + limit
    const selectedCount = artists.filter(a => a.selected).length

    console.log(`✅ Fetched ${artists?.length || 0} artists for user ${user.id} (page ${page})`)
    console.log(`📊 Total artistes utilisateur: ${totalUserArtists}, Sélectionnés: ${selectedCount}`)
    
    return NextResponse.json({
      success: true,
      data: {
        artists: artists || [],
        pagination: {
          page,
          limit,
          total: totalUserArtists,
          hasMore
        },
        stats: {
          total_artists: totalUserArtists,
          selected_artists: selectedCount,
          displayed_artists: artists?.length || 0
        }
      }
    })
  } catch (error: any) {
    console.error('❌ Error in GET /api/user/artists:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}


