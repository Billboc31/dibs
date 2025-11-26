-- ============================================
-- Script de réinitialisation des données utilisateur
-- Pour démo/test
-- ============================================

-- ATTENTION : Ce script supprime TOUTES les données de l'utilisateur
-- Remplace 'YOUR_USER_ID' par ton vrai ID utilisateur

-- 1. Supprimer les artistes de l'utilisateur
DELETE FROM user_artists 
WHERE user_id = 'YOUR_USER_ID';

-- 2. Supprimer les connexions aux plateformes de streaming
DELETE FROM user_streaming_platforms 
WHERE user_id = 'YOUR_USER_ID';

-- 3. Supprimer les scans QR de l'utilisateur
DELETE FROM qr_scans 
WHERE user_id = 'YOUR_USER_ID';

-- 4. Supprimer les intérêts événements de l'utilisateur
DELETE FROM user_events 
WHERE user_id = 'YOUR_USER_ID';

-- 5. Supprimer les tickets de l'utilisateur
DELETE FROM tickets 
WHERE user_id = 'YOUR_USER_ID';

-- 6. Supprimer les positions leaderboard de l'utilisateur
DELETE FROM leaderboards 
WHERE user_id = 'YOUR_USER_ID';

-- 7. (Optionnel) Réinitialiser le profil utilisateur
UPDATE users 
SET 
  display_name = NULL,
  avatar_url = NULL,
  city = NULL,
  country = NULL,
  location_lat = NULL,
  location_lng = NULL,
  updated_at = NOW()
WHERE id = 'YOUR_USER_ID';

-- ============================================
-- Vérification après suppression
-- ============================================

-- Compter les données restantes
SELECT 
  (SELECT COUNT(*) FROM user_artists WHERE user_id = 'YOUR_USER_ID') as artistes,
  (SELECT COUNT(*) FROM user_streaming_platforms WHERE user_id = 'YOUR_USER_ID') as platforms,
  (SELECT COUNT(*) FROM qr_scans WHERE user_id = 'YOUR_USER_ID') as scans,
  (SELECT COUNT(*) FROM user_events WHERE user_id = 'YOUR_USER_ID') as events,
  (SELECT COUNT(*) FROM tickets WHERE user_id = 'YOUR_USER_ID') as tickets,
  (SELECT COUNT(*) FROM leaderboards WHERE user_id = 'YOUR_USER_ID') as leaderboard;

-- Devrait retourner 0 pour toutes les colonnes


