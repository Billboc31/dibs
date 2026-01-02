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

    console.log('🧹 Démarrage du job de nettoyage des notifications...')

    let totalDeleted = 0

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
      totalDeleted += count1
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
      totalDeleted += count2
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
      totalDeleted += count3
      console.log(`  🗑️ ${count3} notifications très anciennes supprimées (>90j)`)
    }

    console.log(`✅ Nettoyage terminé: ${totalDeleted} notifications supprimées au total`)

    return NextResponse.json({
      success: true,
      stats: {
        old_read_deleted: oldReadNotifs?.length || 0,
        old_unread_deleted: oldUnreadNotifs?.length || 0,
        very_old_deleted: veryOldNotifs?.length || 0,
        total_deleted: totalDeleted
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

