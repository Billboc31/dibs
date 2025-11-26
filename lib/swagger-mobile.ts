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
          description: '**CRITIQUE** - Envoie un lien de connexion (Magic Link) par email à l\'utilisateur.',
          'x-priority': 'P0',
          security: [],
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
                      example: 'user@example.com'
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
                          message: { type: 'string' },
                          email: { type: 'string' },
                          message_id: { type: 'string', nullable: true }
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
                  }
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
                      data: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' } } }
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
          description: '**CRITIQUE** - Récupère la liste des artistes suivis par l\'utilisateur.',
          'x-priority': 'P0',
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
                          artists: { type: 'array', items: { $ref: '#/components/schemas/UserArtist' } }
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
                example: { qrCode: 'ALBUM_MAYHEM_2024' }
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
                          pointsEarned: { type: 'integer', example: 500 },
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
                          events: { type: 'array', items: { $ref: '#/components/schemas/Event' } }
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
