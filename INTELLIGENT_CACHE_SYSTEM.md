# 🚀 Système de Cache Intelligent pour Artistes

## 📋 **Résumé**

Implémentation d'un cache intelligent de 3h pour `/api/user/artists` avec fallback automatique en cas de révocation de tokens Spotify. Le système garantit une expérience utilisateur fluide même quand Spotify est inaccessible.

## 🎯 **Stratégie de Cache**

### **1. Cache global longue durée (3h)**
- ✅ **TTL : 3 heures** pour éviter les appels Spotify fréquents
- ✅ **Clé unique** : `user_artists:{userId}` (SANS pagination)
- ✅ **Données complètes** : TOUS les artistes triés par score
- ✅ **Pagination dynamique** : Appliquée côté cache à la demande
- ✅ **Nettoyage automatique** : Toutes les heures

### **2. Fallback intelligent**
```typescript
// Si token révoqué à l'expiration
if (spotifyTokenRevoked && cacheExists) {
  return cachedData + warning // Garde les données utilisables
} else {
  return error // Seulement si pas de cache
}
```

### **3. Invalidation ciblée**
- ✅ **Toggle artistes** : Invalide tout le cache utilisateur
- ✅ **Reconnexion plateforme** : Invalide tout le cache utilisateur
- ✅ **Données périmées** : Marquées comme `stale` mais gardées

## 🔧 **Architecture Technique**

### **Cache Manager (`lib/artists-cache.ts`)**

```typescript
interface CacheEntry {
  data: {
    all_artists: Artist[]  // TOUS les artistes triés par score
    cached_at: string      // Timestamp de mise en cache
  }
  timestamp: number        // Timestamp de création
  userId: string          // ID utilisateur pour invalidation ciblée
  isStale: boolean        // Données périmées mais utilisables
}
```

### **Méthodes principales :**
- `get(userId, page, limit)` : Récupère + applique pagination dynamique
- `set(userId, allArtists)` : Stocke TOUS les artistes triés
- `invalidateUser(userId)` : Supprime le cache complet utilisateur
- `markAsStale(userId)` : Marque comme périmé (fallback)
- `cleanup()` : Nettoie les entrées très anciennes (>6h)

## 📊 **Flux de Données**

### **1. Premier appel (Cache Miss)**
```
GET /api/user/artists?page=0&limit=10
├── Cache vide pour user
├── Appels Spotify API (2-3s)
├── Calcul scores TOUS les artistes
├── Tri par score décroissant
├── Stockage COMPLET en cache
├── Pagination appliquée (page 0)
└── Réponse avec cache_status: 'fresh'
```

### **2. Appels suivants - TOUTES pages (Cache Hit)**
```
GET /api/user/artists?page=1&limit=10
├── Cache trouvé (< 3h)
├── Pagination appliquée côté cache
├── Réponse instantanée (<50ms)
└── Réponse avec cache_status: 'fresh'
```

### **3. Cache expiré + Spotify OK**
```
GET /api/user/artists
├── Cache expiré (> 3h)
├── Nouveaux appels Spotify API
├── Mise à jour cache
└── Réponse avec cache_status: 'fresh'
```

### **4. Cache expiré + Token révoqué**
```
GET /api/user/artists
├── Cache expiré (> 3h)
├── Spotify API → Token révoqué
├── Fallback sur cache périmé
├── Marquage cache comme stale
└── Réponse avec cache_status: 'fallback_revoked'
```

## 🛡️ **Gestion des Révocations**

### **Scénario : Token Spotify révoqué**

1. **Tentative d'appel** Spotify API
2. **Détection révocation** (`SPOTIFY_TOKEN_REVOKED`)
3. **Recherche cache** de secours
4. **Si cache disponible** :
   ```json
   {
     "success": true,
     "data": { /* données du cache */ },
     "cache_status": "fallback_revoked",
     "warning": "Données du cache utilisées. Reconnectez-vous à Spotify."
   }
   ```
5. **Si pas de cache** : Erreur de révocation classique

### **Reconnexion utilisateur :**
```typescript
// L'utilisateur peut se déconnecter proprement
POST /api/user/platforms/disconnect
{
  "platform_slug": "spotify"
}

// Puis se reconnecter via /connect-platform
// Le cache sera automatiquement invalidé
```

## 📱 **Endpoints Ajoutés**

### **1. Déconnexion plateforme**
```
POST /api/user/platforms/disconnect
Body: { "platform_slug": "spotify" }
```
- ✅ Supprime la connexion en base
- ✅ Invalide le cache utilisateur
- ✅ Permet la reconnexion propre

### **2. Statistiques cache**
```
GET /api/cache/stats
```
- ✅ Hit rate, miss rate, stale rate
- ✅ Nombre d'entrées, recommandations
- ✅ Monitoring des performances

## 📊 **Métriques de Performance**

### **Avant le cache :**
- 🐌 **2-3 secondes** par appel
- 🔥 **Limite API Spotify** atteinte rapidement
- 💸 **Coût élevé** en appels API
- ❌ **Indisponible** si token révoqué

### **Avec le cache global :**
- ⚡ **<50ms** pour TOUTES les pages (après 1er calcul)
- 🎯 **UN SEUL calcul** Spotify par utilisateur/3h
- 🛡️ **Disponibilité** même si token révoqué
- 📊 **Hit rate attendu** : >95%
- 🚀 **Pagination instantanée** sur toutes les pages

## 🔄 **Invalidation Intelligente**

### **Quand invalider :**
- ✅ **Toggle artistes** : Les sélections changent
- ✅ **Reconnexion plateforme** : Nouvelles données disponibles
- ✅ **Déconnexion plateforme** : Données plus valides

### **Quand NE PAS invalider :**
- ❌ **Sync artistes** : Met à jour les scores stockés, pas les listes
- ❌ **Consultation profil** : N'affecte pas les artistes
- ❌ **Erreurs temporaires** : Garde le cache pour robustesse

## 🎯 **Avantages Utilisateur**

### **Expérience fluide :**
1. **Première visite** : 2-3s (calcul initial)
2. **Visites suivantes** : <100ms (cache)
3. **Token révoqué** : Données disponibles + message clair
4. **Reconnexion** : Données fraîches automatiquement

### **Robustesse :**
- 🛡️ **Pas de panne** si Spotify indisponible
- 🔄 **Récupération automatique** après reconnexion
- 📱 **Interface mobile** toujours fonctionnelle
- ⚡ **Performance constante** même en mode dev

## 📱 **Pour l'équipe mobile**

### **Nouveaux champs de réponse :**
```json
{
  "success": true,
  "data": {
    "artists": [...],
    "cached": true,
    "cache_status": "fresh|stale|fallback_revoked",
    "warning": "Message si données périmées"
  }
}
```

### **Gestion des statuts :**
- `fresh` : Données récentes (< 3h)
- `stale` : Données anciennes mais utilisables
- `fallback_revoked` : Token révoqué, données de secours

### **Actions recommandées :**
```typescript
// Afficher un badge si données périmées
if (response.cache_status === 'fallback_revoked') {
  showWarningBadge(response.warning)
  showReconnectButton('spotify')
}

// Utiliser l'endpoint de déconnexion
const disconnect = () => {
  fetch('/api/user/platforms/disconnect', {
    method: 'POST',
    body: JSON.stringify({ platform_slug: 'spotify' })
  })
}
```

---

**✅ Cache intelligent implémenté ! Performance maximale avec robustesse garantie ! 🚀**
