import { NextResponse } from 'next/server'
import { getApiDocs } from '@/lib/swagger'

export async function GET() {
  try {
    const spec = getApiDocs()
    return NextResponse.json(spec)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load API documentation' },
      { status: 500 }
    )
  }
}


