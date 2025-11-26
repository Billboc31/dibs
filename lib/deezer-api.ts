import { supabase } from './supabase'

// Deezer API Configuration
const DEEZER_CLIENT_ID = process.env.NEXT_PUBLIC_DEEZER_CLIENT_ID || ''
const DEEZER_REDIRECT_URI = typeof window !== 'undefined' 
  ? `${window.location.origin}/api/auth/deezer/callback`
  : ''

// Types
export type DeezerUser = {
  id: number
  name: string
  email: string
  country: string
  picture_medium: string
}

export type DeezerArtist = {
  id: number
  name: string
  picture_medium: string
  nb_fan: number
}

export type DeezerTrack = {
  id: number
  title: string
  duration: number
  artist: {
    id: number
    name: string
  }
  album: {
    id: number
    title: string
    cover_medium: string
  }
}

// ============================================
// OAUTH FLOW
// ============================================

/**
 * Step 1: Redirect user to Deezer authorization page
 */
export function redirectToDeezerAuth() {
  const permissions = [
    'basic_access',
    'email',
    'listening_history',
  ].join(',')

  const authUrl = new URL('https://connect.deezer.com/oauth/auth.php')
  authUrl.searchParams.set('app_id', DEEZER_CLIENT_ID)
  authUrl.searchParams.set('redirect_uri', DEEZER_REDIRECT_URI)
  authUrl.searchParams.set('perms', permissions)

  window.location.href = authUrl.toString()
}

/**
 * Step 2: Exchange code for access token
 * This should be called in the callback page
 */
export async function getDeezerAccessToken(code: string): Promise<string | null> {
  try {
    const tokenUrl = new URL('https://connect.deezer.com/oauth/access_token.php')
    tokenUrl.searchParams.set('app_id', DEEZER_CLIENT_ID)
    tokenUrl.searchParams.set('secret', process.env.DEEZER_SECRET_KEY || '')
    tokenUrl.searchParams.set('code', code)
    tokenUrl.searchParams.set('output', 'json')

    const response = await fetch(tokenUrl.toString())
    const data = await response.json()

    if (data.access_token) {
      return data.access_token
    }

    console.error('❌ Deezer token error:', data)
    return null
  } catch (error) {
    console.error('❌ Error getting Deezer token:', error)
    return null
  }
}

/**
 * Save Deezer connection to database
 */
export async function saveDeezerConnection(accessToken: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get Deezer platform ID
    const { data: platform } = await supabase
      .from('streaming_platforms')
      .select('id')
      .eq('slug', 'deezer')
      .single()

    if (!platform) throw new Error('Deezer platform not found')

    // Get Deezer user info
    const deezerUser = await getDeezerUserInfo(accessToken)
    if (!deezerUser) throw new Error('Failed to get Deezer user info')

    // Save to database
    const { error } = await supabase
      .from('user_streaming_platforms')
      .upsert({
        user_id: user.id,
        platform_id: platform.id,
        platform_user_id: deezerUser.id.toString(),
        access_token: accessToken,
        connected_at: new Date().toISOString(),
        last_sync_at: new Date().toISOString(),
      }, { onConflict: 'user_id,platform_id' })

    if (error) throw error

    console.log('✅ Deezer connection saved')
    return true
  } catch (error) {
    console.error('❌ Error saving Deezer connection:', error)
    return false
  }
}

// ============================================
// API CALLS
// ============================================

/**
 * Get stored Deezer access token
 */
async function getDeezerToken(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
      .from('user_streaming_platforms')
      .select('access_token, streaming_platforms!inner(slug)')
      .eq('user_id', user.id)
      .eq('streaming_platforms.slug', 'deezer')
      .single()

    return data?.access_token || null
  } catch (error) {
    console.error('❌ Error getting Deezer token:', error)
    return null
  }
}

/**
 * Get current user's Deezer profile
 */
