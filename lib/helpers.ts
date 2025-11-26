import { supabase } from './supabase'

/**
 * Get user's top artists by fanitude points
 */
export async function getUserTopArtists(userId: string, limit = 3) {
  const { data, error } = await supabase
    .from('user_artists')
    .select(`
      fanitude_points,
      last_listening_minutes,
      artists (*)
    `)
    .eq('user_id', userId)
    .order('fanitude_points', { ascending: false })
    .limit(limit)

  if (error) throw error

  return data?.map((ua: any) => ({
    ...ua.artists,
    fanitude_points: ua.fanitude_points,
    listening_minutes: ua.last_listening_minutes
  }))
}

/**
 * Calculate distance between two coordinates (in km)
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Format date for display
 */
export function formatDate(dateString: string, locale = 'fr-FR'): string {
  const date = new Date(dateString)
  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

/**
 * Format time for display
 */
export function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':')
  return `${hours}:${minutes}`
}

/**
 * Get nearby events based on user location
 */
export async function getNearbyEvents(
  userLat: number,
  userLng: number,
  maxDistance = 100 // km
) {
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .gte('event_date', new Date().toISOString())
    .order('event_date', { ascending: true })

  if (error) throw error

  // Filter by distance
  const nearbyEvents = events?.filter(event => {
    if (!event.location_lat || !event.location_lng) return false
    const distance = calculateDistance(
      userLat,
      userLng,
      event.location_lat,
      event.location_lng
    )
    return distance <= maxDistance
  })

  return nearbyEvents?.map(event => {
    const distance = calculateDistance(
      userLat,
      userLng,
      event.location_lat!,
      event.location_lng!
    )
    return {
      ...event,
      distance: Math.round(distance * 10) / 10 // Round to 1 decimal
    }
  })
}

/**
 * Check if user has already scanned a QR code
 */
export async function hasScannedQRCode(
  userId: string,
  qrCodeId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('qr_scans')
    .select('id')
    .eq('user_id', userId)
    .eq('qr_code_id', qrCodeId)
    .limit(1)

  if (error) throw error
  return (data?.length || 0) > 0
}

/**
 * Update user's fanitude points for an artist
 */
export async function updateFanitudePoints(
  userId: string,
  artistId: string,
  pointsToAdd: number
) {
  // Get current points
  const { data: userArtist, error: fetchError } = await supabase
    .from('user_artists')
    .select('fanitude_points')
    .eq('user_id', userId)
    .eq('artist_id', artistId)
    .single()

  if (fetchError) throw fetchError

  // Update points
  const newPoints = (userArtist?.fanitude_points || 0) + pointsToAdd

  const { error: updateError } = await supabase
    .from('user_artists')
    .update({ fanitude_points: newPoints })
    .eq('user_id', userId)
    .eq('artist_id', artistId)

  if (updateError) throw updateError

  return newPoints
}

/**
 * Get user's rank for an artist (mock for POC)
 */
export async function getUserRankForArtist(
  userId: string,
  artistId: string
): Promise<{ countryRank: number; worldRank: number; points: number }> {
  const { data, error } = await supabase
    .from('user_artists')
    .select('fanitude_points')
    .eq('user_id', userId)
    .eq('artist_id', artistId)
    .single()

  if (error) throw error

  // Mock ranks for POC
  const points = data?.fanitude_points || 0
  return {
    points,
    countryRank: Math.floor(Math.random() * 100000) + 1000,
    worldRank: Math.floor(Math.random() * 10000000) + 100000
  }
}

/**
 * Sync user's listening data from streaming platform (mock for POC)
 */
export async function syncStreamingData(userId: string, platformId: string) {
  // In production, this would call the streaming platform API
  // For POC, we just simulate data
  
  const { data: userArtists } = await supabase
    .from('user_artists')
    .select('id, artist_id, last_listening_minutes')
    .eq('user_id', userId)

  if (!userArtists) return

  // Mock: add random listening minutes and update points
  const updates = userArtists.map(ua => {
    const newMinutes = Math.floor(Math.random() * 120) // 0-120 new minutes
    const totalMinutes = ua.last_listening_minutes + newMinutes
    const newPoints = newMinutes * 2 // 1 minute = 2 points

    return supabase
      .from('user_artists')
      .update({
        last_listening_minutes: totalMinutes,
        fanitude_points: supabase.rpc('increment', { x: newPoints }),
        last_sync_at: new Date().toISOString()
      })
      .eq('id', ua.id)
  })

  await Promise.all(updates)
  
  return {
    synced: userArtists.length,
    timestamp: new Date().toISOString()
  }
}



