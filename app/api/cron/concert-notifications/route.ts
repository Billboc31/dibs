import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { fetchArtistConcertsInFrance } from '@/lib/ticketmaster-api'

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

// GET /api/cron/concert-notifications - Job quotidien pour créer les notifications de concerts
// Architecture optimisée: 1 appel Ticketmaster par artiste (partagé entre tous les users)
export async function GET(request: NextRequest) {
  try {
    // Vérifier le secret CRON (sécurité)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('❌ Tentative d\'accès non autorisée au cron')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🚀 Démarrage du job de synchronisation concerts + notifications...')

    const startTime = Date.now()
    let totalNotifications = 0
    let totalConcertsSynced = 0
    let apiCalls = 0

    // PHASE 1 : SYNCHRONISATION DES CONCERTS
    // ========================================
    
    console.log('📊 Phase 1: Synchronisation des concerts depuis Ticketmaster...')
    
    // 1. Récupérer tous les artistes uniques suivis (présence dans user_artists = suivi)
    const { data: followedArtists, error: artistsError } = await supabaseAdmin
      .from('user_artists')
      .select(`
        artists (
          id,
          name,
          spotify_id,
          ticketmaster_id
        )
      `)

    if (artistsError) {
      console.error('❌ Erreur récupération artistes suivis:', artistsError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch followed artists'
      }, { status: 500 })
    }

    // Dédupliquer les artistes (plusieurs users peuvent suivre le même artiste)
    const uniqueArtistsMap = new Map()
    followedArtists?.forEach((ua: any) => {
      const artist = ua.artists
      if (artist && !uniqueArtistsMap.has(artist.id)) {
        uniqueArtistsMap.set(artist.id, artist)
      }
    })

    const uniqueArtists = Array.from(uniqueArtistsMap.values())
    console.log(`🎵 ${uniqueArtists.length} artistes uniques à synchroniser`)

    // 2. Pour chaque artiste, vérifier si concerts déjà synchro AUJOURD'HUI
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0) // Minuit aujourd'hui
    
    for (const artist of uniqueArtists) {
      try {
        // Vérifier si on a déjà synchro cet artiste aujourd'hui
        const { data: existingConcerts } = await supabaseAdmin
          .from('concerts')
          .select('id, last_synced_at')
          .eq('artist_id', artist.id)
          .gte('last_synced_at', todayStart.toISOString())

        if (existingConcerts && existingConcerts.length > 0) {
          console.log(`⏭️ Concerts de ${artist.name} déjà synchro aujourd'hui`)
          continue
        }

        // Pas encore synchro aujourd'hui → appel Ticketmaster pour refresh quotidien
        console.log(`🎫 Fetch Ticketmaster pour ${artist.name}...`)
        const concerts = await fetchArtistConcertsInFrance(artist.name, artist.ticketmaster_id)
        apiCalls++

        if (concerts.length === 0) {
          console.log(`📭 Aucun concert trouvé pour ${artist.name}`)
          continue
        }

        // 3. Upsert les concerts dans la BDD (INSERT ou UPDATE si existe)
        for (const concert of concerts) {
          const { error: upsertError } = await supabaseAdmin
            .from('concerts')
            .upsert({
              artist_id: artist.id,
              ticketmaster_event_id: concert.id, // ✅ ID unique, pas de doublons possibles
              event_name: concert.name,
              event_date: concert.date,
              venue_name: concert.venue,
              venue_city: concert.city,
              venue_country: concert.country,
              venue_lat: concert.lat,
              venue_lng: concert.lng,
              event_url: concert.url,
              image_url: concert.imageUrl,
              last_synced_at: new Date().toISOString()
            }, {
              onConflict: 'ticketmaster_event_id', // ✅ Évite les doublons grâce à la UNIQUE constraint
              ignoreDuplicates: false // Mettre à jour si existe déjà
            })

          if (upsertError) {
            console.error(`⚠️ Erreur upsert concert ${concert.name}:`, upsertError)
          } else {
            totalConcertsSynced++
          }
        }

        console.log(`✅ ${concerts.length} concerts synchronisés pour ${artist.name}`)

      } catch (error) {
        console.error(`❌ Erreur sync concerts pour ${artist.name}:`, error)
      }
    }

    console.log(`✅ Phase 1 terminée: ${totalConcertsSynced} concerts synchronisés, ${apiCalls} appels Ticketmaster`)

    // PHASE 2 : GÉNÉRATION DES NOTIFICATIONS
    // ========================================
    
    console.log('🔔 Phase 2: Génération des notifications pour les users...')

    // 1. Récupérer tous les users avec une localisation définie
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, location_city, location_country, location_lat, location_lng, notification_radius_km')
      .not('location_city', 'is', null)
      .not('location_lat', 'is', null)
      .not('location_lng', 'is', null)

    if (usersError) {
      console.error('❌ Erreur récupération users:', usersError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch users'
      }, { status: 500 })
    }

    if (!users || users.length === 0) {
      console.log('📭 Aucun utilisateur avec localisation définie')
      return NextResponse.json({
        success: true,
        message: 'No users with location',
        stats: { users: 0, artists: 0, notifications: 0 }
      })
    }

    console.log(`👥 ${users.length} utilisateurs avec localisation trouvés`)

    // 2. Pour chaque utilisateur
    for (const user of users) {
      try {
        // Récupérer les artistes suivis par cet utilisateur
        const { data: userArtists, error: userArtistsError } = await supabaseAdmin
          .from('user_artists')
          .select('artist_id')
          .eq('user_id', user.id)

        if (userArtistsError || !userArtists || userArtists.length === 0) {
          continue
        }

        const followedArtistIds = userArtists.map((ua: any) => ua.artist_id)
        console.log(`  👤 User ${user.email}: ${followedArtistIds.length} artistes suivis`)

        // 3. Récupérer TOUS les concerts de ces artistes depuis la table concerts
        const { data: concerts, error: concertsError } = await supabaseAdmin
          .from('concerts')
          .select(`
            *,
            artists (
              id,
              name,
              image_url
            )
          `)
          .in('artist_id', followedArtistIds)
          .gte('event_date', new Date().toISOString()) // Seulement les concerts futurs
          .not('venue_lat', 'is', null)
          .not('venue_lng', 'is', null)

        if (concertsError || !concerts || concerts.length === 0) {
          console.log(`  📭 Aucun concert trouvé pour cet utilisateur`)
          continue
        }

        console.log(`  🎫 ${concerts.length} concerts potentiels trouvés`)

        // 4. Filtrer les concerts par distance (rayon de notification)
        const radius = user.notification_radius_km || 50
        const nearbyConcerts = concerts.filter((concert: any) => {
          if (!concert.venue_lat || !concert.venue_lng) return false
          
          const distance = calculateDistance(
            user.location_lat,
            user.location_lng,
            concert.venue_lat,
            concert.venue_lng
          )
          
          return distance <= radius
        })

        console.log(`  📍 ${nearbyConcerts.length} concerts dans le rayon de ${radius}km`)

        // 5. Créer des notifications pour chaque concert proche
        for (const concert of nearbyConcerts) {
          const artist = concert.artists as any
          if (!artist) continue

          try {
            const eventDate = new Date(concert.event_date)
            
            // Insérer la notification (ignore si existe déjà grâce à la contrainte unique)
            const { error: insertError } = await supabaseAdmin
              .from('notifications')
              .insert({
                user_id: user.id,
                artist_id: concert.artist_id,
                type: 'concert',
                title: `${artist.name} en concert !`,
                message: `${artist.name} sera à ${concert.venue_name}, ${concert.venue_city} le ${eventDate.toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}`,
                event_id: concert.ticketmaster_event_id,
                event_name: concert.event_name,
                event_date: concert.event_date,
                event_venue: concert.venue_name,
                event_city: concert.venue_city,
                event_url: concert.event_url,
                // ✅ Image du concert (ou fallback sur image artiste si pas d'image concert)
                image_url: concert.image_url || artist.image_url
              })

            // Si pas d'erreur et pas de conflit, c'est une nouvelle notification
            if (!insertError) {
              totalNotifications++
              console.log(`    ✅ Notification créée: ${artist.name} - ${concert.venue_city}`)
            } else if (insertError.code !== '23505') { // 23505 = unique constraint violation
              console.error(`    ⚠️ Erreur insertion notification:`, insertError)
            }

          } catch (error) {
            console.error(`    ❌ Erreur création notification:`, error)
          }
        }

      } catch (error) {
        console.error(`  ❌ Erreur traitement user ${user.email}:`, error)
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)

    console.log(`✅ Job terminé en ${duration}s`)
    console.log(`📊 Phase 1: ${totalConcertsSynced} concerts synchronisés, ${apiCalls} appels API Ticketmaster`)
    console.log(`📊 Phase 2: ${totalNotifications} nouvelles notifications créées`)

    return NextResponse.json({
      success: true,
      stats: {
        concerts_synced: totalConcertsSynced,
        ticketmaster_api_calls: apiCalls,
        notifications_created: totalNotifications,
        duration_seconds: parseFloat(duration)
      }
    })

  } catch (error: any) {
    console.error('❌ Error in concert notifications cron:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

