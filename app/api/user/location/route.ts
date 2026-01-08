import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// PATCH /api/user/location - Mettre à jour la localisation de l'utilisateur
export async function PATCH(request: NextRequest) {
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

    const body = await request.json()
    const { city, country, lat, lng, radius_km } = body

    if (!city) {
      return NextResponse.json(
        { success: false, error: 'City is required' },
        { status: 400 }
      )
    }

    // Mettre à jour la localisation de l'utilisateur
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        location_city: city,
        location_country: country || null,
        location_lat: lat || null,
        location_lng: lng || null,
        notification_radius_km: radius_km || 50,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select('location_city, location_country, location_lat, location_lng, notification_radius_km')
      .single()

    if (updateError) {
      console.error('❌ Erreur mise à jour localisation:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update location' },
        { status: 500 }
      )
    }

    console.log(`✅ Localisation mise à jour pour user ${user.id}: ${city}`)

    return NextResponse.json({
      success: true,
      data: {
        city: updatedUser.location_city,
        country: updatedUser.location_country,
        lat: updatedUser.location_lat,
        lng: updatedUser.location_lng,
        radius_km: updatedUser.notification_radius_km
      }
    })

  } catch (error: any) {
    console.error('❌ Error in PATCH /api/user/location:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// GET /api/user/location - Récupérer la localisation de l'utilisateur
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

    // Récupérer la localisation de l'utilisateur
    const { data: userData, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('location_city, location_country, location_lat, location_lng, notification_radius_km')
      .eq('id', user.id)
      .single()

    if (fetchError) {
      console.error('❌ Erreur récupération localisation:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch location' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        city: userData.location_city,
        country: userData.location_country,
        lat: userData.location_lat,
        lng: userData.location_lng,
        radius_km: userData.notification_radius_km || 50
      }
    })

  } catch (error: any) {
    console.error('❌ Error in GET /api/user/location:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
