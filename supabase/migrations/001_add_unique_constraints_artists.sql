-- ============================================
-- Migration: Add UNIQUE constraints to artists table
-- Date: 2024-11-14
-- ============================================

-- Add UNIQUE constraint on spotify_id (allow NULL for artists without Spotify)
ALTER TABLE artists 
ADD CONSTRAINT artists_spotify_id_unique 
UNIQUE (spotify_id);

-- Add UNIQUE constraint on apple_music_id (allow NULL)
ALTER TABLE artists 
ADD CONSTRAINT artists_apple_music_id_unique 
UNIQUE (apple_music_id);

-- Add UNIQUE constraint on deezer_id (allow NULL)
ALTER TABLE artists 
ADD CONSTRAINT artists_deezer_id_unique 
UNIQUE (deezer_id);

-- Note: PostgreSQL automatically allows multiple NULL values
-- with UNIQUE constraints, which is perfect for our use case


