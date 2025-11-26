# Guide d'Intégration des API de Streaming

## 🎯 Objectif

Récupérer les vraies données d'écoute depuis Spotify, Deezer ou Apple Music pour calculer les points de fanitude.

## 📦 Module créé

`lib/streaming-api.ts` contient toutes les fonctions pour :
- Se connecter aux API
- Récupérer les top artistes
- Calculer le temps d'écoute
- Synchroniser les données

## 🔧 Configuration préalable

### 1. Activer OAuth dans Supabase

Voir le fichier `OAUTH_SETUP.md` pour configurer Spotify, Deezer ou Apple Music.

**Important** : Dans la configuration Supabase, active le **provider_token** :
- Supabase Dashboard → **Authentication** → **Providers** → **Spotify**
- Coche "Request provider refresh token"

### 2. Permissions (Scopes)

#### Spotify
```typescript
scopes: [
  'user-top-read',           // Top artistes
  'user-read-recently-played', // Historique
  'user-library-read',       // Bibliothèque
]
```

#### Deezer
```typescript
scopes: [
  'basic_access',
  'email',
  'listening_history',
]
```

## 💻 Utilisation dans l'App

### Exemple 1 : Récupérer les top artistes Spotify

```typescript
import { getSpotifyTopArtists, syncUserListeningData } from '@/lib/streaming-api'

// Dans un composant ou une page
async function loadUserTopArtists() {
  const artists = await getSpotifyTopArtists('medium_term', 20)
  
  console.log('Top artistes:', artists)
  // Affiche: [{ id, name, images, genres }, ...]
}
```

### Exemple 2 : Synchroniser automatiquement les données

```typescript
import { syncUserListeningData } from '@/lib/streaming-api'

// Après connexion à Spotify
async function handleSpotifyConnected(userId: string) {
  try {
    const result = await syncUserListeningData(userId, 'spotify')
    console.log(`✅ ${result.synced} artistes synchronisés`)
  } catch (error) {
    console.error('Erreur sync:', error)
  }
}
```

### Exemple 3 : Bouton "Synchroniser mes écoutes"

```typescript
'use client'

import { useState } from 'react'
import { syncUserListeningData } from '@/lib/streaming-api'
import { supabase } from '@/lib/supabase'

export default function SyncButton() {
  const [loading, setLoading] = useState(false)

  const handleSync = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Sync Spotify (ou autre platform)
      await syncUserListeningData(user.id, 'spotify')
      
      alert('✅ Données synchronisées !')
    } catch (error) {
      alert('❌ Erreur lors de la synchronisation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button 
      onClick={handleSync} 
      disabled={loading}
      className="px-4 py-2 bg-spotify-green text-white rounded-lg"
    >
      {loading ? 'Synchronisation...' : '🔄 Sync Spotify'}
    </button>
  )
}
```

## 🔄 Synchronisation Automatique

### Option 1 : Sync à l'ouverture de l'app

```typescript
// Dans app/layout.tsx ou app/home/page.tsx
useEffect(() => {
  const syncData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // Sync si dernière sync > 24h
      await syncUserListeningData(user.id, 'spotify')
    }
  }
  
  syncData()
}, [])
```

### Option 2 : Sync périodique (Supabase Edge Function + Cron)

Créer une Edge Function qui tourne automatiquement :

```typescript
// supabase/functions/sync-all-users/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Get all users with connected platforms
  const { data: connections } = await supabase
    .from('user_streaming_platforms')
    .select('user_id, streaming_platforms(slug)')
    .not('access_token', 'is', null)

  // Sync each user
  for (const conn of connections || []) {
    try {
      await syncUserListeningData(conn.user_id, conn.streaming_platforms.slug)
    } catch (error) {
      console.error(`Error syncing user ${conn.user_id}:`, error)
    }
  }

  return new Response(JSON.stringify({ synced: connections?.length }))
})
```

Puis configure un Cron dans Supabase :
- **Database** → **Cron Jobs**
- Schedule: `0 2 * * *` (tous les jours à 2h du matin)

## 📊 Calcul des Points

### Formule actuelle

```
Points = Temps d'écoute (minutes) × 2
```

### Affinage possible

```typescript
function calculateFanitudePoints(
  listeningMinutes: number,
  playCount: number,
  followingSince: Date
): number {
  const basePoints = listeningMinutes * 2
  const loyaltyBonus = getDaysSince(followingSince) * 0.1
  const engagementBonus = playCount * 0.5
  
  return Math.floor(basePoints + loyaltyBonus + engagementBonus)
}
```

## 🎨 Intégration UI

### Ajouter un bouton Sync dans le profil

```typescript
// Dans app/profile/page.tsx
<button
  onClick={async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await syncUserListeningData(user.id, 'spotify')
      // Reload profile data
      loadProfile()
    }
  }}
  className="bg-spotify-green text-white px-6 py-2 rounded-lg"
>
  🔄 Sync Spotify Data
</button>
```

### Afficher la dernière sync

```typescript
<p className="text-sm text-gray-600">
  Dernière sync: {lastSyncAt ? formatDate(lastSyncAt) : 'Jamais'}
</p>
```

## 🐛 Gestion des Erreurs

### Token expiré

Si le token Spotify expire, redemander l'autorisation :

```typescript
try {
  await getSpotifyTopArtists()
} catch (error) {
  if (error.message.includes('401')) {
    // Token expired, reconnect
    router.push('/connect-platform')
  }
}
```

### Rate Limiting

Les API ont des limites :
- **Spotify** : 180 requêtes / minute
- **Deezer** : 50 requêtes / 5 secondes

Implémente un retry avec délai :

```typescript
async function fetchWithRetry(url: string, options: any, retries = 3) {
  try {
    const response = await fetch(url, options)
    if (response.status === 429) {
      // Rate limited
      await new Promise(resolve => setTimeout(resolve, 2000))
      if (retries > 0) return fetchWithRetry(url, options, retries - 1)
    }
    return response
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return fetchWithRetry(url, options, retries - 1)
    }
    throw error
  }
}
```

## 🔐 Sécurité

**⚠️ Jamais exposer les tokens côté client !**

Pour la production :
- Créer des Edge Functions Supabase
- Les appels API se font côté serveur
- Le client appelle l'Edge Function

Exemple :

```typescript
// supabase/functions/get-spotify-artists/index.ts
serve(async (req) => {
  const { userId } = await req.json()
  
  // Get user token (server-side)
  const token = await getUserSpotifyToken(userId)
  
  // Call Spotify API
  const artists = await fetch('https://api.spotify.com/v1/me/top/artists', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  
  return new Response(JSON.stringify(artists))
})
```

## 📚 Ressources API

- [Spotify Web API](https://developer.spotify.com/documentation/web-api/)
- [Deezer API](https://developers.deezer.com/api)
- [Apple Music API](https://developer.apple.com/documentation/applemusicapi)

## 🚀 Prochaines Étapes

1. Configure OAuth pour un provider (Spotify recommandé)
2. Teste la fonction `getSpotifyTopArtists()`
3. Implémente le bouton de sync dans le profil
4. Active la sync automatique quotidienne

Besoin d'aide pour une étape spécifique ? 😊



