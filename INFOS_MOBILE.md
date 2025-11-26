# 📱 Informations pour l'équipe Mobile

Ce document contient toutes les informations nécessaires pour que l'équipe mobile puisse commencer le développement de l'application DIBS.

---

## 🌐 URLs du Backend

### En production (une fois déployé)

```
Base URL API     : https://votre-app.vercel.app
Documentation    : https://votre-app.vercel.app/api-docs-mobile
OAuth Spotify    : Voir section OAuth dans la doc
```

### En développement local

```
Base URL API     : http://127.0.0.1:3001
Documentation    : http://127.0.0.1:3001/api-docs-mobile
```

---

## 📖 Documentation API

**URL interactive :** `https://votre-app.vercel.app/api-docs-mobile`

La documentation contient :
- ✅ 21 endpoints prêts à l'emploi
- 📝 Exemples de requêtes exhaustifs
- ✅ Exemples de réponses complets
- 🔧 Commandes cURL pour tester
- 🧪 Interface de test intégrée
- 🎵 Guide OAuth Spotify complet

---

## 🔐 Authentification

Tous les endpoints (sauf OAuth callbacks) nécessitent une authentification JWT via Supabase.

### Comment obtenir le token JWT

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://xxxxx.supabase.co',
  'votre_supabase_anon_key'
)

// Connexion utilisateur
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})

// Récupérer le token
const token = data.session?.access_token
```

### Envoyer le token dans les requêtes

```javascript
const response = await fetch('https://votre-app.vercel.app/api/user/profile', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

---

## 🎵 Connexion Spotify (OAuth)

### Flow complet

1. **Générer le code verifier** (PKCE)
2. **Rediriger vers Spotify** avec les bons paramètres
3. **Spotify redirige vers le backend**
4. **Backend synchronise automatiquement les artistes**
5. **Utilisateur peut utiliser l'app**

### Exemple React Native (avec Expo)

```javascript
import * as WebBrowser from 'expo-web-browser'
import * as Crypto from 'expo-crypto'

async function connectToSpotify(userId) {
  // 1. Générer code verifier
  const codeVerifier = generateRandomString(128)
  
  // 2. Créer code challenge
  const codeChallenge = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    codeVerifier,
    { encoding: Crypto.CryptoEncoding.BASE64 }
  )
  const codeChallengeBase64 = codeChallenge
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  // 3. Construire URL
  const params = new URLSearchParams({
    client_id: 'YOUR_SPOTIFY_CLIENT_ID',
    response_type: 'code',
    redirect_uri: 'https://votre-app.vercel.app/api/auth/spotify/callback',
    scope: 'user-read-email user-read-private user-top-read user-read-recently-played user-follow-read',
    code_challenge_method: 'S256',
    code_challenge: codeChallengeBase64,
    state: `${userId}_${codeVerifier}`
  })

  const authUrl = `https://accounts.spotify.com/authorize?${params}`

  // 4. Ouvrir le navigateur
  const result = await WebBrowser.openAuthSessionAsync(authUrl, 'your-app://callback')

  if (result.type === 'success') {
    console.log('✅ Connexion Spotify réussie!')
  }
}

function generateRandomString(length) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let text = ''
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}
```

**Guide complet OAuth** : Disponible dans la documentation à `https://votre-app.vercel.app/api-docs-mobile`

---

## 📋 Endpoints principaux (P0 - Critiques)

### Authentification
```
GET  /api/auth/me          - Obtenir infos utilisateur authentifié
POST /api/auth/logout      - Déconnexion
```

### Profil utilisateur
```
GET  /api/user/profile     - Récupérer le profil
PUT  /api/user/profile     - Mettre à jour le profil
```

### Artistes
```
GET  /api/user/artists            - Liste des artistes suivis (paginée)
POST /api/user/artists/save       - Sauvegarder la sélection d'artistes
GET  /api/user/artists/top        - Top 3 artistes
```

### Plateformes
```
GET    /api/user/platforms        - Plateformes connectées
DELETE /api/user/platforms        - Déconnecter une plateforme
```

### QR Codes
```
POST /api/qr/scan                 - Scanner un QR code
GET  /api/qr/history              - Historique des scans
```

**Liste complète :** Voir la documentation interactive

---

## 💡 Exemples d'utilisation

### Configuration de base (Axios)

```javascript
import axios from 'axios'

// Créer une instance axios configurée
const api = axios.create({
  baseURL: 'https://votre-app.vercel.app',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Intercepteur pour ajouter le token
api.interceptors.request.use((config) => {
  const token = getUserToken() // Votre fonction pour récupérer le token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré, rediriger vers login
      navigateToLogin()
    }
    return Promise.reject(error)
  }
)

export default api
```

### Récupérer le profil

```javascript
import api from './api'

async function getUserProfile() {
  try {
    const response = await api.get('/api/user/profile')
    console.log('Profile:', response.data)
    return response.data
  } catch (error) {
    console.error('Error:', error.response?.data)
    throw error
  }
}
```

### Mettre à jour le profil

