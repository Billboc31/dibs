import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/events/upcoming - Événements à venir pour les artistes suivis
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

    // Récupérer le paramètre limit
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Date actuelle pour filtrer les événements futurs
    const now = new Date().toISOString()

    // Récupérer les événements à venir
    const { data: events, error: eventsError } = await supabaseAdmin
      .from('events')
      .select('*')
      .gte('event_date', now)
      .order('event_date', { ascending: true })
      .limit(limit)

    if (eventsError) {
      console.error('❌ Error fetching upcoming events:', eventsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch upcoming events' },
        { status: 500 }
      )
    }

    console.log(`✅ Fetched ${events?.length || 0} upcoming events`)
    
    return NextResponse.json({
      success: true,
      data: events || []
    })
  } catch (error: any) {
    console.error('❌ Error in GET /api/events/upcoming:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}


