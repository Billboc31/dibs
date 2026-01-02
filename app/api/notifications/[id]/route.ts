import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// PATCH /api/notifications/[id] - Marquer une notification comme lue
export async function PATCH(
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

    const { id } = params
    const body = await request.json()
    const { read, clicked } = body

    // Mettre à jour la notification
    const updateData: any = {}
    if (read !== undefined) {
      updateData.read = read
      if (read) {
        updateData.read_at = new Date().toISOString()
      }
    }
    if (clicked !== undefined) {
      updateData.clicked = clicked
    }

    const { error: updateError } = await supabaseAdmin
      .from('notifications')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id) // Sécurité: seulement ses propres notifs

    if (updateError) {
      console.error('❌ Erreur mise à jour notification:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update notification' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { id, ...updateData }
    })

  } catch (error: any) {
    console.error('❌ Error in PATCH /api/notifications/[id]:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/notifications/[id] - Supprimer une notification
export async function DELETE(
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

    const { id } = params

    // Supprimer la notification
    const { error: deleteError } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // Sécurité: seulement ses propres notifs

    if (deleteError) {
      console.error('❌ Erreur suppression notification:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Failed to delete notification' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { id }
    })

  } catch (error: any) {
    console.error('❌ Error in DELETE /api/notifications/[id]:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

