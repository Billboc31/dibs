import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { artistsCache } from '@/lib/artists-cache'

// Force dynamic rendering pour éviter les erreurs de build Vercel
export const dynamic = 'force-dynamic'

// GET /api/user/artists/followed - Liste des artistes suivis par l'utilisateur (utilise le cache)
export async function GET(request: NextRequest) {
  try {
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

    console.log(`🔍 Récupération des artistes suivis pour l'utilisateur: ${user.id} (via cache)`)

    // Récupérer tous les artistes depuis le cache
    const cachedData = artistsCache.getFullCache(user.id)

    if (!cachedData) {
      console.log('⚠️ Pas de cache disponible, redirection vers /api/user/artists')
      return NextResponse.json({
        success: false,
        error: 'Cache not available. Please call /api/user/artists first to populate cache.',
        should_fetch_all: true
      }, { status: 404 })
    }

    // Filtrer uniquement les artistes sélectionnés (selected = true)
    const followedArtists = cachedData.artists.filter(artist => artist.selected)

    // Calculer les statistiques
    const totalPoints = followedArtists.reduce((sum, artist) => sum + (artist.fanitude_score || 0), 0)
    const totalMinutes = followedArtists.reduce((sum, artist) => sum + (artist.minutes_listened || 0), 0)
    const averagePoints = followedArtists.length > 0 ? Math.round(totalPoints / followedArtists.length) : 0

    console.log(`✅ ${followedArtists.length} artistes suivis récupérés depuis le cache pour l'utilisateur ${user.id}`)
    console.log(`📊 Stats: ${totalPoints} points total, ${totalMinutes} minutes total, ${averagePoints} points moyenne`)

    return NextResponse.json({
      success: true,
      data: {
        artists: followedArtists,
        stats: {
          total_followed: followedArtists.length,
          total_fanitude_points: totalPoints,
          total_listening_minutes: totalMinutes,
          average_fanitude_points: averagePoints
        }
      },
      cache_info: {
        cached_at: cachedData.cached_at,
        is_stale: cachedData.is_stale
      }
    })

  } catch (error: any) {
    console.error('❌ Error in GET /api/user/artists/followed:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
