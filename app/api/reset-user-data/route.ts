import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Get user from request body
    const body = await request.json()
    const userId = body.userId
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId manquant' },
        { status: 400 }
      )
    }

    console.log('🔄 Réinitialisation des données pour:', userId)

    // Delete user artists
    const { error: artistsError } = await supabaseAdmin
      .from('user_artists')
      .delete()
      .eq('user_id', userId)

    if (artistsError) {
      console.error('❌ Erreur suppression artistes:', artistsError)
    } else {
      console.log('✅ Artistes supprimés')
    }

    // Delete streaming platforms connections
    const { error: platformsError } = await supabaseAdmin
      .from('user_streaming_platforms')
      .delete()
      .eq('user_id', userId)

    if (platformsError) {
      console.error('❌ Erreur suppression plateformes:', platformsError)
    } else {
      console.log('✅ Connexions plateformes supprimées')
    }

    // Delete QR scans
    const { error: scansError } = await supabaseAdmin
      .from('qr_scans')
      .delete()
      .eq('user_id', userId)

    if (scansError) {
      console.error('❌ Erreur suppression scans:', scansError)
    } else {
      console.log('✅ Scans QR supprimés')
    }

    // Delete user events
    const { error: eventsError } = await supabaseAdmin
      .from('user_events')
      .delete()
      .eq('user_id', userId)

    if (eventsError) {
      console.error('❌ Erreur suppression événements:', eventsError)
    } else {
      console.log('✅ Événements supprimés')
    }

    // Delete leaderboards
    const { error: leaderboardError } = await supabaseAdmin
      .from('leaderboards')
      .delete()
      .eq('user_id', userId)

    if (leaderboardError) {
      console.error('❌ Erreur suppression leaderboard:', leaderboardError)
    } else {
      console.log('✅ Leaderboard supprimé')
    }

    // Reset user profile
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .update({
        display_name: null,
        avatar_url: null,
        city: null,
        country: null,
        location_lat: null,
        location_lng: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (profileError) {
      console.error('❌ Erreur reset profil:', profileError)
    } else {
      console.log('✅ Profil réinitialisé')
    }

    console.log('🎉 Réinitialisation terminée !')

    return NextResponse.json({
      success: true,
      message: 'Toutes tes données ont été réinitialisées'
    })
  } catch (error) {
    console.error('❌ Erreur réinitialisation:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la réinitialisation' },
      { status: 500 }
    )
  }
}

