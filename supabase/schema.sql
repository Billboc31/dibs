-- ============================================
-- DIBS - Schema Supabase
-- Backend pour app mobile + POC web
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: streaming_platforms
-- ============================================
CREATE TABLE streaming_platforms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    logo_url TEXT,
    color_hex VARCHAR(7),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default platforms
INSERT INTO streaming_platforms (name, slug, logo_url, color_hex) VALUES
    ('Spotify', 'spotify', null, '#1DB954'),
    ('Apple Music', 'apple_music', null, '#FC3C44'),
    ('Deezer', 'deezer', null, '#A238FF');

-- ============================================
-- TABLE: users (extension du profil Supabase Auth)
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE: artists
-- ============================================
CREATE TABLE artists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    spotify_id VARCHAR(100) UNIQUE,
    apple_music_id VARCHAR(100) UNIQUE,
    deezer_id VARCHAR(100) UNIQUE,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on external IDs
CREATE INDEX idx_artists_spotify ON artists(spotify_id);
CREATE INDEX idx_artists_apple ON artists(apple_music_id);
CREATE INDEX idx_artists_deezer ON artists(deezer_id);

-- ============================================
-- TABLE: user_streaming_platforms
-- Liaison user <-> plateforme de streaming
-- ============================================
CREATE TABLE user_streaming_platforms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform_id UUID NOT NULL REFERENCES streaming_platforms(id) ON DELETE CASCADE,
    platform_user_id VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_sync_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, platform_id)
);

CREATE INDEX idx_user_platforms_user ON user_streaming_platforms(user_id);

-- ============================================
-- TABLE: user_artists
-- Liaison user <-> artiste avec points de fanitude
-- ============================================
CREATE TABLE user_artists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    platform_id UUID REFERENCES streaming_platforms(id) ON DELETE SET NULL,
    fanitude_points INTEGER DEFAULT 0,
    last_listening_minutes INTEGER DEFAULT 0,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, artist_id)
);

CREATE INDEX idx_user_artists_user ON user_artists(user_id);
CREATE INDEX idx_user_artists_artist ON user_artists(artist_id);
CREATE INDEX idx_user_artists_points ON user_artists(fanitude_points DESC);

-- ============================================
-- TABLE: qr_codes
-- Codes QR scannables (albums, merch, etc.)
-- ============================================
CREATE TABLE qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(255) UNIQUE NOT NULL,
    artist_id UUID REFERENCES artists(id) ON DELETE SET NULL,
    points_value INTEGER NOT NULL DEFAULT 500,
    product_name VARCHAR(255),
    product_image_url TEXT,
    max_scans_per_user INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_qr_codes_code ON qr_codes(code);
CREATE INDEX idx_qr_codes_artist ON qr_codes(artist_id);

-- ============================================
-- TABLE: qr_scans
-- Historique des scans par utilisateur
-- ============================================
CREATE TABLE qr_scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    qr_code_id UUID NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
    points_earned INTEGER NOT NULL,
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8)
);

CREATE INDEX idx_qr_scans_user ON qr_scans(user_id);
CREATE INDEX idx_qr_scans_qr ON qr_scans(qr_code_id);

-- ============================================
-- TABLE: events
-- Concerts et événements
-- ============================================
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    doors_open_time TIME,
    show_start_time TIME,
    
    -- Lieu
    venue_name VARCHAR(255) NOT NULL,
    venue_address TEXT,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    country VARCHAR(100) NOT NULL,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    
    -- Infos vente (pour Phase 2)
    tickets_available BOOLEAN DEFAULT false,
    total_capacity INTEGER,
    ticket_sale_start_date TIMESTAMP WITH TIME ZONE,
    ticket_sale_end_date TIMESTAMP WITH TIME ZONE,
    base_price DECIMAL(10, 2),
    priority_sale_enabled BOOLEAN DEFAULT false,
    priority_sale_hours INTEGER DEFAULT 48,
    
    -- API externe
    external_api_id VARCHAR(255),
    external_api_source VARCHAR(50),
    external_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_events_artist ON events(artist_id);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_city ON events(city);
CREATE INDEX idx_events_location ON events(location_lat, location_lng);

-- ============================================
-- TABLE: user_events
-- Intérêt des users pour les events
-- ============================================
CREATE TABLE user_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'interested', -- interested, attending, purchased
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);

CREATE INDEX idx_user_events_user ON user_events(user_id);
CREATE INDEX idx_user_events_event ON user_events(event_id);

-- ============================================
-- TABLE: tickets (Phase 2 - structure prévue)
-- ============================================
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    qr_code_ticket VARCHAR(255) UNIQUE NOT NULL,
    
    -- Liens
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Placement
    section VARCHAR(100),
    row VARCHAR(20),
    seat_number VARCHAR(20),
    seat_type VARCHAR(50), -- standing, seated, vip, wheelchair
    
    -- Achat
    ticket_type VARCHAR(50) DEFAULT 'regular', -- priority_fan, regular, resale
    purchase_price DECIMAL(10, 2),
    fees DECIMAL(10, 2),
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, refunded, cancelled
    payment_intent_id VARCHAR(255),
    fanitude_points_at_purchase INTEGER,
    
    -- Statut
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMP WITH TIME ZONE,
    is_transferable BOOLEAN DEFAULT true,
    transferred_to_user_id UUID REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tickets_user ON tickets(user_id);
