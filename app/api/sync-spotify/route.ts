import { NextRequest, NextResponse } from 'next/server'
import { syncSpotifyData } from '@/lib/spotify-api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    console.log('🔄 Manual Spotify sync requested for user:', userId)

    // Sync Spotify data (will fetch token from database)
    const result = await syncSpotifyData(userId)

    console.log(`✅ Sync completed: ${result.synced} artists`)

    return NextResponse.json({
      success: true,
      synced: result.synced,
      message: `${result.synced} artistes synchronisés`
    })
  } catch (error) {
    console.error('❌ Error in sync-spotify endpoint:', error)
    return NextResponse.json(
      { error: 'Sync failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


