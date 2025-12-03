import { NextResponse } from 'next/server'
import { swaggerSpecMobile } from '@/lib/swagger-mobile-simple'

export async function GET() {
  return NextResponse.json(swaggerSpecMobile)
}