export async function getDeezerUserInfo(accessToken?: string): Promise<DeezerUser | null> {
  const token = accessToken || await getDeezerToken()
  if (!token) return null

  try {
    const response = await fetch(
      `https://api.deezer.com/user/me?access_token=${token}`
    )

    if (!response.ok) {
      throw new Error(`Deezer API error: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('❌ Error fetching Deezer user:', error)
    return null
  }
}

/**
 * Get user's favorite artists
 */
export async function getDeezerFavoriteArtists(limit: number = 50): Promise<DeezerArtist[]> {
  const token = await getDeezerToken()
  if (!token) return []

  try {
    const response = await fetch(
      `https://api.deezer.com/user/me/artists?access_token=${token}&limit=${limit}`
    )

    if (!response.ok) {
      throw new Error(`Deezer API error: ${response.status}`)
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('❌ Error fetching Deezer artists:', error)
    return []
  }
}

/**
 * Get user's listening history
 */
export async function getDeezerListeningHistory(limit: number = 50): Promise<DeezerTrack[]> {
  const token = await getDeezerToken()
  if (!token) return []

  try {
    const response = await fetch(
      `https://api.deezer.com/user/me/history?access_token=${token}&limit=${limit}`
    )

    if (!response.ok) {
      throw new Error(`Deezer API error: ${response.status}`)
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('❌ Error fetching Deezer history:', error)
    return []
  }
}

/**
 * Get user's flow (personalized tracks)
 */
export async function getDeezerFlow(limit: number = 50): Promise<DeezerTrack[]> {
  const token = await getDeezerToken()
  if (!token) return []

  try {
    const response = await fetch(
      `https://api.deezer.com/user/me/flow?access_token=${token}&limit=${limit}`
    )

    if (!response.ok) {
      throw new Error(`Deezer API error: ${response.status}`)
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('❌ Error fetching Deezer flow:', error)
    return []
  }
}

/**
 * Calculate listening time by artist from history
 */
export async function getDeezerListeningTimeByArtist(): Promise<Map<number, number>> {
  const history = await getDeezerListeningHistory(200)
  const artistPlayTime = new Map<number, number>()

  history.forEach(track => {
    const artistId = track.artist.id
    const currentTime = artistPlayTime.get(artistId) || 0
    // Add track duration (in seconds, convert to minutes)
    artistPlayTime.set(artistId, currentTime + (track.duration / 60))
  })

  return artistPlayTime
}

/**
 * Sync user's Deezer data to database
 */
export async function syncDeezerData(userId: string): Promise<{ synced: number }> {
  console.log('🔄 Synchronisation Deezer pour', userId)

  try {
    const token = await getDeezerToken()
    if (!token) {
      throw new Error('Deezer not connected')
    }

    // Get favorite artists
    const artists = await getDeezerFavoriteArtists(50)
    
    // Get listening time per artist
    const listeningTime = await getDeezerListeningTimeByArtist()

    let syncedCount = 0

    for (const artist of artists) {
      // Upsert artist in database
      const { data: dbArtist } = await supabase
        .from('artists')
        .upsert({
          name: artist.name,
          deezer_id: artist.id.toString(),
          image_url: artist.picture_medium,
        }, { 
          onConflict: 'deezer_id',
          ignoreDuplicates: false 
        })
        .select()
        .single()

      if (!dbArtist) continue

      // Calculate points (listening time * 2)
      const minutes = listeningTime.get(artist.id) || 0
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

      syncedCount++
    }

    // Update last sync time
    const { data: platform } = await supabase
      .from('streaming_platforms')
      .select('id')
      .eq('slug', 'deezer')
      .single()

    if (platform) {
      await supabase
        .from('user_streaming_platforms')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('platform_id', platform.id)
    }

    console.log(`✅ ${syncedCount} artistes Deezer synchronisés`)
    return { synced: syncedCount }
  } catch (error) {
    console.error('❌ Erreur synchronisation Deezer:', error)
    throw error
  }
}

/**
 * Check if user has Deezer connected
 */
export async function isDeezerConnected(): Promise<boolean> {
  const token = await getDeezerToken()
  return token !== null
}

/**
 * Disconnect Deezer
 */
export async function disconnectDeezer(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data: platform } = await supabase
      .from('streaming_platforms')
      .select('id')
      .eq('slug', 'deezer')
      .single()

    if (!platform) return false

    const { error } = await supabase
      .from('user_streaming_platforms')
      .delete()
      .eq('user_id', user.id)
      .eq('platform_id', platform.id)

    if (error) throw error

    console.log('✅ Deezer disconnected')
    return true
  } catch (error) {
    console.error('❌ Error disconnecting Deezer:', error)
    return false
  }
}



