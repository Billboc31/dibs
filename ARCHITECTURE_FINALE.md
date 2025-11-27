# 🏗️ Architecture Finale - Gestion des Artistes

## ✅ **Architecture Simple et Efficace**

### **1. Table `artists` (Globale - Toutes plateformes)**
```sql
artists (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  spotify_id VARCHAR UNIQUE,
  apple_music_id VARCHAR UNIQUE, 
  deezer_id VARCHAR UNIQUE,
  image_url TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```
- **Contient TOUS les artistes de TOUTES les plateformes**
- **Partagée entre tous les utilisateurs**
- **Upsert automatique lors des syncs**

### **2. Table `user_artists` (Sélections utilisateur)**
```sql
user_artists (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  artist_id UUID REFERENCES artists(id),
  fanitude_points INTEGER DEFAULT 0,
  last_listening_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(user_id, artist_id)
)
```
- **Table de jointure pour les sélections**
- **Chaque user a ses propres sélections**
- **Contient les stats spécifiques au user**

## 🔄 **Flow Complet**

### **Quand user appelle `/api/user/artists` :**

1. **Vérification connexion Spotify** ✅
2. **Call Spotify API** → Récupère les artistes du user
3. **Upsert dans `artists`** → Ajoute les nouveaux artistes dans la table globale
4. **Fetch `artists` + `user_artists`** → Récupère tous les artistes avec flag `selected`
5. **Return avec pagination** → Artistes + statut de sélection

### **Quand user toggle un artiste :**

- **`selected: true`** → Insert dans `user_artists`
- **`selected: false`** → Delete de `user_artists`

## 🎯 **Avantages**

✅ **Simple** - Pas de duplication de données  
✅ **Scalable** - Table globale partagée  
✅ **Flexible** - Support multi-plateformes  
✅ **Performant** - Jointure simple  
✅ **Cohérent** - Un seul endroit pour les artistes  

## 📱 **Endpoints Mobiles**

- **`GET /api/user/artists`** → Liste avec sync auto
- **`POST /api/user/artists/toggle`** → Sélection/Désélection
- **`POST /api/user/artists/sync`** → Sync manuel (optionnel)

## 🔧 **Implémentation Actuelle**

Le code dans `/app/api/user/artists/route.ts` implémente exactement cette logique :

1. ✅ Vérification connexion Spotify
2. ✅ Sync automatique via `syncSpotifyData()`
3. ✅ Fetch depuis table `artists` globale
4. ✅ Jointure avec `user_artists` pour le flag `selected`
5. ✅ Pagination et stats complètes
