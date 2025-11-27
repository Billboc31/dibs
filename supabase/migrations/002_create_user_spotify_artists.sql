-- Migration: Créer table user_spotify_artists pour stocker les artistes Spotify de chaque user
-- Cette table remplace l'utilisation de la table artists globale pour les artistes Spotify

CREATE TABLE user_spotify_artists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spotify_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  image_url TEXT,
  popularity INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  genres TEXT[], -- Array de genres
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contraintes
  UNIQUE(user_id, spotify_id) -- Un user ne peut pas avoir le même artiste Spotify 2 fois
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_user_spotify_artists_user_id ON user_spotify_artists(user_id);
CREATE INDEX idx_user_spotify_artists_spotify_id ON user_spotify_artists(spotify_id);
CREATE INDEX idx_user_spotify_artists_name ON user_spotify_artists(name);

-- RLS (Row Level Security)
ALTER TABLE user_spotify_artists ENABLE ROW LEVEL SECURITY;

-- Politique : Un user ne peut voir que ses propres artistes Spotify
CREATE POLICY "Users can view their own Spotify artists" ON user_spotify_artists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Spotify artists" ON user_spotify_artists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Spotify artists" ON user_spotify_artists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Spotify artists" ON user_spotify_artists
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_spotify_artists_updated_at 
  BEFORE UPDATE ON user_spotify_artists 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
