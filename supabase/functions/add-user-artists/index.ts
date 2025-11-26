// Edge Function: Add or update user's artists
// POST /functions/v1/add-user-artists
// Body: { artist_ids: string[] }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with user's token
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

    // Parse request body
    const { artist_ids } = await req.json()

    if (!Array.isArray(artist_ids)) {
      throw new Error('artist_ids must be an array')
    }

    // Ensure user profile exists
    await supabase.from('users').upsert({
      id: user.id,
      email: user.email,
    }, { onConflict: 'id' })

    // Delete all existing artists
    const { error: deleteError } = await supabase
      .from('user_artists')
      .delete()
      .eq('user_id', user.id)

    if (deleteError) throw deleteError

    // Insert new artists
    if (artist_ids.length > 0) {
      const artistsToAdd = artist_ids.map(artist_id => ({
        user_id: user.id,
        artist_id,
        fanitude_points: 0,
        last_listening_minutes: 0,
        last_sync_at: new Date().toISOString(),
      }))

      const { error: insertError } = await supabase
        .from('user_artists')
        .insert(artistsToAdd)

      if (insertError) throw insertError
    }

    return new Response(
      JSON.stringify({
        success: true,
        count: artist_ids.length,
        message: `${artist_ids.length} artists saved`,
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



