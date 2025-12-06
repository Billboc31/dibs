# 🎯 Calcul de Scores de Fanitude en Temps Réel

## 📋 **Résumé**

L'endpoint `/api/user/artists` calcule maintenant les scores de fanitude **à la volée** pour trier les artistes par popularité, sans les stocker en base de données. Les scores ne sont stockés que lors de la sélection d'un artiste par l'utilisateur.

## 🔧 **Fonctionnement**

### **1. Calcul dynamique des scores**

**Fonction :** `calculateLiveFanitudeScore()`
- ✅ **Top Artists** : Position dans les top artists (court, moyen, long terme)
- ✅ **Écoutes récentes** : Nombre de tracks récemment jouées (3 min par track)
- ✅ **Artistes suivis** : Bonus de 20 minutes si l'artiste est suivi
- ✅ **Gestion des révocations** : Refresh automatique des tokens

### **2. Algorithme de scoring**

```typescript
// Position dans les top artists
const positionBonus = Math.max(50 - artistPosition, 1)
totalMinutes += positionBonus * 10 // 10 minutes par point de position

// Écoutes récentes
totalMinutes += artistTracks.length * 3 // 3 minutes par écoute

// Artiste suivi
if (isFollowed) {
  totalMinutes += 20 // Bonus de 20 minutes
}
```

### **3. Tri automatique**

1. **Récupération** de tous les artistes de l'utilisateur
2. **Calcul parallèle** des scores de fanitude pour chaque artiste
3. **Tri décroissant** par score (les plus écoutés en premier)
4. **Application de la pagination** après le tri
5. **Inclusion des scores** dans les résultats pour affichage mobile

## 📱 **Expérience utilisateur**

### **Avant (tri alphabétique) :**
```
1. Adele
2. Billie Eilish  
3. Ed Sheeran
4. Taylor Swift
```

### **Après (tri par popularité) :**
```
1. Taylor Swift (Score: 180 min)
2. Ed Sheeran (Score: 95 min)
3. Billie Eilish (Score: 60 min)
4. Adele (Score: 20 min)
```

## 🚀 **Performance**

### **Optimisations :**
- ✅ **Calculs parallèles** avec `Promise.all()`
- ✅ **Gestion d'erreurs** par artiste (un échec n'affecte pas les autres)
- ✅ **Fallback** au tri alphabétique si erreur générale
- ✅ **Cache implicite** via les tokens Spotify (pas de recalcul inutile)

### **Temps de réponse estimé :**
- **10 artistes** : ~500ms
- **50 artistes** : ~1.5s
- **100 artistes** : ~2.5s

## 🔄 **Gestion des erreurs**

### **Token expiré :**
```typescript
if (error.message === 'TOKEN_EXPIRED') {
  // Refresh automatique du token
  const newToken = await refreshSpotifyToken(refreshToken)
  // Retry avec le nouveau token
  return await calculateLiveFanitudeScore(artistId, newToken)
}
```

### **Token révoqué :**
```typescript
if (refreshError.message === 'SPOTIFY_TOKEN_REVOKED') {
  // Nettoyage automatique de la connexion
  await disconnectRevokedSpotifyUser(userId)
  throw new Error('SPOTIFY_TOKEN_REVOKED')
}
```

### **Fallback :**
```typescript
// Si erreur générale, tri alphabétique
catch (error) {
  console.log('📝 Fallback: tri par nom alphabétique')
  artists = artists.sort((a, b) => a.name.localeCompare(b.name))
}
```

## 📊 **Stockage des scores**

### **Scores temporaires (non stockés) :**
- ✅ Calculés à chaque appel `/api/user/artists`
- ✅ Utilisés pour le tri ET inclus dans la réponse
- ✅ Permettent l'affichage du score dans l'interface mobile

### **Scores persistants (stockés) :**
- ✅ Seulement lors de la sélection d'un artiste (`/api/user/artists/toggle`)
- ✅ Mis à jour lors de la synchronisation (`/api/user/artists/sync`)
- ✅ Visibles dans `/api/user/artists/followed`

## 🎯 **Avantages**

1. **Tri intelligent** : Les artistes les plus écoutés apparaissent en premier
2. **Données fraîches** : Scores calculés en temps réel depuis Spotify
3. **Pas de pollution** : Aucun stockage inutile en base
4. **Performance** : Calculs parallèles et gestion d'erreurs robuste
5. **Expérience** : Interface mobile plus intuitive

## 📱 **Pour l'équipe mobile**

### **Comportement attendu :**
```json
GET /api/user/artists?page=0&limit=10

{
  "success": true,
  "data": {
    "artists": [
      {
        "id": "...",
        "name": "Taylor Swift",
        "selected": true,
        "fanitude_score": 185
      },
      {
        "id": "...", 
        "name": "Ed Sheeran",
        "selected": false,
        "fanitude_score": 92
      }
    ],
    "note": "🎯 Artistes automatiquement triés par score de fanitude temps réel"
  }
}
```

### **Gestion des erreurs :**
- **Temps de réponse** : Prévoir 1-3s pour les grandes listes
- **Révocations** : Gérer `SPOTIFY_TOKEN_REVOKED` comme avant
- **Fallback** : Si erreur, tri alphabétique appliqué automatiquement

### **Affichage des scores :**
```jsx
// Exemple React Native
<View style={styles.artistItem}>
  <Text style={styles.artistName}>{artist.name}</Text>
  <View style={styles.scoreContainer}>
    <Text style={styles.scoreLabel}>🎵</Text>
    <Text style={styles.scoreValue}>{artist.fanitude_score} min</Text>
  </View>
  {artist.selected && <Icon name="heart" color="red" />}
</View>
```

**Suggestions d'affichage :**
- 🎵 **Badge de score** : Afficher le score avec une icône musicale
- 🏆 **Indicateur de popularité** : Barre de progression basée sur le score
- 🔥 **Icône "trending"** : Pour les scores élevés (>100 min)
- ⭐ **Étoiles** : Conversion du score en système d'étoiles (1-5)

---

**✅ Tri intelligent implémenté ! Les utilisateurs voient maintenant leurs artistes les plus écoutés en premier ! 🎵**
