-- ============================================
-- Migration: Ajout du système de notifications concerts
-- Date: 2025-01-03
-- ============================================

-- 1. Ajouter les colonnes de localisation à la table users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS location_city VARCHAR(255),
ADD COLUMN IF NOT EXISTS location_country VARCHAR(2),
ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS location_lng DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS notification_radius_km INTEGER DEFAULT 50;

-- 2. Ajouter un ID Ticketmaster dans la table artists
ALTER TABLE artists
ADD COLUMN IF NOT EXISTS ticketmaster_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_artists_ticketmaster ON artists(ticketmaster_id);

-- 3. Créer la table des notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    
    -- Type de notification
    type VARCHAR(50) NOT NULL, -- 'concert', 'new_album', 'qr_code', etc.
    
    -- Contenu de la notification
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    
    -- Données spécifiques au concert
    event_id VARCHAR(255), -- ID externe (Ticketmaster, Bandsintown)
    event_name TEXT,
    event_date TIMESTAMP WITH TIME ZONE,
    event_venue TEXT,
    event_city TEXT,
    event_country VARCHAR(2),
    event_url TEXT,
    
    -- Image (optionnelle)
    image_url TEXT,
    
    -- Métadonnées
    read BOOLEAN DEFAULT FALSE,
    clicked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Contrainte unique pour éviter les doublons
    CONSTRAINT unique_user_event UNIQUE(user_id, event_id, type)
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_event_date ON notifications(event_date);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- 4. Enable RLS sur notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own notifications
CREATE POLICY notifications_select_policy ON notifications
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY notifications_update_policy ON notifications
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own notifications
CREATE POLICY notifications_delete_policy ON notifications
    FOR DELETE
    USING (auth.uid() = user_id);

-- 5. Commentaires pour documentation
COMMENT ON TABLE notifications IS 'Notifications pour les utilisateurs (concerts, nouveaux albums, etc.)';
COMMENT ON COLUMN users.location_city IS 'Ville de l''utilisateur pour les notifications de concerts';
COMMENT ON COLUMN users.notification_radius_km IS 'Rayon en km pour chercher des concerts (défaut: 50km)';
COMMENT ON COLUMN artists.ticketmaster_id IS 'ID de l''artiste sur Ticketmaster pour récupérer les concerts';

