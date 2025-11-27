import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/user/artists - Liste des artistes suivis (paginée)
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

    // Récupérer les paramètres de pagination
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '0')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = page * limit

    console.log(`🔍 Recherche artistes pour user: ${user.id}`)

    // Vérifier d'abord s'il y a des artistes dans la table artists
    const { count: totalArtistsCount } = await supabaseAdmin
      .from('artists')
      .select('*', { count: 'exact', head: true })
    
    console.log(`📊 Total artistes dans la DB: ${totalArtistsCount}`)

    // Récupérer le nombre total d'artistes de l'utilisateur
    const { count } = await supabaseAdmin
      .from('user_artists')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    console.log(`👤 Artistes de l'utilisateur: ${count}`)

    // Si aucun artiste utilisateur, vérifier s'il y a des artistes Spotify à synchroniser
    if (count === 0) {
      console.log('⚠️ Aucun artiste utilisateur trouvé, vérification des artistes Spotify disponibles...')
      
      // Récupérer quelques artistes Spotify pour voir s'ils existent
      const { data: spotifyArtists, error: spotifyError } = await supabaseAdmin
        .from('artists')
        .select('id, name, spotify_id')
        .not('spotify_id', 'is', null)
        .limit(5)
      
      console.log('🎵 Artistes Spotify disponibles:', spotifyArtists?.length || 0)
      if (spotifyArtists && spotifyArtists.length > 0) {
        console.log('📋 Exemples d\'artistes Spotify:', spotifyArtists.map(a => ({ name: a.name, spotify_id: a.spotify_id })))
      }
    }

    // Récupérer les artistes avec pagination
    const { data: artists, error: artistsError } = await supabaseAdmin
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
      .order('last_listening_minutes', { ascending: false })
      .range(offset, offset + limit - 1)

    if (artistsError) {
      console.error('❌ Error fetching artists:', artistsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch artists' },
        { status: 500 }
      )
    }

    const hasMore = (count || 0) > offset + limit

    console.log(`✅ Fetched ${artists?.length || 0} artists for user ${user.id} (page ${page})`)
    
    return NextResponse.json({
      success: true,
      data: {
        artists: artists || [],
        total: count || 0,
        page,
        hasMore
      }
    })
  } catch (error: any) {
    console.error('❌ Error in GET /api/user/artists:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}


