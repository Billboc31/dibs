# 📱 API Requirements pour App Mobile

## ⚠️ Problème identifié

Le frontend web actuel fait **33 requêtes directes à Supabase**. L'app mobile ne peut pas se connecter directement à Supabase, donc **tous ces appels doivent passer par des endpoints API**.

---

## 📋 Endpoints à créer (par page)

### 🏠 **Home** (`/home`)

#### Requêtes actuelles :
```typescript
// app/home/page.tsx
supabase.from('user_artists').select('fanitude_points, artists(*)')
supabase.from('events').select('*').gte('event_date', ...)
```

#### Endpoints nécessaires :
```
GET /api/user/top-artists
GET /api/events/upcoming
```

---

### 👤 **Profile** (`/profile`)

#### Requêtes actuelles :
```typescript
// app/profile/page.tsx
supabase.from('users').select('*')
supabase.from('user_artists').select('fanitude_points, artist_id, artists(*)')
supabase.from('user_events').select('event_id, events!inner(event_date)')
supabase.from('qr_scans').select('id')
```

#### Endpoints nécessaires :
```
GET /api/user/profile
GET /api/user/artists
GET /api/user/stats
```

---

### 🎤 **Select Artists** (`/select-artists`)

#### Requêtes actuelles :
```typescript
// app/select-artists/page.tsx
supabase.from('user_streaming_platforms').select('...')  
supabase.from('user_artists').select('...')
supabase.from('users').upsert({...})
supabase.from('user_artists').delete()
supabase.from('user_artists').insert([...])
```

#### Endpoints nécessaires :
```
GET /api/user/streaming-platforms
GET /api/user/artists
POST /api/user/artists/save
```

---

### 👥 **Community** (`/community/[artistId]`)

#### Requêtes actuelles :
```typescript
// app/community/[artistId]/page.tsx
supabase.from('artists').select('*').eq('id', artistId)
supabase.from('user_artists').select('...')
```

#### Endpoints nécessaires :
```
GET /api/artists/:id
GET /api/artists/:id/leaderboard
```

---

### 🔗 **Connect Platform** (`/connect-platform`)

#### Requêtes actuelles :
```typescript
// app/connect-platform/page.tsx
supabase.from('user_streaming_platforms').select('...')
supabase.from('users').upsert({...})
supabase.from('streaming_platforms').select('id')
supabase.from('user_streaming_platforms').insert({...})
```

#### Endpoints nécessaires :
```
GET /api/user/platforms
GET /api/platforms/list
```

---

### 📱 **QR Scan** (`/qr-scan` & `/qr-recap`)

#### Requêtes actuelles :
```typescript
// app/qr-scan/page.tsx & app/qr-recap/page.tsx
supabase.from('qr_codes').select('*')
supabase.from('qr_scans').select('*')
supabase.from('qr_scans').insert({...})
supabase.from('user_artists').select('fanitude_points')
supabase.from('user_artists').update({...})
```

#### Endpoints nécessaires :
```
POST /api/qr/scan
GET /api/qr/history
GET /api/qr/validate/:code
```

---

### 📍 **Location** (`/location`)

#### Requêtes actuelles :
```typescript
// app/location/page.tsx
supabase.from('users').update({ city, country, ... })
```

#### Endpoints nécessaires :
```
PUT /api/user/location
```

---

## 🎯 Liste complète des endpoints à créer

### 🔐 **Authentication**
- ✅ `GET /api/auth/spotify/callback` - **Existe**
- 🆕 `POST /api/auth/logout` - Déconnexion
- 🆕 `GET /api/auth/me` - Info utilisateur courant

### 👤 **User**
- ✅ `POST /api/reset-user-data` - **Existe**
- 🆕 `GET /api/user/profile` - Récupérer le profil
- 🆕 `PUT /api/user/profile` - Mettre à jour le profil
- 🆕 `PUT /api/user/location` - Mettre à jour la localisation
- 🆕 `GET /api/user/stats` - Statistiques utilisateur

