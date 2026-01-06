import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createGunzip } from 'zlib'
import { pipeline } from 'stream/promises'
import { Readable } from 'stream'
import { parser } from 'stream-json'
import { streamArray } from 'stream-json/streamers/StreamArray'
import { chain } from 'stream-chain'
import { pick } from 'stream-json/filters/Pick'

export const dynamic = 'force-dynamic'

// Configuration pour le parsing du gros fichier
export const maxDuration = 300 // 5 minutes max
export const runtime = 'nodejs' // Nécessaire pour les streams

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

/**
 * Télécharge et parse le fichier .gz en streaming (économise la mémoire)
 */
async function downloadTicketmasterFeedStreaming(): Promise<any[]> {
  const apiKey = process.env.TICKETMASTER_API_KEY
  
  if (!apiKey) {
    console.warn('⚠️ TICKETMASTER_API_KEY non configurée')
    return []
  }

  try {
    const url = `https://app.ticketmaster.com/discovery-feed/v2/events.json?apikey=${apiKey}&countryCode=FR`
    
    console.log('📡 Téléchargement et parsing en streaming (économise RAM)...')
    const startTime = Date.now()
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/x-gzip'
      }
    })

    if (!response.ok) {
      console.error(`❌ Erreur Ticketmaster: ${response.status}`)
      return []
    }

    if (!response.body) {
      console.error(`❌ Pas de body dans la réponse`)
      return []
    }

    // Convertir le ReadableStream web en Node.js Stream
    const webStream = response.body
    const nodeStream = Readable.fromWeb(webStream as any)

    // Pipeline: téléchargement → décompression → parsing JSON streaming
    const events: any[] = []
    const gunzip = createGunzip()

    let eventCount = 0

    return new Promise((resolve, reject) => {
      // Créer la chaîne de traitement :
      // 1. gunzip décompresse le stream
      // 2. parser() parse le JSON en streaming
      // 3. pick({ filter: 'events' }) sélectionne uniquement la propriété "events"
      // 4. streamArray() parse le tableau "events" élément par élément
      const pipeline = chain([
        nodeStream,
        gunzip,
        parser(),
        pick({ filter: 'events' }),
        streamArray()
      ])

      pipeline
        .on('data', ({ value }: any) => {
          // Chaque élément du tableau "events"
          events.push(value)
          eventCount++
          
          // Log de progression tous les 10k événements
          if (eventCount % 10000 === 0) {
            console.log(`   📊 ${eventCount} événements parsés...`)
          }
        })
        .on('end', () => {
          const duration = ((Date.now() - startTime) / 1000).toFixed(2)
          console.log(`✅ ${events.length} événements parsés en ${duration}s (streaming)`)
          resolve(events)
        })
        .on('error', (error: any) => {
          console.error(`❌ Erreur streaming:`, error)
          reject(error)
        })
    })

  } catch (error) {
    console.error(`❌ Erreur téléchargement Ticketmaster:`, error)
    return []
  }
}

/**
 * Filtre les événements Music et les transforme en format unifié
 */
function filterAndTransformEvents(events: any[]): any[] {
  return events
    .filter(e => e.classificationSegment === 'Music')
    .map(event => ({
      ticketmaster_event_id: event.eventId,
      event_name: event.eventName,
      event_date: event.eventStartDateTime || event.eventStartLocalDate,
      venue_name: event.venue?.venueName || 'Lieu inconnu',
      venue_city: event.venue?.venueCity || '',
      venue_country: event.venue?.venueCountryCode || 'FR',
      venue_lat: event.venue?.venueLatitude,
      venue_lng: event.venue?.venueLongitude,
      event_url: event.primaryEventUrl,
      image_url: event.eventImageUrl || event.images?.[0]?.image?.url,
      attractions: event.attractions || [],
      raw_event_name: event.eventName?.toLowerCase()
    }))
}

/**
 * Match un concert avec un artiste
 */
