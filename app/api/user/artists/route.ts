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

    // Récupérer toutes les plateformes connectées par l'utilisateur
    const { data: connectedPlatforms } = await supabaseAdmin
      .from('user_streaming_platforms')
      .select(`
        access_token, 
        refresh_token,
        platform_id,
        streaming_platforms!inner (
          id,
          name,
          slug
        )
      `)
      .eq('user_id', user.id)

    if (!connectedPlatforms || connectedPlatforms.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Aucune plateforme de streaming connectée. Connectez-vous d\'abord à une plateforme via /connect-platform'
      }, { status: 400 })
    }

    console.log(`🔗 Plateformes connectées: ${connectedPlatforms.map(p => (p.streaming_platforms as any).name).join(', ')}`)

    // Synchroniser les artistes pour chaque plateforme connectée
    for (const platform of connectedPlatforms) {
      const platformData = platform.streaming_platforms as any
      const platformName = platformData.slug
      console.log(`🎵 Synchronisation des artistes ${platformData.name}...`)
      
      try {
        if (platformName === 'spotify') {
          const { syncSpotifyData } = await import('@/lib/spotify-api')
          const syncedCount = await syncSpotifyData(user.id)
          console.log(`🔄 ${syncedCount} artistes synchronisés depuis Spotify`)
        }
        // TODO: Ajouter d'autres plateformes (Apple Music, Deezer) quand elles seront implémentées
        else {
          console.log(`⚠️ Synchronisation non implémentée pour ${platformData.name}`)
        }
      } catch (error) {
        console.error(`❌ Erreur sync ${platformData.name}:`, error)
        // Continue même en cas d'erreur de sync
      }
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

    // Construire les filtres pour les plateformes connectées
    const platformFilters = connectedPlatforms.map(p => (p.streaming_platforms as any).slug)
    console.log(`🔍 Recherche d'artistes pour les plateformes: ${platformFilters.join(', ')}`)

    // Appliquer les filtres selon les plateformes connectées
    const orConditions = []
    if (platformFilters.includes('spotify')) {
      orConditions.push('spotify_id.not.is.null')
    }
    if (platformFilters.includes('apple_music')) {
      orConditions.push('apple_music_id.not.is.null')
    }
    if (platformFilters.includes('deezer')) {
      orConditions.push('deezer_id.not.is.null')
    }

    // Si aucun artiste utilisateur, vérifier s'il y a des artistes Spotify à synchroniser
    if (count === 0) {
      console.log('⚠️ Aucun artiste utilisateur trouvé, vérification des artistes Spotify disponibles...')
      
      // Récupérer quelques artistes des plateformes connectées pour voir s'ils existent
      let debugQuery = supabaseAdmin
        .from('artists')
        .select('id, name, spotify_id, apple_music_id, deezer_id')
        .limit(5)

      if (orConditions.length > 0) {
        debugQuery = debugQuery.or(orConditions.join(','))
      }

      const { data: platformArtists } = await debugQuery
      
      console.log('🎵 Artistes des plateformes disponibles:', platformArtists?.length || 0)
      if (platformArtists && platformArtists.length > 0) {
        console.log('📋 Exemples d\'artistes:', platformArtists.map(a => ({ 
          name: a.name, 
          spotify_id: a.spotify_id,
          apple_music_id: a.apple_music_id,
          deezer_id: a.deezer_id
        })))
      }
    }

    // Récupérer TOUS les artistes des plateformes connectées avec le statut de sélection
    let artistsQuery = supabaseAdmin
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
      .order('name')
      .range(offset, offset + limit - 1)

    if (orConditions.length > 0) {
      artistsQuery = artistsQuery.or(orConditions.join(','))
    }

    const { data: allArtists, error: artistsError } = await artistsQuery

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

    // Recalculer le total avec tous les artistes des plateformes connectées
    let totalCountQuery = supabaseAdmin
      .from('artists')
      .select('*', { count: 'exact', head: true })

    if (orConditions.length > 0) {
      totalCountQuery = totalCountQuery.or(orConditions.join(','))
    }

    const { count: totalPlatformsCount } = await totalCountQuery

    const hasMore = (totalPlatformsCount || 0) > offset + limit
    const selectedCount = artists.filter(a => a.selected).length

    console.log(`✅ Fetched ${artists?.length || 0} artists for user ${user.id} (page ${page})`)
    console.log(`📊 Total plateformes: ${totalPlatformsCount}, Sélectionnés: ${selectedCount}`)
    
    return NextResponse.json({
      success: true,
      data: {
        artists: artists || [],
        pagination: {
          page,
          limit,
          total: totalPlatformsCount || 0,
          hasMore
        },
        stats: {
          total_artists: totalPlatformsCount || 0,
          selected_artists: selectedCount,
          displayed_artists: artists?.length || 0,
          connected_platforms: connectedPlatforms.map(p => (p.streaming_platforms as any).name)
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


