import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { artistsCache } from '@/lib/artists-cache'

// Force dynamic rendering pour éviter les erreurs de build Vercel
export const dynamic = 'force-dynamic'

// GET /api/user/artists/top - Top 3 artistes
// Architecture: BDD = source de vérité, cache = optimisation
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

    console.log(`🔍 Récupération du top 3 artistes pour l'utilisateur: ${user.id}`)

    // 1. LIRE LA BDD (source de vérité) - Top 3 par fanitude_points
    const { data: topArtists, error: artistsError } = await supabaseAdmin
      .from('user_artists')
      .select(`
        artist_id,
        fanitude_points,
        last_listening_minutes,
        artists (
          id,
          name,
          spotify_id,
          apple_music_id,
          deezer_id,
          image_url,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .order('fanitude_points', { ascending: false })
      .limit(3)

    if (artistsError) {
      console.error('❌ Error fetching top artists:', artistsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch top artists' },
        { status: 500 }
      )
    }

    // 2. VÉRIFIER LE CACHE pour scores plus récents
    const cachedData = artistsCache.getFullCache(user.id)
    let scoresUpdated = false

    if (cachedData && !cachedData.is_stale && topArtists) {
      console.log(`📦 Cache disponible et frais, vérification des scores à jour...`)
      
      // Créer une map du cache
      const cacheMap = new Map(
        cachedData.artists.map(a => [a.id, a.fanitude_score])
      )

      // Mettre à jour les scores depuis le cache si plus récents
      for (const ua of topArtists) {
        const cachedScore = cacheMap.get(ua.artist_id)
        
        if (cachedScore !== undefined && cachedScore !== ua.fanitude_points) {
          await supabaseAdmin
            .from('user_artists')
            .update({ fanitude_points: cachedScore })
            .eq('user_id', user.id)
            .eq('artist_id', ua.artist_id)
          
          ua.fanitude_points = cachedScore
          scoresUpdated = true
        }
      }

      if (scoresUpdated) {
        console.log(`✅ Scores du top 3 mis à jour depuis le cache`)
      }
    }

    console.log(`✅ Top ${topArtists?.length || 0} artistes pour l'utilisateur ${user.id}`)
    
    return NextResponse.json({
      success: true,
      data: topArtists || [],
      cache_used: scoresUpdated
    })
  } catch (error: any) {
    console.error('❌ Error in GET /api/user/artists/top:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}


