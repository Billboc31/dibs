import { supabase, supabaseAdmin } from './supabase'

// Spotify API Configuration
const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || ''
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || ''
const SPOTIFY_REDIRECT_URI = typeof window !== 'undefined' 
  ? `${window.location.origin}/api/auth/spotify/callback`
  : process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:3001/api/auth/spotify/callback'

// Types
export type SpotifyUser = {
  id: string
  display_name: string
  email: string
  country: string
  images: Array<{ url: string }>
}

export type SpotifyArtist = {
  id: string
  name: string
  images: Array<{ url: string }>
  followers: { total: number }
  genres: string[]
}

export type SpotifyTrack = {
  id: string
  name: string
  duration_ms: number
  artists: Array<{ id: string; name: string }>
  album: {
    id: string
    name: string
    images: Array<{ url: string }>
  }
  played_at?: string
}

// ============================================
// OAUTH FLOW (avec PKCE)
// ============================================

/**
 * Generate PKCE code verifier and challenge
 */
function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return base64URLEncode(array)
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return base64URLEncode(new Uint8Array(hash))
}

function base64URLEncode(array: Uint8Array): string {
  // Convert Uint8Array to string safely
  let binary = ''
  for (let i = 0; i < array.length; i++) {
    binary += String.fromCharCode(array[i])
  }
  
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * Step 1: Redirect user to Spotify authorization page
 */
export async function redirectToSpotifyAuth() {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User must be authenticated')
  }

  // Generate PKCE codes
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)
  
  console.log('🔐 PKCE Generation:')
  console.log('  - Code Verifier length:', codeVerifier.length)
  console.log('  - Code Verifier preview:', codeVerifier.substring(0, 20) + '...')
  console.log('  - Code Challenge:', codeChallenge)

  // Encode user_id and code_verifier in state
  const stateData = {
    codeVerifier,
    userId: user.id
  }
  const state = btoa(JSON.stringify(stateData))
  
  console.log('📦 State encoding:')
  console.log('  - State data:', stateData)
  console.log('  - State encoded length:', state.length)

  const scopes = [
    'user-read-email',
    'user-read-private',
    'user-top-read',
    'user-read-recently-played',
    'user-follow-read',
  ].join(' ')

  const authUrl = new URL('https://accounts.spotify.com/authorize')
  authUrl.searchParams.set('client_id', SPOTIFY_CLIENT_ID)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('redirect_uri', SPOTIFY_REDIRECT_URI)
  authUrl.searchParams.set('scope', scopes)
  authUrl.searchParams.set('code_challenge_method', 'S256')
  authUrl.searchParams.set('code_challenge', codeChallenge)
  authUrl.searchParams.set('state', state)

  window.location.href = authUrl.toString()
}

/**
 * Step 2: Exchange code for access token
 */
export async function getSpotifyAccessToken(code: string, codeVerifier: string): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    console.log('🔄 Token exchange request:')
    console.log('  - Code length:', code.length)
    console.log('  - Code Verifier length:', codeVerifier.length)
    console.log('  - Code Verifier preview:', codeVerifier.substring(0, 20) + '...')
    console.log('  - Redirect URI:', SPOTIFY_REDIRECT_URI)
    
    const requestBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: SPOTIFY_REDIRECT_URI,
      client_id: SPOTIFY_CLIENT_ID,
      code_verifier: codeVerifier,
    })
    
    console.log('📤 Request body:', requestBody.toString())
    
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: requestBody,
    })

    const data = await response.json()

    if (data.access_token) {
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      }
    }

    console.error('❌ Spotify token error:', data)
    return null
  } catch (error) {
    console.error('❌ Error getting Spotify token:', error)
    return null
  }
}

/**
 * Refresh access token
 */
export async function refreshSpotifyToken(refreshToken: string): Promise<string | null> {
  try {
    const credentials = btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    })

    const data = await response.json()

    if (data.access_token) {
      return data.access_token
    }

    console.error('❌ Spotify refresh error:', data)
    return null
  } catch (error) {
    console.error('❌ Error refreshing Spotify token:', error)
    return null
  }
}

/**
 * Save Spotify connection to database
 */
