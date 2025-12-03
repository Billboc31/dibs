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

    console.log(`📊 Récupération de TOUS les artistes des plateformes connectées...`)
    
    // Construire les filtres pour les plateformes connectées
    const platformFilters = connectedPlatforms.map(p => (p.streaming_platforms as any).slug)
    console.log(`🔍 Plateformes: ${platformFilters.join(', ')}`)

    // Construire les conditions OR pour les plateformes connectées
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


    // Debug: Afficher le nombre d'artistes sélectionnés par l'utilisateur
    if (count === 0) {
      console.log('⚠️ Aucun artiste sélectionné par l\'utilisateur')
    } else {
      console.log(`✅ ${count} artistes déjà sélectionnés par l\'utilisateur`)
    }

    // Récupérer TOUS les artistes des plateformes connectées avec pagination
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

    // Appliquer les filtres des plateformes connectées

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

    // Combiner les données : tous les artistes + flag de sélection SEULEMENT
    const artists = allArtists?.map(artist => {
      const userArtist = selectedArtistsMap.get(artist.id)
      return {
        id: artist.id,
        name: artist.name,
        spotify_id: artist.spotify_id,
        apple_music_id: artist.apple_music_id,
        deezer_id: artist.deezer_id,
        image_url: artist.image_url,
        selected: !!userArtist
      }
    }) || []

    // TODO: Calculer le total d'artistes spécifiques à cet utilisateur
    // Pour l'instant, on utilise le total de la BDD mais il faudrait récupérer
    // les artistes spécifiques à l'utilisateur depuis les APIs des plateformes
    let totalCountQuery = supabaseAdmin
      .from('artists')
      .select('*', { count: 'exact', head: true })

    if (orConditions.length > 0) {
      totalCountQuery = totalCountQuery.or(orConditions.join(','))
    }

    const { count: totalPlatformArtists } = await totalCountQuery
    const hasMore = (totalPlatformArtists || 0) > offset + limit
    const selectedCount = artists.filter(a => a.selected).length

    console.log(`✅ Fetched ${artists?.length || 0} artists for user ${user.id} (page ${page})`)
    console.log(`📊 Total artistes utilisateur: ${totalPlatformArtists}, Sélectionnés: ${selectedCount}`)
    
    return NextResponse.json({
      success: true,
      data: {
        artists: artists || [],
        pagination: {
          page,
          limit,
          total: totalPlatformArtists || 0,
          hasMore
        },
        stats: {
          total_artists: totalPlatformArtists || 0,
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


