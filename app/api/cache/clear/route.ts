import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { artistsCache } from '@/lib/artists-cache'

// Force dynamic rendering pour éviter les erreurs de build Vercel
export const dynamic = 'force-dynamic'

/**
 * DELETE /api/cache/clear - Vider le cache des artistes
 * 
 * Query params:
 * - userId: ID de l'utilisateur (optionnel, vide le cache d'un utilisateur spécifique)
 * - all: 'true' pour vider tout le cache (nécessite authentification)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authentification requise
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
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

    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get('userId')
    const clearAll = searchParams.get('all') === 'true'

    let message = ''
    let cacheKey = ''

    if (clearAll) {
      // Vider tout le cache
      artistsCache.clear()
      message = 'Tout le cache a été vidé'
      console.log('🗑️ Cache complet vidé par:', user.id)
    } else if (targetUserId) {
      // Vider le cache d'un utilisateur spécifique
      artistsCache.invalidateUser(targetUserId)
      cacheKey = `user_artists:${targetUserId}`
      message = `Cache de l'utilisateur ${targetUserId} vidé`
      console.log(`🗑️ Cache vidé pour utilisateur ${targetUserId} par:`, user.id)
    } else {
      // Par défaut, vider le cache de l'utilisateur authentifié
      artistsCache.invalidateUser(user.id)
      cacheKey = `user_artists:${user.id}`
      message = 'Votre cache a été vidé'
      console.log(`🗑️ Cache vidé pour utilisateur ${user.id}`)
    }

    const stats = artistsCache.getStats()

    return NextResponse.json({
      success: true,
      data: {
        message,
        cache_key: cacheKey || 'all',
        cleared_by: user.id,
        current_stats: stats
      }
    })

  } catch (error: any) {
    console.error('❌ Error in DELETE /api/cache/clear:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

