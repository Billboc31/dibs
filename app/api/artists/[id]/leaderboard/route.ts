import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'


// Force dynamic rendering pour éviter les erreurs de build Vercel
export const dynamic = 'force-dynamic'

// GET /api/artists/[id]/leaderboard - Leaderboard d'un artiste
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const artistId = params.id
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    // Récupérer l'artiste
    const { data: artist, error: artistError } = await supabaseAdmin
      .from('artists')
      .select('*')
      .eq('id', artistId)
      .single()

    if (artistError || !artist) {
      return NextResponse.json(
        { success: false, error: 'Artist not found' },
        { status: 404 }
      )
    }

    // Récupérer tous les user_artists pour cet artiste avec les infos user
    const { data: allUserArtists, error: userArtistsError } = await supabaseAdmin
      .from('user_artists')
      .select(`
        user_id,
        fanitude_points,
        last_listening_minutes,
        users!inner (
          id,
          display_name,
          email,
          avatar_url,
          country
        )
      `)
      .eq('artist_id', artistId)
      .order('fanitude_points', { ascending: false })

    if (userArtistsError) {
      console.error('❌ Error fetching user_artists:', userArtistsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch leaderboard' },
        { status: 500 }
      )
    }

    // Calculer les positions
    const leaderboardWithPositions = allUserArtists?.map((item: any, index: number) => ({
      position: index + 1,
      user_id: item.user_id,
      display_name: item.users?.display_name || item.users?.email?.split('@')[0] || 'Anonymous',
      avatar_url: item.users?.avatar_url,
      country: item.users?.country,
      fanitude_points: item.fanitude_points,
      last_listening_minutes: item.last_listening_minutes
    })) || []

    // Calculer position mondiale et par pays pour l'utilisateur courant
    const currentUserIndex = allUserArtists?.findIndex((item: any) => item.user_id === user.id)
    let currentUser = null

    if (currentUserIndex !== undefined && currentUserIndex >= 0) {
      const userItem: any = allUserArtists[currentUserIndex]
      const userCountry = userItem.users?.country

      // Position dans le pays
      let countryPosition = 1
      if (userCountry) {
        const usersInCountry = allUserArtists.filter((item: any) => item.users?.country === userCountry)
        countryPosition = usersInCountry.findIndex((item: any) => item.user_id === user.id) + 1
      }

      currentUser = {
        position: currentUserIndex + 1,
        country_position: countryPosition,
        fanitude_points: userItem.fanitude_points
      }
    }

    // Limiter le leaderboard
    const topLeaderboard = leaderboardWithPositions.slice(0, limit)

    console.log(`✅ Fetched leaderboard for artist ${artistId} (${topLeaderboard.length} entries)`)
    
    return NextResponse.json({
      success: true,
      data: {
        artist,
        currentUser,
        leaderboard: topLeaderboard
      }
    })
  } catch (error: any) {
    console.error('❌ Error in GET /api/artists/[id]/leaderboard:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}