export async function saveSpotifyConnection(accessToken: string, refreshToken: string, userId: string) {
  try {
    // Get Spotify platform ID (using admin client to bypass RLS)
    const { data: platform } = await supabaseAdmin
      .from('streaming_platforms')
      .select('id')
      .eq('slug', 'spotify')
      .single()

    if (!platform) throw new Error('Spotify platform not found')

    // Test token validity first
    console.log('🔍 Testing access token before getting user info...')
    const isTokenValid = await testSpotifyToken(accessToken)
    if (!isTokenValid) {
      throw new Error('Invalid or expired Spotify access token')
    }

    // Get Spotify user info
    const spotifyUser = await getSpotifyUserInfo(accessToken)
    if (!spotifyUser) throw new Error('Failed to get Spotify user info')

    // Save to database (using admin client to bypass RLS)
    const { error } = await supabaseAdmin
      .from('user_streaming_platforms')
      .upsert({
        user_id: userId,
        platform_id: platform.id,
        platform_user_id: spotifyUser.id,
        access_token: accessToken,
        refresh_token: refreshToken,
        connected_at: new Date().toISOString(),
        last_sync_at: new Date().toISOString(),
      }, { onConflict: 'user_id,platform_id' })

    if (error) throw error

    console.log('✅ Spotify connection saved')
    return true
  } catch (error) {
    console.error('❌ Error saving Spotify connection:', error)
    return false
  }
}

// ============================================
// API CALLS
// ============================================

/**
 * Get stored Spotify access token
 */
async function getSpotifyToken(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
      .from('user_streaming_platforms')
      .select('access_token, refresh_token, streaming_platforms!inner(slug)')
      .eq('user_id', user.id)
      .eq('streaming_platforms.slug', 'spotify')
      .single()

    if (!data?.access_token) return null

    // Try to use the token, if it fails, refresh it
    const isValid = await testSpotifyToken(data.access_token)
    
    if (!isValid && data.refresh_token) {
      const newToken = await refreshSpotifyToken(data.refresh_token)
      if (newToken) {
        // Update token in database
        await supabase
          .from('user_streaming_platforms')
          .update({ access_token: newToken })
          .eq('user_id', user.id)
          .eq('streaming_platforms.slug', 'spotify')
        
        return newToken
      }
    }

    return data.access_token
  } catch (error) {
    console.error('❌ Error getting Spotify token:', error)
    return null
  }
}

/**
 * Test if token is valid
 */
async function testSpotifyToken(token: string): Promise<boolean> {
  try {
    console.log('🧪 Testing Spotify token validity...')
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    console.log('🧪 Token test result:', response.status, response.ok)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('🧪 Token test error:', errorText)
    }
    
    return response.ok
  } catch (error) {
    console.error('🧪 Token test exception:', error)
    return false
  }
}

/**
 * Get current user's Spotify profile
 */
