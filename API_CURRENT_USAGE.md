# 📋 Endpoints API actuellement utilisés par le Frontend

Cette documentation liste **UNIQUEMENT** les endpoints backend qui sont réellement appelés par le frontend de l'application DIBS.

---

## 🎯 Endpoints utilisés (2 au total)

### 1️⃣ **Synchroniser Spotify**
```
POST /api/sync-spotify
```

**Utilisé par :**
- `/select-artists` - Synchronisation automatique au chargement de la page
- `/select-artists` - Bouton "🔄 Resynchroniser manuellement"

**Fichier :** `app/select-artists/page.tsx` (lignes 62 et 236)

**Body :**
```json
{
  "userId": "uuid-de-l-utilisateur"
}
```

**Réponse :**
```json
{
  "success": true,
  "synced": 8,
  "message": "8 artistes synchronisés"
}
```

**Ce que ça fait :**
- Récupère les top artists de Spotify
- Récupère les followed artists
- Récupère les artistes des recently played tracks
- Calcule les points de fanitude
- Sauvegarde tout dans la base de données

**Code utilisé :**
```javascript
// app/select-artists/page.tsx
const response = await fetch('/api/sync-spotify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: user.id })
})
const result = await response.json()
console.log(`✅ ${result.synced} artistes synchronisés`)
```

---

### 2️⃣ **Réinitialiser les données utilisateur**
```
POST /api/reset-user-data
```

**Utilisé par :**
- `/settings` - Bouton "🔄 Réinitialiser mes données"

**Fichier :** `app/settings/page.tsx` (ligne 32)

**Body :**
```json
{
  "userId": "uuid-de-l-utilisateur"
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Toutes tes données ont été réinitialisées"
}
```

**Ce que ça fait :**
- Supprime tous les artistes suivis
- Supprime les connexions aux plateformes (Spotify, etc.)
- Supprime les scans QR
- Supprime les intérêts événements
- Réinitialise le profil utilisateur

**Code utilisé :**
```javascript
// app/settings/page.tsx
const response = await fetch('/api/reset-user-data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: user.id })
})
```

---

## 🚫 Endpoints NON utilisés actuellement

Ces endpoints sont documentés dans Swagger mais **ne sont pas appelés par le frontend** :

### ❌ OAuth Callbacks
- `GET /api/auth/spotify/callback` - Géré automatiquement par Next.js (redirection)
- `GET /api/auth/deezer/callback` - Deprecated

### ❌ Supabase Edge Functions
- `POST /functions/v1/add-user-artists` - **Remplacé** par la logique direct de `select-artists/page.tsx` qui utilise Supabase client
- `POST /functions/v1/scan-qr-code` - **Non implémenté** dans le frontend actuel
- `POST /functions/v1/sync-streaming-data` - **Non utilisé**, remplacé par `/api/sync-spotify`

---

## 📊 Flow complet de l'application

### **1. Connexion Spotify**
```
Page: /connect-platform
    ↓
Clique "Connecter Spotify"
    ↓
Redirection OAuth Spotify
    ↓
GET /api/auth/spotify/callback (automatique)
    ↓
Sauvegarde du token
    ↓
POST /api/sync-spotify (automatique)
    ↓
Redirection /select-artists
```

### **2. Sélection des artistes**
```
Page: /select-artists
    ↓
Chargement automatique:
  - POST /api/sync-spotify
  - Chargement des artistes depuis Supabase
    ↓
Utilisateur sélectionne des artistes
    ↓
Clique "Continue"
    ↓
Sauvegarde via Supabase client (pas d'API call)
    ↓
Redirection /home
```

### **3. Réinitialisation (démo)**
```
Page: /settings
    ↓
Clique "🔄 Réinitialiser mes données"
    ↓
POST /api/reset-user-data
    ↓
Redirection /connect-platform
```

---

## 🔍 Interactions Supabase directes

Le frontend fait aussi des **requêtes directes à Supabase** (pas via API) :

### Lecture de données
- `supabase.from('artists').select()` - Liste des artistes
- `supabase.from('user_artists').select()` - Artistes de l'utilisateur
- `supabase.from('user_streaming_platforms').select()` - Plateformes connectées
- `supabase.from('events').select()` - Événements
- `supabase.from('users').select()` - Profil utilisateur

### Écriture de données
- `supabase.from('user_artists').insert()` - Sauvegarder artistes sélectionnés
- `supabase.from('user_artists').delete()` - Supprimer artistes
- `supabase.from('users').upsert()` - Créer/mettre à jour profil

**Fichiers concernés :**
- `app/select-artists/page.tsx`
- `app/home/page.tsx`
- `app/profile/page.tsx`
- `app/community/[artistId]/page.tsx`
- `app/connect-platform/page.tsx`

---

## 📚 Documentation complète

Pour voir la documentation Swagger complète (y compris les endpoints non utilisés) :

```
http://127.0.0.1:3001/api-docs
```

---

## 🎯 Résumé

**Endpoints API réellement utilisés : 2**
1. ✅ `POST /api/sync-spotify`
2. ✅ `POST /api/reset-user-data`

**Tout le reste passe par :**
- Supabase client-side (lecture/écriture directe)
- OAuth redirections (automatiques)

---

**Date:** 19/11/2024  
**Version:** 1.0.0


