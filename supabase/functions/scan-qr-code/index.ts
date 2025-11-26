// Edge Function: Scan a QR code and add points
// POST /functions/v1/scan-qr-code
// Body: { qr_code: string }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Parse request
    const { qr_code } = await req.json()

    if (!qr_code) {
      throw new Error('qr_code is required')
    }

    // Check if QR code exists and is active
    const { data: qrCodeData, error: qrError } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('code', qr_code)
      .eq('is_active', true)
      .single()

    if (qrError || !qrCodeData) {
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive QR code' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Check if already scanned
    const { data: existingScans } = await supabase
      .from('qr_scans')
      .select('id')
      .eq('user_id', user.id)
      .eq('qr_code_id', qrCodeData.id)

    if (existingScans && existingScans.length >= qrCodeData.max_scans_per_user) {
      return new Response(
        JSON.stringify({ error: 'QR code already scanned' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
      )
    }

    // Record scan
    const { error: scanError } = await supabase
      .from('qr_scans')
      .insert({
        user_id: user.id,
        qr_code_id: qrCodeData.id,
        points_earned: qrCodeData.points_value,
        scanned_at: new Date().toISOString(),
      })

    if (scanError) throw scanError

    // Update fanitude points if artist is linked
    if (qrCodeData.artist_id) {
      const { data: userArtist } = await supabase
        .from('user_artists')
        .select('fanitude_points')
        .eq('user_id', user.id)
        .eq('artist_id', qrCodeData.artist_id)
        .single()

      if (userArtist) {
        await supabase
          .from('user_artists')
          .update({
            fanitude_points: userArtist.fanitude_points + qrCodeData.points_value,
          })
          .eq('user_id', user.id)
          .eq('artist_id', qrCodeData.artist_id)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        points_earned: qrCodeData.points_value,
        qr_code_id: qrCodeData.id,
        product_name: qrCodeData.product_name,
        artist_id: qrCodeData.artist_id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})



