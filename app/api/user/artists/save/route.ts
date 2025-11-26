import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/user/artists/save - Sauvegarder la sélection d'artistes
export async function POST(request: NextRequest) {
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

    // Récupérer la liste des artistIds
    const body = await request.json()
    const { artistIds } = body

    if (!artistIds || !Array.isArray(artistIds)) {
      return NextResponse.json(
        { success: false, error: 'artistIds array is required' },
        { status: 400 }
      )
    }

    console.log(`📝 Saving ${artistIds.length} artists for user ${user.id}`)

    // Supprimer tous les artistes existants
    const { error: deleteError } = await supabaseAdmin
      .from('user_artists')
      .delete()
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('❌ Error deleting existing artists:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Failed to delete existing artists' },
        { status: 500 }
      )
    }

    // Insérer les nouveaux artistes
    if (artistIds.length > 0) {
      const artistsToInsert = artistIds.map((artistId: string) => ({
        user_id: user.id,
        artist_id: artistId,
        fanitude_points: 0,
        last_listening_minutes: 0
      }))

      const { error: insertError } = await supabaseAdmin
        .from('user_artists')
        .insert(artistsToInsert)

      if (insertError) {
        console.error('❌ Error inserting artists:', insertError)
        return NextResponse.json(
          { success: false, error: 'Failed to insert artists' },
          { status: 500 }
        )
      }
    }

    console.log(`✅ Successfully saved ${artistIds.length} artists for user ${user.id}`)
    
    return NextResponse.json({
      success: true,
      data: {
        saved: artistIds.length
      }
    })
  } catch (error: any) {
    console.error('❌ Error in POST /api/user/artists/save:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}


