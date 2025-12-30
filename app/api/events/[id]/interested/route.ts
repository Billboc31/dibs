import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'


// Force dynamic rendering pour éviter les erreurs de build Vercel
export const dynamic = 'force-dynamic'

// POST /api/events/[id]/interested - Marquer intéressé par un événement
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const eventId = params.id

    // Vérifier que l'événement existe
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('id')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      )
    }

    // Vérifier si déjà marqué comme intéressé
    const { data: existing } = await supabaseAdmin
      .from('user_events')
      .select('id')
      .eq('user_id', user.id)
      .eq('event_id', eventId)
      .single()

    if (existing) {
      console.log(`⚠️ User ${user.id} already interested in event ${eventId}`)
      return NextResponse.json({
        success: true,
        message: 'Already marked as interested'
      })
    }

    // Ajouter l'intérêt
    const { error: insertError } = await supabaseAdmin
      .from('user_events')
      .insert({
        user_id: user.id,
        event_id: eventId
      })

    if (insertError) {
      console.error('❌ Error marking interested:', insertError)
      return NextResponse.json(
        { success: false, error: 'Failed to mark as interested' },
        { status: 500 }
      )
    }

    console.log(`✅ User ${user.id} marked interested in event ${eventId}`)
    
    return NextResponse.json({
      success: true,
      message: 'Interest registered'
    })
  } catch (error: any) {
    console.error('❌ Error in POST /api/events/[id]/interested:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}


