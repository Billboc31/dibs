-- Table pour stocker les concerts des artistes
-- Synchronisée avec l'API Ticketmaster pour éviter trop d'appels API

CREATE TABLE concerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relation avec l'artiste
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  
  -- ID unique Ticketmaster (garantit pas de doublons)
  ticketmaster_event_id VARCHAR(255) UNIQUE NOT NULL,
  
  -- Informations du concert
  event_name TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Lieu
  venue_name TEXT,
  venue_city TEXT,
  venue_country VARCHAR(2) DEFAULT 'FR',
  venue_lat DECIMAL(10, 8),
  venue_lng DECIMAL(11, 8),
  
  -- Liens et médias
  event_url TEXT,
  image_url TEXT,
  
  -- Metadata pour la synchronisation
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contrainte unique : un événement Ticketmaster ne peut être qu'une seule fois en BDD
  CONSTRAINT unique_ticketmaster_event UNIQUE(ticketmaster_event_id),
  
  -- Contrainte : pas de doublons artist + event
  CONSTRAINT unique_artist_event UNIQUE(artist_id, ticketmaster_event_id)
);

-- Index pour performance
CREATE INDEX idx_concerts_artist ON concerts(artist_id);
CREATE INDEX idx_concerts_date ON concerts(event_date);
CREATE INDEX idx_concerts_sync ON concerts(last_synced_at);
CREATE INDEX idx_concerts_location ON concerts(venue_lat, venue_lng);
CREATE INDEX idx_concerts_country ON concerts(venue_country);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_concerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER concerts_updated_at
BEFORE UPDATE ON concerts
FOR EACH ROW
EXECUTE FUNCTION update_concerts_updated_at();

