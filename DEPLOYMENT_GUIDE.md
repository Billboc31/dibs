# 🚀 Guide de Déploiement DIBS Backend

Ce guide explique comment déployer le backend DIBS (Next.js) pour que l'équipe mobile puisse commencer le développement.

## 📋 Table des matières

1. [Déploiement sur Vercel (Recommandé)](#vercel)
2. [Déploiement sur Firebase](#firebase)
3. [Configuration des variables d'environnement](#variables)
4. [Vérification du déploiement](#verification)

---

## 🌟 Option 1 : Vercel (Recommandé)

**Pourquoi Vercel ?**
- ✅ Créé par l'équipe de Next.js
- ✅ Déploiement automatique depuis Git
- ✅ HTTPS gratuit
- ✅ Configuration zero
- ✅ Plan gratuit généreux

### Étape 1 : Préparer le projet

1. **Créer un compte Vercel**
   - Aller sur https://vercel.com
   - Se connecter avec GitHub

2. **Pousser le code sur GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/dibs-backend.git
   git push -u origin main
   ```

### Étape 2 : Déployer sur Vercel

1. **Importer le projet**
   - Aller sur https://vercel.com/new
   - Cliquer sur "Import Project"
   - Sélectionner votre dépôt GitHub `dibs-backend`

2. **Configurer le projet**
   - Framework Preset : **Next.js** (détecté automatiquement)
   - Root Directory : `./` (par défaut)
   - Build Command : `npm run build` (par défaut)
   - Output Directory : `.next` (par défaut)

3. **Ajouter les variables d'environnement**
   
   Dans l'onglet "Environment Variables", ajouter :
   
   ```
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=votre_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
   
   # Spotify
   NEXT_PUBLIC_SPOTIFY_CLIENT_ID=votre_spotify_client_id
   SPOTIFY_CLIENT_SECRET=votre_spotify_client_secret
   NEXT_PUBLIC_SPOTIFY_REDIRECT_URI=https://votre-app.vercel.app/api/auth/spotify/callback
   
   # Base URL
   NEXT_PUBLIC_BASE_URL=https://votre-app.vercel.app
   ```

4. **Déployer**
   - Cliquer sur "Deploy"
   - Attendre 2-3 minutes ⏳
   - Votre app sera disponible sur `https://votre-app.vercel.app` 🎉

### Étape 3 : Mettre à jour Spotify Redirect URI

1. Aller sur https://developer.spotify.com/dashboard
2. Sélectionner votre application
3. Cliquer sur "Edit Settings"
4. Ajouter dans "Redirect URIs" :
   ```
   https://votre-app.vercel.app/api/auth/spotify/callback
   ```
5. Sauvegarder

### Étape 4 : Tester le déploiement

Ouvrir dans le navigateur :
- **API Docs Mobile** : `https://votre-app.vercel.app/api-docs-mobile`
- **API Health Check** : `https://votre-app.vercel.app/api/user/profile`

### 🔄 Déploiement automatique

Chaque fois que vous poussez sur GitHub, Vercel redéploie automatiquement ! 🚀

```bash
git add .
git commit -m "Update API"
git push
# Vercel déploie automatiquement en 2 minutes
```

---

## 🔥 Option 2 : Firebase Hosting + Cloud Functions

**Note :** Plus complexe que Vercel, mais fonctionne aussi.

### Prérequis

```bash
npm install -g firebase-tools
firebase login
```

### Étape 1 : Initialiser Firebase

```bash
firebase init

# Sélectionner :
# - Hosting
# - Functions

# Configuration :
# - Use an existing project ou Create a new project
# - Public directory : out
# - Single-page app : No
# - Set up automatic builds : No
```

### Étape 2 : Créer `firebase.json`

```json
{
  "hosting": {
    "public": "out",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "function": "nextjsServer"
      }
    ]
  },
  "functions": {
    "source": ".",
    "predeploy": [
      "npm run build"
    ]
  }
}
```

### Étape 3 : Créer `functions/index.js`

```javascript
const { https } = require('firebase-functions');
const next = require('next');

const isDev = process.env.NODE_ENV !== 'production';
const server = next({
  dev: isDev,
  conf: { distDir: '.next' },
});

const nextjsHandle = server.getRequestHandler();

exports.nextjsServer = https.onRequest(async (req, res) => {
  await server.prepare();
  return nextjsHandle(req, res);
});
```

### Étape 4 : Configurer les variables d'environnement

```bash
# Ajouter les variables dans Firebase
firebase functions:config:set \
  supabase.url="votre_supabase_url" \
  supabase.anon_key="votre_supabase_anon_key" \
  supabase.service_key="votre_service_role_key" \
  spotify.client_id="votre_spotify_client_id" \
  spotify.client_secret="votre_spotify_client_secret"
```

### Étape 5 : Déployer

```bash
# Build pour production
npm run build
npm run export

# Déployer
firebase deploy
```

Votre app sera disponible sur :
```
https://votre-projet.web.app
```

---

## 🔧 Configuration des variables d'environnement {#variables}

### Variables requises

| Variable | Description | Où la trouver |
|----------|-------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de votre projet Supabase | https://app.supabase.com → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique Supabase | https://app.supabase.com → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé privée Supabase (pour bypass RLS) | https://app.supabase.com → Settings → API |
| `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` | Client ID Spotify | https://developer.spotify.com/dashboard |
| `SPOTIFY_CLIENT_SECRET` | Client Secret Spotify | https://developer.spotify.com/dashboard |
| `NEXT_PUBLIC_SPOTIFY_REDIRECT_URI` | URL de callback | `https://votre-app.vercel.app/api/auth/spotify/callback` |
| `NEXT_PUBLIC_BASE_URL` | URL de base de l'app | `https://votre-app.vercel.app` |

### Exemple de fichier `.env.production`

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Spotify
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=7552cb4398ce47c588e72d59219dc512
SPOTIFY_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_SPOTIFY_REDIRECT_URI=https://dibs-backend.vercel.app/api/auth/spotify/callback

# Base URL
NEXT_PUBLIC_BASE_URL=https://dibs-backend.vercel.app
```

---

## ✅ Vérification du déploiement {#verification}

### 1. Tester la documentation API

```bash
curl https://votre-app.vercel.app/api-docs-mobile
# Devrait retourner la page HTML de la doc
```

### 2. Tester un endpoint

```bash
# Test sans authentification (devrait retourner 401)
curl https://votre-app.vercel.app/api/user/profile
# {"success": false, "error": "User not authenticated"}

# Test avec token
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://votre-app.vercel.app/api/user/profile
```

### 3. Tester la connexion Spotify

1. Ouvrir `https://votre-app.vercel.app/connect-platform`
2. Cliquer sur "Connecter Spotify"
3. S'authentifier
4. Vérifier la redirection

---

## 📱 Informations pour l'équipe mobile

Une fois déployé, fournir ces informations à l'équipe mobile :

### URLs importantes

```
# Base URL de l'API
https://votre-app.vercel.app

# Documentation API
https://votre-app.vercel.app/api-docs-mobile

# Documentation OAuth Spotify
https://votre-app.vercel.app/api-docs-mobile
(Cliquer sur "Voir la documentation OAuth Spotify")
```

### Configuration mobile

L'équipe mobile devra configurer dans leur app :

```javascript
// config.js ou .env
export const API_BASE_URL = 'https://votre-app.vercel.app'
export const SPOTIFY_CLIENT_ID = 'votre_spotify_client_id'
export const SPOTIFY_REDIRECT_URI = 'https://votre-app.vercel.app/api/auth/spotify/callback'
```

### Exemple d'appel API depuis React Native

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://votre-app.vercel.app',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Ajouter le token JWT
api.interceptors.request.use((config) => {
  const token = getUserToken(); // Fonction pour récupérer le token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Exemple d'utilisation
async function getUserProfile() {
  try {
    const response = await api.get('/api/user/profile');
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data);
    throw error;
  }
}
```

---

## 🔒 Sécurité

### CORS (si nécessaire)

Si vous avez des problèmes de CORS, créer `middleware.ts` à la racine :

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Ajouter les headers CORS
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Gérer les requêtes OPTIONS
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers: response.headers })
  }

  return response
}

export const config = {
  matcher: '/api/:path*',
}
```

### Rate Limiting

Pour protéger l'API, vous pouvez ajouter un rate limiting avec Vercel Edge Config ou Upstash.

---

## 🆘 Dépannage

### Problème : "Module not found"
**Solution :** Vérifier que toutes les dépendances sont dans `package.json`
```bash
npm install
```

### Problème : "Environment variable not defined"
**Solution :** Vérifier les variables d'environnement sur Vercel
- Aller dans Project Settings → Environment Variables
- Redéployer après avoir ajouté les variables

### Problème : "Spotify redirect URI mismatch"
**Solution :** Vérifier que l'URL dans Spotify Dashboard correspond exactement
```
https://votre-app.vercel.app/api/auth/spotify/callback
```

### Problème : "Supabase connection failed"
**Solution :** Vérifier que Supabase accepte les connexions depuis Vercel
- Aller dans Supabase → Settings → API
- Vérifier que l'URL et les clés sont correctes

---

## 📊 Monitoring

### Vercel Analytics

Activer Analytics dans Vercel pour suivre :
- Nombre de requêtes
- Temps de réponse
- Erreurs

### Logs

Voir les logs en temps réel :
```bash
vercel logs https://votre-app.vercel.app
```

---

## 🎉 Conclusion

Votre backend est maintenant déployé et accessible ! L'équipe mobile peut commencer le développement.

**URLs à partager :**
- 📱 API Base : `https://votre-app.vercel.app`
- 📖 Documentation : `https://votre-app.vercel.app/api-docs-mobile`

**Support :** Si problèmes, vérifier les logs Vercel ou Firebase.

