import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { artistsCache } from '@/lib/artists-cache'

// Force dynamic rendering pour éviter les erreurs de build Vercel
export const dynamic = 'force-dynamic'

// GET /api/user/artists/top - Top 3 artistes (utilise le cache)
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

    console.log(`🔍 Récupération du top 3 artistes pour l'utilisateur: ${user.id} (via cache)`)

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

    // Filtrer uniquement les artistes sélectionnés et prendre les 3 premiers (déjà triés par fanitude_score)
    const topArtists = cachedData.artists
      .filter(artist => artist.selected)
      .slice(0, 3)

    console.log(`✅ Top ${topArtists.length} artistes récupérés depuis le cache pour l'utilisateur ${user.id}`)

    return NextResponse.json({
      success: true,
      data: topArtists,
      cache_info: {
        cached_at: cachedData.cached_at,
        is_stale: cachedData.is_stale
      }
    })
  } catch (error: any) {
    console.error('❌ Error in GET /api/user/artists/top:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}


