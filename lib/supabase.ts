import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for server-side operations (bypasses RLS)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabase

// Types
export type User = {
  id: string
  email: string
  display_name?: string
  avatar_url?: string
  city?: string
  country?: string
  location_lat?: number
  location_lng?: number
  created_at: string
  updated_at: string
}

export type Artist = {
  id: string
  name: string
  spotify_id?: string
  apple_music_id?: string
  deezer_id?: string
  image_url?: string
  created_at: string
  updated_at: string
}

export type StreamingPlatform = {
  id: string
  name: string
  slug: string
  logo_url?: string
  color_hex?: string
  created_at: string
}

export type UserArtist = {
  id: string
  user_id: string
  artist_id: string
  platform_id?: string
  fanitude_points: number
  last_listening_minutes: number
  last_sync_at?: string
  created_at: string
  updated_at: string
}

export type QRCode = {
  id: string
  code: string
  artist_id?: string
  points_value: number
  product_name?: string
  product_image_url?: string
  max_scans_per_user: number
  is_active: boolean
  created_at: string
  expires_at?: string
}

export type QRScan = {
  id: string
  user_id: string
  qr_code_id: string
  points_earned: number
  scanned_at: string
  location_lat?: number
  location_lng?: number
}

export type Event = {
  id: string
  artist_id: string
  name: string
  event_date: string
  doors_open_time?: string
  show_start_time?: string
  venue_name: string
  venue_address?: string
  city: string
  postal_code?: string
  country: string
  location_lat?: number
  location_lng?: number
  tickets_available: boolean
  total_capacity?: number
  ticket_sale_start_date?: string
  ticket_sale_end_date?: string
  base_price?: number
  priority_sale_enabled: boolean
  priority_sale_hours: number
  external_api_id?: string
  external_api_source?: string
  external_url?: string
  created_at: string
  updated_at: string
}

export type UserEvent = {
  id: string
  user_id: string
  event_id: string
  status: 'interested' | 'attending' | 'purchased'
  created_at: string
  updated_at: string
}

export type Leaderboard = {
  id: string
  artist_id: string
  user_id: string
  rank_country?: number
  rank_world?: number
  fanitude_points: number
  calculated_at: string
}


