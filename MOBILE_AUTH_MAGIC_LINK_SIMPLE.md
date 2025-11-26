# 🔐 Guide d'authentification Magic Link SIMPLE pour l'app mobile DIBS

Ce guide explique comment implémenter l'authentification Magic Link dans l'application mobile DIBS **SANS deep links compliqués**.

## 📋 Vue d'ensemble

L'authentification Magic Link permet aux utilisateurs de se connecter en cliquant simplement sur un lien reçu par email, sans avoir besoin de saisir un mot de passe.

### Avantages
- ✅ Plus sécurisé (pas de mot de passe à retenir)
- ✅ Meilleure UX (un seul clic)
- ✅ Moins de friction
- ✅ **PAS de deep links compliqués !**
- ✅ Gestion automatique par Supabase

## 🏗️ Architecture SIMPLE

```
1. App Mobile → Backend API (demande Magic Link)
2. Backend → Supabase → Email Magic Link → Utilisateur
3. Utilisateur clique sur le lien (ouvre une page web)
4. App Mobile → Supabase (vérifie la session)
```

**Pas de deep links ! L'utilisateur clique sur le lien, puis revient dans l'app.**

## 🚀 Implémentation React Native/Expo SIMPLE

### 1. Installation des dépendances

```bash
npm install @supabase/supabase-js @react-native-async-storage/async-storage
# Plus besoin d'expo-linking !
```

### 2. Configuration Supabase

```javascript
// lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uiksbhgojgvytapelbuq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 3. Service d'authentification SIMPLE

```javascript
// services/authService.js
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../lib/supabase'

const API_BASE_URL = 'https://dibs-poc0.vercel.app'

class AuthService {
  
  // 1. Demander un Magic Link (SIMPLE)
  async sendMagicLink(email) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      const result = await response.json()
      return result
    } catch (error) {
      console.error('Erreur Magic Link:', error)
      throw error
    }
  }
  
  // 2. Vérifier si l'utilisateur est connecté (SIMPLE)
  async checkAuthStatus() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Erreur session:', error)
        return null
      }
      
      if (session) {
        // Sauvegarder le token
        await AsyncStorage.setItem('auth_token', session.access_token)
        await AsyncStorage.setItem('refresh_token', session.refresh_token)
        
        return {
          user: session.user,
          token: session.access_token
        }
      }
      
      return null
    } catch (error) {
      console.error('Erreur vérification auth:', error)
      return null
    }
  }
  
  // 3. Récupérer le token sauvegardé
  async getStoredToken() {
    try {
      return await AsyncStorage.getItem('auth_token')
    } catch (error) {
      console.error('Erreur récupération token:', error)
      return null
    }
  }
  
  // 4. Déconnexion
  async logout() {
    try {
      await supabase.auth.signOut()
      await AsyncStorage.removeItem('auth_token')
      await AsyncStorage.removeItem('refresh_token')
    } catch (error) {
      console.error('Erreur déconnexion:', error)
    }
  }
}

