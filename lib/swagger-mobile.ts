import swaggerJsdoc from 'swagger-jsdoc'

const options: any = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DIBS Mobile API - Magic Link Auth',
      version: '1.0.0',
      description: `📱 **API d'authentification Magic Link pour l'application mobile DIBS**

Cette API utilise uniquement l'authentification par Magic Link (lien de connexion par email).

## 🔐 Authentication Magic Link

L'authentification se fait en 2 étapes :

### 1. Demander un Magic Link
\`\`\`javascript
const response = await fetch('/api/auth/magic-link', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    redirectTo: 'dibs://auth/callback' // Deep link mobile
  })
})
\`\`\`

### 2. L'utilisateur clique sur le lien dans son email
- Le lien redirige vers votre app mobile
- Supabase gère automatiquement l'authentification
- Récupérez le token avec \`supabase.auth.getSession()\`

### 3. Utiliser le token pour les autres endpoints
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

## 🚀 Exemple complet React Native/Expo

\`\`\`javascript
import { createClient } from '@supabase/supabase-js'
import * as Linking from 'expo-linking'

// 1. Configuration Supabase
const supabase = createClient(
  'https://uiksbhgojgvytapelbuq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
)

// 2. Fonction de connexion Magic Link
const loginWithMagicLink = async (email) => {
  try {
    // Demander le Magic Link via l'API
    const response = await fetch('https://dibs-poc0.vercel.app/api/auth/magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        redirectTo: 'dibs://auth/callback'
      })
    })
    
    const result = await response.json()
    
    if (result.success) {
      Alert.alert('Email envoyé !', 'Vérifiez votre boîte email et cliquez sur le lien.')
    }
  } catch (error) {
    console.error('Erreur Magic Link:', error)
  }
}

// 3. Gérer le deep link de retour
useEffect(() => {
  const handleDeepLink = (url) => {
    if (url.includes('access_token')) {
      // L'utilisateur a cliqué sur le Magic Link
      // Supabase gère automatiquement l'authentification
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          // Utilisateur connecté !
          const token = session.access_token
          // Sauvegarder le token et naviguer vers l'app
        }
      })
    }
  }
  
  Linking.addEventListener('url', handleDeepLink)
  return () => Linking.removeEventListener('url', handleDeepLink)
}, [])
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
                    },
                    redirectTo: { 
                      type: 'string', 
                      example: 'dibs://auth/callback',
                      description: 'URL de redirection après connexion (deep link mobile)'
                    }
                  }
                },
                example: {
                  email: 'user@example.com',
                  redirectTo: 'dibs://auth/callback'
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
                          message: { type: 'string', example: 'Magic link sent successfully' },
                          email: { type: 'string', example: 'user@example.com' },
                          message_id: { type: 'string', nullable: true, example: 'msg_123456' },
                          redirect_to: { type: 'string', example: 'dibs://auth/callback' }
                        }
                      }
                    }
                  },
                  example: {
                    success: true,
                    data: {
                      message: 'Magic link sent successfully',
                      email: 'user@example.com',
                      message_id: 'msg_123456',
                      redirect_to: 'dibs://auth/callback'
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