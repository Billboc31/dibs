# 🚀 Démarrage Rapide - Spotify

## ✅ Ce qui a été fait

L'intégration Spotify est **complète et prête à l'emploi** ! Voici ce qui a été créé :

### 📁 Nouveaux fichiers

1. **`lib/spotify-api.ts`** - Module complet pour l'API Spotify
   - OAuth 2.0 avec PKCE (sécurisé)
   - Refresh token automatique
   - Récupération des artistes favoris
   - Synchronisation des données

2. **`app/api/auth/spotify/callback/route.ts`** - Route de callback OAuth
   - Gère le retour après autorisation
   - Sauvegarde les tokens dans Supabase

3. **`SPOTIFY_SETUP.md`** - Guide de configuration complet
   - Instructions étape par étape
   - Résolution de problèmes

4. **`MIGRATION_DEEZER_TO_SPOTIFY.md`** - Pourquoi Spotify ?
   - Comparaison Spotify vs Deezer
   - Avantages de Spotify

5. **`env.example`** - Template des variables d'environnement

### 🔧 Fichiers modifiés

- **`app/connect-platform/page.tsx`** - Utilise maintenant Spotify
- **`README.md`** - Documentation mise à jour

## 🎯 Pour démarrer en 5 minutes

### 1️⃣ Créer une app Spotify

1. Va sur https://developer.spotify.com/dashboard
2. **Log in** avec ton compte Spotify
3. Clique sur **"Create app"**
4. Remplis :
   - App name: **DIBS**
   - Redirect URI: voir ci-dessous ⬇️
   - API: **Web API**
5. Clique sur **Save**

#### ⚠️ Redirect URI : HTTPS requis ?

Si Spotify refuse `http://localhost`, utilise **ngrok** :

```bash
# Terminal 1 : Lance ton app
npm run dev

# Terminal 2 : Lance ngrok
ngrok http 3000
```

Copie l'URL HTTPS ngrok (ex: `https://abc123.ngrok-free.app`) et utilise :
```
https://abc123.ngrok-free.app/api/auth/spotify/callback
```

📖 **Guide complet** : Voir [`HTTPS_LOCAL.md`](./HTTPS_LOCAL.md)

### 2️⃣ Copier les credentials

1. Dans ton app → **Settings**
2. Copie le **Client ID**
3. Clique sur **View client secret** et copie-le

### 3️⃣ Configurer le projet

Crée un fichier `.env.local` à la racine :

```bash
# Supabase (garde tes valeurs existantes)
NEXT_PUBLIC_SUPABASE_URL=ton-url-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=ta-clé-supabase

# Spotify (nouvelles valeurs)
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=ton-client-id-ici
SPOTIFY_CLIENT_SECRET=ton-client-secret-ici
```

### 4️⃣ Redémarrer l'app

```bash
npm run dev
```

### 5️⃣ Tester !

1. Ouvre http://localhost:3001
2. Connecte-toi avec ton email
3. Clique sur **"LOG IN WITH SPOTIFY"**
4. Autorise l'accès
5. ✅ Tes artistes Spotify sont synchronisés !

## 🎉 C'est tout !

Tu as maintenant une intégration Spotify complète avec :

✅ OAuth 2.0 sécurisé (PKCE)  
✅ Refresh token automatique (pas d'expiration !)  
✅ Top artistes (6 derniers mois)  
✅ Artistes suivis  
✅ Historique d'écoute récent  
✅ Synchronisation automatique  
✅ Calcul des points de fanitude  

## 📚 Plus d'infos

- **Configuration détaillée** → [`SPOTIFY_SETUP.md`](./SPOTIFY_SETUP.md)
- **Pourquoi Spotify ?** → [`MIGRATION_DEEZER_TO_SPOTIFY.md`](./MIGRATION_DEEZER_TO_SPOTIFY.md)
- **Architecture** → [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- **README principal** → [`README.md`](./README.md)

## 🆘 Besoin d'aide ?

### Erreur "Invalid client"

➡️ Vérifie que tes credentials sont bien dans `.env.local`

### Erreur "Invalid redirect URI"

➡️ Dans Spotify Dashboard, vérifie que l'URL de callback est exactement :
```
http://localhost:3001/api/auth/spotify/callback
```

### Token expiré

➡️ Pas de problème ! Le refresh se fait automatiquement. 🎉

### Autres problèmes

Consulte la section **Dépannage** dans [`SPOTIFY_SETUP.md`](./SPOTIFY_SETUP.md)

---

**Bon développement ! 🎵**

