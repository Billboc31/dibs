import { supabase } from './supabase'

// Types
export type SpotifyTopArtist = {
  id: string
  name: string
  images: { url: string }[]
  genres: string[]
}

export type SpotifyRecentlyPlayed = {
  track: {
    id: string
    name: string
    artists: { id: string; name: string }[]
  }
  played_at: string
}

export type DeezerArtist = {
  id: string
  name: string
  picture_medium: string
}

// ============================================
// SPOTIFY API
// ============================================

/**
 * Get Spotify access token from Supabase session
 */
async function getSpotifyToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.provider_token) {
    console.error('❌ Pas de token Spotify')
    return null
  }
  
  return session.provider_token
}

/**
 * Get user's top artists from Spotify
 * https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks
 */
export async function getSpotifyTopArtists(
  timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term',
  limit: number = 20
): Promise<SpotifyTopArtist[]> {
  const token = await getSpotifyToken()
  if (!token) return []

  try {
    const response = await fetch(
      `https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`)
    }

    const data = await response.json()
    return data.items || []
  } catch (error) {
    console.error('❌ Erreur Spotify API:', error)
    return []
  }
}

/**
 * Get recently played tracks
 */
export async function getSpotifyRecentlyPlayed(limit: number = 50): Promise<SpotifyRecentlyPlayed[]> {
  const token = await getSpotifyToken()
  if (!token) return []

  try {
    const response = await fetch(
      `https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`)
    }

    const data = await response.json()
    return data.items || []
  } catch (error) {
    console.error('❌ Erreur Spotify API:', error)
    return []
  }
}

/**
 * Calculate listening time per artist from recently played
 */
export async function getSpotifyListeningTimeByArtist(): Promise<Map<string, number>> {
  const recentlyPlayed = await getSpotifyRecentlyPlayed()
  const artistPlayCount = new Map<string, number>()

  recentlyPlayed.forEach(item => {
    item.track.artists.forEach(artist => {
      const currentCount = artistPlayCount.get(artist.id) || 0
      // Assume average track = 3.5 minutes
      artistPlayCount.set(artist.id, currentCount + 3.5)
    })
  })

  return artistPlayCount
}

// ============================================
// DEEZER API
// ============================================

/**
 * Get Deezer access token from Supabase session
 */
async function getDeezerToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  
  // Pour Deezer, le token peut être stocké différemment
  // On le récupère depuis user_streaming_platforms
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: platforms } = await supabase
    .from('user_streaming_platforms')
    .select('access_token, platform_id, streaming_platforms(slug)')
    .eq('user_id', user.id)
    .eq('streaming_platforms.slug', 'deezer')
    .single()

  return platforms?.access_token || null
}

/**
 * Get user's favorite artists from Deezer
 * https://developers.deezer.com/api/user/artists
 */
export async function getDeezerFavoriteArtists(limit: number = 20): Promise<DeezerArtist[]> {
  const token = await getDeezerToken()
  if (!token) return []

  try {
    const response = await fetch(
      `https://api.deezer.com/user/me/artists?access_token=${token}&limit=${limit}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Deezer API error: ${response.status}`)
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('❌ Erreur Deezer API:', error)
    return []
  }
}

/**
 * Get user's listening history from Deezer
 */
export async function getDeezerListeningHistory(limit: number = 50): Promise<any[]> {
  const token = await getDeezerToken()
  if (!token) return []

  try {
    const response = await fetch(
      `https://api.deezer.com/user/me/history?access_token=${token}&limit=${limit}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Deezer API error: ${response.status}`)
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('❌ Erreur Deezer API:', error)
    return []
  }
}

// ============================================
// APPLE MUSIC API
// ============================================

/**
 * Apple Music utilise MusicKit.js côté client
 * Documentation: https://developer.apple.com/documentation/applemusicapi
 */
export async function getAppleMusicTopArtists(): Promise<any[]> {
  // Apple Music nécessite MusicKit.js
  // À implémenter avec le SDK Apple Music
  console.warn('⚠️ Apple Music API non implémentée (nécessite MusicKit.js)')
  return []
}

// ============================================
// SYNC HELPER - Pour mettre à jour les points
// ============================================

/**
 * Sync user's listening data from their connected platform
 */
export async function syncUserListeningData(userId: string, platform: 'spotify' | 'deezer' | 'apple_music') {
  console.log(`🔄 Synchronisation ${platform} pour l'utilisateur ${userId}`)

  try {
    let topArtists: any[] = []
    let listeningTime: Map<string, number> = new Map()

    // Get data from the appropriate platform
    if (platform === 'spotify') {
      topArtists = await getSpotifyTopArtists('medium_term', 50)
      listeningTime = await getSpotifyListeningTimeByArtist()
    } else if (platform === 'deezer') {
      topArtists = await getDeezerFavoriteArtists(50)
      // Deezer listening time calculation would go here
    } else if (platform === 'apple_music') {
      topArtists = await getAppleMusicTopArtists()
    }

    if (topArtists.length === 0) {
      console.warn('⚠️ Aucun artiste trouvé')
      return { synced: 0 }
    }

    // For each artist, update or create in database
    for (const artist of topArtists) {
      // Map platform-specific artist data
      const artistId = platform === 'spotify' ? artist.id : artist.id.toString()
      const artistName = artist.name
      const artistImage = platform === 'spotify' 
        ? artist.images[0]?.url 
        : artist.picture_medium

      // Upsert artist in database
      const { data: dbArtist } = await supabase
        .from('artists')
        .upsert({
          name: artistName,
          [`${platform}_id`]: artistId,
          image_url: artistImage,
        }, { 
          onConflict: `${platform}_id`,
          ignoreDuplicates: false 
        })
        .select()
        .single()

      if (!dbArtist) continue

      // Calculate points (listening time * 2)
      const minutes = listeningTime.get(artistId) || 0
      const points = Math.floor(minutes * 2)

      // Update user_artists
      await supabase
        .from('user_artists')
        .upsert({
          user_id: userId,
          artist_id: dbArtist.id,
          fanitude_points: points,
          last_listening_minutes: Math.floor(minutes),
          last_sync_at: new Date().toISOString(),
        }, { onConflict: 'user_id,artist_id' })
    }

    console.log(`✅ ${topArtists.length} artistes synchronisés`)
    return { synced: topArtists.length }

  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error)
    throw error
  }
}

/**
 * Estimate listening time from play count (approximation)
 */
export function estimateListeningTime(playCount: number, avgTrackLength: number = 3.5): number {
  return playCount * avgTrackLength
}



