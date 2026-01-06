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

// GET /api/cron/generate-notifications - Génère les notifications depuis les concerts en BDD
export async function GET(request: NextRequest) {
  try {
    // Vérifier le secret CRON (sécurité)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('❌ Tentative d\'accès non autorisée au cron')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔔 Démarrage de la génération de notifications...')
    console.log('📝 Ce cron utilise les concerts DÉJÀ EN BDD (pas de téléchargement Ticketmaster)\n')

    const startTime = Date.now()
    let totalNotifications = 0
    let totalUsersProcessed = 0
    let totalArtistsChecked = 0
    let totalConcertsEvaluated = 0

    // 1. Récupérer tous les users avec localisation
    console.log('👥 Récupération des utilisateurs avec localisation...')
    
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
          notifications_created: 0
        }
      })
    }

    console.log(`✅ ${users.length} utilisateurs avec localisation trouvés\n`)

    // 2. Pour chaque utilisateur
    for (const user of users) {
      console.log(`\n${'='.repeat(80)}`)
      console.log(`👤 User: ${user.email} (${user.id})`)
      console.log(`📍 Localisation: ${user.location_city}, ${user.location_country} (${user.location_lat}, ${user.location_lng})`)
      console.log(`📏 Rayon: ${user.notification_radius_km || 50} km`)
      
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
        console.log(`⚠️ Aucun artiste suivi par ${user.email}`)
        continue
      }

      const followedArtistIds = userArtistsData.map((ua: any) => ua.artist_id)
      const followedArtistsMap = new Map(userArtistsData.map((ua: any) => [ua.artists.id, ua.artists]))

      console.log(`🎵 ${followedArtistIds.length} artistes suivis: ${userArtistsData.map((ua: any) => ua.artists.name).slice(0, 5).join(', ')}${followedArtistIds.length > 5 ? '...' : ''}`)

      // Récupérer les concerts pertinents depuis la BDD
      const { data: relevantConcerts, error: concertsError } = await supabaseAdmin
        .from('concerts')
        .select('*')
        .in('artist_id', followedArtistIds)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })

      if (concertsError || !relevantConcerts || relevantConcerts.length === 0) {
        console.log(`📭 Aucun concert trouvé pour les artistes de ${user.email}`)
        continue
      }

      console.log(`🎤 ${relevantConcerts.length} concerts trouvés en BDD pour ces artistes`)

      let concertsInRadius = 0
      let notificationsCreated = 0

      // Filtrer par distance et créer des notifications
      for (const concert of relevantConcerts) {
        const artist = followedArtistsMap.get(concert.artist_id)
        if (!artist) continue

        totalArtistsChecked++
        totalConcertsEvaluated++

        // Calculer la distance
        if (!concert.venue_lat || !concert.venue_lng) {
          console.log(`   ⚠️ ${artist.name} - ${concert.event_name}: Pas de coordonnées GPS`)
          continue
        }

        const distance = calculateDistance(
          user.location_lat!, user.location_lng!,
          concert.venue_lat!, concert.venue_lng!
        )

        const notificationRadius = user.notification_radius_km || 50

        console.log(`   📍 ${artist.name} - ${concert.venue_name} (${concert.venue_city}): ${distance.toFixed(1)} km`)

        if (distance <= notificationRadius) {
          concertsInRadius++
          
          try {
            // Insérer la notification (ignore si existe déjà grâce à la contrainte unique)
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
              notificationsCreated++
              console.log(`      ✅ Notification créée: ${concert.event_name}`)
            } else if (insertError.code === '23505') {
              // Contrainte unique - notification existe déjà
              console.log(`      ⏭️ Notification déjà existante (ignorée)`)
            } else {
              console.error(`      ⚠️ Erreur insertion notification:`, insertError)
            }

          } catch (error) {
            console.error(`      ❌ Erreur traitement concert:`, error)
          }
        } else {
          console.log(`      ❌ Hors rayon (${distance.toFixed(1)} km > ${notificationRadius} km)`)
        }
      }

      console.log(`\n📊 Résumé pour ${user.email}:`)
      console.log(`   - Concerts évalués: ${relevantConcerts.length}`)
      console.log(`   - Concerts dans le rayon: ${concertsInRadius}`)
      console.log(`   - Nouvelles notifications créées: ${notificationsCreated}`)
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)

    console.log(`\n${'='.repeat(80)}`)
    console.log(`✅ Génération terminée en ${duration}s`)
    console.log(`📊 STATISTIQUES FINALES:`)
    console.log(`   - Users traités: ${totalUsersProcessed}`)
    console.log(`   - Artistes vérifiés: ${totalArtistsChecked}`)
    console.log(`   - Concerts évalués: ${totalConcertsEvaluated}`)
    console.log(`   - Nouvelles notifications: ${totalNotifications}`)

    return NextResponse.json({
      success: true,
      stats: {
        users_processed: totalUsersProcessed,
        artists_checked: totalArtistsChecked,
        concerts_evaluated: totalConcertsEvaluated,
        notifications_created: totalNotifications,
        duration_seconds: parseFloat(duration)
      }
    })

  } catch (error: any) {
    console.error('❌ Error in generate notifications:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

