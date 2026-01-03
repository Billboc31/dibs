import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { artistsCache } from '@/lib/artists-cache'

// Force dynamic rendering pour éviter les erreurs de build Vercel
export const dynamic = 'force-dynamic'

// GET /api/user/artists/followed - Liste des artistes suivis par l'utilisateur
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

    console.log(`🔍 Récupération des artistes suivis pour l'utilisateur: ${user.id}`)

    // 1. LIRE LA BDD (source de vérité)
    const { data: followedArtists, error: followedError } = await supabaseAdmin
      .from('user_artists')
      .select(`
        artist_id,
        fanitude_points,
        last_listening_minutes,
        created_at,
        updated_at,
        artists (
          id,
          name,
          spotify_id,
          apple_music_id,
          deezer_id,
          image_url
        )
      `)
      .eq('user_id', user.id)
      .order('fanitude_points', { ascending: false })

    if (followedError) {
      console.error('❌ Erreur récupération artistes suivis:', followedError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch followed artists' },
        { status: 500 }
      )
    }

    // 2. VÉRIFIER LE CACHE pour scores plus récents
    const cachedData = artistsCache.getFullCache(user.id)
    let updatedCount = 0

    if (cachedData && !cachedData.is_stale) {
      console.log(`📦 Cache disponible et frais, vérification des scores à jour...`)
      
      // Créer une map du cache pour accès rapide
      const cacheMap = new Map(
        cachedData.artists.map(a => [a.id, a.fanitude_score])
      )

      // Pour chaque artiste en BDD, vérifier si le cache a un score plus récent
      for (const ua of followedArtists || []) {
        const cachedScore = cacheMap.get(ua.artist_id)
        
        if (cachedScore !== undefined && cachedScore !== ua.fanitude_points) {
          // Le cache a un score différent, mettre à jour la BDD
          await supabaseAdmin
            .from('user_artists')
            .update({ fanitude_points: cachedScore })
            .eq('user_id', user.id)
            .eq('artist_id', ua.artist_id)
          
          ua.fanitude_points = cachedScore
          updatedCount++
        }
      }

      if (updatedCount > 0) {
        console.log(`✅ ${updatedCount} scores mis à jour depuis le cache vers la BDD`)
      }
    }

    // 3. FORMATER ET RETOURNER les données BDD
    const artists = followedArtists?.map(ua => {
      const artist = ua.artists as any
      return {
        id: artist.id,
        name: artist.name,
        spotify_id: artist.spotify_id,
        apple_music_id: artist.apple_music_id,
        deezer_id: artist.deezer_id,
        image_url: artist.image_url,
        fanitude_points: ua.fanitude_points,
        last_listening_minutes: ua.last_listening_minutes,
        followed_since: ua.created_at,
        last_updated: ua.updated_at
      }
    }) || []

    // Calculer les statistiques
    const totalPoints = artists.reduce((sum, artist) => sum + (artist.fanitude_points || 0), 0)
    const totalMinutes = artists.reduce((sum, artist) => sum + (artist.last_listening_minutes || 0), 0)
    const averagePoints = artists.length > 0 ? Math.round(totalPoints / artists.length) : 0

    console.log(`✅ ${artists.length} artistes suivis pour l'utilisateur ${user.id}`)
    console.log(`📊 Stats: ${totalPoints} points total, ${averagePoints} points moyenne`)

    return NextResponse.json({
      success: true,
      data: {
        artists,
        stats: {
          total_followed: artists.length,
          total_fanitude_points: totalPoints,
          total_listening_minutes: totalMinutes,
          average_fanitude_points: averagePoints
        }
      },
      cache_used: updatedCount > 0,
      scores_updated: updatedCount
    })

  } catch (error: any) {
    console.error('❌ Error in GET /api/user/artists/followed:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
