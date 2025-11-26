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

## 🔐 Authentication Magic Link (WebSocket COMPLET)

L'authentification se fait avec le **WebSocket COMPLET** qui fait tout automatiquement :

### ⚡ WebSocket COMPLET - Tout automatique !
\`\`\`javascript
// 1 seule ligne pour TOUT faire !
const eventSource = new EventSource(
  \`https://dibs-poc0.vercel.app/api/auth/ws-complete?email=\${email}\`
)

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data)
  
  if (data.status === 'authenticated') {
    // TOKEN AUTOMATIQUEMENT REÇU !
    const token = data.session.access_token
    AsyncStorage.setItem('auth_token', token)
    navigation.navigate('Home')
  }
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
                          redirect_to: { type: 'string', example: 'https://dibs-poc0.vercel.app/auth/callback' },
                          instructions: { type: 'string', example: 'L\'utilisateur doit cliquer sur le lien dans l\'email. Il sera redirigé vers une page de callback qui déclenchera l\'événement WebSocket Supabase dans l\'app mobile.' }
                        }
                      }
                    }
                  },
                  example: {
                    success: true,
                    data: {
                      message: 'Magic Link envoyé ! Cliquez sur le lien dans votre email pour vous connecter.',
                      email: 'user@example.com',
                      message_id: 'msg_123456',
                      redirect_to: 'https://dibs-poc0.vercel.app/auth/callback',
                      instructions: 'L\'utilisateur doit cliquer sur le lien dans l\'email. Il sera redirigé vers une page de callback qui déclenchera l\'événement WebSocket Supabase dans l\'app mobile.'
                    }
                  }
                }
              }
            },
            400: {
              description: 'Email manquant ou invalide',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                  example: {
                    success: false,
                    error: 'Email is required'
                  }
                }
              }
            },
            500: {
              description: 'Erreur interne du serveur',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                  example: {
                    success: false,
                    error: 'Failed to send magic link'
                  }
                }
              }
            }
          }
        }
      },
      '/api/auth/ws-complete': {
        get: {
          tags: ['Auth'],
          summary: '🚀 P0 - WebSocket COMPLET (Magic Link + Token automatique)',
          description: `**CRITIQUE** - WebSocket tout-en-un : envoie le Magic Link ET renvoie le token automatiquement !

## 🚀 WebSocket COMPLET - Tout automatique !

Ce WebSocket fait TOUT en une seule connexion :
1. **Envoie automatiquement le Magic Link** dès la connexion
2. **Attend que l'utilisateur clique** sur le lien
3. **Renvoie automatiquement le token** quand l'utilisateur se connecte

### ⚡ Utilisation ULTRA SIMPLE

