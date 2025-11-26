import { NextRequest, NextResponse } from 'next/server'
import { getDeezerAccessToken, saveDeezerConnection, syncDeezerData } from '@/lib/deezer-api'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error_reason')

  // User denied access
  if (error || !code) {
    return NextResponse.redirect(
      new URL('/connect-platform?error=deezer_denied', request.url)
    )
  }

  try {
    // Exchange code for access token
    const accessToken = await getDeezerAccessToken(code)

    if (!accessToken) {
      throw new Error('Failed to get access token')
    }

    // Save connection to database
    const saved = await saveDeezerConnection(accessToken)

    if (!saved) {
      throw new Error('Failed to save connection')
    }

    // Redirect to artist selection with success message
    return NextResponse.redirect(
      new URL('/select-artists?platform=deezer&connected=true', request.url)
    )
  } catch (error) {
    console.error('❌ Deezer callback error:', error)
    return NextResponse.redirect(
      new URL('/connect-platform?error=deezer_error', request.url)
    )
  }
}



