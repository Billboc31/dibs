import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering pour éviter les erreurs de build Vercel
export const dynamic = 'force-dynamic'

// GET /api/artists/[id]/followers - Liste paginée des followers d'un artiste
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
    const page = parseInt(searchParams.get('page') || '0')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (Number.isNaN(page) || Number.isNaN(limit) || page < 0 || limit <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid pagination parameters' },
        { status: 400 }
      )
    }

    // Vérifier que l'artiste existe
    const { data: artist, error: artistError } = await supabaseAdmin
      .from('artists')
      .select('id, name, image_url, spotify_id, apple_music_id, deezer_id')
      .eq('id', artistId)
      .single()

    if (artistError || !artist) {
      return NextResponse.json(
        { success: false, error: 'Artist not found' },
        { status: 404 }
      )
    }

    const offset = page * limit

    // Récupérer les followers avec pagination
    const { data: followers, error: followersError, count } = await supabaseAdmin
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
          location_country
        )
      `, { count: 'exact' })
      .eq('artist_id', artistId)
      .order('fanitude_points', { ascending: false })
      .range(offset, offset + limit - 1)

    if (followersError) {
      console.error('❌ Error fetching artist followers:', followersError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch followers' },
        { status: 500 }
      )
    }

    const total = count || 0
    const formattedFollowers = followers?.map((item: any, index: number) => ({
      position: offset + index + 1,
      user_id: item.user_id,
      display_name: item.users?.display_name || item.users?.email?.split('@')[0] || 'Anonymous',
      avatar_url: item.users?.avatar_url,
      country: item.users?.location_country,
      fanitude_points: item.fanitude_points,
      last_listening_minutes: item.last_listening_minutes
    })) || []

    return NextResponse.json({
      success: true,
      data: {
        artist,
        followers: formattedFollowers,
        pagination: {
          page,
          limit,
          total,
          hasMore: offset + limit < total
        }
      }
    })
  } catch (error: any) {
    console.error('❌ Error in GET /api/artists/[id]/followers:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}