```javascript
async function updateProfile(displayName, city, country) {
  try {
    const response = await api.put('/api/user/profile', {
      display_name: displayName,
      city: city,
      country: country
    })
    console.log('✅ Profile updated:', response.data)
    return response.data
  } catch (error) {
    console.error('❌ Error:', error.response?.data)
    throw error
  }
}
```

### Sauvegarder des artistes

```javascript
async function saveArtists(artistIds) {
  try {
    const response = await api.post('/api/user/artists/save', {
      artistIds: artistIds
    })
    console.log('✅ Artists saved:', response.data)
    return response.data
  } catch (error) {
    console.error('❌ Error:', error.response?.data)
    throw error
  }
}

// Utilisation
await saveArtists([
  '550e8400-e29b-41d4-a716-446655440000',
  '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  '7c9e6679-7425-40de-944b-e07fc1f90ae7'
])
```

### Scanner un QR code

```javascript
async function scanQRCode(code) {
  try {
    const response = await api.post('/api/qr/scan', {
      code: code
    })
    console.log('✅ QR scanned:', response.data)
    console.log(`🎉 ${response.data.data.points_earned} points earned!`)
    return response.data
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('⚠️ QR code already scanned or invalid')
    }
    throw error
  }
}

// Utilisation
await scanQRCode('QR-ABC123')
```

### Liste paginée d'artistes

```javascript
async function getArtists(page = 0, limit = 10) {
  try {
    const response = await api.get('/api/user/artists', {
      params: { page, limit }
    })
    
    console.log(`Artists ${page * limit + 1}-${(page + 1) * limit}:`)
    console.log(response.data.data.artists)
    console.log(`Total: ${response.data.data.total}`)
    console.log(`Has more: ${response.data.data.hasMore}`)
    
    return response.data
  } catch (error) {
    console.error('Error:', error.response?.data)
    throw error
  }
}

// Scroll infini
let page = 0
let hasMore = true

async function loadMoreArtists() {
  if (!hasMore) return
  
  const result = await getArtists(page)
  hasMore = result.data.hasMore
  page++
}
```

---

## 🔧 Configuration requise

### Variables d'environnement (mobile app)

```javascript
// .env ou config.js
export const API_BASE_URL = 'https://votre-app.vercel.app'
export const SPOTIFY_CLIENT_ID = 'votre_spotify_client_id'
export const SUPABASE_URL = 'https://xxxxx.supabase.co'
export const SUPABASE_ANON_KEY = 'votre_supabase_anon_key'
```

### Packages nécessaires

```bash
# React Native / Expo
npm install @supabase/supabase-js
npm install axios
npm install expo-web-browser  # Pour OAuth
npm install expo-crypto        # Pour PKCE
```

---

## 📊 Format des réponses

Toutes les réponses suivent le même format :

### Success ✅
```json
{
  "success": true,
  "data": {
    // ... données
  }
}
```

### Error ❌
```json
{
  "success": false,
  "error": "Message d'erreur"
}
```

---

## 🐛 Débogage

### Activer les logs détaillés

```javascript
// En développement, logger toutes les requêtes
api.interceptors.request.use((config) => {
  console.log('📤 Request:', config.method?.toUpperCase(), config.url)
  console.log('📝 Data:', config.data)
  return config
})

api.interceptors.response.use(
  (response) => {
    console.log('📥 Response:', response.status, response.data)
    return response
  },
  (error) => {
    console.error('❌ Error:', error.response?.status, error.response?.data)
    return Promise.reject(error)
  }
)
```

### Tester avec cURL

```bash
# Test endpoint sans auth
curl https://votre-app.vercel.app/api/auth/me

# Test avec auth
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://votre-app.vercel.app/api/user/profile

# Test POST
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code": "QR-ABC123"}' \
  https://votre-app.vercel.app/api/qr/scan
```

---

## ⚠️ Points importants

### Sécurité
- ⚠️ **Ne JAMAIS** stocker le `SUPABASE_SERVICE_ROLE_KEY` côté mobile
- ✅ Utiliser uniquement `SUPABASE_ANON_KEY` côté mobile
- ✅ Toutes les opérations sensibles passent par le backend

### Tokens
- Les tokens JWT expirent après 1 heure
- Implémenter un refresh automatique avec Supabase
- Rediriger vers login si 401

### CORS
- Le backend est configuré pour accepter les requêtes depuis n'importe quelle origine
- Pas besoin de configuration spéciale

### Rate Limiting
- Pas de rate limiting pour l'instant
- À implémenter en production si nécessaire

---

## 📞 Support

Pour toute question :
1. Consulter la [documentation interactive](https://votre-app.vercel.app/api-docs-mobile)
2. Vérifier les [exemples de code](#exemples-dutilisation)
3. Tester les endpoints avec l'interface de test intégrée
4. Contacter l'équipe backend

---

## ✅ Checklist avant de commencer

- [ ] Accès à la documentation : `https://votre-app.vercel.app/api-docs-mobile`
- [ ] Token Supabase configuré
- [ ] Axios ou fetch configuré avec intercepteurs
- [ ] Gestion des erreurs 401 (token expiré)
- [ ] OAuth Spotify implémenté (si nécessaire)
- [ ] Tester les endpoints principaux

**Bon développement ! 🚀**