export async function getSpotifyUserInfo(accessToken?: string): Promise<SpotifyUser | null> {
  const token = accessToken || await getSpotifyToken()
  if (!token) {
    console.error('❌ No Spotify token available')
    return null
  }

  try {
    console.log('🔍 Calling Spotify /me API...')
    console.log('🔑 Token length:', token.length)
    console.log('🔑 Token preview:', token.substring(0, 20) + '...')
    
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    console.log('📡 Spotify /me response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Spotify /me error response:', errorText)
      
      // Handle development mode restriction
      if (response.status === 403 && errorText.includes('user may not be registered')) {
        console.error('🚨 SPOTIFY DEV MODE: User not in allowlist.')
        console.error('📋 SOLUTION: Go to https://developer.spotify.com/dashboard')
        console.error('👥 Add the user email to "Users and Access" section')
        throw new Error('Spotify app in development mode - user not authorized. Add user to developer dashboard.')
      }
      
      throw new Error(`Spotify API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('✅ Spotify user info retrieved:', data.id, data.email)
    return data
  } catch (error) {
    console.error('❌ Error fetching Spotify user:', error)
    return null
  }
}

/**
 * Get user's top artists
 */
export async function getSpotifyTopArtists(timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', limit: number = 50): Promise<SpotifyArtist[]> {
  const token = await getSpotifyToken()
  if (!token) return []

  try {
    const response = await fetch(
      `https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}&limit=${limit}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    )

    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`)
    }

    const data = await response.json()
    return data.items || []
  } catch (error) {
    console.error('❌ Error fetching Spotify top artists:', error)
    return []
  }
}

/**
 * Get user's followed artists
 */
export async function getSpotifyFollowedArtists(limit: number = 50): Promise<SpotifyArtist[]> {
  const token = await getSpotifyToken()
  if (!token) return []

  try {
    const response = await fetch(
      `https://api.spotify.com/v1/me/following?type=artist&limit=${limit}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    )

    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`)
    }

    const data = await response.json()
    return data.artists?.items || []
  } catch (error) {
    console.error('❌ Error fetching Spotify followed artists:', error)
    return []
  }
}

/**
 * Get user's recently played tracks
 */
export async function getSpotifyRecentlyPlayed(limit: number = 50): Promise<SpotifyTrack[]> {
  const token = await getSpotifyToken()
  if (!token) return []

  try {
    const response = await fetch(
      `https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    )

    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`)
    }

    const data = await response.json()
    return data.items?.map((item: any) => ({ ...item.track, played_at: item.played_at })) || []
  } catch (error) {
    console.error('❌ Error fetching Spotify recently played:', error)
    return []
  }
}

/**
 * Calculate listening time by artist from recent plays
 */
export async function getSpotifyListeningTimeByArtist(): Promise<Map<string, number>> {
  const recentTracks = await getSpotifyRecentlyPlayed(50)
  const artistPlayTime = new Map<string, number>()

  recentTracks.forEach(track => {
    track.artists.forEach(artist => {
      const currentTime = artistPlayTime.get(artist.id) || 0
      // Add track duration (in ms, convert to minutes)
      artistPlayTime.set(artist.id, currentTime + (track.duration_ms / 60000))
    })
  })

  return artistPlayTime
}

/**
 * Sync user's Spotify data to database
 */
export async function syncSpotifyData(userId: string, accessToken?: string): Promise<{ synced: number }> {
  console.log('🔄 Synchronisation Spotify pour', userId)

  try {
    // Get token from parameter or from database
    let token = accessToken
    if (!token) {
      // Get token from database using admin client
      const { data: connection } = await supabaseAdmin
        .from('user_streaming_platforms')
        .select('access_token, streaming_platforms!inner(slug)')
        .eq('user_id', userId)
        .eq('streaming_platforms.slug', 'spotify')
        .single()
      
      token = connection?.access_token
    }

    if (!token) {
      throw new Error('Spotify not connected')
    }

    // Get top artists (medium term = ~6 months) - call API directly with token
    const topArtists = await fetchSpotifyTopArtists(token, 'medium_term', 50)
    
    // Get followed artists
    const followedArtists = await fetchSpotifyFollowedArtists(token, 50)
    
    // Get recently played tracks
    const recentTracks = await fetchSpotifyRecentlyPlayed(token, 50)
    
    // Combine and deduplicate all artists
    const artistsMap = new Map<string, Partial<SpotifyArtist> & { id: string; name: string }>()
    
    // Add top artists (complete data)
    topArtists.forEach(artist => artistsMap.set(artist.id, artist))
    
    // Add followed artists (complete data)
    followedArtists.forEach(artist => artistsMap.set(artist.id, artist))
    
    // Add artists from recently played tracks (partial data)
    recentTracks.forEach(track => {
      track.artists.forEach(artist => {
        if (!artistsMap.has(artist.id)) {
          artistsMap.set(artist.id, artist as any)
        }
      })
    })
    
    const allArtists = Array.from(artistsMap.values())
    console.log(`📋 Total unique artists found: ${allArtists.length}`)
    
    // Calculate listening time per artist from recent plays
    const listeningTime = new Map<string, number>()
    recentTracks.forEach(track => {
      track.artists.forEach(artist => {
        const currentTime = listeningTime.get(artist.id) || 0
        listeningTime.set(artist.id, currentTime + (track.duration_ms / 60000))
      })
    })

    let syncedCount = 0

    for (const artist of allArtists) {
      // Skip artists without basic info
      if (!artist.id || !artist.name) {
        console.log('⚠️ Skipping artist without id or name:', artist)
        continue
      }

      // For artists from recently played, we might need to fetch full details
      let imageUrl = artist.images?.[0]?.url || null
      
      // If no image and we have an ID, fetch full artist details
      if (!imageUrl && artist.id) {
        try {
          const fullArtist = await fetchSpotifyArtistDetails(token, artist.id)
          imageUrl = fullArtist?.images?.[0]?.url || null
        } catch (error) {
          console.log(`⚠️ Could not fetch details for artist ${artist.name}`)
        }
      }

      // Upsert artist in database (using admin client)
      const { data: dbArtist, error: upsertError } = await supabaseAdmin
        .from('artists')
        .upsert({
          name: artist.name,
          spotify_id: artist.id,
          image_url: imageUrl,
        }, { 
          onConflict: 'spotify_id',
          ignoreDuplicates: false 
        })
        .select()
        .single()

      if (upsertError) {
        console.error(`❌ Error upserting artist ${artist.name}:`, upsertError)
        continue
      }

      if (!dbArtist) continue

      // Calculate points (listening time * 2)
      const minutes = listeningTime.get(artist.id) || 0
      const points = Math.floor(minutes * 2)

      // Update user_artists (using admin client)
      await supabaseAdmin
        .from('user_artists')
        .upsert({
          user_id: userId,
          artist_id: dbArtist.id,
          fanitude_points: points,
          last_listening_minutes: Math.floor(minutes),
          last_sync_at: new Date().toISOString(),
        }, { onConflict: 'user_id,artist_id' })

      syncedCount++
    }

    // Update last sync time (using admin client)
    const { data: platform } = await supabaseAdmin
      .from('streaming_platforms')
      .select('id')
      .eq('slug', 'spotify')
      .single()

    if (platform) {
      await supabaseAdmin
        .from('user_streaming_platforms')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('platform_id', platform.id)
    }

    console.log(`✅ ${syncedCount} artistes Spotify synchronisés`)
    return { synced: syncedCount }
  } catch (error) {
    console.error('❌ Erreur synchronisation Spotify:', error)
    throw error
  }
}

// Helper functions that take token as parameter
async function fetchSpotifyTopArtists(token: string, timeRange: 'short_term' | 'medium_term' | 'long_term', limit: number): Promise<SpotifyArtist[]> {
  try {
    console.log(`📊 Fetching top artists (${timeRange}, limit: ${limit})...`)
    const response = await fetch(
      `https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}&limit=${limit}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    )
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Spotify API error (${response.status}):`, errorText)
      
      // Handle development mode restriction for artist fetching
      if (response.status === 403 && errorText.includes('user may not be registered')) {
        console.error('🚨 SPOTIFY DEV MODE: User not authorized for top artists')
        return [] // Return empty array instead of throwing
      }
      
      throw new Error(`Spotify API error: ${response.status}`)
    }
    const data = await response.json()
    console.log(`✅ Top artists fetched: ${data.items?.length || 0} artistes`)
    if (data.items?.length > 0) {
      console.log(`   Top 3: ${data.items.slice(0, 3).map((a: any) => a.name).join(', ')}`)
    }
    return data.items || []
  } catch (error) {
    console.error('❌ Error fetching top artists:', error)
    return []
  }
}

async function fetchSpotifyFollowedArtists(token: string, limit: number): Promise<SpotifyArtist[]> {
  try {
    console.log(`👥 Fetching followed artists (limit: ${limit})...`)
    const response = await fetch(
      `https://api.spotify.com/v1/me/following?type=artist&limit=${limit}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    )
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Spotify API error (${response.status}):`, errorText)
      
      // Handle development mode restriction for artist fetching
      if (response.status === 403 && errorText.includes('user may not be registered')) {
        console.error('🚨 SPOTIFY DEV MODE: User not authorized for followed artists')
        return [] // Return empty array instead of throwing
      }
      
      throw new Error(`Spotify API error: ${response.status}`)
    }
    const data = await response.json()
    console.log(`✅ Followed artists fetched: ${data.artists?.items?.length || 0} artistes`)
    return data.artists?.items || []
  } catch (error) {
    console.error('❌ Error fetching followed artists:', error)
    return []
  }
}

async function fetchSpotifyRecentlyPlayed(token: string, limit: number): Promise<SpotifyTrack[]> {
  try {
    console.log(`🎵 Fetching recently played (limit: ${limit})...`)
    const response = await fetch(
      `https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    )
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Spotify API error (${response.status}):`, errorText)
      
      // Handle development mode restriction for artist fetching
      if (response.status === 403 && errorText.includes('user may not be registered')) {
        console.error('🚨 SPOTIFY DEV MODE: User not authorized for recently played')
        return [] // Return empty array instead of throwing
      }
      
      throw new Error(`Spotify API error: ${response.status}`)
    }
    const data = await response.json()
    console.log(`✅ Recently played fetched: ${data.items?.length || 0} tracks`)
    return data.items?.map((item: any) => ({ ...item.track, played_at: item.played_at })) || []
  } catch (error) {
    console.error('❌ Error fetching recently played:', error)
    return []
  }
}

async function fetchSpotifyArtistDetails(token: string, artistId: string): Promise<SpotifyArtist | null> {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    )
    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error(`❌ Error fetching artist details for ${artistId}:`, error)
    return null
  }
}

/**
 * Check if user has Spotify connected
 */
export async function isSpotifyConnected(): Promise<boolean> {
  const token = await getSpotifyToken()
  return token !== null
}

/**
 * Disconnect Spotify
 */
export async function disconnectSpotify(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data: platform } = await supabase
      .from('streaming_platforms')
      .select('id')
      .eq('slug', 'spotify')
      .single()

    if (!platform) return false

    const { error } = await supabase
      .from('user_streaming_platforms')
      .delete()
      .eq('user_id', user.id)
      .eq('platform_id', platform.id)

    if (error) throw error

    console.log('✅ Spotify disconnected')
    return true
  } catch (error) {
    console.error('❌ Error disconnecting Spotify:', error)
    return false
  }
}

