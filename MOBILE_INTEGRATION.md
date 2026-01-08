# Guide d'Intégration Mobile

## 🎯 Architecture Backend-Mobile

Le backend Supabase est **totalement indépendant** et peut être utilisé par :
- ✅ Application Web (Next.js) - **Actuel**
- ✅ Application iOS (Swift / React Native)
- ✅ Application Android (Kotlin / React Native)

**Toutes les apps utilisent la même base de données et les mêmes règles de sécurité.**

## 📦 SDK Disponibles

### React Native
```bash
npm install @supabase/supabase-js
```

### iOS Native (Swift)
```swift
// Swift Package Manager
https://github.com/supabase/supabase-swift
```

### Android Native (Kotlin)
```kotlin
// Gradle
implementation 'io.github.jan-tennert.supabase:postgrest-kt:VERSION'
```

## 🔐 Authentification Mobile

### React Native Example

```typescript
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)

// Sign in with email
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
})

// Sign in with OAuth (Google, Apple)
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
})
```

### iOS Swift Example

```swift
import Supabase

let supabase = SupabaseClient(
  supabaseURL: URL(string: "https://your-project.supabase.co")!,
  supabaseKey: "your-anon-key"
)

// Sign in with email
try await supabase.auth.signInWithOTP(
  email: "user@example.com"
)

// Sign in with OAuth
try await supabase.auth.signInWithOAuth(provider: .google)
```

### Android Kotlin Example

```kotlin
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.gotrue.Auth

val supabase = createSupabaseClient(
    supabaseUrl = "https://your-project.supabase.co",
    supabaseKey = "your-anon-key"
) {
    install(Auth)
}

// Sign in
supabase.auth.signInWith(Email) {
    email = "user@example.com"
}
```

## 🗄️ Accès aux Données

### 1. Requêtes Directes (RLS activé)

**React Native:**
```typescript
// Get user's artists
const { data: artists } = await supabase
  .from('user_artists')
  .select(`
    fanitude_points,
    artists (id, name, image_url)
  `)
  .eq('user_id', user.id)
  .order('fanitude_points', { ascending: false })

// Add artist
await supabase.from('user_artists').insert({
  user_id: user.id,
  artist_id: artistId,
  fanitude_points: 0,
})
```

### 2. Via Edge Functions (Recommandé)

**Avantages:**
- ✅ Logique métier centralisée
- ✅ Validation côté serveur
- ✅ Pas de duplication de code
- ✅ Plus sécurisé

**React Native Example:**
```typescript
// Call Edge Function to add artists
const { data, error } = await supabase.functions.invoke('add-user-artists', {
  body: { artist_ids: ['id1', 'id2', 'id3'] }
})

// Scan QR code
const { data, error } = await supabase.functions.invoke('scan-qr-code', {
  body: { qr_code: 'ALBUM_MAYHEM_2024' }
})

// Sync streaming data
const { data, error } = await supabase.functions.invoke('sync-streaming-data', {
  body: { platform: 'spotify' }
})
```

**iOS Swift:**
```swift
struct AddArtistsRequest: Encodable {
    let artist_ids: [String]
}

let response = try await supabase.functions
    .invoke("add-user-artists", 
           options: FunctionInvokeOptions(
               body: AddArtistsRequest(artist_ids: ["id1", "id2"])
           ))
```

**Android Kotlin:**
```kotlin
val response = supabase.functions.invoke(
    "add-user-artists",
    body = mapOf("artist_ids" to listOf("id1", "id2"))
)
```

## 📱 Fonctionnalités Clés pour Mobile

### 1. Connexion Plateformes Streaming

```typescript
// React Native
import * as WebBrowser from 'expo-web-browser'

async function connectSpotify() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'spotify',
    options: {
      redirectTo: 'myapp://connect-platform',
      scopes: 'user-top-read user-read-recently-played'
    }
  })
  
  if (data?.url) {
    await WebBrowser.openAuthSessionAsync(data.url, 'myapp://')
  }
}
```

### 2. Scan QR Code

```typescript
// React Native avec expo-camera
import { Camera } from 'expo-camera'

function QRScanner() {
  const handleBarCodeScanned = async ({ data }) => {
    // Call Edge Function
    const result = await supabase.functions.invoke('scan-qr-code', {
      body: { qr_code: data }
    })
    
    if (result.data.success) {
      alert(`+${result.data.points_earned} points!`)
    }
  }

  return (
    <Camera
      onBarCodeScanned={handleBarCodeScanned}
      barCodeScannerSettings={{
        barCodeTypes: ['qr'],
      }}
    />
  )
}
```

### 3. Notifications Push

