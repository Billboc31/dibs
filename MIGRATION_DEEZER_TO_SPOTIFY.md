# Migration de Deezer vers Spotify

## 🔄 Pourquoi ce changement ?

**Deezer n'accepte plus les nouvelles connexions d'applications**, ce qui rend impossible l'utilisation de leur API pour les nouveaux projets. Spotify est une excellente alternative avec une API plus complète et plus facile à configurer.

## ✅ Ce qui a été fait

### 1. Nouveau module Spotify API
- ✅ **`lib/spotify-api.ts`** : Module complet avec toutes les fonctions nécessaires
- ✅ Support OAuth 2.0 avec PKCE (plus sécurisé que Deezer)
- ✅ Refresh token automatique (contrairement à Deezer qui expire)
- ✅ Fonctions pour récupérer les données utilisateur

### 2. Route de callback OAuth
- ✅ **`app/api/auth/spotify/callback/route.ts`** : Gère le retour OAuth
- ✅ Échange du code contre un access token
- ✅ Sauvegarde sécurisée dans Supabase

### 3. Page de connexion mise à jour
- ✅ **`app/connect-platform/page.tsx`** : Utilise maintenant Spotify
- ✅ Deezer désactivé avec message explicatif
- ✅ Gestion des erreurs et succès

### 4. Documentation complète
- ✅ **`SPOTIFY_SETUP.md`** : Guide complet de configuration
- ✅ Instructions étape par étape
- ✅ Dépannage et ressources

## 🆚 Comparaison Spotify vs Deezer

