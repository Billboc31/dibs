import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/user/platforms - Plateformes connectées par l'utilisateur
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

    // Récupérer les plateformes connectées
    const { data: userPlatforms, error: platformsError } = await supabaseAdmin
      .from('user_streaming_platforms')
      .select(`
        platform_id,
        connected_at,
        streaming_platforms (
          id,
          name,
          slug,
          logo_url,
          color_hex
        )
      `)
      .eq('user_id', user.id)

    if (platformsError) {
      console.error('❌ Error fetching user platforms:', platformsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user platforms' },
        { status: 500 }
      )
    }

    console.log(`✅ Fetched ${userPlatforms?.length || 0} connected platforms for user ${user.id}`)
    
    return NextResponse.json({
      success: true,
      data: userPlatforms || []
    })
  } catch (error: any) {
    console.error('❌ Error in GET /api/user/platforms:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/user/platforms?platformId=xxx - Déconnecter une plateforme
export async function DELETE(request: NextRequest) {
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

    // Récupérer le platformId
    const { searchParams } = new URL(request.url)
    const platformId = searchParams.get('platformId')

    if (!platformId) {
      return NextResponse.json(
        { success: false, error: 'platformId is required' },
        { status: 400 }
      )
    }

    // Supprimer la connexion
    const { error: deleteError } = await supabaseAdmin
      .from('user_streaming_platforms')
      .delete()
      .eq('user_id', user.id)
      .eq('platform_id', platformId)

    if (deleteError) {
      console.error('❌ Error disconnecting platform:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Failed to disconnect platform' },
        { status: 500 }
      )
    }

    console.log(`✅ Disconnected platform ${platformId} for user ${user.id}`)
    
    return NextResponse.json({
      success: true,
      message: 'Platform disconnected'
    })
  } catch (error: any) {
    console.error('❌ Error in DELETE /api/user/platforms:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}


