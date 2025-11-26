// Edge Function: Sync user's streaming data
// POST /functions/v1/sync-streaming-data
// Body: { platform: 'spotify' | 'deezer' | 'apple_music' }

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

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { platform } = await req.json()

    // Get user's platform token
    const { data: platformData } = await supabase
      .from('user_streaming_platforms')
      .select('access_token')
      .eq('user_id', user.id)
      .eq('streaming_platforms.slug', platform)
      .single()

    if (!platformData?.access_token) {
      throw new Error('Platform not connected')
    }

    let topArtists = []

    // Call appropriate streaming API
    if (platform === 'spotify') {
      const response = await fetch(
        'https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=50',
        {
          headers: {
            Authorization: `Bearer ${platformData.access_token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch Spotify data')
      }

      const data = await response.json()
      topArtists = data.items || []
    }
    // Add Deezer, Apple Music support here

    // Update database with artists data
    let syncedCount = 0
    for (const artist of topArtists) {
      // Upsert artist
      const { data: dbArtist } = await supabase
        .from('artists')
        .upsert({
          name: artist.name,
          spotify_id: artist.id,
          image_url: artist.images?.[0]?.url,
        }, { onConflict: 'spotify_id' })
        .select()
        .single()

      if (dbArtist) {
        // Update user_artists with points
        await supabase
          .from('user_artists')
          .upsert({
            user_id: user.id,
            artist_id: dbArtist.id,
            fanitude_points: 100, // Base points, refine with actual listening data
            last_sync_at: new Date().toISOString(),
          }, { onConflict: 'user_id,artist_id' })

        syncedCount++
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        synced: syncedCount,
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



