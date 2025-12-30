import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering pour éviter les erreurs de build Vercel
export const dynamic = 'force-dynamic'

// GET /api/user/artists/top - Top 3 artistes
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

    // Récupérer les 3 artistes avec le plus de points
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

    console.log(`✅ Fetched top 3 artists for user ${user.id}`)
    
    return NextResponse.json({
      success: true,
      data: topArtists || []
    })
  } catch (error: any) {
    console.error('❌ Error in GET /api/user/artists/top:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}