export default new AuthService()
```

### 4. Composant de connexion SIMPLE

```javascript
// screens/LoginScreen.js
import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native'
import authService from '../services/authService'

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  
  // Envoyer le Magic Link
  const handleSendMagicLink = async () => {
    if (!email) {
      Alert.alert('Erreur', 'Veuillez saisir votre email')
      return
    }
    
    setIsLoading(true)
    try {
      const result = await authService.sendMagicLink(email)
      
      if (result.success) {
        Alert.alert(
          'Email envoyé !', 
          'Vérifiez votre boîte email et cliquez sur le lien. Puis revenez dans l\'app et appuyez sur "Vérifier".',
          [{ text: 'OK' }]
        )
      } else {
        Alert.alert('Erreur', result.error)
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'envoyer l\'email')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Vérifier si l'utilisateur est connecté
  const handleCheckAuth = async () => {
    setIsChecking(true)
    try {
      const authData = await authService.checkAuthStatus()
      
      if (authData) {
        Alert.alert('Connexion réussie !', 'Vous êtes maintenant connecté.')
        navigation.replace('Home') // Naviguer vers l'écran principal
      } else {
        Alert.alert(
          'Pas encore connecté', 
          'Cliquez d\'abord sur le lien dans votre email, puis réessayez.'
        )
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de vérifier l\'authentification')
    } finally {
      setIsChecking(false)
    }
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion DIBS</Text>
      
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Votre email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      
      <TouchableOpacity 
        style={[styles.button, styles.primaryButton]} 
        onPress={handleSendMagicLink}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Envoi...' : 'Envoyer Magic Link'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, styles.secondaryButton]} 
        onPress={handleCheckAuth}
        disabled={isChecking}
      >
        <Text style={styles.buttonTextSecondary}>
          {isChecking ? 'Vérification...' : 'Vérifier si connecté'}
        </Text>
      </TouchableOpacity>
      
      <Text style={styles.instructions}>
        1. Saisissez votre email{'\n'}
        2. Appuyez sur "Envoyer Magic Link"{'\n'}
        3. Cliquez sur le lien dans votre email{'\n'}
        4. Revenez dans l'app et appuyez sur "Vérifier"
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    backgroundColor: 'white',
    fontSize: 16,
  },
  button: {
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  instructions: {
    marginTop: 20,
    textAlign: 'center',
    color: '#666',
    lineHeight: 20,
  },
})

export default LoginScreen
```

### 5. Hook d'authentification (optionnel)

```javascript
// hooks/useAuth.js
import { useState, useEffect } from 'react'
import authService from '../services/authService'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    checkInitialAuth()
  }, [])
  
  const checkInitialAuth = async () => {
    try {
      const authData = await authService.checkAuthStatus()
      if (authData) {
        setUser(authData.user)
        setToken(authData.token)
      }
    } catch (error) {
      console.error('Erreur auth initiale:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const logout = async () => {
    await authService.logout()
    setUser(null)
    setToken(null)
  }
  
  return {
    user,
    token,
    isLoading,
    isAuthenticated: !!user,
    logout,
    refreshAuth: checkInitialAuth
  }
}
```

## 🔧 Configuration Supabase (côté serveur)

Dans le dashboard Supabase :

1. **Authentication → Settings**
2. **Site URL** : `https://dibs-poc0.vercel.app` (ou votre domaine)
3. **Redirect URLs** : Ajouter `https://dibs-poc0.vercel.app/**`

## 🎯 Flow utilisateur SIMPLE

1. **Utilisateur saisit son email** dans l'app
2. **App envoie une requête** à `/api/auth/magic-link`
3. **Utilisateur reçoit un email** avec un lien
4. **Utilisateur clique sur le lien** (ouvre une page web)
5. **Page web confirme** l'authentification
6. **Utilisateur revient dans l'app** et appuie sur "Vérifier"
7. **App vérifie la session** avec `supabase.auth.getSession()`
8. **Si connecté, redirection** vers l'écran principal

## ✅ Avantages de cette approche

- ✅ **Pas de deep links compliqués**
- ✅ **Fonctionne sur tous les appareils**
- ✅ **Pas de configuration spéciale**
- ✅ **Simple à implémenter**
- ✅ **Fiable**

## 🚨 Points importants

1. **Pas de deep links** - L'utilisateur clique sur le lien, puis revient manuellement dans l'app
2. **Vérification manuelle** - L'utilisateur doit appuyer sur "Vérifier" après avoir cliqué sur le lien
3. **Session Supabase** - L'authentification est gérée par Supabase, pas par des redirections
4. **Token persistant** - Le token est sauvegardé localement pour les prochains lancements

## 🔍 Debugging

```javascript
// Pour débugger l'authentification
const debugAuth = async () => {
  console.log('=== DEBUG AUTH ===')
  
  // Vérifier la session Supabase
  const { data: { session }, error } = await supabase.auth.getSession()
  console.log('Session:', session)
  console.log('Erreur:', error)
  
  // Vérifier le token stocké
  const storedToken = await AsyncStorage.getItem('auth_token')
  console.log('Token stocké:', storedToken)
  
  console.log('==================')
}
```

Cette approche est **beaucoup plus simple** et évite tous les problèmes de deep links !

