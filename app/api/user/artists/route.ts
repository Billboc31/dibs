import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { refreshSpotifyToken, disconnectRevokedSpotifyUser } from '@/lib/spotify-api'
import { artistsCache } from '@/lib/artists-cache'

// Force dynamic rendering pour éviter les erreurs de build Vercel
export const dynamic = 'force-dynamic'

// Helper function pour calculer le score de fanitude à la volée (sans stocker)
async function calculateLiveFanitudeScore(artistSpotifyId: string, accessToken: string, refreshToken?: string, userId?: string): Promise<number> {
  try {
    let totalMinutes = 0

    // 1. Vérifier si l'artiste est dans les top artists
    const timeRanges = ['short_term', 'medium_term', 'long_term']
    for (const timeRange of timeRanges) {
      try {
        const topResponse = await fetch(
          `https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}&limit=50`,
          { headers: { 'Authorization': `Bearer ${accessToken}` } }
        )
        
        // Gérer les erreurs 401 (token expiré)
        if (topResponse.status === 401) {
          throw new Error('TOKEN_EXPIRED')
        }
        
        if (topResponse.ok) {
          const topData = await topResponse.json()
          const artistPosition = topData.items?.findIndex((a: any) => a.id === artistSpotifyId)
          
          if (artistPosition !== -1) {
            // Plus l'artiste est haut dans le top, plus il a de points
            // Position 0 = 50 points, Position 49 = 1 point
            const positionBonus = Math.max(50 - artistPosition, 1)
            totalMinutes += positionBonus * 10 // 10 minutes par point de position
          }
        }
      } catch (error) {
        console.log(`⚠️ Erreur top artists ${timeRange}:`, error)
      }
    }

    // 2. Vérifier les pistes récemment jouées
      try {
        const recentResponse = await fetch(
          'https://api.spotify.com/v1/me/player/recently-played?limit=50',
          { headers: { 'Authorization': `Bearer ${accessToken}` } }
        )
        
        if (recentResponse.status === 401) {
          throw new Error('TOKEN_EXPIRED')
        }
        
        if (recentResponse.ok) {
        const recentData = await recentResponse.json()
        const artistTracks = recentData.items?.filter((item: any) => 
          item.track?.artists?.some((artist: any) => artist.id === artistSpotifyId)
        ) || []
        
        // Chaque écoute récente = 3 minutes
        totalMinutes += artistTracks.length * 3
      }
    } catch (error) {
      console.log('⚠️ Erreur recently played:', error)
    }

    // 3. Vérifier si l'artiste est suivi
      try {
        const followResponse = await fetch(
          `https://api.spotify.com/v1/me/following/contains?type=artist&ids=${artistSpotifyId}`,
          { headers: { 'Authorization': `Bearer ${accessToken}` } }
        )
        
        if (followResponse.status === 401) {
          throw new Error('TOKEN_EXPIRED')
        }
        
        if (followResponse.ok) {
        const followData = await followResponse.json()
        if (followData[0] === true) {
          totalMinutes += 20 // Bonus de 20 minutes pour les artistes suivis
        }
      }
    } catch (error) {
      console.log('⚠️ Erreur follow check:', error)
    }

    return totalMinutes
  } catch (error: any) {
    // Gérer les tokens expirés avec refresh automatique
    if (error.message === 'TOKEN_EXPIRED' && refreshToken && userId) {
      console.log(`🔄 Token expiré pour calcul fanitude ${artistSpotifyId}, refresh en cours...`)
      
      try {
        const newAccessToken = await refreshSpotifyToken(refreshToken)
        if (!newAccessToken) {
          throw new Error('Failed to refresh Spotify token')
        }
        
        // Mettre à jour le token dans la base
        await supabaseAdmin
          .from('user_streaming_platforms')
          .update({ access_token: newAccessToken })
          .eq('user_id', userId)
          .eq('platform_id', (await supabaseAdmin
            .from('streaming_platforms')
            .select('id')
            .eq('slug', 'spotify')
            .single()
          ).data?.id)
        
        console.log('✅ Token refreshé, nouveau calcul fanitude...')
        
        // Retry avec le nouveau token (sans refresh pour éviter la récursion)
        return await calculateLiveFanitudeScore(artistSpotifyId, newAccessToken)
      } catch (refreshError: any) {
        if (refreshError.message === 'SPOTIFY_TOKEN_REVOKED') {
          console.log('🚨 Token Spotify révoqué pendant calcul fanitude')
          await disconnectRevokedSpotifyUser(userId)
          throw new Error('SPOTIFY_TOKEN_REVOKED')
        }
        throw refreshError
      }
    }
    
    console.log(`⚠️ Erreur calcul fanitude pour ${artistSpotifyId}:`, error)
    return 0
  }
}

