# 🪄 Authentification Magic Link pour l'App Mobile

Guide simple pour implémenter l'authentification Magic Link avec le backend DIBS.

## 🎯 Concept

L'utilisateur entre juste son **email**, reçoit un **Magic Link** par email, clique dessus et est automatiquement connecté. **Pas de mot de passe !**

---

## 📱 Implémentation Mobile

### 1️⃣ Configuration de base

```javascript
// api.js
import axios from 'axios'

const api = axios.create({
  baseURL: 'https://dibs-poc0.vercel.app', // Ou ton URL Vercel
  headers: {
    'Content-Type': 'application/json',
  },
})

export default api
```

### 2️⃣ Envoyer le Magic Link

```javascript
// auth.js
import api from './api'

async function sendMagicLink(email) {
  try {
    const response = await api.post('/api/auth/magic-link', {
      email: email,
      redirectTo: 'dibs://auth/callback' // Deep link de ton app
    })
    
    if (response.data.success) {
      console.log('✅ Magic Link envoyé à:', email)
      console.log('📧 Message:', response.data.data.message)
      return response.data.data
    }
  } catch (error) {
    console.error('❌ Erreur Magic Link:', error.response?.data)
    throw error
  }
}

// Utilisation
await sendMagicLink('user@example.com')
```

### 3️⃣ Gérer le Deep Link (callback)

```javascript
// App.js ou AuthContext.js
import { Linking } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

useEffect(() => {
  // Écouter les deep links
  const handleDeepLink = (url) => {
    console.log('🔗 Deep link reçu:', url)
    
    if (url.startsWith('dibs://auth/callback')) {
      const urlObj = new URL(url)
      const accessToken = urlObj.searchParams.get('access_token')
      const refreshToken = urlObj.searchParams.get('refresh_token')
      
      if (accessToken && refreshToken) {
        // Sauvegarder les tokens
        AsyncStorage.setItem('auth_token', accessToken)
        AsyncStorage.setItem('refresh_token', refreshToken)
        
        console.log('✅ Utilisateur connecté via Magic Link!')
        
        // Rediriger vers l'écran principal
        navigation.navigate('Home')
      }
    }
  }

  // Écouter les deep links quand l'app est ouverte
  const subscription = Linking.addEventListener('url', handleDeepLink)
  
  // Vérifier si l'app a été ouverte par un deep link
  Linking.getInitialURL().then((url) => {
    if (url) {
      handleDeepLink(url)
    }
  })

  return () => subscription?.remove()
}, [])
```

### 4️⃣ Écran de connexion simple

```javascript
// LoginScreen.js
import React, { useState } from 'react'
import { View, TextInput, TouchableOpacity, Text, Alert } from 'react-native'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSendMagicLink = async () => {
    if (!email) {
      Alert.alert('Erreur', 'Veuillez entrer votre email')
      return
    }

    setLoading(true)
    try {
      await sendMagicLink(email)
      setEmailSent(true)
      Alert.alert(
        'Magic Link envoyé ! 📧',
        'Vérifiez votre boîte email et cliquez sur le lien pour vous connecter.'
      )
    } catch (error) {
      Alert.alert('Erreur', error.response?.data?.error || 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 24, marginBottom: 20 }}>📧</Text>
        <Text style={{ fontSize: 18, textAlign: 'center', marginBottom: 10 }}>
          Magic Link envoyé !
        </Text>
        <Text style={{ textAlign: 'center', color: '#666' }}>
          Vérifiez votre boîte email ({email}) et cliquez sur le lien pour vous connecter.
        </Text>
        <TouchableOpacity 
          onPress={() => setEmailSent(false)}
          style={{ marginTop: 20, padding: 10 }}
        >
          <Text style={{ color: '#007AFF' }}>Renvoyer un lien</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 30, textAlign: 'center' }}>
        Connexion DIBS
      </Text>
      
      <TextInput
        placeholder="Votre email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          padding: 15,
          borderRadius: 8,
          marginBottom: 20,
          fontSize: 16
        }}
      />
      
      <TouchableOpacity
        onPress={handleSendMagicLink}
        disabled={loading}
        style={{
          backgroundColor: loading ? '#ccc' : '#007AFF',
          padding: 15,
          borderRadius: 8,
          alignItems: 'center'
        }}
      >
        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
          {loading ? 'Envoi...' : 'Envoyer Magic Link ✨'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}
```

---

## 🔧 Configuration Deep Link

### React Native / Expo

Dans `app.json` ou `app.config.js` :

```json
{
  "expo": {
    "scheme": "dibs",
    "name": "DIBS App"
  }
}
```

### React Native CLI

Dans `android/app/src/main/AndroidManifest.xml` :

```xml
<activity
  android:name=".MainActivity"
  android:exported="true"
  android:launchMode="singleTop"
  android:theme="@style/LaunchTheme">
  
  <intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="dibs" />
  </intent-filter>
</activity>
```

---

## 🔄 Gestion des tokens

```javascript
// tokenManager.js
import AsyncStorage from '@react-native-async-storage/async-storage'
import api from './api'

// Récupérer le token stocké
export async function getStoredToken() {
  try {
    return await AsyncStorage.getItem('auth_token')
  } catch (error) {
    console.error('Erreur récupération token:', error)
    return null
  }
}

// Configurer l'intercepteur API
api.interceptors.request.use(async (config) => {
  const token = await getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Gérer l'expiration du token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expiré, déconnecter l'utilisateur
      await AsyncStorage.removeItem('auth_token')
      await AsyncStorage.removeItem('refresh_token')
      // Rediriger vers login
    }
    return Promise.reject(error)
  }
)

// Vérifier si l'utilisateur est connecté
export async function isAuthenticated() {
  const token = await getStoredToken()
  return !!token
}

// Déconnexion
export async function logout() {
  try {
    await api.post('/api/auth/logout')
  } catch (error) {
    console.error('Erreur logout:', error)
  } finally {
    await AsyncStorage.removeItem('auth_token')
    await AsyncStorage.removeItem('refresh_token')
  }
}
```

---

## ✅ Avantages du Magic Link

- **🚀 Simple** : Juste un email, pas de mot de passe
- **🔒 Sécurisé** : Pas de mot de passe à retenir/voler
- **📱 Mobile-friendly** : Parfait pour les apps mobiles
- **🎯 UX optimale** : Moins de friction pour l'utilisateur
- **🔄 Pas d'inscription** : L'utilisateur est créé automatiquement

---

## 🧪 Test

1. **Envoyer un Magic Link** : `POST /api/auth/magic-link`
2. **Vérifier l'email** reçu
3. **Cliquer sur le lien** dans l'email
4. **Vérifier la redirection** vers l'app

---

## 📖 Documentation complète

Voir la documentation interactive : **https://dibs-poc0.vercel.app/api-docs-mobile**

Section **Auth** → **✨ P0 - Authentification Magic Link**
