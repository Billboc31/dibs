# Architecture de Gestion des Artistes

## 🎯 **Problème résolu**

**Avant :** Table `artists` globale → Tous les users voyaient les mêmes artistes Spotify
**Maintenant :** Table `user_spotify_artists` par user → Chaque user voit SES artistes Spotify

## 📊 **Nouvelle Architecture**

### **Tables :**

1. **`user_spotify_artists`** - Artistes Spotify de chaque user
   ```sql
   - id (UUID)
   - user_id (UUID) → Référence vers auth.users
   - spotify_id (VARCHAR) → ID Spotify de l'artiste
   - name (VARCHAR) → Nom de l'artiste
   - image_url (TEXT) → Photo de l'artiste
   - popularity (INTEGER) → Score de popularité Spotify
   - followers_count (INTEGER) → Nombre de followers Spotify
   - genres (TEXT[]) → Array des genres musicaux
   ```

2. **`user_artists`** - Artistes sélectionnés par l'utilisateur
   ```sql
   - user_id (UUID) → Référence vers auth.users
   - artist_id (UUID) → Référence vers user_spotify_artists.id
   - fanitude_points (INTEGER) → Points de fanitude
   - last_listening_minutes (INTEGER) → Minutes d'écoute
   ```

3. **`artists`** - Artistes globaux (pour QR codes, événements, etc.)
   ```sql
   - Reste inchangée pour les fonctionnalités globales
   ```

## 🔄 **Flow de Synchronisation**

### **1. Connexion Spotify (/connect-platform)**
```
User clique "Connecter Spotify" 
→ OAuth Spotify 
→ Tokens sauvés dans user_streaming_platforms
→ syncSpotifyData() appelée automatiquement
→ Artistes du user sauvés dans user_spotify_artists
```

### **2. Récupération des artistes (/api/user/artists)**
```
User appelle /api/user/artists
→ Vérification connexion Spotify
→ Sync automatique depuis Spotify API (artistes récents)
→ Récupération depuis user_spotify_artists (SES artistes)
→ Join avec user_artists pour flag selected
→ Retour avec selected: true/false
```

### **3. Sélection d'artistes (/api/user/artists/toggle)**
```
User sélectionne un artiste
→ Vérification que l'artiste est dans user_spotify_artists
→ Ajout/suppression dans user_artists
→ L'artiste reste dans user_spotify_artists (ne disparaît pas)
```

## 🎯 **Avantages**

1. **Isolation par user** : Chaque user voit SES artistes Spotify
2. **Pas de pollution** : Les artistes d'un user n'affectent pas les autres
3. **Sync automatique** : Les artistes sont mis à jour depuis Spotify
4. **Persistance** : Les artistes ne disparaissent jamais
5. **Performance** : Requêtes optimisées par user_id

## 🔧 **Migration Nécessaire**

1. **Appliquer la migration SQL** : `002_create_user_spotify_artists.sql`
2. **Migrer les données existantes** (si nécessaire)
3. **Tester les endpoints** mis à jour

## 📱 **Impact Mobile**

- **Aucun changement** dans l'API mobile
- **Même format** de réponse
- **Même logique** de sélection/désélection
- **Mais maintenant** chaque user voit SES artistes uniquement

## 🧪 **Tests**

1. **User A** se connecte à Spotify → Voit ses artistes
2. **User B** se connecte à Spotify → Voit ses artistes (différents)
3. **User A** sélectionne des artistes → N'affecte pas User B
4. **Sync automatique** : Nouveaux artistes Spotify apparaissent
