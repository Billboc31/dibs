import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/qr/scan - Scanner un QR code
export async function POST(request: NextRequest) {
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

    // Récupérer le code
    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Code is required' },
        { status: 400 }
      )
    }

    console.log(`📱 Scanning QR code: ${code} for user ${user.id}`)

    // Vérifier que le QR code existe et est actif
    const { data: qrCode, error: qrError } = await supabaseAdmin
      .from('qr_codes')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single()

    if (qrError || !qrCode) {
      console.log(`❌ QR code not found or inactive: ${code}`)
      return NextResponse.json(
        { success: false, error: 'Invalid or inactive QR code' },
        { status: 400 }
      )
    }

    // Vérifier si déjà scanné par cet utilisateur
    const { data: existingScan } = await supabaseAdmin
      .from('qr_scans')
      .select('id')
      .eq('user_id', user.id)
      .eq('qr_code_id', qrCode.id)
      .single()

    if (existingScan) {
      console.log(`⚠️ QR code already scanned by user ${user.id}`)
      return NextResponse.json(
        { success: false, error: 'QR code already scanned' },
        { status: 400 }
      )
    }

    // Enregistrer le scan
    const { error: scanError } = await supabaseAdmin
      .from('qr_scans')
      .insert({
        user_id: user.id,
        qr_code_id: qrCode.id,
        points_earned: qrCode.points_value || 0
      })

    if (scanError) {
      console.error('❌ Error recording scan:', scanError)
      return NextResponse.json(
        { success: false, error: 'Failed to record scan' },
        { status: 500 }
      )
    }

    // Si le QR code est lié à un artiste, ajouter les points
    if (qrCode.artist_id) {
      const { data: existingArtist } = await supabaseAdmin
        .from('user_artists')
        .select('fanitude_points')
        .eq('user_id', user.id)
        .eq('artist_id', qrCode.artist_id)
        .single()

      if (existingArtist) {
        // Artiste déjà suivi, ajouter les points
        await supabaseAdmin
          .from('user_artists')
          .update({
            fanitude_points: existingArtist.fanitude_points + (qrCode.points_value || 0)
          })
          .eq('user_id', user.id)
          .eq('artist_id', qrCode.artist_id)
      } else {
        // Artiste pas encore suivi, le créer
        await supabaseAdmin
          .from('user_artists')
          .insert({
            user_id: user.id,
            artist_id: qrCode.artist_id,
            fanitude_points: qrCode.points_value || 0,
            last_listening_minutes: 0
          })
      }
    }

    // Récupérer le nom de l'artiste si disponible
    let artistName = null
    if (qrCode.artist_id) {
      const { data: artist } = await supabaseAdmin
        .from('artists')
        .select('name')
        .eq('id', qrCode.artist_id)
        .single()
      artistName = artist?.name
    }

    console.log(`✅ QR code scanned successfully: ${code} (+${qrCode.points_value} points)`)
    
    return NextResponse.json({
      success: true,
      data: {
        points_earned: qrCode.points_value || 0,
        artist_name: artistName,
        item_type: qrCode.item_type,
        item_name: qrCode.item_name
      }
    })
  } catch (error: any) {
    console.error('❌ Error in POST /api/qr/scan:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}


