# 🚨 Gestion des Révocations de Tokens Spotify

## 📋 **Résumé**

En mode développement, Spotify révoque fréquemment les tokens d'accès (limite de 25 utilisateurs). Cette implémentation gère automatiquement ces révocations et informe clairement l'utilisateur mobile.

## 🔧 **Implémentation**

### **1. Détection des révocations**

**Fichier :** `lib/spotify-api.ts`
- ✅ Fonction `refreshSpotifyToken()` modifiée pour détecter les erreurs `invalid_grant`
- ✅ Lancement d'une exception `SPOTIFY_TOKEN_REVOKED` quand le refresh token est révoqué
- ✅ Fonction `disconnectRevokedSpotifyUser()` pour nettoyer la connexion révoquée

```typescript
if (data.error === 'invalid_grant' || response.status === 400) {
  console.log('🚨 Refresh token Spotify révoqué:', data.error_description || data.error)
  throw new Error('SPOTIFY_TOKEN_REVOKED')
}
```

### **2. Gestion dans les endpoints**

**Fichiers modifiés :**
- ✅ `app/api/user/artists/route.ts`
- ✅ `app/api/user/artists/sync/route.ts`

**Comportement :**
1. **Tentative d'appel** Spotify avec le token actuel
2. **Si 401** → Tentative de refresh du token
3. **Si refresh échoue** avec `SPOTIFY_TOKEN_REVOKED` :
   - Nettoyage automatique de la connexion en base
   - Retour d'une réponse HTTP 401 avec message clair

```typescript
if (refreshError.message === 'SPOTIFY_TOKEN_REVOKED') {
  console.log('🚨 Token Spotify révoqué, nettoyage en cours...')
  await disconnectRevokedSpotifyUser(userId)
  throw new Error('SPOTIFY_TOKEN_REVOKED')
}
```

### **3. Réponses API standardisées**

**Format de réponse pour révocation :**
```json
{
  "success": false,
  "error": "SPOTIFY_TOKEN_REVOKED",
  "message": "Votre connexion Spotify a été révoquée. Veuillez vous reconnecter.",
  "action_required": "reconnect_spotify"
}
```

**Statut HTTP :** `401 Unauthorized`

### **4. Documentation mobile**

**Fichier :** `lib/swagger-mobile-simple.ts`
- ✅ Ajout d'exemples de réponse `spotify_revoked` pour les endpoints concernés
- ✅ Documentation des codes d'erreur et actions requises

**Fichier :** `app/api-docs-mobile/page.tsx`
- ✅ Section d'information sur les révocations en mode développement
- ✅ Alerte visuelle spéciale quand `SPOTIFY_TOKEN_REVOKED` est détecté
- ✅ Instructions claires pour la reconnexion

## 📱 **Expérience utilisateur mobile**

### **Scénario typique :**

1. **Utilisateur** fait un appel API (ex: `/api/user/artists`)
2. **Token révoqué** → Réponse `401` avec `SPOTIFY_TOKEN_REVOKED`
3. **App mobile** détecte l'erreur et affiche :
   ```
   🚨 Connexion Spotify expirée
   Votre accès Spotify a été révoqué. 
   Veuillez vous reconnecter.
   [Bouton: Reconnecter Spotify]
   ```
4. **Redirection** vers `/connect-platform` pour reconnexion

### **Interface de test :**

Dans la documentation mobile (`/api-docs-mobile`), les développeurs voient :
- 🟠 **Section d'information** sur les révocations en mode dev
- 🚨 **Alerte visuelle** quand une révocation est détectée dans les tests
- 📋 **Instructions** pour la reconnexion

## 🧪 **Tests**

**Script de simulation :** `test-revocation-simulation.js`
```bash
node test-revocation-simulation.js
```

**Test en réel :**
1. Se connecter à Spotify via `/connect-platform`
2. Attendre la révocation automatique (mode dev)
3. Tester `/api/user/artists` → Doit retourner `SPOTIFY_TOKEN_REVOKED`
4. Vérifier le nettoyage automatique en base

## 🎯 **Endpoints concernés**

| Endpoint | Gestion révocation | Nettoyage auto |
|----------|-------------------|----------------|
| `/api/user/artists` | ✅ | ✅ |
| `/api/user/artists/sync` | ✅ | ✅ |
| `/api/user/artists/followed` | ✅ | ✅ |

## 🚀 **Mode production**

En production, les révocations seront **beaucoup plus rares** car :
- ✅ Quota illimité d'utilisateurs
- ✅ Tokens plus stables
- ✅ Moins de surveillance automatique

**Cette implémentation reste active** pour gérer les rares cas de révocation manuelle ou de problèmes techniques.

## 📝 **Messages pour l'équipe mobile**

```typescript
// Exemple de gestion côté mobile (React Native)
if (response.data?.error === 'SPOTIFY_TOKEN_REVOKED') {
  // Afficher popup de reconnexion
  showSpotifyReconnectDialog({
    message: response.data.message,
    onReconnect: () => navigation.navigate('ConnectPlatform')
  })
}
```

---

**✅ Implémentation terminée et testée !**
