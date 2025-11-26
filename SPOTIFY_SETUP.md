# Configuration Spotify OAuth

## 🎯 Ce qui a été fait

✅ Module Spotify API complet (`lib/spotify-api.ts`)  
✅ Page de callback OAuth (`app/api/auth/spotify/callback/route.ts`)  
✅ Intégration dans l'app (bouton Spotify fonctionne)  
✅ Synchronisation automatique des artistes favoris  
✅ Calcul des points de fanitude  
✅ Support du refresh token (pas d'expiration !)

## 🔧 Configuration Requise

### 1. Créer une Application Spotify

1. Va sur [Spotify for Developers](https://developer.spotify.com/dashboard)
2. **Log in** avec ton compte Spotify (gratuit ou premium)
3. Clique sur **"Create app"**
4. Remplis les informations :
   - **App name** : DIBS
   - **App description** : Music fan loyalty platform
   - **Website** : `http://localhost:3001` (pour dev)
   - **Redirect URIs** :
     ```
     http://localhost:3001/api/auth/spotify/callback
     ```
   - **APIs used** : Coche **Web API**

5. Accepte les **Terms of Service**
6. Clique sur **Save**

### 2. Récupérer les Credentials

Une fois créée :

1. Va dans ton app sur le [Dashboard](https://developer.spotify.com/dashboard)
2. Clique sur **Settings**
3. Tu verras :
   - **Client ID**
   - **Client secret** (clique sur "View client secret")

### 3. Configurer les Variables d'Environnement

Crée ou modifie ton fichier `.env.local` :

```bash
# Spotify OAuth
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=ton-client-id-ici
SPOTIFY_CLIENT_SECRET=ton-client-secret-ici
```

⚠️ **Important** : 
- `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` est public (commence par `NEXT_PUBLIC_`)
- `SPOTIFY_CLIENT_SECRET` est privée (ne commence PAS par `NEXT_PUBLIC_`)

### 4. Redémarrer l'App

```bash
# Arrête le serveur (Ctrl+C)
npm run dev
```

## 🧪 Tester la Connexion

1. Lance l'app : `npm run dev`
2. Connecte-toi avec ton email
3. Va sur `/connect-platform`
4. Clique sur **"LOG IN WITH SPOTIFY"**
5. Tu seras redirigé vers Spotify
6. Autorise l'accès
7. Tu reviens sur `/select-artists` avec tes artistes Spotify !

## 📊 Ce qui est récupéré

Une fois connecté, Spotify fournit :

✅ **Top artistes** (tes 50 artistes les plus écoutés)  
✅ **Artistes suivis** (ceux que tu follow)  
✅ **Historique d'écoute récent** (50 dernières écoutes)  
✅ **Temps d'écoute par artiste** (calculé)  
✅ **Images des artistes**  
✅ **Nombre de followers par artiste**  
✅ **Genres musicaux**

## 🔄 Synchronisation

### Automatique

La première connexion synchronise automatiquement :
1. Les artistes top de l'utilisateur (6 derniers mois)
2. Les artistes suivis
3. Le temps d'écoute estimé
4. Calcul des points de fanitude (temps × 2)

### Manuelle

Pour re-synchroniser plus tard :

```typescript
import { syncSpotifyData } from '@/lib/spotify-api'

// Bouton "Sync" dans le profil
async function handleSync() {
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await syncSpotifyData(user.id)
    alert('Données Spotify synchronisées !')
  }
}
```

## 🔐 Sécurité

### Token Storage

Les tokens Spotify sont stockés de manière sécurisée dans Supabase :
- Table `user_streaming_platforms`
- Column `access_token` (encrypted at rest par Supabase)
- Column `refresh_token` (pour renouveler automatiquement)
- Row Level Security activée

### Refresh Token

Contrairement à Deezer, Spotify fournit un **refresh token** qui permet de renouveler automatiquement l'access token sans redemander l'autorisation ! 🎉

Le refresh se fait automatiquement dans `getSpotifyToken()`.

### Permissions Demandées (Scopes)

```
- user-read-email : Email de l'utilisateur
- user-read-private : Informations de profil
- user-top-read : Top artistes et tracks
- user-read-recently-played : Historique d'écoute
- user-follow-read : Artistes suivis
```

Pas de permission d'écriture = l'app ne peut rien modifier sur Spotify.

## 🌐 Production

### URL de Callback en Production

Quand tu déploies :

1. Retourne sur [Spotify Dashboard](https://developer.spotify.com/dashboard)
2. Sélectionne ton app
3. Va dans **Settings**
4. Ajoute l'URL de prod dans **Redirect URIs** :
   ```
   https://ton-domaine.com/api/auth/spotify/callback
   ```
5. **Save**

Tu peux avoir plusieurs Redirect URIs (dev + prod).

### Variables d'Environnement

Sur Vercel / Netlify / etc. :
1. Va dans **Settings** → **Environment Variables**
2. Ajoute :
   - `NEXT_PUBLIC_SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`

## 🐛 Dépannage

### Erreur "Invalid client"

➡️ Vérifie que `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` et `SPOTIFY_CLIENT_SECRET` sont bien définis dans `.env.local`

### Erreur "Invalid redirect URI"

➡️ Vérifie que l'URL de callback dans Spotify Dashboard correspond exactement à celle de ton app (y compris le port).

### Token expiré

➡️ Pas de problème ! Le refresh token est automatiquement utilisé pour obtenir un nouveau token.

### "Failed to get access token"

➡️ Vérifie :
1. Que ton app Spotify est bien en mode **Development**
2. Que les scopes sont corrects
3. Que le code verifier PKCE est correctement passé

### "User not registered in the Developer Dashboard"

➡️ En mode Development, seuls les utilisateurs ajoutés dans le Dashboard peuvent se connecter :
1. Va dans **User Management** dans ton app
2. Ajoute les emails des testeurs

Pour supprimer cette limite : demande le **Quota Extension** dans Spotify Dashboard (une fois l'app prête pour la prod).

## 📱 Mobile

L'API Spotify fonctionne aussi sur mobile ! Voir `MOBILE_INTEGRATION.md`.

## 🆚 Spotify vs Deezer

### Avantages Spotify

✅ **Refresh token** : pas besoin de se reconnecter  
✅ **API plus complète** : top tracks, saved albums, playlists, etc.  
✅ **Données plus riches** : genres, popularité, audio features  
✅ **Meilleure documentation**  
✅ **Pas de validation d'app** (instantané !)

### Données Spotify

Spotify fournit 3 périodes de temps pour les top artistes :
- `short_term` : 4 dernières semaines
- `medium_term` : 6 derniers mois (par défaut)
- `long_term` : plusieurs années

Tu peux facilement ajuster la période dans `syncSpotifyData()`.

## 🔗 Ressources

- [Spotify for Developers](https://developer.spotify.com/)
- [Web API Documentation](https://developer.spotify.com/documentation/web-api)
- [Authorization Guide](https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow)
- [API Reference](https://developer.spotify.com/documentation/web-api/reference)

## ✅ Checklist

- [ ] Créer app sur Spotify Dashboard
- [ ] Copier Client ID et Client Secret
- [ ] Ajouter dans `.env.local`
- [ ] Ajouter Redirect URI : `http://localhost:3001/api/auth/spotify/callback`
- [ ] Redémarrer l'app
- [ ] Tester la connexion
- [ ] Vérifier que les artistes sont synchronisés
- [ ] Ajouter callback URL de prod (plus tard)

---

**Connexion Spotify prête à l'emploi ! 🎵**