// Helper function to make Spotify API calls with automatic token refresh
async function fetchSpotifyWithRefresh(url: string, accessToken: string, refreshToken: string, userId: string): Promise<any> {
  const makeRequest = async (token: string) => {
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    if (response.status === 401) {
      // Token expired, need to refresh
      throw new Error('TOKEN_EXPIRED')
    }
    
    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`)
    }
    
    return response.json()
  }

  try {
    // Try with current token
    return await makeRequest(accessToken)
  } catch (error: any) {
    if (error.message === 'TOKEN_EXPIRED') {
      console.log('🔄 Token Spotify expiré, refresh en cours...')
      
      try {
        // Refresh the token
        const newAccessToken = await refreshSpotifyToken(refreshToken)
        if (!newAccessToken) {
          throw new Error('Failed to refresh Spotify token')
        }
        
        // Update token in database
        await supabaseAdmin
          .from('user_streaming_platforms')
          .update({ access_token: newAccessToken })
          .eq('user_id', userId)
          .eq('platform_id', (await supabaseAdmin
            .from('streaming_platforms')
            .select('id')
            .eq('slug', 'spotify')
            .single()
          ).data?.id)
        
        console.log('✅ Token Spotify refreshé avec succès')
        
        // Retry with new token
        return await makeRequest(newAccessToken)
      } catch (refreshError: any) {
        if (refreshError.message === 'SPOTIFY_TOKEN_REVOKED') {
          console.log('🚨 Token Spotify révoqué, nettoyage en cours...')
          await disconnectRevokedSpotifyUser(userId)
          throw new Error('SPOTIFY_TOKEN_REVOKED')
        }
        throw refreshError
      }
    }
    throw error
  }
}

// GET /api/user/artists - Liste des artistes suivis (paginée)
export async function GET(request: NextRequest) {
  // Déclarer les variables au niveau supérieur pour les utiliser dans catch
  let user: any = null
  let page = 0
  let limit = 10
  
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Authorization header required' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !authUser) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    user = authUser

    // Récupérer les paramètres de pagination
    const { searchParams } = new URL(request.url)
    page = parseInt(searchParams.get('page') || '0')
    limit = parseInt(searchParams.get('limit') || '10')
    const offset = page * limit

    console.log(`🔍 Recherche artistes pour user: ${user.id}`)

    // Vérifier le cache d'abord
    const cachedResult = artistsCache.get(user.id, page, limit)
    if (cachedResult) {
      // Si le cache est frais, le retourner directement
      if (!cachedResult.isStale) {
        console.log('⚡ Cache frais utilisé')
        return NextResponse.json({
          success: true,
          data: {
            ...cachedResult.data,
            cached: true,
            cache_status: 'fresh'
          }
        })
      }
      
      // Si le cache est périmé, on tente de le rafraîchir
      // Mais on garde le cache périmé en fallback si le refresh échoue
      console.log('⚠️ Cache périmé détecté, tentative de rafraîchissement...')
    }

    // Récupérer l'ancien cache complet pour préserver les scores en cas d'erreur
    const oldCachedData = artistsCache.getFullCache(user.id)
    const oldScoresMap = new Map<string, number>()
    
    if (oldCachedData && oldCachedData.artists) {
      oldCachedData.artists.forEach((artist: any) => {
        if (artist.id && artist.fanitude_score !== undefined) {
          oldScoresMap.set(artist.id, artist.fanitude_score)
        }
      })
      console.log(`📦 Anciens scores récupérés du cache: ${oldScoresMap.size} artistes`)
    }

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
          .select('access_token, refresh_token')
          .eq('user_id', user.id)
          .eq('platform_id', connectedPlatforms.find(p => (p.streaming_platforms as any).slug === 'spotify')?.platform_id)
          .single()

        if (!connection?.access_token || !connection?.refresh_token) {
          console.log('⚠️ Pas de token Spotify pour cet utilisateur')
        } else {
          // Récupérer les artistes depuis l'API Spotify avec gestion du refresh
          console.log(`🔑 Récupération des artistes Spotify...`)
          
          // Récupérer plus d'artistes avec différentes périodes
          const [topArtistsShort, topArtistsMedium, topArtistsLong, followedArtists, recentTracks] = await Promise.all([
            // Top artists court terme (4 semaines)
            fetchSpotifyWithRefresh(
              'https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=50',
              connection.access_token,
              connection.refresh_token,
              user.id
            ).then(data => data.items || []).catch(err => {
              console.log(`❌ Erreur top artists short:`, err.message)
              return []
            }),
            
            // Top artists moyen terme (6 mois)
            fetchSpotifyWithRefresh(
              'https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=50',
              connection.access_token,
              connection.refresh_token,
              user.id
            ).then(data => data.items || []).catch(err => {
              console.log(`❌ Erreur top artists medium:`, err.message)
              return []
            }),
            
            // Top artists long terme (plusieurs années)
            fetchSpotifyWithRefresh(
              'https://api.spotify.com/v1/me/top/artists?time_range=long_term&limit=50',
              connection.access_token,
              connection.refresh_token,
              user.id
            ).then(data => data.items || []).catch(err => {
              console.log(`❌ Erreur top artists long:`, err.message)
              return []
            }),
            
            // Artistes suivis
            fetchSpotifyWithRefresh(
              'https://api.spotify.com/v1/me/following?type=artist&limit=50',
              connection.access_token,
              connection.refresh_token,
              user.id
            ).then(data => data.artists?.items || []).catch(err => {
              console.log(`❌ Erreur followed artists:`, err.message)
              return []
            }),
            
            // Pistes récemment jouées
            fetchSpotifyWithRefresh(
              'https://api.spotify.com/v1/me/player/recently-played?limit=50',
              connection.access_token,
              connection.refresh_token,
              user.id
            ).then(data => data.items || []).catch(err => {
              console.log(`❌ Erreur recent tracks:`, err.message)
              return []
            })
          ])

          // Combiner tous les top artists
          const topArtists = [...topArtistsShort, ...topArtistsMedium, ...topArtistsLong]

          // Logs détaillés pour chaque source
          console.log(`📊 Résultats Spotify API:`)
          console.log(`   🎯 Top artists short (4 semaines): ${Array.isArray(topArtistsShort) ? topArtistsShort.length : 0}`)
          console.log(`   🎯 Top artists medium (6 mois): ${Array.isArray(topArtistsMedium) ? topArtistsMedium.length : 0}`)
          console.log(`   🎯 Top artists long (années): ${Array.isArray(topArtistsLong) ? topArtistsLong.length : 0}`)
          console.log(`   🎯 Total top artists: ${Array.isArray(topArtists) ? topArtists.length : 0}`)
          console.log(`   👥 Followed artists: ${Array.isArray(followedArtists) ? followedArtists.length : 0}`)
          console.log(`   🎧 Recent tracks: ${Array.isArray(recentTracks) ? recentTracks.length : 0}`)

          // Combiner tous les artistes et dédupliquer avec vérifications de sécurité
          const artistsMap = new Map()
          
          // Ajouter top artists (vérification de sécurité)
          let topArtistsCount = 0
          if (Array.isArray(topArtists)) {
            topArtists.forEach(artist => {
              if (artist && artist.id) {
                artistsMap.set(artist.id, artist)
                topArtistsCount++
              }
            })
          }
          
          // Ajouter followed artists (vérification de sécurité)
          let followedArtistsCount = 0
          if (Array.isArray(followedArtists)) {
            followedArtists.forEach(artist => {
              if (artist && artist.id) {
                if (!artistsMap.has(artist.id)) {
                  followedArtistsCount++
                }
                artistsMap.set(artist.id, artist)
              }
            })
          }
          
          // Ajouter artistes des pistes récentes (vérification de sécurité)
          let recentArtistsCount = 0
          if (Array.isArray(recentTracks)) {
            recentTracks.forEach(track => {
              if (track && Array.isArray(track.artists)) {
                track.artists.forEach(artist => {
                  if (artist && artist.id && !artistsMap.has(artist.id)) {
                    artistsMap.set(artist.id, artist)
                    recentArtistsCount++
                  }
                })
              }
            })
          }

          console.log(`🔄 Artistes uniques ajoutés:`)
          console.log(`   🎯 Depuis top artists: ${topArtistsCount}`)
          console.log(`   👥 Depuis followed artists: ${followedArtistsCount}`)
          console.log(`   🎧 Depuis recent tracks: ${recentArtistsCount}`)

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

    // Nettoyer user_artists : supprimer les artistes qui ne sont plus dans Spotify
    try {
      // Récupérer les artistes actuellement sélectionnés par l'utilisateur
      const { data: selectedUserArtists } = await supabaseAdmin
        .from('user_artists')
        .select('artist_id, artists!inner(id, name, spotify_id)')
        .eq('user_id', user.id)
      
      if (selectedUserArtists && selectedUserArtists.length > 0) {
        // Créer un Set des IDs d'artistes encore dans Spotify
        const spotifyArtistIdsSet = new Set(userSpecificArtistIds)
        
        // Trouver les artistes à supprimer (ceux dans user_artists mais plus dans Spotify)
        const artistsToRemove = selectedUserArtists.filter(ua => 
          !spotifyArtistIdsSet.has(ua.artist_id)
        )
        
        if (artistsToRemove.length > 0) {
          console.log(`🧹 Nettoyage: ${artistsToRemove.length} artistes ne sont plus dans votre écoute Spotify`)
          
          // Supprimer ces artistes de user_artists
          const artistIdsToRemove = artistsToRemove.map(ua => ua.artist_id)
          const { error: deleteError } = await supabaseAdmin
            .from('user_artists')
            .delete()
            .eq('user_id', user.id)
            .in('artist_id', artistIdsToRemove)
          
          if (deleteError) {
            console.error('❌ Erreur lors du nettoyage des artistes:', deleteError)
          } else {
            console.log(`✅ ${artistsToRemove.length} artistes supprimés: ${artistsToRemove.map((ua: any) => ua.artists.name).join(', ')}`)
          }
        } else {
          console.log('✅ Tous les artistes sélectionnés sont encore dans votre écoute Spotify')
        }
      }
    } catch (cleanupError) {
      console.error('⚠️ Erreur lors du nettoyage (non bloquant):', cleanupError)
    }

    if (userSpecificArtistIds.length === 0) {
      console.log('❌ Aucun artiste trouvé pour cet utilisateur')
      
      // Si on a un cache périmé, l'utiliser en fallback
      const cachedFallback = artistsCache.get(user.id, page, limit)
      if (cachedFallback) {
        console.log('🛡️ Utilisation du cache périmé comme fallback (Spotify inaccessible)')
        artistsCache.markAsStale(user.id)
        
        return NextResponse.json({
          success: true,
          data: {
            ...cachedFallback.data,
            cached: true,
            cache_status: 'fallback_spotify_error',
            warning: 'Données du cache utilisées. Spotify temporairement inaccessible.'
          }
        })
      }
      
      // Pas de cache disponible, retourner l'erreur
      return NextResponse.json({
        success: false,
        error: 'Impossible de récupérer les artistes Spotify. Vérifiez votre connexion Spotify ou réessayez plus tard.'
      }, { status: 400 })
    }

    // Récupérer TOUS les artistes de l'utilisateur (sans pagination d'abord)
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

    // Combiner les données : tous les artistes + flag de sélection + anciens scores
    let artists = allArtists?.map(artist => {
      const userArtist = selectedArtistsMap.get(artist.id)
      const oldScore = oldScoresMap.get(artist.id) || 0 // Récupérer l'ancien score du cache
      return {
        id: artist.id,
        name: artist.name,
        spotify_id: artist.spotify_id,
        apple_music_id: artist.apple_music_id,
        deezer_id: artist.deezer_id,
        image_url: artist.image_url,
        selected: !!userArtist,
        live_fanitude_score: oldScore // Initialiser avec l'ancien score, sera recalculé si possible
      }
    }) || []

    // Récupérer la connexion Spotify pour le calcul des scores
    const spotifyConnection = connectedPlatforms?.find(p => (p.streaming_platforms as any).slug === 'spotify')
    
    // Calculer les scores de fanitude à la volée pour le tri (si connexion Spotify)
    if (spotifyConnection && artists.length > 0) {
      console.log('🔄 Calcul des scores de fanitude à la volée pour le tri...')
      
      try {
        const artistsWithScores = await Promise.all(
          artists.map(async (artist) => {
            if (artist.spotify_id) {
              try {
                const score = await calculateLiveFanitudeScore(
                  artist.spotify_id, 
                  spotifyConnection.access_token, 
                  spotifyConnection.refresh_token, 
                  user.id
                )
                return { ...artist, live_fanitude_score: score }
              } catch (error) {
                console.log(`⚠️ Erreur calcul score pour ${artist.name}:`, error)
                return artist
              }
            }
            return artist
          })
        )

        // Trier par score de fanitude décroissant (les plus écoutés en premier)
        artists = artistsWithScores.sort((a, b) => b.live_fanitude_score - a.live_fanitude_score)
        
        console.log(`✅ Scores calculés et triés (top 3: ${artists.slice(0, 3).map(a => `${a.name}:${a.live_fanitude_score}`).join(', ')})`)
      } catch (error: any) {
        console.log('⚠️ Erreur lors du calcul des scores de fanitude:', error)
        
        // Si c'est une révocation, on propage l'erreur
        if (error.message === 'SPOTIFY_TOKEN_REVOKED') {
          throw error
        }
        
        // Sinon, on continue avec le tri par fanitude (même avec des scores à 0)
        console.log('📝 Fallback: tri par score de fanitude (scores potentiellement à 0)')
        artists = artists.sort((a, b) => (b.live_fanitude_score || 0) - (a.live_fanitude_score || 0))
      }
    }

    // Préparer TOUS les artistes avec leurs scores pour le cache
    const finalArtists = artists.map(({ live_fanitude_score, ...artist }) => ({
      ...artist,
      fanitude_score: live_fanitude_score || 0 // Score calculé en temps réel
    }))

    console.log(`✅ Calculé ${finalArtists.length} artistes pour user ${user.id}`)
    
    // Mettre en cache TOUS les artistes triés
    artistsCache.set(user.id, finalArtists)
    
    // Récupérer les données paginées depuis le cache (qui vient d'être mis à jour)
    const cachedPaginatedResult = artistsCache.get(user.id, page, limit)
    
    if (!cachedPaginatedResult) {
      throw new Error('Erreur interne: impossible de récupérer les données du cache')
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...cachedPaginatedResult.data,
        cached: false,
        cache_status: 'fresh'
      }
    })
  } catch (error: any) {
    console.error('❌ Error in GET /api/user/artists:', error)
    
    // Essayer de récupérer les données du cache comme fallback (en cas d'erreur Spotify)
    const cachedFallback = artistsCache.get(user.id, page, limit)
    
    if (cachedFallback) {
      console.log('🛡️ Erreur lors du refresh, utilisation du cache comme fallback')
      
      // Marquer le cache comme périmé pour les prochains appels
      artistsCache.markAsStale(user.id)
      
      // Déterminer le message approprié selon le type d'erreur
      const isRevoked = error.message === 'SPOTIFY_TOKEN_REVOKED'
      
      return NextResponse.json({
        success: true,
        data: {
          ...cachedFallback.data,
          cached: true,
          cache_status: isRevoked ? 'fallback_revoked' : 'fallback_error',
          warning: isRevoked 
            ? 'Données du cache utilisées. Reconnectez-vous à Spotify pour des données fraîches.'
            : 'Données du cache utilisées. Spotify temporairement inaccessible.'
        }
      })
    }
    
    // Pas de cache disponible, retourner l'erreur appropriée
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