\`\`\`javascript
// 1 seule ligne pour tout faire !
const eventSource = new EventSource(
  \`https://dibs-poc0.vercel.app/api/auth/ws-complete?email=\${email}\`
)

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data)
  console.log('Step', data.step, ':', data.message)
  
  switch (data.status) {
    case 'connected':
      // Step 1: WebSocket connecté
      console.log('✅ WebSocket connecté')
      break
      
    case 'sending_magic_link':
      // Step 2: Envoi du Magic Link en cours
      console.log('📧 Envoi du Magic Link...')
      break
      
    case 'magic_link_sent':
      // Step 3: Magic Link envoyé
      console.log('✅ Magic Link envoyé !', data.message_id)
      Alert.alert('Email envoyé !', 'Cliquez sur le lien dans votre email.')
      break
      
    case 'waiting_for_click':
      // Step 4: En attente du clic
      console.log('⏳ En attente du clic sur le Magic Link...')
      break
      
    case 'authenticated':
      // Step 5: TOKEN REÇU !
      console.log('🎉 TOKEN REÇU !', data.session.access_token)
      
      // Sauvegarder le token
      AsyncStorage.setItem('auth_token', data.session.access_token)
      AsyncStorage.setItem('refresh_token', data.session.refresh_token)
      
      // Rediriger vers l'app
      Alert.alert('Connexion réussie !', 'Vous êtes connecté !')
      navigation.navigate('Home')
      
      eventSource.close()
      break
      
    case 'error':
      console.error('❌ Erreur:', data.error)
      Alert.alert('Erreur', data.message)
      eventSource.close()
      break
  }
}
\`\`\`

## 📱 Exemple complet React Native

\`\`\`javascript
// LoginScreen avec WebSocket COMPLET
const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')
  const [step, setStep] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const eventSourceRef = useRef(null)
  
  const handleCompleteLogin = () => {
    if (!email) {
      Alert.alert('Erreur', 'Saisissez votre email')
      return
    }
    
    // Connexion au WebSocket COMPLET
    const eventSource = new EventSource(
      \`https://dibs-poc0.vercel.app/api/auth/ws-complete?email=\${encodeURIComponent(email)}\`
    )
    
    eventSourceRef.current = eventSource
    setIsActive(true)
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setStep(data.step || 0)
      setStatus(data.message)
      
      switch (data.status) {
        case 'magic_link_sent':
          Alert.alert('Email envoyé ! 📧', 'Cliquez sur le lien dans votre email.')
          break
          
        case 'authenticated':
          // TOKEN AUTOMATIQUEMENT REÇU !
          AsyncStorage.setItem('auth_token', data.session.access_token)
          Alert.alert('Connexion réussie ! 🎉', 'Vous êtes maintenant connecté.')
          navigation.navigate('Home')
          eventSource.close()
          setIsActive(false)
          break
          
        case 'error':
          Alert.alert('Erreur', data.message)
          eventSource.close()
          setIsActive(false)
          break
      }
    }
    
    eventSource.onerror = () => {
      setStatus('Erreur de connexion WebSocket')
      setIsActive(false)
    }
  }
  
  const handleCancel = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }
    setIsActive(false)
    setStatus('')
    setStep(0)
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>DIBS - WebSocket Complet</Text>
      
      {!isActive ? (
        <>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Votre email"
            keyboardType="email-address"
          />
          <TouchableOpacity onPress={handleCompleteLogin}>
            <Text>🚀 Connexion Automatique Complète</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View>
          <Text>WebSocket Actif - Étape {step}/5</Text>
          <Text>{status}</Text>
          <ActivityIndicator size="large" color="#007AFF" />
          <TouchableOpacity onPress={handleCancel}>
            <Text>Annuler</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}
\`\`\`

## 🔄 Flow complet automatique

\`\`\`
1. App → Connexion WebSocket (/api/auth/ws-complete?email=...)
2. WebSocket → Envoie automatiquement le Magic Link
3. WebSocket → "magic_link_sent" (avec message_id)
4. Utilisateur → Clique sur le lien dans l'email
5. Callback → Vérifie le Magic Link et envoie le token au WebSocket
6. WebSocket → "authenticated" avec access_token + refresh_token
7. App → Sauvegarde le token et redirige vers Home
\`\`\`

## ⚡ Avantages du WebSocket COMPLET

- ✅ **Tout automatique** - Magic Link + Token en une connexion
- ✅ **Pas d'étapes manuelles** - L'utilisateur clique juste sur le lien
- ✅ **Token direct** - Pas besoin de \`supabase.auth.getSession()\`
- ✅ **Steps clairs** - Suivi étape par étape (1 à 5)
- ✅ **Gestion d'erreurs** - Erreurs détaillées à chaque étape
- ✅ **Fermeture auto** - Se ferme après authentification

## 🎯 Messages WebSocket Complet

- **Step 1** - \`connected\` : WebSocket connecté
- **Step 2** - \`sending_magic_link\` : Envoi Magic Link en cours
- **Step 3** - \`magic_link_sent\` : Magic Link envoyé (avec message_id)
- **Step 4** - \`waiting_for_click\` : En attente du clic
- **Step 5** - \`authenticated\` : TOKEN REÇU ! (avec session complète)
- **Error** - \`error\` : Erreur à n'importe quelle étape`,
          'x-priority': 'P0',
          parameters: [
            {
              name: 'email',
              in: 'query',
              required: true,
              description: 'Email de l\'utilisateur',
              schema: { type: 'string', format: 'email', example: 'user@example.com' }
            }
          ],
          responses: {
            200: {
              description: 'WebSocket complet - Magic Link + Token automatique',
              content: {
                'text/event-stream': {
                  schema: {
                    type: 'object',
                    properties: {
                      step: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
                      status: { 
                        type: 'string', 
                        enum: ['connected', 'sending_magic_link', 'magic_link_sent', 'waiting_for_click', 'authenticated', 'error'],
                        example: 'authenticated' 
                      },
                      message: { type: 'string', example: 'Authentification réussie ! Token envoyé à l\'app mobile.' },
                      email: { type: 'string', format: 'email', example: 'user@example.com' },
                      message_id: { type: 'string', nullable: true, example: 'msg_123456' },
                      redirect_to: { type: 'string', nullable: true, example: 'https://dibs-poc0.vercel.app/auth/callback-ws?email=user@example.com' },
                      user: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', format: 'uuid' },
                          email: { type: 'string', format: 'email' },
                          display_name: { type: 'string', nullable: true },
                          avatar_url: { type: 'string', nullable: true },
                          created_at: { type: 'string', format: 'date-time' }
                        }
                      },
                      session: {
                        type: 'object',
                        properties: {
                          access_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                          refresh_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                          expires_at: { type: 'integer', example: 1737894600 },
                          expires_in: { type: 'integer', example: 3600 }
                        }
                      },
                      timestamp: { type: 'string', format: 'date-time' }
                    }
                  },
                  example: {
                    step: 5,
                    status: 'authenticated',
                    message: 'Authentification réussie ! Token envoyé à l\'app mobile.',
                    email: 'user@example.com',
                    user: {
                      id: '550e8400-e29b-41d4-a716-446655440000',
                      email: 'user@example.com',
                      display_name: 'John Doe',
                      created_at: '2025-11-26T17:30:00Z'
                    },
                    session: {
                      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                      refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                      expires_at: 1737894600,
                      expires_in: 3600
                    },
                    timestamp: '2025-11-26T17:30:00Z'
                  }
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
                  },
                  example: {
                    success: true,
                    data: {
                      user: {
                        id: '550e8400-e29b-41d4-a716-446655440000',
                        email: 'user@example.com',
                        display_name: 'John Doe',
                        avatar_url: null,
                        city: 'Paris',
                        country: 'France',
                        created_at: '2025-01-15T10:30:00Z'
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
                  },
                  example: {
                    success: true,
                    data: {
                      user: {
                        id: '550e8400-e29b-41d4-a716-446655440000',
                        email: 'user@example.com',
                        display_name: 'John Doe',
                        avatar_url: 'https://example.com/avatar.jpg',
                        city: 'Paris',
                        country: 'France',
                        location_lat: 48.8566,
                        location_lng: 2.3522,
                        created_at: '2025-01-15T10:30:00Z',
                        updated_at: '2025-01-15T10:30:00Z'
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
                  },
                  example: {
                    success: true,
                    data: {
                      user: {
                        id: '550e8400-e29b-41d4-a716-446655440000',
                        email: 'user@example.com',
                        display_name: 'John Doe',
                        avatar_url: 'https://example.com/avatar.jpg',
                        city: 'Paris',
                        country: 'France',
                        updated_at: '2025-11-26T17:30:00Z'
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
                  },
                  example: {
                    success: true,
                    data: {
                      totalArtists: 5,
                      totalPoints: 2750,
                      upcomingEvents: 3,
                      qrScans: 12
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
                  },
                  example: {
                    success: true,
                    data: {
                      artists: [
                        {
                          id: '550e8400-e29b-41d4-a716-446655440001',
                          user_id: '550e8400-e29b-41d4-a716-446655440000',
                          artist_id: '550e8400-e29b-41d4-a716-446655440002',
                          fanitude_points: 1250,
                          listening_minutes: 625,
                          created_at: '2025-01-15T10:30:00Z',
                          updated_at: '2025-01-15T10:30:00Z',
                          artist: {
                            id: '550e8400-e29b-41d4-a716-446655440002',
                            name: 'Lady Gaga',
                            spotify_id: '1HY2Jd0NmPuamShAr6KMms',
                            image_url: 'https://example.com/ladygaga.jpg',
                            created_at: '2025-01-15T10:30:00Z',
                            updated_at: '2025-01-15T10:30:00Z'
                          }
                        }
                      ],
                      pagination: {
                        page: 1,
                        limit: 10,
                        total: 25,
                        hasMore: true
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
                  },
                  example: {
                    success: true,
                    data: {
                      message: 'Artists saved successfully',
                      count: 2
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
                  },
                  example: {
                    success: true,
                    data: {
                      topArtists: [
                        {
                          id: '550e8400-e29b-41d4-a716-446655440001',
                          fanitude_points: 1250,
                          artist: {
                            id: '550e8400-e29b-41d4-a716-446655440002',
                            name: 'Lady Gaga',
                            image_url: 'https://example.com/ladygaga.jpg'
                          }
                        },
                        {
                          id: '550e8400-e29b-41d4-a716-446655440003',
                          fanitude_points: 980,
                          artist: {
                            id: '550e8400-e29b-41d4-a716-446655440004',
                            name: 'The Weeknd',
                            image_url: 'https://example.com/theweeknd.jpg'
                          }
                        },
                        {
                          id: '550e8400-e29b-41d4-a716-446655440005',
                          fanitude_points: 750,
                          artist: {
                            id: '550e8400-e29b-41d4-a716-446655440006',
                            name: 'Taylor Swift',
                            image_url: 'https://example.com/taylorswift.jpg'
                          }
                        }
                      ]
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
                  },
                  example: {
                    success: true,
                    data: {
                      artist: {
                        id: '550e8400-e29b-41d4-a716-446655440002',
                        name: 'Lady Gaga',
                        spotify_id: '1HY2Jd0NmPuamShAr6KMms',
                        apple_music_id: '277293880',
                        deezer_id: '12246',
                        image_url: 'https://example.com/ladygaga.jpg',
                        created_at: '2025-01-15T10:30:00Z',
                        updated_at: '2025-01-15T10:30:00Z'
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
                  },
                  example: {
                    success: true,
                    data: {
                      artist: {
                        id: '550e8400-e29b-41d4-a716-446655440002',
                        name: 'Lady Gaga',
                        image_url: 'https://example.com/ladygaga.jpg'
                      },
                      leaderboard: [
                        {
                          user_id: '550e8400-e29b-41d4-a716-446655440000',
                          display_name: 'John Doe',
                          fanitude_points: 1250,
                          world_position: 1,
                          country_position: 1,
                          country: 'France'
                        },
                        {
                          user_id: '550e8400-e29b-41d4-a716-446655440007',
                          display_name: 'Jane Smith',
                          fanitude_points: 980,
                          world_position: 2,
                          country_position: 1,
                          country: 'USA'
                        }
                      ]
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
                  },
                  example: {
                    success: true,
                    data: {
                      message: 'QR code scanned successfully',
                      pointsEarned: 500,
                      artist: {
                        id: '550e8400-e29b-41d4-a716-446655440002',
                        name: 'Lady Gaga',
                        image_url: 'https://example.com/ladygaga.jpg'
                      },
                      totalPoints: 1750
                    }
                  }
                }
              }
            },
            400: {
              description: 'QR code invalide ou déjà scanné',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                  example: {
                    success: false,
                    error: 'QR code already scanned or invalid'
                  }
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
                  },
                  example: {
                    success: true,
                    data: {
                      scans: [
                        {
                          id: '550e8400-e29b-41d4-a716-446655440008',
                          user_id: '550e8400-e29b-41d4-a716-446655440000',
                          qr_code: 'ALBUM_MAYHEM_2024',
                          artist_id: '550e8400-e29b-41d4-a716-446655440002',
                          points_earned: 500,
                          scanned_at: '2025-11-26T15:30:00Z',
                          artist: {
                            id: '550e8400-e29b-41d4-a716-446655440002',
                            name: 'Lady Gaga',
                            image_url: 'https://example.com/ladygaga.jpg'
                          }
                        }
                      ]
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
                  },
                  example: {
                    success: true,
                    data: {
                      valid: true,
                      points: 500,
                      artist: {
                        id: '550e8400-e29b-41d4-a716-446655440002',
                        name: 'Lady Gaga',
                        image_url: 'https://example.com/ladygaga.jpg'
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
                  },
                  example: {
                    success: true,
                    data: {
                      events: [
                        {
                          id: '550e8400-e29b-41d4-a716-446655440009',
                          title: 'Lady Gaga - Chromatica Ball Tour',
                          artist_id: '550e8400-e29b-41d4-a716-446655440002',
                          event_date: '2025-07-15T20:00:00Z',
                          venue: 'AccorHotels Arena',
                          city: 'Paris',
                          country: 'France',
                          image_url: 'https://example.com/concert.jpg',
                          ticket_url: 'https://tickets.example.com/ladygaga',
                          created_at: '2025-01-15T10:30:00Z'
                        }
                      ]
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
                  },
                  example: {
                    success: true,
                    data: {
                      event: {
                        id: '550e8400-e29b-41d4-a716-446655440009',
                        title: 'Lady Gaga - Chromatica Ball Tour',
                        artist_id: '550e8400-e29b-41d4-a716-446655440002',
                        event_date: '2025-07-15T20:00:00Z',
                        venue: 'AccorHotels Arena',
                        city: 'Paris',
                        country: 'France',
                        image_url: 'https://example.com/concert.jpg',
                        ticket_url: 'https://tickets.example.com/ladygaga',
                        created_at: '2025-01-15T10:30:00Z'
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
                  },
                  example: {
                    success: true,
                    data: {
                      events: [
                        {
                          status: 'interested',
                          event: {
                            id: '550e8400-e29b-41d4-a716-446655440009',
                            title: 'Lady Gaga - Chromatica Ball Tour',
                            event_date: '2025-07-15T20:00:00Z',
                            venue: 'AccorHotels Arena',
                            city: 'Paris',
                            country: 'France'
                          }
                        }
                      ]
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
                  },
                  example: {
                    success: true,
                    data: {
                      platforms: [
                        {
                          id: '550e8400-e29b-41d4-a716-446655440010',
                          name: 'Spotify',
                          logo_url: 'https://example.com/spotify-logo.png',
                          is_active: true
                        },
                        {
                          id: '550e8400-e29b-41d4-a716-446655440011',
                          name: 'Apple Music',
                          logo_url: 'https://example.com/applemusic-logo.png',
                          is_active: false
                        }
                      ]
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
                  },
                  example: {
                    success: true,
                    data: {
                      connectedPlatforms: [
                        {
                          platform_name: 'Spotify',
                          connected_at: '2025-11-26T10:30:00Z'
                        }
                      ]
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
                  platformId: '550e8400-e29b-41d4-a716-446655440010'
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