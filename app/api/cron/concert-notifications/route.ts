import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { fetchConcertsNearby } from '@/lib/ticketmaster-api'

export const dynamic = 'force-dynamic'

// GET /api/cron/concert-notifications - Job quotidien pour créer les notifications de concerts
export async function GET(request: NextRequest) {
  try {
    // Vérifier le secret CRON (sécurité)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('❌ Tentative d\'accès non autorisée au cron')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🚀 Démarrage du job de notifications concerts...')

    const startTime = Date.now()
    let totalNotifications = 0
    let totalUsers = 0
    let totalArtists = 0

    // 1. Récupérer tous les users avec une localisation définie
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, location_city, location_country, notification_radius_km')
      .not('location_city', 'is', null)

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
      totalUsers++
      
      // Récupérer les artistes suivis par cet utilisateur
      const { data: followedArtists, error: artistsError } = await supabaseAdmin
        .from('user_artists')
        .select(`
          artist_id,
          artists (
            id,
            name,
            ticketmaster_id,
            image_url
          )
        `)
        .eq('user_id', user.id)

      if (artistsError || !followedArtists || followedArtists.length === 0) {
        continue
      }

      console.log(`  🎵 User ${user.email}: ${followedArtists.length} artistes suivis`)

      // 3. Pour chaque artiste suivi
      for (const ua of followedArtists) {
        const artist = ua.artists as any
        if (!artist) continue

        totalArtists++

        // Chercher les concerts de cet artiste près de l'utilisateur
        const concerts = await fetchConcertsNearby(
          artist.name,
          user.location_city,
          user.notification_radius_km || 50,
          user.location_country
        )

        // 4. Créer des notifications pour chaque concert
        for (const concert of concerts) {
          try {
            // Insérer la notification (ignore si existe déjà grâce à la contrainte unique)
            const { error: insertError } = await supabaseAdmin
              .from('notifications')
              .insert({
                user_id: user.id,
                artist_id: artist.id,
                type: 'concert',
                title: `${artist.name} en concert !`,
                message: `${artist.name} sera à ${concert.venue}, ${concert.city} le ${new Date(concert.date).toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}`,
                event_id: concert.id,
                event_name: concert.name,
                event_date: concert.date,
                event_venue: concert.venue,
                event_city: concert.city,
                event_country: concert.country,
                event_url: concert.url,
                image_url: concert.imageUrl || artist.image_url
              })

            // Si pas d'erreur et pas de conflit, c'est une nouvelle notification
            if (!insertError) {
              totalNotifications++
              console.log(`    ✅ Notification créée: ${artist.name} - ${concert.venue}`)
            } else if (insertError.code !== '23505') { // 23505 = unique constraint violation
              console.error(`    ⚠️ Erreur insertion notification:`, insertError)
            }

          } catch (error) {
            console.error(`    ❌ Erreur traitement concert:`, error)
          }
        }

        // Petit délai pour éviter de surcharger l'API Ticketmaster
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)

    console.log(`✅ Job terminé en ${duration}s`)
    console.log(`📊 Stats: ${totalUsers} users, ${totalArtists} artistes, ${totalNotifications} nouvelles notifications`)

    return NextResponse.json({
      success: true,
      stats: {
        users_processed: totalUsers,
        artists_checked: totalArtists,
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

