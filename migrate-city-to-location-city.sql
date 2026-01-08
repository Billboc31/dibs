-- Migration: Uniformisation des colonnes de localisation
-- Copie les données de city/country vers location_city/location_country
-- et supprime les anciennes colonnes

-- ============================================
-- ÉTAPE 1: Copier les données existantes
-- ============================================

-- Copier city → location_city (seulement si location_city est NULL)
UPDATE users 
SET location_city = city 
WHERE city IS NOT NULL 
  AND (location_city IS NULL OR location_city = '');

-- Copier country → location_country (seulement si location_country est NULL)
UPDATE users 
SET location_country = country 
WHERE country IS NOT NULL 
  AND (location_country IS NULL OR location_country = '');

-- ============================================
-- ÉTAPE 2: Vérifier les données avant suppression
-- ============================================

-- Afficher les utilisateurs qui ont des données dans les deux colonnes
SELECT 
  id, 
  email,
  city as old_city,
  location_city as new_city,
  country as old_country,
  location_country as new_country
FROM users
WHERE city IS NOT NULL OR country IS NOT NULL
LIMIT 10;

-- Compter les utilisateurs concernés
SELECT 
  COUNT(*) as total_users,
  COUNT(city) as users_with_city,
  COUNT(country) as users_with_country,
  COUNT(location_city) as users_with_location_city,
  COUNT(location_country) as users_with_location_country
FROM users;

-- ============================================
-- ÉTAPE 3: Supprimer les anciennes colonnes
-- ============================================
-- ⚠️ ATTENTION: Cette opération est IRRÉVERSIBLE !
-- ⚠️ Assurez-vous que les données ont bien été copiées avant d'exécuter cette étape

-- Décommenter les lignes ci-dessous pour supprimer les colonnes:

-- ALTER TABLE users DROP COLUMN IF EXISTS city;
-- ALTER TABLE users DROP COLUMN IF EXISTS country;

-- ============================================
-- ÉTAPE 4: Vérification finale
-- ============================================

-- Vérifier que les colonnes ont été supprimées
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name IN ('city', 'country', 'location_city', 'location_country')
ORDER BY column_name;

-- ============================================
-- NOTES
-- ============================================
-- 
-- Si vous devez annuler la migration (avant suppression):
-- UPDATE users SET city = location_city WHERE location_city IS NOT NULL;
-- UPDATE users SET country = location_country WHERE location_country IS NOT NULL;
--
-- Colonnes finales dans la table users:
-- - location_city (VARCHAR)
-- - location_country (VARCHAR)  
-- - location_lat (NUMERIC)
-- - location_lng (NUMERIC)
-- - notification_radius_km (INTEGER, défaut: 50)

