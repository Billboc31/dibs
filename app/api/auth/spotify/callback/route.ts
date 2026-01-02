import { NextRequest, NextResponse } from 'next/server'
import { getSpotifyAccessToken, saveSpotifyConnection, syncSpotifyData } from '@/lib/spotify-api'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const state = searchParams.get('state') // PKCE code verifier passed via state

  console.log('🔍 Spotify callback - code:', code ? 'present' : 'missing')
  console.log('🔍 Spotify callback - state:', state ? 'present' : 'missing')

  // User denied access
  if (error || !code) {
    console.log('❌ User denied or no code')
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.url
    return NextResponse.redirect(
      new URL('/connect-platform?error=spotify_denied', baseUrl)
    )
  }

  try {
    // Decode state to get code verifier and user ID
    console.log('📦 Decoding state:', state?.substring(0, 50) + '...')
    const stateData = state ? JSON.parse(atob(state)) : { codeVerifier: '', userId: '' }
    const codeVerifier = stateData.codeVerifier || ''
    const userId = stateData.userId || ''
    
    console.log('🔐 PKCE Callback:')
    console.log('  - Code Verifier length:', codeVerifier.length)
    console.log('  - Code Verifier preview:', codeVerifier.substring(0, 20) + '...')
    console.log('  - User ID:', userId)

    if (!userId) {
      console.log('❌ No user ID in state')
      throw new Error('User ID not found in state')
    }
    
    console.log('🔄 Exchanging code for token...')
    // Exchange code for access token
    const tokens = await getSpotifyAccessToken(code, codeVerifier)
    
    if (!tokens) {
      console.log('❌ No tokens received')
      throw new Error('Failed to get access token')
    }

    console.log('✅ Tokens received, saving connection...')
    console.log('🔑 Access token length:', tokens.accessToken.length)
    console.log('🔑 Access token preview:', tokens.accessToken.substring(0, 30) + '...')
    
    // Save connection to database
    const saved = await saveSpotifyConnection(tokens.accessToken, tokens.refreshToken, userId)

    if (!saved) {
      console.log('❌ Failed to save connection')
      throw new Error('Failed to save connection')
    }

    console.log('✅ Connection saved! Synchronizing artists...')
    // Synchronize Spotify artists
    try {
      const syncResult = await syncSpotifyData(userId, tokens.accessToken)
      console.log(`✅ ${syncResult.synced} artistes Spotify synchronisés`)
    } catch (syncError) {
      console.error('⚠️ Error syncing artists (non-blocking):', syncError)
      // Continue even if sync fails - user can sync later
    }

    console.log('✅ All done! Redirecting...')
    // Redirect to success page that tells user to return to mobile app
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.url
    return NextResponse.redirect(
      new URL('/spotify-success', baseUrl)
    )
  } catch (error) {
    console.error('❌ Spotify callback error:', error)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.url
    return NextResponse.redirect(
      new URL('/connect-platform?error=spotify_error', baseUrl)
    )
  }
}

