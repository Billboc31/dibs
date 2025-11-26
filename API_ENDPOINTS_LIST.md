# 📋 Liste complète des Endpoints DIBS API

## 🚀 Next.js API Routes (http://127.0.0.1:3001)

### 🔐 Authentication

#### `GET /api/auth/spotify/callback`
**Description:** Callback OAuth Spotify  
**Paramètres:** `code`, `state`, `error` (query)  
**Réponse:** Redirection vers `/select-artists` ou `/connect-platform`  
**Utilisé par:** OAuth flow Spotify

#### `GET /api/auth/deezer/callback` ⚠️ DEPRECATED
**Description:** Callback OAuth Deezer (n'accepte plus les nouvelles connexions)  
**Paramètres:** `code` (query)  
**Réponse:** Redirection  
**Statut:** Deprecated

---

### 🎵 Spotify

#### `POST /api/sync-spotify`
**Description:** Synchronise les artistes Spotify de l'utilisateur  
**Body:**
```json
{
  "userId": "uuid"
}
```
**Réponse:**
```json
{
  "success": true,
  "synced": 8,
  "message": "8 artistes synchronisés"
}
```
**Utilisé par:** Page `/select-artists`, resynchronisation automatique

---

### 👤 User

#### `POST /api/reset-user-data`
**Description:** Réinitialise toutes les données utilisateur (démo)  
**Body:**
```json
{
  "userId": "uuid"
}
```
**Réponse:**
```json
{
  "success": true,
  "message": "Toutes tes données ont été réinitialisées"
}
```
**Utilisé par:** Page `/settings`

---

## 🌐 Supabase Edge Functions (https://your-project.supabase.co/functions/v1)

### 🎤 Artists

#### `POST /functions/v1/add-user-artists`
**Description:** Sauvegarde la liste des artistes suivis  
**Authentification:** Bearer Token requis  
**Body:**
```json
{
  "artist_ids": ["uuid1", "uuid2", "uuid3"]
}
```
**Réponse:**
```json
{
  "success": true,
  "count": 3,
  "message": "3 artists saved"
}
```
**Utilisé par:** Page `/select-artists` (bouton Continue)

---

### 📱 QR Codes

#### `POST /functions/v1/scan-qr-code`
**Description:** Scanne un QR code et ajoute des points  
**Authentification:** Bearer Token requis  
**Body:**
```json
{
  "qr_code": "ALBUM_MAYHEM_2024"
}
```
**Réponse:**
```json
{
  "success": true,
  "points_earned": 500,
  "qr_code_id": "uuid",
  "product_name": "Mayhem Vinyl",
  "artist_id": "uuid"
}
```
**Cas d'erreur:**
- `404` - QR code invalide ou inactif
- `409` - QR code déjà scanné
**Utilisé par:** Page `/qr-scan`

---

### 🔄 Streaming

#### `POST /functions/v1/sync-streaming-data`
**Description:** Synchronise les données d'une plateforme de streaming  
**Authentification:** Bearer Token requis  
**Body:**
```json
{
  "platform": "spotify"
}
```
**Valeurs platform:** `spotify`, `deezer`, `apple_music`  
**Réponse:**
```json
{
  "success": true,
  "synced": 15
}
```
**Utilisé par:** Synchronisation des plateformes

---

## 🔑 Authentification

### Next.js API Routes
Pas d'authentification requise (géré via cookies de session)

### Supabase Edge Functions
**Header requis:**
```
Authorization: Bearer YOUR_SUPABASE_JWT_TOKEN
```

**Obtenir le token depuis le client:**
```javascript
const { data: { session } } = await supabase.auth.getSession()
const token = session?.access_token
```

---

## 📊 Status Codes

| Code | Signification |
|------|---------------|
| 200  | Succès |
| 302  | Redirection (OAuth callbacks) |
| 400  | Bad Request - Paramètres manquants/invalides |
| 401  | Unauthorized - Token manquant ou invalide |
| 404  | Not Found - Ressource introuvable |
| 409  | Conflict - Ressource déjà existante |
| 500  | Server Error - Erreur serveur |

---

## 🧪 Exemples d'utilisation

### Synchroniser Spotify

```javascript
const response = await fetch('http://127.0.0.1:3001/api/sync-spotify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: 'your-user-id' })
})
const data = await response.json()
console.log(data) // { success: true, synced: 8, ... }
```

### Scanner un QR Code

```javascript
const { data: { session } } = await supabase.auth.getSession()

const response = await fetch('https://your-project.supabase.co/functions/v1/scan-qr-code', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  },
  body: JSON.stringify({ qr_code: 'ALBUM_MAYHEM_2024' })
})
const data = await response.json()
console.log(data) // { success: true, points_earned: 500, ... }
```

### Sauvegarder des artistes

```javascript
const { data: { session } } = await supabase.auth.getSession()

const response = await fetch('https://your-project.supabase.co/functions/v1/add-user-artists', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  },
  body: JSON.stringify({
    artist_ids: ['uuid1', 'uuid2', 'uuid3']
  })
})
const data = await response.json()
console.log(data) // { success: true, count: 3, ... }
```

---

## 📚 Documentation interactive

Pour tester tous ces endpoints de manière interactive :

**Ouvre Swagger UI:**
```
http://127.0.0.1:3001/api-docs
```

Ou depuis l'app :  
**Settings** → **📖 Ouvrir la documentation API**

---

## 🔄 Rate Limiting

Actuellement aucune limite de taux n'est appliquée en développement.

En production, prévoir :
- Spotify API : 180 requêtes / minute
- Supabase Edge Functions : Selon le plan choisi

---

## 🛠️ Debugging

### Voir les logs Next.js API
Les logs apparaissent dans le terminal où tu as lancé `npm run dev`

### Voir les logs Supabase Edge Functions
Va sur **Supabase Dashboard** → **Edge Functions** → **Logs**

### Obtenir ton User ID
Console du navigateur :
```javascript
supabase.auth.getUser().then(r => console.log(r.data.user.id))
```

---

## 📞 Support

Pour toute question sur l'API :
- Consulte la doc Swagger : `http://127.0.0.1:3001/api-docs`
- Regarde `API_DOCUMENTATION.md`
- Vérifie les logs dans la console

---

**Dernière mise à jour:** 19/11/2024  
**Version API:** 1.0.0