| Fonctionnalité | Spotify | Deezer |
|----------------|---------|--------|
| **Approbation app** | ✅ Instantanée | ❌ Plusieurs heures d'attente |
| **Refresh token** | ✅ Oui (pas d'expiration) | ❌ Non (reconnexion nécessaire) |
| **Top artistes** | ✅ 3 périodes (4 semaines, 6 mois, années) | ❌ Seulement favoris |
| **Artistes suivis** | ✅ Oui | ✅ Oui |
| **Historique récent** | ✅ 50 dernières écoutes | ✅ Oui |
| **Genres** | ✅ Oui | ❌ Non |
| **Popularité** | ✅ Oui | ❌ Non |
| **Documentation** | ✅ Excellente | 🟡 Correcte |
| **Nouvelles apps** | ✅ Acceptées | ❌ Plus acceptées |

## 📊 Données récupérées

### Avec Spotify tu obtiens :

✅ **Top artistes** (50 max)
- Court terme : 4 dernières semaines
- Moyen terme : 6 derniers mois
- Long terme : plusieurs années

✅ **Artistes suivis** (50 max)

✅ **Historique récent** (50 dernières écoutes)

✅ **Informations détaillées** :
- Images haute qualité
- Nombre de followers
- Genres musicaux
- Popularité

## 🚀 Comment démarrer

### Étape 1 : Créer une app Spotify

1. Va sur [Spotify for Developers](https://developer.spotify.com/dashboard)
2. **Create app**
3. Remplis les infos :
   - App name: **DIBS**
   - App description: **Music fan loyalty platform**
   - Redirect URI: `http://localhost:3001/api/auth/spotify/callback`
   - API: **Web API**

### Étape 2 : Copier les credentials

1. Dans ton app → **Settings**
2. Copie :
   - **Client ID**
   - **Client secret**

### Étape 3 : Configurer les variables d'environnement

Crée `.env.local` à la racine du projet :

```bash
# Spotify OAuth
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=ton-client-id-ici
SPOTIFY_CLIENT_SECRET=ton-client-secret-ici

# Supabase (garde tes variables existantes)
NEXT_PUBLIC_SUPABASE_URL=ton-url-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=ta-clé-supabase
```

### Étape 4 : Redémarrer l'app

```bash
npm run dev
```

### Étape 5 : Tester

1. Ouvre `http://localhost:3001`
2. Connecte-toi avec ton email
3. Clique sur **"LOG IN WITH SPOTIFY"**
4. Autorise l'accès
5. ✅ Tes artistes sont synchronisés !

## 🔐 Sécurité améliorée

### PKCE (Proof Key for Code Exchange)

Spotify utilise PKCE, une méthode plus sécurisée que le flux OAuth classique :

1. **Code Verifier** : Chaîne aléatoire générée côté client
2. **Code Challenge** : Hash SHA-256 du code verifier
3. Le code verifier n'est jamais exposé dans l'URL

### Refresh Token

Le refresh token permet de renouveler automatiquement l'access token :
- **Pas besoin de reconnecter l'utilisateur**
- **Expérience utilisateur fluide**
- **Géré automatiquement** dans `getSpotifyToken()`

## 🗄️ Base de données

Aucun changement nécessaire ! Le schéma Supabase existant supporte déjà :

```sql
CREATE TABLE user_streaming_platforms (
    ...
    access_token TEXT,
    refresh_token TEXT,  -- ✅ Déjà présent !
    ...
);
```

## 📁 Fichiers modifiés

### Nouveaux fichiers

```
lib/spotify-api.ts                        # Module API Spotify
app/api/auth/spotify/callback/route.ts    # Callback OAuth
SPOTIFY_SETUP.md                          # Documentation
MIGRATION_DEEZER_TO_SPOTIFY.md           # Ce fichier
```

### Fichiers modifiés

```
app/connect-platform/page.tsx             # Utilise Spotify au lieu de Deezer
```

### Fichiers conservés (pour référence)

```
lib/deezer-api.ts                         # Conservé au cas où
app/api/auth/deezer/callback/route.ts     # Conservé au cas où
DEEZER_SETUP.md                           # Conservé pour historique
```

## 🔄 Migration des utilisateurs existants

Si tu as déjà des utilisateurs connectés avec Deezer :

### Option 1 : Coexistence (recommandé)

Les deux APIs peuvent coexister dans la base de données :

- Garde `lib/deezer-api.ts`
- Les utilisateurs Deezer existants continuent de fonctionner
- Les nouveaux utilisateurs utilisent Spotify

### Option 2 : Migration complète

Si tu veux migrer tous les utilisateurs vers Spotify :

1. Demande aux utilisateurs de reconnecter avec Spotify
2. Mappe les artistes Deezer → Spotify avec `artist.deezer_id` et `artist.spotify_id`
3. Supprime les anciennes connexions Deezer

```sql
-- Exemple de requête pour mapper les artistes
UPDATE user_artists ua
SET platform_id = (SELECT id FROM streaming_platforms WHERE slug = 'spotify')
WHERE platform_id = (SELECT id FROM streaming_platforms WHERE slug = 'deezer');
```

## 🐛 Résolution de problèmes

### "Invalid client"

➡️ Vérifie que tes variables d'environnement sont correctes dans `.env.local`

### "Invalid redirect URI"

➡️ Vérifie que l'URL de callback correspond exactement :
- Dans Spotify Dashboard : `http://localhost:3001/api/auth/spotify/callback`
- Port correct (3001 ou autre)

### "User not registered"

En mode Development, seuls les utilisateurs ajoutés dans **User Management** peuvent se connecter.

➡️ Ajoute ton email dans le Dashboard Spotify → User Management

### Token expiré

Pas de souci ! Le refresh se fait automatiquement dans `getSpotifyToken()`.

## 📚 Ressources

### Documentation Spotify

- [Dashboard](https://developer.spotify.com/dashboard)
- [Web API Guide](https://developer.spotify.com/documentation/web-api)
- [Authorization Guide](https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow)
- [API Reference](https://developer.spotify.com/documentation/web-api/reference)

### Documentation du projet

- [`SPOTIFY_SETUP.md`](./SPOTIFY_SETUP.md) : Guide de configuration détaillé
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) : Architecture du projet
- [`README.md`](./README.md) : Vue d'ensemble

## ✨ Avantages de la migration

### Pour les développeurs

✅ Configuration instantanée (pas d'attente d'approbation)  
✅ API plus riche et mieux documentée  
✅ Refresh token automatique  
✅ Meilleure gestion des erreurs  
✅ Plus de données disponibles (genres, popularité, etc.)

### Pour les utilisateurs

✅ Connexion plus rapide  
✅ Pas besoin de reconnecter régulièrement  
✅ Plus de précision dans les artistes favoris  
✅ Meilleure expérience globale

## 🎉 C'est tout !

La migration est terminée. Spotify est maintenant la plateforme de streaming par défaut pour DIBS !

Pour toute question, consulte [`SPOTIFY_SETUP.md`](./SPOTIFY_SETUP.md) ou ouvre une issue.

---

**Happy coding! 🎵**

