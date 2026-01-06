import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * Calcule la distance entre deux points GPS (en km)
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// GET /api/debug/notifications - Debug des notifications pour un user
export async function GET(request: NextRequest) {
  try {
    // Récupérer l'auth header pour identifier le user
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

    const debug: any = {
      user_id: user.id,
      user_email: user.email
    }

    // 1. Vérifier la localisation du user
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('location_city, location_country, location_lat, location_lng, notification_radius_km')
      .eq('id', user.id)
      .single()

    debug.location = userData || 'Pas de localisation'

    if (!userData || !userData.location_lat || !userData.location_lng) {
      return NextResponse.json({
        success: true,
        debug,
        problem: 'User n\'a pas de localisation définie'
      })
    }

    // 2. Vérifier les artistes suivis
    const { data: followedArtists } = await supabaseAdmin
      .from('user_artists')
      .select(`
        artist_id,
        artists (
          id,
          name
        )
      `)
      .eq('user_id', user.id)

    debug.followed_artists = followedArtists?.map((ua: any) => ({
      id: ua.artists.id,
      name: ua.artists.name
    })) || []

    if (!followedArtists || followedArtists.length === 0) {
      return NextResponse.json({
        success: true,
        debug,
        problem: 'User ne suit aucun artiste'
      })
    }

    const followedArtistIds = followedArtists.map((ua: any) => ua.artist_id)

    // 3. Vérifier les concerts en BDD pour ces artistes
    const { data: concerts } = await supabaseAdmin
      .from('concerts')
      .select('*')
      .in('artist_id', followedArtistIds)
      .gte('event_date', new Date().toISOString())
      .order('event_date', { ascending: true })

    debug.total_concerts_for_followed_artists = concerts?.length || 0

    if (!concerts || concerts.length === 0) {
      return NextResponse.json({
        success: true,
        debug,
        problem: 'Aucun concert trouvé pour les artistes suivis'
      })
    }

    // 4. Calculer les distances et voir lesquels sont dans le rayon
    const concertsWithDistance = concerts.map(concert => ({
      id: concert.id,
      event_name: concert.event_name,
      event_date: concert.event_date,
      venue_name: concert.venue_name,
      venue_city: concert.venue_city,
      venue_lat: concert.venue_lat,
      venue_lng: concert.venue_lng,
      distance_km: concert.venue_lat && concert.venue_lng 
        ? calculateDistance(
            userData.location_lat!,
            userData.location_lng!,
            concert.venue_lat,
            concert.venue_lng
          )
        : null
    })).sort((a, b) => (a.distance_km || 999999) - (b.distance_km || 999999))

    const radius = userData.notification_radius_km || 50
    const concertsInRadius = concertsWithDistance.filter(c => 
      c.distance_km !== null && c.distance_km <= radius
    )

    debug.concerts_analysis = {
      total_concerts: concerts.length,
      notification_radius_km: radius,
      concerts_in_radius: concertsInRadius.length,
      closest_concerts: concertsWithDistance.slice(0, 10) // 10 plus proches
    }

    // 5. Vérifier les notifications existantes
    const { data: existingNotifications } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'concert')

    debug.existing_notifications = existingNotifications?.length || 0

    return NextResponse.json({
      success: true,
      debug,
      summary: {
        has_location: true,
        followed_artists: followedArtists.length,
        total_concerts: concerts.length,
        concerts_in_radius: concertsInRadius.length,
        existing_notifications: existingNotifications?.length || 0,
        should_have_notifications: concertsInRadius.length > 0 
          ? `OUI (${concertsInRadius.length} concerts dans les ${radius} km)`
          : `NON (0 concerts dans les ${radius} km)`
      }
    })

  } catch (error: any) {
    console.error('❌ Error in debug notifications:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

