import { NextResponse } from 'next/server'
import swaggerSpecMobile from '@/lib/swagger-mobile'

export async function GET() {
  return NextResponse.json(swaggerSpecMobile)
}