```typescript
// React Native
import * as Notifications from 'expo-notifications'

// Subscribe to realtime changes
supabase
  .channel('user_points')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'user_artists',
      filter: `user_id=eq.${user.id}`,
    },
    (payload) => {
      // Send local notification
      Notifications.scheduleNotificationAsync({
        content: {
          title: 'Points Updated!',
          body: `You now have ${payload.new.fanitude_points} points`,
        },
        trigger: null,
      })
    }
  )
  .subscribe()
```

### 4. Géolocalisation

```typescript
// React Native
import * as Location from 'expo-location'

async function updateUserLocation() {
  const { status } = await Location.requestForegroundPermissionsAsync()
  
  if (status === 'granted') {
    const location = await Location.getCurrentPositionAsync({})
    
    // Utiliser l'API endpoint (RECOMMANDÉ)
    const { data: { session } } = await supabase.auth.getSession()
    await fetch('https://api.dibs.app/api/user/location', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        city: 'Paris', // Obtenir via reverse geocoding
        country: 'France',
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        radius_km: 50
      })
    })
  }
}
```

## 🔒 Sécurité

### Row Level Security (RLS)

**Déjà configuré dans le backend !** Les mêmes règles s'appliquent automatiquement au mobile :

```sql
-- Users can only see their own data
CREATE POLICY "Users can view own artists" ON user_artists
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only modify their own data
CREATE POLICY "Users can insert own artists" ON user_artists
    FOR INSERT WITH CHECK (auth.uid() = user_id);
```

Le mobile n'a **rien à faire**, c'est automatique !

## 📊 Synchronisation Hors-ligne (Optional)

Pour une meilleure UX mobile :

```typescript
// React Native avec @react-native-async-storage/async-storage
import AsyncStorage from '@react-native-async-storage/async-storage'

// Cache data locally
await AsyncStorage.setItem('user_artists', JSON.stringify(artists))

// Load from cache first
const cached = await AsyncStorage.getItem('user_artists')
if (cached) {
  setArtists(JSON.parse(cached))
}

// Then fetch fresh data
const { data } = await supabase.from('user_artists').select('*')
setArtists(data)
await AsyncStorage.setItem('user_artists', JSON.stringify(data))
```

## 🚀 Setup Complet Mobile

### 1. Configuration Initiale

```typescript
// config/supabase.ts
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)
```

### 2. Navigation Flow

```typescript
// App.tsx
import { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

const Stack = createNativeStackNavigator()

export default function App() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!session ? (
          <Stack.Screen name="SignIn" component={SignInScreen} />
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="SelectArtists" component={SelectArtistsScreen} />
            <Stack.Screen name="QRScan" component={QRScanScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
```

## 📚 API Reference Mobile

### Méthodes Disponibles

| Fonction | Web | Mobile | Description |
|----------|-----|--------|-------------|
| `supabase.auth.signInWithOtp()` | ✅ | ✅ | Connexion email |
| `supabase.auth.signInWithOAuth()` | ✅ | ✅ | OAuth (Google, Apple) |
| `supabase.from().select()` | ✅ | ✅ | Lire données |
| `supabase.from().insert()` | ✅ | ✅ | Insérer données |
| `supabase.from().update()` | ✅ | ✅ | Modifier données |
| `supabase.from().delete()` | ✅ | ✅ | Supprimer données |
| `supabase.functions.invoke()` | ✅ | ✅ | Appeler Edge Function |
| `supabase.channel().subscribe()` | ✅ | ✅ | Realtime |
| `supabase.storage` | ✅ | ✅ | Upload fichiers |

## 🎨 UI Libraries Recommandées

### React Native
- **Expo** - Framework complet
- **React Native Paper** - Material Design
- **NativeBase** - Composants UI
- **React Navigation** - Navigation

### iOS Native
- **SwiftUI** - Interface native Apple
- **Combine** - Reactive programming

### Android Native
- **Jetpack Compose** - UI moderne
- **Material Design 3** - Design system

## ✅ Checklist Migration Mobile

- [ ] Installer SDK Supabase mobile
- [ ] Configurer credentials (.env)
- [ ] Implémenter authentification
- [ ] Tester les requêtes de base
- [ ] Implémenter scan QR avec camera
- [ ] Géolocalisation
- [ ] Deep linking pour OAuth
- [ ] Push notifications (optionnel)
- [ ] Cache hors-ligne (optionnel)
- [ ] Tests sur devices réels

## 🔗 Ressources

- [Supabase React Native Docs](https://supabase.com/docs/guides/getting-started/quickstarts/reactnative)
- [Supabase iOS Swift](https://github.com/supabase/supabase-swift)
- [Supabase Android Kotlin](https://github.com/supabase-community/supabase-kt)
- [Expo](https://expo.dev/)

---

**Le backend est prêt, il suffit d'installer le SDK mobile et de réutiliser les mêmes appels ! 🚀**



