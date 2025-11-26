import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// PUT /api/user/location - Mettre à jour la localisation
export async function PUT(request: NextRequest) {
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

    // Récupérer les données de localisation
    const body = await request.json()
    const { city, country, location_lat, location_lng } = body

    if (!city || !country) {
      return NextResponse.json(
        { success: false, error: 'City and country are required' },
        { status: 400 }
      )
    }

    // Mettre à jour la localisation
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        city,
        country,
        location_lat: location_lat || null,
        location_lng: location_lng || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating location:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update location' },
        { status: 500 }
      )
    }

    console.log(`✅ Location updated for user ${user.id}: ${city}, ${country}`)
    return NextResponse.json({ success: true, data: updatedProfile })
  } catch (error: any) {
    console.error('❌ Error in PUT /api/user/location:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}


