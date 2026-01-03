import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET /api/cron/clean-notifications - Job hebdomadaire pour nettoyer les anciennes notifications
export async function GET(request: NextRequest) {
  try {
    // Vérifier le secret CRON (sécurité)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('❌ Tentative d\'accès non autorisée au cron')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🧹 Démarrage du job de nettoyage...')

    let totalDeletedNotifications = 0
    let totalDeletedConcerts = 0

    // PARTIE 1: NETTOYAGE DES NOTIFICATIONS
    // ======================================

    // 1. Supprimer les notifications de concerts passés et lus après 30 jours
    const { data: oldReadNotifs, error: error1 } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('type', 'concert')
      .eq('read', true)
      .lt('event_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .select('id')

    if (error1) {
      console.error('❌ Erreur suppression anciennes notifications lues:', error1)
    } else {
      const count1 = oldReadNotifs?.length || 0
      totalDeletedNotifications += count1
      console.log(`  🗑️ ${count1} notifications lues de concerts passés supprimées (>30j)`)
    }

    // 2. Supprimer les notifications de concerts passés non lus après 7 jours
    const { data: oldUnreadNotifs, error: error2 } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('type', 'concert')
      .lt('event_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .select('id')

    if (error2) {
      console.error('❌ Erreur suppression notifications passées non lues:', error2)
    } else {
      const count2 = oldUnreadNotifs?.length || 0
      totalDeletedNotifications += count2
      console.log(`  🗑️ ${count2} notifications de concerts passés supprimées (>7j)`)
    }

    // 3. Supprimer les notifications très anciennes (>90 jours) quel que soit leur type
    const { data: veryOldNotifs, error: error3 } = await supabaseAdmin
      .from('notifications')
      .delete()
      .lt('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
      .select('id')

    if (error3) {
      console.error('❌ Erreur suppression notifications très anciennes:', error3)
    } else {
      const count3 = veryOldNotifs?.length || 0
      totalDeletedNotifications += count3
      console.log(`  🗑️ ${count3} notifications très anciennes supprimées (>90j)`)
    }

    console.log(`✅ Nettoyage notifications terminé: ${totalDeletedNotifications} notifications supprimées`)

    // PARTIE 2: NETTOYAGE DES CONCERTS PASSÉS
    // ========================================

    console.log('🎫 Nettoyage des concerts passés dans la table concerts...')

    // Supprimer les concerts passés depuis plus de 7 jours
    const { data: pastConcerts, error: concertsError } = await supabaseAdmin
      .from('concerts')
      .delete()
      .lt('event_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .select('id')

    if (concertsError) {
      console.error('❌ Erreur suppression concerts passés:', concertsError)
    } else {
      totalDeletedConcerts = pastConcerts?.length || 0
      console.log(`  🗑️ ${totalDeletedConcerts} concerts passés supprimés (>7j)`)
    }

    // Supprimer les concerts avec last_synced_at > 30 jours (données obsolètes)
    const { data: staleConcerts, error: staleError } = await supabaseAdmin
      .from('concerts')
      .delete()
      .lt('last_synced_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .gte('event_date', new Date().toISOString())
      .select('id')

    if (staleError) {
      console.error('❌ Erreur suppression concerts obsolètes:', staleError)
    } else {
      const staleCount = staleConcerts?.length || 0
      totalDeletedConcerts += staleCount
      console.log(`  🗑️ ${staleCount} concerts obsolètes supprimés (non synchro depuis >30j)`)
    }

    console.log(`✅ Nettoyage terminé!`)
    console.log(`📊 Total: ${totalDeletedNotifications} notifications + ${totalDeletedConcerts} concerts supprimés`)

    return NextResponse.json({
      success: true,
      stats: {
        notifications: {
          old_read_deleted: oldReadNotifs?.length || 0,
          old_unread_deleted: oldUnreadNotifs?.length || 0,
          very_old_deleted: veryOldNotifs?.length || 0,
          total_deleted: totalDeletedNotifications
        },
        concerts: {
          past_concerts_deleted: pastConcerts?.length || 0,
          stale_concerts_deleted: staleConcerts?.length || 0,
          total_deleted: totalDeletedConcerts
        }
      }
    })

  } catch (error: any) {
    console.error('❌ Error in clean notifications cron:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

