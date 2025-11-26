# 🚀 Déploiement Rapide sur Vercel

Guide ultra-rapide pour déployer le backend DIBS en 5 minutes.

## ⚡ Démarrage rapide

### 1. Pousser sur GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/VOTRE_USERNAME/dibs-backend.git
git push -u origin main
```

### 2. Déployer sur Vercel

1. **Aller sur** https://vercel.com/new
2. **Importer** votre repo GitHub `dibs-backend`
3. **Ajouter les variables d'environnement** :

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=7552cb4398ce47c588e72d59219dc512
SPOTIFY_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_SPOTIFY_REDIRECT_URI=https://VOTRE-APP.vercel.app/api/auth/spotify/callback
NEXT_PUBLIC_BASE_URL=https://VOTRE-APP.vercel.app
```

4. **Cliquer sur "Deploy"** ✅

### 3. Configurer Spotify

1. Aller sur https://developer.spotify.com/dashboard
2. Éditer votre application
3. Ajouter dans "Redirect URIs" :
   ```
   https://VOTRE-APP.vercel.app/api/auth/spotify/callback
   ```
4. Sauvegarder

## 🎯 C'est tout !

Votre backend est en ligne sur : `https://VOTRE-APP.vercel.app`

**Documentation API :** `https://VOTRE-APP.vercel.app/api-docs-mobile`

## 📱 Informations pour le dev mobile

```javascript
// Configuration à utiliser dans l'app mobile
const API_BASE_URL = 'https://VOTRE-APP.vercel.app'
const SPOTIFY_CLIENT_ID = 'votre_spotify_client_id'
```

## 🔄 Mises à jour

Chaque push sur GitHub redéploie automatiquement !

```bash
git add .
git commit -m "Update"
git push
# Déployé automatiquement en 2 minutes
```

## 📖 Guide complet

Pour plus de détails, voir [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

