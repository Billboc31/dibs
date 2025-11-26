import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/user/events - Événements de l'utilisateur
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

    // Récupérer les événements de l'utilisateur
    const { data: userEvents, error: eventsError } = await supabaseAdmin
      .from('user_events')
      .select(`
        event_id,
        created_at,
        events!inner (
          id,
          name,
          event_date,
          venue,
          city,
          country,
          image_url
        )
      `)
      .eq('user_id', user.id)
      .order('events(event_date)', { ascending: true })

    if (eventsError) {
      console.error('❌ Error fetching user events:', eventsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user events' },
        { status: 500 }
      )
    }

    // Extraire juste les événements (sans le wrapper user_events)
    const events = userEvents?.map((item: any) => item.events) || []

    console.log(`✅ Fetched ${events.length} events for user ${user.id}`)
    
    return NextResponse.json({
      success: true,
      data: events
    })
  } catch (error: any) {
    console.error('❌ Error in GET /api/user/events:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}