### 🎤 **Artists**
- ✅ `POST /api/sync-spotify` - **Existe**
- 🆕 `GET /api/user/artists` - Liste des artistes suivis
- 🆕 `POST /api/user/artists/save` - Sauvegarder artistes sélectionnés
- 🆕 `GET /api/user/top-artists` - Top 3 artistes
- 🆕 `GET /api/artists/:id` - Détails d'un artiste
- 🆕 `GET /api/artists/:id/leaderboard` - Leaderboard d'un artiste

### 🔗 **Platforms**
- 🆕 `GET /api/platforms/list` - Liste des plateformes
- 🆕 `GET /api/user/platforms` - Plateformes connectées
- 🆕 `DELETE /api/user/platforms/:id` - Déconnecter une plateforme

### 📱 **QR Codes**
- 🆕 `POST /api/qr/scan` - Scanner un QR code
- 🆕 `GET /api/qr/history` - Historique des scans
- 🆕 `GET /api/qr/validate/:code` - Valider un QR code

### 📅 **Events**
- 🆕 `GET /api/events/upcoming` - Événements à venir
- 🆕 `GET /api/events/:id` - Détails d'un événement
- 🆕 `POST /api/events/:id/interested` - Marquer intéressé
- 🆕 `GET /api/user/events` - Événements de l'utilisateur

---

## 📊 Résumé

| Catégorie | Endpoints existants | Endpoints à créer | Total |
|-----------|--------------------:|------------------:|------:|
| Authentication | 1 | 2 | 3 |
| User | 1 | 4 | 5 |
| Artists | 1 | 5 | 6 |
| Platforms | 0 | 3 | 3 |
| QR Codes | 0 | 3 | 3 |
| Events | 0 | 4 | 4 |
| **TOTAL** | **3** | **21** | **24** |

---

## 🏗️ Architecture recommandée

### Structure des dossiers
```
app/api/
├── auth/
│   ├── spotify/callback/route.ts (✅ existe)
│   ├── logout/route.ts (🆕)
│   └── me/route.ts (🆕)
├── user/
│   ├── profile/route.ts (🆕)
│   ├── location/route.ts (🆕)
│   ├── stats/route.ts (🆕)
│   └── artists/
│       ├── route.ts (🆕 GET list)
│       ├── save/route.ts (🆕 POST)
│       └── top/route.ts (🆕 GET top 3)
├── artists/
│   └── [id]/
│       ├── route.ts (🆕 GET details)
│       └── leaderboard/route.ts (🆕)
├── platforms/
│   ├── route.ts (🆕 GET list)
│   └── [id]/route.ts (🆕 DELETE)
├── qr/
│   ├── scan/route.ts (🆕 POST)
│   ├── history/route.ts (🆕 GET)
│   └── validate/[code]/route.ts (🆕)
└── events/
    ├── upcoming/route.ts (🆕)
    └── [id]/
        ├── route.ts (🆕 GET details)
        └── interested/route.ts (🆕 POST)
```

---

## 🔒 Sécurité

Tous les endpoints doivent :
1. ✅ Vérifier l'authentification (userId)
2. ✅ Utiliser `supabaseAdmin` pour bypass RLS
3. ✅ Valider les inputs
4. ✅ Gérer les erreurs proprement
5. ✅ Logger les opérations importantes

---

## 📱 Format de réponse standard

### Success
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

---

## 🚀 Priorités

### P0 - Critique (app mobile ne peut pas fonctionner sans)
1. `GET /api/user/profile`
2. `GET /api/user/artists`
3. `POST /api/user/artists/save`
4. `GET /api/user/platforms`
5. `GET /api/events/upcoming`

### P1 - Important (features principales)
6. `POST /api/qr/scan`
7. `GET /api/artists/:id/leaderboard`
8. `GET /api/user/stats`

### P2 - Nice to have
9. Tous les autres endpoints

---

## 💡 Recommandation

Pour l'app mobile, je recommande de **créer tous ces endpoints** maintenant, afin que :
- L'app mobile ait une API complète et cohérente
- Le frontend web puisse migrer progressivement vers les API endpoints
- La logique métier soit centralisée côté backend
- Les règles de sécurité soient appliquées uniformément

---

**Tu veux que je crée tous ces endpoints ?** 🚀