CREATE INDEX idx_tickets_event ON tickets(event_id);

-- ============================================
-- TABLE: leaderboards
-- Classements par artiste (cache pour performance)
-- ============================================
CREATE TABLE leaderboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rank_country INTEGER,
    rank_world INTEGER,
    fanitude_points INTEGER NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(artist_id, user_id)
);

CREATE INDEX idx_leaderboards_artist_rank ON leaderboards(artist_id, rank_world);
CREATE INDEX idx_leaderboards_user ON leaderboards(user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function: Auto update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_artists_updated_at BEFORE UPDATE ON artists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_artists_updated_at BEFORE UPDATE ON user_artists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_events_updated_at BEFORE UPDATE ON user_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaming_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Users: can read own profile, admins can read all
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- User streaming platforms: users can manage their own connections
CREATE POLICY "Users can view own platforms" ON user_streaming_platforms
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own platforms" ON user_streaming_platforms
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own platforms" ON user_streaming_platforms
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own platforms" ON user_streaming_platforms
    FOR DELETE USING (auth.uid() = user_id);

-- User artists: users can manage their own artists
CREATE POLICY "Users can view own artists" ON user_artists
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own artists" ON user_artists
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own artists" ON user_artists
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own artists" ON user_artists
    FOR DELETE USING (auth.uid() = user_id);

-- QR Scans: users can only see their own scans
CREATE POLICY "Users can view own scans" ON qr_scans
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scans" ON qr_scans
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User events: users can manage their event interests
CREATE POLICY "Users can view own event interests" ON user_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own event interests" ON user_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own event interests" ON user_events
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own event interests" ON user_events
    FOR DELETE USING (auth.uid() = user_id);

-- Tickets: users can only see their own tickets
CREATE POLICY "Users can view own tickets" ON tickets
    FOR SELECT USING (auth.uid() = user_id);

-- Public read access for reference tables
ALTER TABLE streaming_platforms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Streaming platforms are viewable by everyone" ON streaming_platforms
    FOR SELECT USING (true);

ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Artists are viewable by everyone" ON artists
    FOR SELECT USING (true);

ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "QR codes are viewable by everyone" ON qr_codes
    FOR SELECT USING (true);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events are viewable by everyone" ON events
    FOR SELECT USING (true);

ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leaderboards are viewable by everyone" ON leaderboards
    FOR SELECT USING (true);

-- ============================================
-- SAMPLE DATA (pour POC)
-- ============================================

-- Sample Artists
INSERT INTO artists (name, spotify_id, image_url) VALUES
    ('Lady Gaga', 'spotify_ladygaga', 'https://i.scdn.co/image/ab6761610000e5eb8fece891cbf373c2bf6c69ef'),
    ('Katy Perry', 'spotify_katyperry', 'https://i.scdn.co/image/ab6761610000e5eb63854222856e26ba6e09e0c2'),
    ('The Weeknd', 'spotify_theweeknd', 'https://i.scdn.co/image/ab6761610000e5eb214f3cf1cbe7139c1e26ffbb'),
    ('Ava Max', 'spotify_avamax', 'https://i.scdn.co/image/ab6761610000e5eb3a8a1d18d6e0ca2be8f7a42e'),
    ('Taylor Swift', 'spotify_taylorswift', 'https://i.scdn.co/image/ab6761610000e5ebe672b5f553298dcdccb0e676'),
    ('Eminem', 'spotify_eminem', 'https://i.scdn.co/image/ab6761610000e5eba00b11c129b27a88fc72f36b');

-- Sample QR Codes
INSERT INTO qr_codes (code, artist_id, points_value, product_name, product_image_url) VALUES
    ('ALBUM_MAYHEM_2024', (SELECT id FROM artists WHERE name = 'Lady Gaga'), 500, 'Mayhem Vinyl (Collector Edition)', null),
    ('MERCH_WEEKND_TOUR', (SELECT id FROM artists WHERE name = 'The Weeknd'), 300, 'After Hours Tour T-Shirt', null),
    ('ALBUM_KATY_SMILE', (SELECT id FROM artists WHERE name = 'Katy Perry'), 500, 'Smile Album Deluxe', null);

-- Sample Events
INSERT INTO events (artist_id, name, event_date, venue_name, city, country, location_lat, location_lng) VALUES
    ((SELECT id FROM artists WHERE name = 'Lady Gaga'), 'Lady Gaga - Chromatica Ball', '2025-07-15 20:30:00+02', 'AccorHotels Arena', 'Paris', 'France', 48.8394, 2.3795),
    ((SELECT id FROM artists WHERE name = 'The Weeknd'), 'The Weeknd - After Hours Tour', '2025-08-22 21:00:00+02', 'Stade de France', 'Saint-Denis', 'France', 48.9245, 2.3601),
    ((SELECT id FROM artists WHERE name = 'Katy Perry'), 'Katy Perry - Play Residency', '2025-09-10 20:00:00+02', 'La Seine Musicale', 'Boulogne-Billancourt', 'France', 48.8277, 2.2280);

-- ============================================
-- END OF SCHEMA
-- ============================================


