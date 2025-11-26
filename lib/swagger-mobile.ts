import swaggerJsdoc from 'swagger-jsdoc'

const options: any = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DIBS Mobile API - Magic Link Auth',
      version: '1.0.0',
      description: `📱 **API d'authentification Magic Link pour l'application mobile DIBS**

Cette API utilise uniquement l'authentification par Magic Link (lien de connexion par email) **SANS deep links compliqués**.

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

### 4. Utiliser le token pour les autres endpoints
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

// 3. Vérifier si l'utilisateur est connecté (SIMPLE)
const checkAuthStatus = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Erreur session:', error)
      return null
    }
    
    if (session) {
      // Utilisateur connecté !
      const token = session.access_token
      console.log('Token récupéré:', token)
      
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

// 4. Utilisation dans un composant
const LoginScreen = () => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const handleLogin = async () => {
    setIsLoading(true)
    await loginWithMagicLink(email)
    setIsLoading(false)
  }
  
  const handleCheckAuth = async () => {
    const authData = await checkAuthStatus()
    if (authData) {
      // Rediriger vers l'écran principal
      navigation.navigate('Home')
    } else {
      Alert.alert('Pas encore connecté', 'Cliquez d\'abord sur le lien dans votre email.')
    }
  }
  
  return (
    <View>
      <TextInput 
        value={email} 
        onChangeText={setEmail}
        placeholder="Votre email"
        keyboardType="email-address"
      />
      <Button 
        title="Envoyer Magic Link" 
        onPress={handleLogin}
        disabled={isLoading}
      />
      <Button 
        title="Vérifier si connecté" 
        onPress={handleCheckAuth}
      />
    </View>
  )
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
        }
      }
    },
    security: [
      {
        BearerAuth: []
      }
    ],
    paths: {
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
                  },
                  example: {
                    success: true,
                    data: {
                      message: 'Magic Link envoyé ! Cliquez sur le lien dans votre email pour vous connecter.',
                      email: 'user@example.com',
                      message_id: 'msg_123456',
                      instructions: 'L\'utilisateur doit cliquer sur le lien dans l\'email. Supabase gérera automatiquement l\'authentification.'
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
      '/api/auth/verify-otp': {
        post: {
          tags: ['Auth'],
          summary: '🔢 P2 - Vérifier un code OTP (Optionnel)',
          description: '**OPTIONNEL** - Vérifie un code OTP reçu par email. Alternative si les Magic Links ne fonctionnent pas.',
          'x-priority': 'P2',
          security: [], // Pas d'auth requise pour vérifier un OTP
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'token'],
                  properties: {
                    email: { 
                      type: 'string', 
                      format: 'email', 
                      example: 'user@example.com',
                      description: 'Email de l\'utilisateur'
                    },
                    token: { 
                      type: 'string', 
                      example: '123456',
                      description: 'Code OTP reçu par email'
                    }
                  }
                },
                example: {
                  email: 'user@example.com',
                  token: '123456'
                }
              }
            }
          },
          responses: {
            200: {
              description: 'OTP vérifié avec succès',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          user: { $ref: '#/components/schemas/User' },
                          session: {
                            type: 'object',
                            properties: {
                              access_token: { type: 'string' },
                              refresh_token: { type: 'string' },
                              expires_at: { type: 'integer' },
                              expires_in: { type: 'integer' }
                            }
                          },
                          message: { type: 'string', example: 'Connexion réussie !' }
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
                        display_name: null,
                        created_at: '2025-01-15T10:30:00Z'
                      },
                      session: {
                        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                        refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                        expires_at: 1737894600,
                        expires_in: 3600
                      },
                      message: 'Connexion réussie !'
                    }
                  }
                }
              }
            },
            400: {
              description: 'Code OTP invalide ou expiré',
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
      }
    }
  },
  apis: []
}

export const swaggerSpecMobile = swaggerJsdoc(options)