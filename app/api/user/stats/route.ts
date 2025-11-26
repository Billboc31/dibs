import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/user/stats - Statistiques utilisateur
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

    // Récupérer toutes les stats en parallèle
    const [
      { count: totalArtists },
      { data: pointsData },
      { count: totalEvents },
      { count: totalQrScans }
    ] = await Promise.all([
      // Nombre total d'artistes
      supabaseAdmin
        .from('user_artists')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
      
      // Points totaux (somme de tous les fanitude_points)
      supabaseAdmin
        .from('user_artists')
        .select('fanitude_points')
        .eq('user_id', user.id),
      
      // Nombre d'événements
      supabaseAdmin
        .from('user_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
      
      // Nombre de scans QR
      supabaseAdmin
        .from('qr_scans')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
    ])

    // Calculer le total des points
    const totalPoints = pointsData?.reduce((sum, item) => sum + (item.fanitude_points || 0), 0) || 0

    const stats = {
      total_artists: totalArtists || 0,
      total_points: totalPoints,
      total_events: totalEvents || 0,
      total_qr_scans: totalQrScans || 0
    }

    console.log(`✅ Fetched stats for user ${user.id}:`, stats)
    
    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error: any) {
    console.error('❌ Error in GET /api/user/stats:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}


