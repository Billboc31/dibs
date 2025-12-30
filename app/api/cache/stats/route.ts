import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { artistsCache } from '@/lib/artists-cache'


// Force dynamic rendering pour éviter les erreurs de build Vercel
export const dynamic = 'force-dynamic'

/**
 * Retourne les statistiques du cache des artistes
 * Utile pour le monitoring et le debug
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification (optionnel pour les stats)
    const authHeader = request.headers.get('Authorization')
    let isAuthenticated = false
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
      isAuthenticated = !authError && !!user
    }

    const stats = artistsCache.getStats()
    
    // Calculer des métriques supplémentaires
    const totalRequests = stats.hits + stats.misses
    const hitRate = totalRequests > 0 ? (stats.hits / totalRequests * 100).toFixed(2) : '0'
    const staleRate = totalRequests > 0 ? (stats.staleHits / totalRequests * 100).toFixed(2) : '0'

    return NextResponse.json({
      success: true,
      data: {
        cache_stats: {
          ...stats,
          hit_rate_percent: parseFloat(hitRate),
          stale_rate_percent: parseFloat(staleRate),
          total_requests: totalRequests
        },
        cache_info: {
          ttl_hours: 3,
          cleanup_interval_hours: 1,
          fallback_enabled: true,
          authenticated_request: isAuthenticated
        },
        recommendations: {
          performance: hitRate > '80' ? 'Excellent' : hitRate > '60' ? 'Bon' : 'À améliorer',
          stale_usage: staleRate > '10' ? 'Élevé (vérifier connexions Spotify)' : 'Normal'
        }
      }
    })

  } catch (error: any) {
    console.error('❌ Error in GET /api/cache/stats:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
