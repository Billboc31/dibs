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

    // Vérifier si l'utilisateur a une connexion Spotify
    const { data: spotifyConnection } = await supabaseAdmin
      .from('user_streaming_platforms')
      .select('access_token, refresh_token')
      .eq('user_id', user.id)
      .eq('platform_name', 'Spotify')
      .single()

    if (!spotifyConnection) {
      return NextResponse.json({
        success: false,
        error: 'Aucune connexion Spotify trouvée. Connectez-vous d\'abord à Spotify via /connect-platform'
      }, { status: 400 })
    }

    // Synchroniser les artistes Spotify du user (appel API + upsert dans table globale)
    console.log('🎵 Synchronisation des artistes Spotify du user...')
    const { syncSpotifyData } = await import('@/lib/spotify-api')
    
    try {
      const syncedCount = await syncSpotifyData(user.id)
      console.log(`🔄 ${syncedCount} artistes synchronisés depuis Spotify`)
    } catch (error) {
      console.error('❌ Erreur sync Spotify:', error)
      // Continue même en cas d'erreur de sync
    }

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

    // Récupérer TOUS les artistes Spotify avec le statut de sélection
    const { data: allArtists, error: artistsError } = await supabaseAdmin
      .from('artists')
      .select(`
        id,
        name,
        spotify_id,
        apple_music_id,
        deezer_id,
        image_url,
        created_at
      `)
      .not('spotify_id', 'is', null)
      .order('name')
      .range(offset, offset + limit - 1)

    if (artistsError) {
      console.error('❌ Error fetching artists:', artistsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch artists' },
        { status: 500 }
      )
    }

    // Récupérer les artistes sélectionnés par l'utilisateur
    const { data: selectedArtists } = await supabaseAdmin
      .from('user_artists')
      .select('artist_id, fanitude_points, last_listening_minutes')
      .eq('user_id', user.id)

    // Créer un Map des artistes sélectionnés pour un accès rapide
    const selectedArtistsMap = new Map(
      selectedArtists?.map(ua => [ua.artist_id, ua]) || []
    )

    // Combiner les données : tous les artistes + flag de sélection
    const artists = allArtists?.map(artist => {
      const userArtist = selectedArtistsMap.get(artist.id)
      return {
        ...artist,
        selected: !!userArtist,
        fanitude_points: userArtist?.fanitude_points || 0,
        last_listening_minutes: userArtist?.last_listening_minutes || 0
      }
    }) || []

    // Recalculer le total avec tous les artistes Spotify
    const { count: totalSpotifyCount } = await supabaseAdmin
      .from('artists')
      .select('*', { count: 'exact', head: true })
      .not('spotify_id', 'is', null)

    const hasMore = (totalSpotifyCount || 0) > offset + limit
    const selectedCount = artists.filter(a => a.selected).length

    console.log(`✅ Fetched ${artists?.length || 0} artists for user ${user.id} (page ${page})`)
    console.log(`📊 Total Spotify: ${totalSpotifyCount}, Sélectionnés: ${selectedCount}`)
    
    return NextResponse.json({
      success: true,
      data: {
        artists: artists || [],
        pagination: {
          page,
          limit,
          total: totalSpotifyCount || 0,
          hasMore
        },
        stats: {
          total_spotify_artists: totalSpotifyCount || 0,
          selected_artists: selectedCount,
          displayed_artists: artists?.length || 0
        }
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


