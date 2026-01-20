-- Ajouter les colonnes manquantes à la table notifications
-- (Si elles existent déjà, ça ne fera rien grâce à IF NOT EXISTS)

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS event_city TEXT,
ADD COLUMN IF NOT EXISTS event_country VARCHAR(2),
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS clicked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- Vérifier que les colonnes existent maintenant
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'notifications'
  AND column_name IN ('event_city', 'event_country', 'image_url', 'clicked', 'read_at')
ORDER BY column_name;



