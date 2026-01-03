import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Fonction pour calculer la distance entre deux points (formule de Haversine)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// POST /api/concerts/sync - Synchroniser les concerts pour tous les utilisateurs (CRON job)
export async function POST(request: NextRequest) {
  try {
    // Vérifier si c'est un appel autorisé (CRON secret)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🎵 Démarrage de la synchronisation des concerts...')

    // 1. Récupérer tous les artistes suivis par au moins un utilisateur
    const { data: followedArtists } = await supabaseAdmin
      .from('user_artists')
      .select(`
        artist_id,
        artists (
          id,
          name,
          spotify_id,
          image_url
        )
      `)
      .limit(1000)

    if (!followedArtists || followedArtists.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Aucun artiste suivi',
        concerts_found: 0
      })
    }

    // Dédupliquer les artistes
    const uniqueArtists = Array.from(
      new Map(followedArtists.map(ua => [ua.artist_id, ua.artists as any])).values()
    )

    console.log(`📊 ${uniqueArtists.length} artistes uniques à vérifier`)

    let concertsFound = 0
    let newConcerts = 0

    // 2. Pour chaque artiste, récupérer les concerts depuis Bandsintown
    for (const artist of uniqueArtists) {
      if (!artist) continue

      try {
        // Appel à Bandsintown API
        const response = await fetch(
          `https://rest.bandsintown.com/artists/${encodeURIComponent((artist as any).name)}/events?app_id=${process.env.BANDSINTOWN_APP_ID}`,
          { headers: { 'Accept': 'application/json' } }
        )

        if (!response.ok) continue

        const concerts = await response.json()
        
        if (!Array.isArray(concerts)) continue

        concertsFound += concerts.length

        // 3. Sauvegarder les concerts en BDD
        for (const concert of concerts) {
          try {
            const { data: existingConcert } = await supabaseAdmin
              .from('concerts')
              .select('id')
              .eq('external_id', concert.id)
              .single()

            if (!existingConcert) {
              // Nouveau concert !
              const { error: insertError } = await supabaseAdmin
                .from('concerts')
                .insert({
                  artist_id: (artist as any).id,
                  external_id: concert.id,
                  venue_name: concert.venue?.name || 'Unknown',
                  venue_city: concert.venue?.city || 'Unknown',
                  venue_country: concert.venue?.country || 'Unknown',
                  venue_latitude: concert.venue?.latitude || null,
                  venue_longitude: concert.venue?.longitude || null,
                  event_date: concert.datetime,
                  lineup: concert.lineup || [],
                  ticket_url: concert.url || null,
                  ticket_status: concert.offers?.[0]?.status || 'available'
                })

              if (!insertError) {
                newConcerts++
                console.log(`✅ Nouveau concert: ${(artist as any).name} - ${concert.venue?.city} (${concert.datetime})`)

                // 4. Trouver les utilisateurs à notifier
                await notifyUsersForNewConcert((artist as any).id, concert)
              }
            }
          } catch (error) {
            console.error(`⚠️ Erreur sauvegarde concert ${concert.id}:`, error)
          }
        }

        // Rate limiting pour ne pas spam Bandsintown
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        console.error(`⚠️ Erreur récupération concerts pour ${(artist as any).name}:`, error)
      }
    }

    console.log(`🎉 Sync terminé: ${concertsFound} concerts trouvés, ${newConcerts} nouveaux`)

    return NextResponse.json({
      success: true,
      artists_checked: uniqueArtists.length,
      concerts_found: concertsFound,
      new_concerts: newConcerts
    })

  } catch (error: any) {
    console.error('❌ Error in POST /api/concerts/sync:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// Fonction pour notifier les utilisateurs d'un nouveau concert
async function notifyUsersForNewConcert(artistId: string, concert: any) {
  try {
    // Récupérer tous les utilisateurs qui suivent cet artiste
    const { data: followers } = await supabaseAdmin
      .from('user_artists')
      .select(`
        user_id,
        users!inner (
          id,
          email,
          display_name
        )
      `)
      .eq('artist_id', artistId)

    if (!followers || followers.length === 0) return

    // Récupérer le concert inséré
    const { data: concertData } = await supabaseAdmin
      .from('concerts')
      .select('id')
      .eq('external_id', concert.id)
      .single()

    if (!concertData) return

    for (const follower of followers) {
      try {
        // Vérifier si l'utilisateur a une localisation configurée
        const { data: userLocation } = await supabaseAdmin
          .from('user_locations')
          .select('*')
          .eq('user_id', follower.user_id)
          .single()

        if (!userLocation || !concert.venue?.latitude || !concert.venue?.longitude) continue

        // Calculer la distance
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          concert.venue.latitude,
          concert.venue.longitude
        )

        // Si le concert est dans le rayon, créer une notification
        if (distance <= userLocation.radius_km) {
          // Vérifier les préférences de notification
          const { data: prefs } = await supabaseAdmin
            .from('user_notification_preferences')
            .select('new_concerts_enabled, push_enabled, email_enabled')
            .eq('user_id', follower.user_id)
            .single()

          if (!prefs || !prefs.new_concerts_enabled) continue

          // Créer la notification en BDD
          await supabaseAdmin
            .from('concert_notifications')
            .insert({
              user_id: follower.user_id,
              concert_id: concertData.id,
              notification_type: 'new_concert'
            })

          console.log(`📬 Notification créée pour user ${follower.user_id} (${distance.toFixed(1)}km)`)

          // TODO: Envoyer push notification / email ici
          // if (prefs.push_enabled) { ... }
          // if (prefs.email_enabled) { ... }
        }

      } catch (error) {
        console.error(`⚠️ Erreur notification user ${follower.user_id}:`, error)
      }
    }

  } catch (error) {
    console.error('⚠️ Erreur notifyUsersForNewConcert:', error)
  }
}

