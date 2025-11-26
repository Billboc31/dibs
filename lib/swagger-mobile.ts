import swaggerJsdoc from 'swagger-jsdoc'

const options: any = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DIBS Mobile API',
      version: '1.0.0',
      description: `📱 **API complète pour l'application mobile DIBS**

Cette API est spécifiquement conçue pour l'application mobile. Tous les endpoints nécessitent une authentification via Supabase.

⚠️ **Important:** L'app mobile ne doit PAS se connecter directement à Supabase. Tous les appels doivent passer par ces endpoints API.

## 🔐 Authentication Magic Link (Simple)

L'authentification se fait en 2 étapes simples :

### 1. Demander un Magic Link
\`\`\`javascript
const response = await fetch('/api/auth/magic-link', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com'
  })
})
\`\`\`

### 2. L'utilisateur clique sur le lien dans son email
- Le lien ouvre une page web qui confirme l'authentification
- **Pas de deep links compliqués !**
- L'utilisateur revient dans l'app et utilise Supabase directement

### 3. Récupérer la session dans l'app mobile
\`\`\`javascript
// Dans l'app mobile après que l'utilisateur ait cliqué sur le lien
const { data: { session } } = await supabase.auth.getSession()
if (session) {
  // Utilisateur connecté !
  const token = session.access_token
}
\`\`\`

### 4. Écouter la connexion en temps réel (WebSocket)
\`\`\`javascript
// Écouter les changements d'authentification en temps réel
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session) {
    // L'utilisateur vient de se connecter !
    const token = session.access_token
    console.log('Utilisateur connecté automatiquement !', token)
    
    // Sauvegarder le token
    AsyncStorage.setItem('auth_token', token)
    
    // Rediriger vers l'écran principal
    navigation.navigate('Home')
  }
})
\`\`\`

### 5. Utiliser le token pour les autres endpoints
\`\`\`javascript
// Headers pour tous les autres appels API
const headers = {
  'Authorization': \`Bearer \${token}\`,
  'Content-Type': 'application/json'
}
\`\`\`

## 📊 Format de réponse

### Success
\`\`\`json
{
  "success": true,
  "data": { ... }
}
\`\`\`

### Error
\`\`\`json
{
  "success": false,
  "error": "Message d'erreur"
}
\`\`\`

## 🎯 Priorités

- **P0** = Critique (app ne peut pas fonctionner sans)
- **P1** = Important (features principales)
- **P2** = Nice to have

## 🚀 Exemple complet React Native/Expo (SIMPLE)

\`\`\`javascript
import { createClient } from '@supabase/supabase-js'
import { Alert } from 'react-native'

// 1. Configuration Supabase
const supabase = createClient(
  'https://uiksbhgojgvytapelbuq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
)

// 2. Fonction de connexion Magic Link (SIMPLE)
const loginWithMagicLink = async (email) => {
  try {
    // Demander le Magic Link via l'API
    const response = await fetch('https://dibs-poc0.vercel.app/api/auth/magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email })
    })
    
    const result = await response.json()
    
    if (result.success) {
      Alert.alert(
        'Email envoyé !', 
        'Vérifiez votre boîte email et cliquez sur le lien. Puis revenez dans l\'app et appuyez sur "Vérifier".'
      )
    }
  } catch (error) {
    console.error('Erreur Magic Link:', error)
  }
}

// 3. Écouter l'authentification en temps réel (AUTOMATIQUE)
const setupAuthListener = () => {
  // Écouter les changements d'état d'authentification
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      console.log('Auth event:', event, session)
      
      if (event === 'SIGNED_IN' && session) {
        // L'utilisateur vient de se connecter via Magic Link !
        const token = session.access_token
        
        console.log('✅ Connexion automatique détectée !', token)
        
        // Sauvegarder le token
        await AsyncStorage.setItem('auth_token', token)
        await AsyncStorage.setItem('refresh_token', session.refresh_token)
        
        // Mettre à jour l'état de l'app
        setUser(session.user)
        setToken(token)
        
        // Rediriger automatiquement vers l'écran principal
        Alert.alert('Connexion réussie !', 'Vous êtes maintenant connecté.')
        navigation.navigate('Home')
        
      } else if (event === 'SIGNED_OUT') {
        // L'utilisateur s'est déconnecté
        console.log('🚪 Déconnexion détectée')
        
        await AsyncStorage.removeItem('auth_token')
        await AsyncStorage.removeItem('refresh_token')
        
        setUser(null)
        setToken(null)
        
        navigation.navigate('Login')
      }
    }
  )
  
  // Retourner la fonction de nettoyage
  return () => subscription.unsubscribe()
}

// 4. Vérifier la session actuelle (au démarrage de l'app)
const checkAuthStatus = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Erreur session:', error)
      return null
    }
    
    if (session) {
      // Utilisateur déjà connecté !
      const token = session.access_token
      console.log('Token existant récupéré:', token)
      
      // Sauvegarder le token pour les appels API
      await AsyncStorage.setItem('auth_token', token)
      
      return {
        user: session.user,
        token: token
      }
    }
    
    return null
  } catch (error) {
    console.error('Erreur vérification auth:', error)
    return null
  }
}
\`\`\`
`,
      contact: {
        name: 'DIBS API Support',
        email: 'support@dibs.app'
      }
    },
    servers: [
      {
        url: 'https://dibs-poc0.vercel.app',
        description: 'Production Server'
      },
      {
        url: 'http://127.0.0.1:3001',
        description: 'Development Server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtenu via Supabase Auth'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Message d\'erreur' }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' },
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            display_name: { type: 'string', example: 'John Doe' },
            avatar_url: { type: 'string', nullable: true, example: 'https://example.com/avatar.jpg' },
            city: { type: 'string', nullable: true, example: 'Paris' },
            country: { type: 'string', nullable: true, example: 'France' },
            location_lat: { type: 'number', nullable: true, example: 48.8566 },
            location_lng: { type: 'number', nullable: true, example: 2.3522 },
            created_at: { type: 'string', format: 'date-time', example: '2025-01-15T10:30:00Z' },
            updated_at: { type: 'string', format: 'date-time', example: '2025-01-15T10:30:00Z' }
          }
        },
        Artist: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440001' },
            name: { type: 'string', example: 'Lady Gaga' },
            spotify_id: { type: 'string', nullable: true, example: '1HY2Jd0NmPuamShAr6KMms' },
            apple_music_id: { type: 'string', nullable: true, example: '277293880' },
            deezer_id: { type: 'string', nullable: true, example: '12246' },
            image_url: { type: 'string', nullable: true, example: 'https://example.com/artist.jpg' },
            created_at: { type: 'string', format: 'date-time', example: '2025-01-15T10:30:00Z' },
            updated_at: { type: 'string', format: 'date-time', example: '2025-01-15T10:30:00Z' }
          }
        },
        UserArtist: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            artist_id: { type: 'string', format: 'uuid' },
            fanitude_points: { type: 'integer', example: 1250 },
            listening_minutes: { type: 'integer', example: 625 },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            artist: { $ref: '#/components/schemas/Artist' }
          }
        },
        Event: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string', example: 'Lady Gaga - Chromatica Ball Tour' },
            artist_id: { type: 'string', format: 'uuid' },
            event_date: { type: 'string', format: 'date-time', example: '2025-07-15T20:00:00Z' },
            venue: { type: 'string', example: 'AccorHotels Arena' },
            city: { type: 'string', example: 'Paris' },
            country: { type: 'string', example: 'France' },
            image_url: { type: 'string', nullable: true },
            ticket_url: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        QRScan: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            qr_code: { type: 'string', example: 'ALBUM_MAYHEM_2024' },
            artist_id: { type: 'string', format: 'uuid' },
            points_earned: { type: 'integer', example: 500 },
            scanned_at: { type: 'string', format: 'date-time' },
            artist: { $ref: '#/components/schemas/Artist' }
          }
        }
      }
    },
    security: [
      {
        BearerAuth: []
      }
    ],
    paths: {
      // === AUTHENTICATION ===
      '/api/auth/magic-link': {
        post: {
          tags: ['Auth'],
          summary: '🔐 P0 - Envoyer un Magic Link',
          description: '**CRITIQUE** - Envoie un lien de connexion (Magic Link) par email à l\'utilisateur. L\'utilisateur clique sur le lien pour se connecter automatiquement.',
          'x-priority': 'P0',
          security: [], // Pas d'auth requise pour demander un Magic Link
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email'],
                  properties: {
                    email: { 
                      type: 'string', 
                      format: 'email', 
                      example: 'user@example.com',
                      description: 'Email de l\'utilisateur'
                    }
                  }
                },
                example: {
                  email: 'user@example.com'
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Magic link envoyé avec succès',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          message: { type: 'string', example: 'Magic Link envoyé ! Cliquez sur le lien dans votre email pour vous connecter.' },
                          email: { type: 'string', example: 'user@example.com' },
                          message_id: { type: 'string', nullable: true, example: 'msg_123456' },
                          instructions: { type: 'string', example: 'L\'utilisateur doit cliquer sur le lien dans l\'email. Supabase gérera automatiquement l\'authentification.' }
                        }
                      }
                    }
                  }
                }
              }
            },
            400: {
              description: 'Email manquant ou invalide',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/api/auth/me': {
        get: {
          tags: ['Auth'],
          summary: '👤 P0 - Obtenir l\'utilisateur actuel',
          description: '**CRITIQUE** - Récupère les informations de l\'utilisateur actuellement connecté.',
          'x-priority': 'P0',
          responses: {
            200: {
              description: 'Informations utilisateur',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          user: { $ref: '#/components/schemas/User' }
                        }
                      }
                    }
                  }
                }
              }
            },
            401: {
              description: 'Non authentifié',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/api/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: '🚪 P0 - Déconnexion',
          description: '**CRITIQUE** - Déconnecte l\'utilisateur et invalide sa session.',
          'x-priority': 'P0',
          responses: {
            200: {
              description: 'Déconnexion réussie',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          message: { type: 'string', example: 'Logged out successfully' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/auth/ws': {
        get: {
          tags: ['Auth'],
          summary: '🔄 P0 - WebSocket Authentification personnalisé',
          description: `**CRITIQUE** - WebSocket personnalisé pour écouter l'authentification en temps réel.

## 🌐 WebSocket personnalisé (Server-Sent Events)

\`\`\`javascript
// Connexion au WebSocket personnalisé
const connectToAuthWS = (email) => {
  const eventSource = new EventSource(
    \`https://dibs-poc0.vercel.app/api/auth/ws?email=\${encodeURIComponent(email)}\`
  )
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data)
    console.log('WebSocket message:', data)
    
    switch (data.type) {
      case 'connected':
        console.log('✅ WebSocket connecté')
        setStatus('En attente de l\'authentification...')
        break
        
      case 'authenticated':
        console.log('🎉 Utilisateur authentifié !', data.user)
        setStatus('Connexion réussie !')
        
        // L'utilisateur est connecté !
        Alert.alert('Connexion réussie !', 'Vous êtes maintenant connecté.')
        navigation.navigate('Home')
        
        // Fermer la connexion
        eventSource.close()
        break
        
      case 'ping':
        console.log('⏳ En attente...', data.message)
        break
        
      case 'timeout':
        console.log('⏰ Timeout WebSocket')
        setStatus('Timeout - Veuillez réessayer')
        eventSource.close()
        break
        
      case 'error':
        console.error('❌ Erreur WebSocket:', data.error)
        setStatus('Erreur de connexion')
        break
    }
  }
  
  eventSource.onerror = (error) => {
    console.error('Erreur EventSource:', error)
    setStatus('Erreur de connexion WebSocket')
  }
  
  return eventSource
}
\`\`\`

## 📱 Exemple complet avec WebSocket personnalisé

\`\`\`javascript
// LoginScreen avec WebSocket personnalisé
import React, { useState, useRef } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native'

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState('')
  const eventSourceRef = useRef(null)
  
  const handleSendMagicLink = async () => {
    if (!email) {
      Alert.alert('Erreur', 'Veuillez saisir votre email')
      return
    }
    
    setIsLoading(true)
    
    try {
      // 1. Envoyer le Magic Link
      const response = await fetch('https://dibs-poc0.vercel.app/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      const result = await response.json()
      
      if (result.success) {
        // 2. Connecter au WebSocket pour écouter l'authentification
        const eventSource = new EventSource(
          \`https://dibs-poc0.vercel.app/api/auth/ws?email=\${encodeURIComponent(email)}\`
        )
        
        eventSourceRef.current = eventSource
        
        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data)
          
          switch (data.type) {
            case 'connected':
              setStatus('WebSocket connecté - En attente...')
              break
              
            case 'authenticated':
              setStatus('Connexion réussie ! 🎉')
              Alert.alert(
                'Connexion réussie !', 
                'Vous êtes maintenant connecté à DIBS.',
                [{ text: 'Continuer', onPress: () => navigation.navigate('Home') }]
              )
              eventSource.close()
              break
              
            case 'ping':
              setStatus('En attente de l\'authentification...')
              break
              
            case 'timeout':
              setStatus('Timeout - Veuillez réessayer')
              eventSource.close()
              setIsLoading(false)
              break
              
            case 'error':
              setStatus('Erreur de connexion')
              eventSource.close()
              setIsLoading(false)
              break
          }
        }
        
        Alert.alert(
          'Email envoyé ! 📧', 
          'Cliquez sur le lien dans votre email. La connexion se fera automatiquement via WebSocket.'
        )
        
      } else {
        Alert.alert('Erreur', result.error)
        setIsLoading(false)
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'envoyer l\'email')
      setIsLoading(false)
    }
  }
  
  const handleCancel = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }
    setIsLoading(false)
    setStatus('')
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion DIBS</Text>
      
      {!isLoading ? (
        <>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Votre email"
            keyboardType="email-address"
          />
          
          <TouchableOpacity style={styles.button} onPress={handleSendMagicLink}>
            <Text style={styles.buttonText}>Connexion WebSocket</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.waitingContainer}>
          <Text style={styles.waitingTitle}>WebSocket actif</Text>
          <Text style={styles.status}>{status}</Text>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}
\`\`\`

## 🔄 Types de messages WebSocket

- \`connected\` - WebSocket connecté
- \`authenticated\` - Utilisateur authentifié (avec données user)
- \`ping\` - Message de maintien de connexion
- \`timeout\` - Timeout après 5 minutes
- \`error\` - Erreur de connexion

## ⚡ Avantages du WebSocket personnalisé

- ✅ **Contrôle total** - Logique personnalisée
- ✅ **Temps réel** - Détection instantanée
- ✅ **Timeout automatique** - Fermeture après 5 minutes
- ✅ **Messages détaillés** - Status et erreurs clairs
- ✅ **Compatible mobile** - Fonctionne avec EventSource

## 🚀 Utilisation avec Supabase (RECOMMANDÉ)

## 🚀 Utilisation avec Supabase (RECOMMANDÉ)

\`\`\`javascript
// Écouter les changements d'authentification en temps réel
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  async (event, session) => {
    console.log('Auth event:', event, session)
    
    if (event === 'SIGNED_IN' && session) {
      // L'utilisateur vient de se connecter via Magic Link !
      const token = session.access_token
      
      console.log('✅ Connexion automatique détectée !', token)
      
      // Sauvegarder le token
      await AsyncStorage.setItem('auth_token', token)
      
      // Rediriger automatiquement
      navigation.navigate('Home')
    }
  }
)

// N'oubliez pas de nettoyer l'abonnement
return () => subscription.unsubscribe()
\`\`\`

## 📱 Exemple complet React Native

\`\`\`javascript
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const useAuth = () => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // Vérifier la session actuelle au démarrage
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setUser(session.user)
        setToken(session.access_token)
        await AsyncStorage.setItem('auth_token', session.access_token)
      }
      setLoading(false)
    }
    
    getInitialSession()
    
    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event)
        
        if (event === 'SIGNED_IN' && session) {
          setUser(session.user)
          setToken(session.access_token)
          await AsyncStorage.setItem('auth_token', session.access_token)
          
          // Notification de connexion réussie
          Alert.alert('Connexion réussie !', 'Vous êtes maintenant connecté.')
          
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setToken(null)
          await AsyncStorage.removeItem('auth_token')
        }
        
        setLoading(false)
      }
    )
    
    return () => subscription.unsubscribe()
  }, [])
  
  return { user, token, loading }
}

// Utilisation dans un composant
const App = () => {
  const { user, token, loading } = useAuth()
  
  if (loading) {
    return <LoadingScreen />
  }
  
  return user ? <MainApp /> : <LoginScreen />
}
\`\`\`

## 📱 Écran de connexion avec WebSocket

\`\`\`javascript
// LoginScreen.js - Connexion automatique avec WebSocket
import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native'
import { supabase } from '../lib/supabase'

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isWaitingForAuth, setIsWaitingForAuth] = useState(false)
  
  // Configurer l'écoute WebSocket au montage du composant
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event reçu:', event)
        
        if (event === 'SIGNED_IN' && session) {
          // L'utilisateur vient de se connecter !
          console.log('✅ Connexion automatique via Magic Link !')
          
          setIsWaitingForAuth(false)
          
          // Sauvegarder le token
          await AsyncStorage.setItem('auth_token', session.access_token)
          
          // Afficher une notification de succès
          Alert.alert(
            'Connexion réussie ! 🎉', 
            'Vous êtes maintenant connecté à DIBS.',
            [{ text: 'Continuer', onPress: () => navigation.navigate('Home') }]
          )
        }
      }
    )
    
    // Nettoyer l'abonnement au démontage
    return () => subscription.unsubscribe()
  }, [navigation])
  
  // Envoyer le Magic Link
  const handleSendMagicLink = async () => {
    if (!email) {
      Alert.alert('Erreur', 'Veuillez saisir votre email')
      return
    }
    
    setIsLoading(true)
    
    try {
      const response = await fetch('https://dibs-poc0.vercel.app/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setIsWaitingForAuth(true)
        Alert.alert(
          'Email envoyé ! 📧', 
          'Cliquez sur le lien dans votre email. La connexion se fera automatiquement.',
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
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion DIBS</Text>
      
      {!isWaitingForAuth ? (
        <>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Votre email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleSendMagicLink}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Envoi...' : 'Envoyer Magic Link'}
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.waitingContainer}>
          <Text style={styles.waitingTitle}>En attente de connexion...</Text>
          <Text style={styles.waitingText}>
            Cliquez sur le lien dans votre email.{'\n'}
            La connexion se fera automatiquement ! ⚡
          </Text>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}
    </View>
  )
}
\`\`\`

## ⚡ Avantages du WebSocket Supabase

- ✅ **Automatique** - Pas besoin d'appuyer sur "Vérifier"
- ✅ **Temps réel** - Connexion instantanée après clic sur Magic Link
- ✅ **Fiable** - Géré nativement par Supabase
- ✅ **Simple** - Pas de serveur WebSocket à maintenir
- ✅ **Sécurisé** - Authentification gérée par Supabase

## 🔧 Events disponibles

- \`SIGNED_IN\` - Utilisateur connecté
- \`SIGNED_OUT\` - Utilisateur déconnecté  
- \`TOKEN_REFRESHED\` - Token rafraîchi
- \`USER_UPDATED\` - Profil utilisateur mis à jour`,
          'x-priority': 'P0',
          parameters: [
            {
              name: 'email',
              in: 'query',
              required: true,
              description: 'Email de l\'utilisateur à surveiller',
              schema: { type: 'string', format: 'email', example: 'user@example.com' }
            }
          ],
          responses: {
            200: {
              description: 'Server-Sent Events stream pour l\'authentification',
              content: {
                'text/event-stream': {
                  schema: {
                    type: 'object',
                    properties: {
                      type: { 
                        type: 'string', 
                        enum: ['connected', 'authenticated', 'ping', 'timeout', 'error'],
                        example: 'authenticated' 
                      },
                      message: { type: 'string', example: 'Utilisateur authentifié avec succès !' },
                      user: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', format: 'uuid' },
                          email: { type: 'string', format: 'email' },
                          display_name: { type: 'string', nullable: true },
                          last_sign_in_at: { type: 'string', format: 'date-time' }
                        }
                      },
                      timestamp: { type: 'string', format: 'date-time' }
                    }
                  },
                  example: {
                    type: 'authenticated',
                    message: 'Utilisateur authentifié avec succès !',
                    user: {
                      id: '550e8400-e29b-41d4-a716-446655440000',
                      email: 'user@example.com',
                      display_name: 'John Doe',
                      last_sign_in_at: '2025-11-26T16:30:00Z'
                    },
                    timestamp: '2025-11-26T16:30:00Z'
                  }
                }
              }
            },
            101: {
              description: 'WebSocket connection établie via Supabase Auth (alternative)',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      event: { 
                        type: 'string', 
                        enum: ['SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED', 'USER_UPDATED'],
                        example: 'SIGNED_IN' 
                      },
                      session: {
                        type: 'object',
                        properties: {
                          access_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                          refresh_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                          expires_at: { type: 'integer', example: 1737894600 },
                          expires_in: { type: 'integer', example: 3600 },
                          user: { $ref: '#/components/schemas/User' }
                        }
                      }
                    }
                  },
                  example: {
                    event: 'SIGNED_IN',
                    session: {
                      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                      refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                      expires_at: 1737894600,
                      expires_in: 3600,
                      user: {
                        id: '550e8400-e29b-41d4-a716-446655440000',
                        email: 'user@example.com',
                        display_name: 'John Doe'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },

      // === USER PROFILE ===
      '/api/user/profile': {
        get: {
          tags: ['User'],
          summary: '👤 P0 - Obtenir le profil utilisateur',
          description: '**CRITIQUE** - Récupère le profil complet de l\'utilisateur connecté.',
          'x-priority': 'P0',
          responses: {
            200: {
              description: 'Profil utilisateur',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          user: { $ref: '#/components/schemas/User' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        put: {
          tags: ['User'],
          summary: '✏️ P1 - Mettre à jour le profil',
          description: 'Met à jour les informations du profil utilisateur.',
          'x-priority': 'P1',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    display_name: { type: 'string', example: 'John Doe' },
                    avatar_url: { type: 'string', nullable: true, example: 'https://example.com/avatar.jpg' }
                  }
                },
                example: {
                  display_name: 'John Doe',
                  avatar_url: 'https://example.com/avatar.jpg'
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Profil mis à jour',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          user: { $ref: '#/components/schemas/User' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/user/location': {
        put: {
          tags: ['User'],
          summary: '📍 P1 - Mettre à jour la localisation',
          description: 'Met à jour la localisation de l\'utilisateur.',
          'x-priority': 'P1',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['city', 'country'],
                  properties: {
                    city: { type: 'string', example: 'Paris' },
                    country: { type: 'string', example: 'France' },
                    location_lat: { type: 'number', example: 48.8566 },
                    location_lng: { type: 'number', example: 2.3522 }
                  }
                },
                example: {
                  city: 'Paris',
                  country: 'France',
                  location_lat: 48.8566,
                  location_lng: 2.3522
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Localisation mise à jour',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          message: { type: 'string', example: 'Location updated successfully' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/user/stats': {
        get: {
          tags: ['User'],
          summary: '📊 P0 - Statistiques utilisateur',
          description: '**CRITIQUE** - Récupère les statistiques de l\'utilisateur (artistes, points, événements, scans).',
          'x-priority': 'P0',
          responses: {
            200: {
              description: 'Statistiques utilisateur',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          totalArtists: { type: 'integer', example: 5 },
                          totalPoints: { type: 'integer', example: 2750 },
                          upcomingEvents: { type: 'integer', example: 3 },
                          qrScans: { type: 'integer', example: 12 }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },

      // === ARTISTS ===
      '/api/user/artists': {
        get: {
          tags: ['Artists'],
          summary: '🎵 P0 - Artistes de l\'utilisateur',
          description: '**CRITIQUE** - Récupère la liste des artistes suivis par l\'utilisateur avec pagination.',
          'x-priority': 'P0',
          parameters: [
            {
              name: 'page',
              in: 'query',
              description: 'Numéro de page (commence à 1)',
              required: false,
              schema: { type: 'integer', default: 1, example: 1 }
            },
            {
              name: 'limit',
              in: 'query',
              description: 'Nombre d\'artistes par page',
              required: false,
              schema: { type: 'integer', default: 10, example: 10 }
            }
          ],
          responses: {
            200: {
              description: 'Liste des artistes',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          artists: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/UserArtist' }
                          },
                          pagination: {
                            type: 'object',
                            properties: {
                              page: { type: 'integer', example: 1 },
                              limit: { type: 'integer', example: 10 },
                              total: { type: 'integer', example: 25 },
                              hasMore: { type: 'boolean', example: true }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/user/artists/save': {
        post: {
          tags: ['Artists'],
          summary: '💾 P0 - Sauvegarder les artistes sélectionnés',
          description: '**CRITIQUE** - Sauvegarde la liste des artistes sélectionnés par l\'utilisateur.',
          'x-priority': 'P0',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['artistIds'],
                  properties: {
                    artistIds: {
                      type: 'array',
                      items: { type: 'string', format: 'uuid' },
                      example: ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002']
                    }
                  }
                },
                example: {
                  artistIds: ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002']
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Artistes sauvegardés',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          message: { type: 'string', example: 'Artists saved successfully' },
                          count: { type: 'integer', example: 2 }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/user/artists/top': {
        get: {
          tags: ['Artists'],
          summary: '🏆 P0 - Top 3 artistes',
          description: '**CRITIQUE** - Récupère les 3 artistes préférés de l\'utilisateur (plus de points).',
          'x-priority': 'P0',
          responses: {
            200: {
              description: 'Top 3 artistes',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          topArtists: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/UserArtist' },
                            maxItems: 3
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/artists/{id}': {
        get: {
          tags: ['Artists'],
          summary: '🎤 P1 - Détails d\'un artiste',
          description: 'Récupère les détails d\'un artiste spécifique.',
          'x-priority': 'P1',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'ID de l\'artiste',
              schema: { type: 'string', format: 'uuid' }
            }
          ],
          responses: {
            200: {
              description: 'Détails de l\'artiste',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          artist: { $ref: '#/components/schemas/Artist' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/artists/{id}/leaderboard': {
        get: {
          tags: ['Artists'],
          summary: '🏅 P1 - Classement pour un artiste',
          description: 'Récupère le classement des fans pour un artiste spécifique.',
          'x-priority': 'P1',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'ID de l\'artiste',
              schema: { type: 'string', format: 'uuid' }
            }
          ],
          responses: {
            200: {
              description: 'Classement des fans',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          artist: { $ref: '#/components/schemas/Artist' },
                          leaderboard: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                user_id: { type: 'string', format: 'uuid' },
                                display_name: { type: 'string', example: 'John Doe' },
                                fanitude_points: { type: 'integer', example: 1250 },
                                world_position: { type: 'integer', example: 1 },
                                country_position: { type: 'integer', example: 1 },
                                country: { type: 'string', example: 'France' }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },

      // === QR CODES ===
      '/api/qr/scan': {
        post: {
          tags: ['QR'],
          summary: '📱 P0 - Scanner un QR code',
          description: '**CRITIQUE** - Scanne un QR code et attribue des points à l\'utilisateur.',
          'x-priority': 'P0',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['qrCode'],
                  properties: {
                    qrCode: { type: 'string', example: 'ALBUM_MAYHEM_2024' }
                  }
                },
                example: {
                  qrCode: 'ALBUM_MAYHEM_2024'
                }
              }
            }
          },
          responses: {
            200: {
              description: 'QR code scanné avec succès',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          message: { type: 'string', example: 'QR code scanned successfully' },
                          pointsEarned: { type: 'integer', example: 500 },
                          artist: { $ref: '#/components/schemas/Artist' },
                          totalPoints: { type: 'integer', example: 1750 }
                        }
                      }
                    }
                  }
                }
              }
            },
            400: {
              description: 'QR code invalide ou déjà scanné',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/api/qr/history': {
        get: {
          tags: ['QR'],
          summary: '📋 P1 - Historique des scans QR',
          description: 'Récupère l\'historique des QR codes scannés par l\'utilisateur.',
          'x-priority': 'P1',
          responses: {
            200: {
              description: 'Historique des scans',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          scans: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/QRScan' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/qr/validate/{code}': {
        get: {
          tags: ['QR'],
          summary: '✅ P1 - Valider un QR code',
          description: 'Vérifie si un QR code est valide avant de le scanner.',
          'x-priority': 'P1',
          parameters: [
            {
              name: 'code',
              in: 'path',
              required: true,
              description: 'Code QR à valider',
              schema: { type: 'string' }
            }
          ],
          responses: {
            200: {
              description: 'QR code valide',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          valid: { type: 'boolean', example: true },
                          points: { type: 'integer', example: 500 },
                          artist: { $ref: '#/components/schemas/Artist' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },

      // === EVENTS ===
      '/api/events/upcoming': {
        get: {
          tags: ['Events'],
          summary: '🎪 P1 - Événements à venir',
          description: 'Récupère la liste des concerts et événements à venir.',
          'x-priority': 'P1',
          responses: {
            200: {
              description: 'Liste des événements',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          events: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Event' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/events/{id}': {
        get: {
          tags: ['Events'],
          summary: '🎫 P1 - Détails d\'un événement',
          description: 'Récupère les détails d\'un événement spécifique.',
          'x-priority': 'P1',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'ID de l\'événement',
              schema: { type: 'string', format: 'uuid' }
            }
          ],
          responses: {
            200: {
              description: 'Détails de l\'événement',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          event: { $ref: '#/components/schemas/Event' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/events/{id}/interested': {
        post: {
          tags: ['Events'],
          summary: '❤️ P2 - Marquer intérêt pour un événement',
          description: 'Marque l\'utilisateur comme intéressé par un événement.',
          'x-priority': 'P2',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'ID de l\'événement',
              schema: { type: 'string', format: 'uuid' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['status'],
                  properties: {
                    status: { 
                      type: 'string', 
                      enum: ['interested', 'going', 'not_interested'],
                      example: 'interested' 
                    }
                  }
                },
                example: {
                  status: 'interested'
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Statut mis à jour',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          message: { type: 'string', example: 'Interest status updated' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/user/events': {
        get: {
          tags: ['Events'],
          summary: '📅 P1 - Événements de l\'utilisateur',
          description: 'Récupère les événements auxquels l\'utilisateur s\'est montré intéressé.',
          'x-priority': 'P1',
          responses: {
            200: {
              description: 'Événements de l\'utilisateur',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          events: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                status: { type: 'string', example: 'interested' },
                                event: { $ref: '#/components/schemas/Event' }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },

      // === PLATFORMS ===
      '/api/platforms': {
        get: {
          tags: ['Platforms'],
          summary: '🎵 P2 - Plateformes de streaming',
          description: 'Récupère la liste des plateformes de streaming disponibles.',
          'x-priority': 'P2',
          responses: {
            200: {
              description: 'Liste des plateformes',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          platforms: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                id: { type: 'string', format: 'uuid' },
                                name: { type: 'string', example: 'Spotify' },
                                logo_url: { type: 'string', example: 'https://example.com/spotify-logo.png' },
                                is_active: { type: 'boolean', example: true }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/user/platforms': {
        get: {
          tags: ['Platforms'],
          summary: '🔗 P2 - Plateformes connectées',
          description: 'Récupère les plateformes de streaming connectées par l\'utilisateur.',
          'x-priority': 'P2',
          responses: {
            200: {
              description: 'Plateformes connectées',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          connectedPlatforms: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                platform_name: { type: 'string', example: 'Spotify' },
                                connected_at: { type: 'string', format: 'date-time' }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        delete: {
          tags: ['Platforms'],
          summary: '🗑️ P2 - Déconnecter une plateforme',
          description: 'Déconnecte une plateforme de streaming.',
          'x-priority': 'P2',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['platformId'],
                  properties: {
                    platformId: { type: 'string', format: 'uuid' }
                  }
                },
                example: {
                  platformId: '550e8400-e29b-41d4-a716-446655440003'
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Plateforme déconnectée',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          message: { type: 'string', example: 'Platform disconnected successfully' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  apis: []
}

export const swaggerSpecMobile = swaggerJsdoc(options)