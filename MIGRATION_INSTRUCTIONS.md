# 🔄 Instructions de Migration Supabase

## Problème résolu

Cette migration ajoute les contraintes UNIQUE manquantes sur les colonnes `spotify_id`, `apple_music_id` et `deezer_id` de la table `artists`.

Sans ces contraintes, l'upsert échoue avec l'erreur :
```
there is no unique or exclusion constraint matching the ON CONFLICT specification
```

## 📝 Étapes pour appliquer la migration

### Option 1 : Via l'interface Supabase (Recommandé)

1. **Va sur ton dashboard Supabase** : https://supabase.com/dashboard
2. **Sélectionne ton projet**
3. **SQL Editor** (dans le menu de gauche)
4. **New Query**
5. **Copie et colle le contenu du fichier** `supabase/migrations/001_add_unique_constraints_artists.sql`
6. **Run** (ou Ctrl+Enter)

### Option 2 : Via le CLI Supabase (si installé)

```bash
# Si tu as le CLI Supabase installé
supabase db push
```

## 🧪 Vérification

Après avoir appliqué la migration, tu peux vérifier que tout fonctionne :

1. **Vérifie les contraintes** dans le SQL Editor :
```sql
SELECT
    conname AS constraint_name,
    contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'artists'::regclass
AND contype = 'u';
```

Tu devrais voir :
- `artists_spotify_id_unique`
- `artists_apple_music_id_unique`
- `artists_deezer_id_unique`

2. **Teste la synchronisation Spotify** :
   - Va sur `/select-artists`
   - Clique sur "🔄 Resynchroniser Spotify"
   - Cette fois, ça devrait fonctionner ! 🎉

## 📋 Contenu de la migration

```sql
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
```

## ⚠️ Note importante

PostgreSQL permet automatiquement plusieurs valeurs NULL avec les contraintes UNIQUE, ce qui est parfait pour notre cas d'usage (certains artistes peuvent ne pas avoir de `spotify_id`, par exemple).


