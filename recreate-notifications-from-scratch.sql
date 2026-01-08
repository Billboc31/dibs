-- ============================================
-- RECRÉER LA TABLE NOTIFICATIONS COMPLÈTEMENT
-- ⚠️ ATTENTION : Ceci supprime toutes les notifications existantes !
-- ============================================

-- 1. Supprimer la table actuelle (et toutes les notifications)
DROP TABLE IF EXISTS notifications CASCADE;

-- 2. Recréer la table avec la bonne structure
CREATE TABLE notifications (
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

-- 3. Créer les index
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read, created_at DESC);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_event_date ON notifications(event_date);
CREATE INDEX idx_notifications_type ON notifications(type);

-- 4. Activer RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 5. Recréer les policies
DROP POLICY IF EXISTS notifications_select_policy ON notifications;
DROP POLICY IF EXISTS notifications_update_policy ON notifications;
DROP POLICY IF EXISTS notifications_delete_policy ON notifications;

CREATE POLICY notifications_select_policy ON notifications
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY notifications_update_policy ON notifications
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY notifications_delete_policy ON notifications
    FOR DELETE
    USING (auth.uid() = user_id);

-- 6. Ajouter les commentaires
COMMENT ON TABLE notifications IS 'Notifications pour les utilisateurs (concerts, nouveaux albums, etc.)';
COMMENT ON COLUMN notifications.event_id IS 'ID externe de l''événement (Ticketmaster, etc.)';

-- 7. Vérifier la structure finale
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;


