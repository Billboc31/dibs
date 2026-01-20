-- ============================================
-- SCRIPT DE MIGRATION : Table notifications
-- ============================================

-- OPTION 1: Si tu veux GARDER les notifications existantes, ajoute les colonnes manquantes
-- (Recommandé si tu as déjà des notifications importantes)

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS event_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS event_name TEXT,
ADD COLUMN IF NOT EXISTS event_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS event_venue TEXT,
ADD COLUMN IF NOT EXISTS event_city TEXT,
ADD COLUMN IF NOT EXISTS event_country VARCHAR(2),
ADD COLUMN IF NOT EXISTS event_url TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS clicked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- Ajouter la contrainte unique si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_user_event'
    ) THEN
        ALTER TABLE notifications 
        ADD CONSTRAINT unique_user_event UNIQUE(user_id, event_id, type);
    END IF;
END $$;

-- Créer les index s'ils n'existent pas
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_event_date ON notifications(event_date);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Vérifier les colonnes finales
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;