function matchArtist(concert: any, artistName: string): boolean {
  const lowerArtistName = artistName.toLowerCase()
  const eventName = concert.raw_event_name || ''
  
  // Match exact ou début de nom
  if (
    eventName === lowerArtistName ||
    eventName.startsWith(lowerArtistName + ' ') ||
    eventName.startsWith(lowerArtistName + ':') ||
    eventName.includes(' ' + lowerArtistName + ' ')
  ) {
    return true
  }
  
  // Match dans les attractions
  if (concert.attractions?.some((a: any) => a.name?.toLowerCase() === lowerArtistName)) {
    return true
  }
  
  return false
}

// GET /api/cron/concert-notifications - Job quotidien optimisé (1 seul appel API)
export async function GET(request: NextRequest) {
  try {
    // Vérifier le secret CRON (sécurité)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('❌ Tentative d\'accès non autorisée au cron')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🚀 Démarrage du job de synchronisation concerts + notifications...')
    console.log('🆕 Méthode optimisée: fichier .gz complet (1 seul appel API)\n')

    const startTime = Date.now()
    let totalNotifications = 0
    let totalUsersProcessed = 0
    let totalArtistsChecked = 0
    let totalConcertsSynced = 0

    // PHASE 1 : TÉLÉCHARGEMENT DES CONCERTS
    // ======================================

    console.log('📊 Phase 1: Téléchargement fichier Ticketmaster...\n')

    const allEvents = await downloadTicketmasterFeedStreaming()
    
    if (allEvents.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Impossible de télécharger les événements Ticketmaster'
      }, { status: 500 })
    }

    // Filtrer les événements Music uniquement
    const musicEvents = filterAndTransformEvents(allEvents)
    console.log(`🎸 Événements Music: ${musicEvents.length}\n`)

    // PHASE 2 : SYNCHRONISATION PAR ARTISTE
    // ======================================

    console.log('📊 Phase 2: Synchronisation des concerts par artiste...\n')

    // Récupérer tous les artistes uniques suivis
    const { data: followedArtistsData, error: artistsError } = await supabaseAdmin
      .from('user_artists')
      .select(`
        artists (
          id,
          name,
          spotify_id,
          ticketmaster_id,
          image_url
        )
      `)

    if (artistsError) {
      console.error('❌ Erreur récupération artistes suivis:', artistsError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch followed artists'
      }, { status: 500 })
    }

    // Dédupliquer les artistes
    const uniqueArtistsMap = new Map<string, any>()
    followedArtistsData?.forEach((ua: any) => {
      const artist = ua.artists
      if (artist && !uniqueArtistsMap.has(artist.id)) {
        uniqueArtistsMap.set(artist.id, artist)
      }
    })

    const uniqueArtists = Array.from(uniqueArtistsMap.values())
    console.log(`🎵 ${uniqueArtists.length} artistes uniques à synchroniser\n`)

    // Pour chaque artiste, chercher ses concerts dans le fichier
    for (const artist of uniqueArtists) {
      try {
        // Matcher les concerts de cet artiste
        const artistConcerts = musicEvents.filter(concert => 
          matchArtist(concert, artist.name)
        )

        if (artistConcerts.length === 0) {
          console.log(`📭 Aucun concert pour ${artist.name}`)
          continue
        }

        console.log(`🎤 ${artist.name}: ${artistConcerts.length} concert(s) trouvé(s)`)

        // Upsert les concerts en BDD
        for (const concert of artistConcerts) {
          const { error: upsertError } = await supabaseAdmin
            .from('concerts')
            .upsert({
              artist_id: artist.id,
              ticketmaster_event_id: concert.ticketmaster_event_id,
              event_name: concert.event_name,
              event_date: concert.event_date,
              venue_name: concert.venue_name,
              venue_city: concert.venue_city,
              venue_country: concert.venue_country,
              venue_lat: concert.venue_lat,
              venue_lng: concert.venue_lng,
              event_url: concert.event_url,
              image_url: concert.image_url,
              last_synced_at: new Date().toISOString()
            }, {
              onConflict: 'ticketmaster_event_id',
              ignoreDuplicates: false
            })

          if (upsertError) {
            console.error(`⚠️ Erreur upsert concert ${concert.event_name}:`, upsertError)
          } else {
            totalConcertsSynced++
          }
        }

        console.log(`✅ ${artistConcerts.length} concerts synchronisés pour ${artist.name}`)

      } catch (error) {
        console.error(`❌ Erreur sync concerts pour ${artist.name}:`, error)
      }
    }

    console.log(`\n✅ Phase 2 terminée: ${totalConcertsSynced} concerts synchronisés, 1 appel API\n`)

    // PHASE 3 : GÉNÉRATION DES NOTIFICATIONS
    // ========================================

    console.log('🔔 Phase 3: Génération des notifications pour les users...\n')

    // Récupérer tous les users avec localisation
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
        stats: { 
          users_processed: 0, 
          artists_checked: 0, 
          notifications_created: 0, 
          concerts_synced: totalConcertsSynced, 
          ticketmaster_api_calls: 1 // 🎯 1 seul appel au lieu de 150+
        }
      })
    }

    console.log(`👥 ${users.length} utilisateurs avec localisation trouvés\n`)

    // Pour chaque utilisateur
    for (const user of users) {
      totalUsersProcessed++

      // Récupérer les artistes suivis par cet utilisateur
      const { data: userArtistsData, error: userArtistsError } = await supabaseAdmin
        .from('user_artists')
        .select(`
          artist_id,
          artists (
            id,
            name,
            image_url
          )
        `)
        .eq('user_id', user.id)

      if (userArtistsError || !userArtistsData || userArtistsData.length === 0) {
        continue
      }

      const followedArtistIds = userArtistsData.map((ua: any) => ua.artist_id)
      const followedArtistsMap = new Map(userArtistsData.map((ua: any) => [ua.artists.id, ua.artists]))

      console.log(`  🎵 User ${user.email}: ${followedArtistIds.length} artistes suivis`)

      // Récupérer les concerts pertinents depuis la BDD
      const { data: relevantConcerts, error: concertsError } = await supabaseAdmin
        .from('concerts')
        .select('*')
        .in('artist_id', followedArtistIds)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })

      if (concertsError || !relevantConcerts || relevantConcerts.length === 0) {
        continue
      }

      console.log(`  🔎 ${relevantConcerts.length} concerts pertinents trouvés pour ${user.email}`)

      // Filtrer par distance et créer des notifications
      for (const concert of relevantConcerts) {
        const artist = followedArtistsMap.get(concert.artist_id)
        if (!artist) continue

        totalArtistsChecked++

        // Calculer la distance
        const distance = calculateDistance(
          user.location_lat!, user.location_lng!,
          concert.venue_lat!, concert.venue_lng!
        )

        const notificationRadius = user.notification_radius_km || 50

        if (distance <= notificationRadius) {
          try {
            // Insérer la notification (ignore si existe déjà)
            const { error: insertError } = await supabaseAdmin
              .from('notifications')
              .insert({
                user_id: user.id,
                artist_id: artist.id,
                type: 'concert',
                title: `${artist.name} en concert !`,
                message: `${artist.name} sera à ${concert.venue_name}, ${concert.venue_city} le ${new Date(concert.event_date).toLocaleDateString('fr-FR', {
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
                event_country: concert.venue_country,
                event_url: concert.event_url,
                image_url: concert.image_url || artist.image_url
              })

            if (!insertError) {
              totalNotifications++
              console.log(`    ✅ Notification créée: ${artist.name} - ${concert.venue_name}`)
            } else if (insertError.code !== '23505') {
              console.error(`    ⚠️ Erreur insertion notification:`, insertError)
            }

          } catch (error) {
            console.error(`    ❌ Erreur traitement concert:`, error)
          }
        }
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)

    console.log(`\n✅ Job terminé en ${duration}s`)
    console.log(`📊 Stats: ${totalUsersProcessed} users, ${totalArtistsChecked} artistes, ${totalNotifications} nouvelles notifications`)
    console.log(`🎯 API calls: 1 seul appel (vs 150+ avant) - Gain: x150 !`)

    return NextResponse.json({
      success: true,
      stats: {
        users_processed: totalUsersProcessed,
        artists_checked: totalArtistsChecked,
        notifications_created: totalNotifications,
        concerts_synced: totalConcertsSynced,
        ticketmaster_api_calls: 1, // 🚀 1 seul appel !
        duration_seconds: parseFloat(duration),
        optimization: 'x150 efficiency gain'
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
