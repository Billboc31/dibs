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

## 🔐 Authentication

Tous les endpoints (sauf OAuth callbacks) nécessitent un header d'authentification:

\`\`\`
Authorization: Bearer YOUR_SUPABASE_JWT_TOKEN
\`\`\`

Pour obtenir ce token, l'app mobile doit :
1. Authentifier l'utilisateur via Supabase Auth (email/password, OAuth, etc.)
2. Récupérer le JWT token avec \`supabase.auth.getSession()\`
3. Inclure ce token dans toutes les requêtes

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
        url: 'http://127.0.0.1:3001',
        description: 'Développement local'
      },
      {
        url: 'https://api.dibs.app',
        description: 'Production'
      }
    ],
    tags: [
      { name: 'Auth', description: '🔐 Authentification et session' },
      { name: 'User', description: '👤 Profil et données utilisateur' },
      { name: 'Artists', description: '🎤 Artistes et fanitude' },
      { name: 'Platforms', description: '🔗 Plateformes de streaming' },
      { name: 'QR', description: '📱 Scan de QR codes' },
      { name: 'Events', description: '📅 Événements et concerts' }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token from Supabase Auth'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Error message' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            display_name: { type: 'string', nullable: true },
            avatar_url: { type: 'string', nullable: true },
            city: { type: 'string', nullable: true },
            country: { type: 'string', nullable: true },
            location_lat: { type: 'number', nullable: true },
            location_lng: { type: 'number', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Artist: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            spotify_id: { type: 'string', nullable: true },
            apple_music_id: { type: 'string', nullable: true },
            deezer_id: { type: 'string', nullable: true },
            image_url: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        UserArtist: {
          type: 'object',
          properties: {
            artist_id: { type: 'string', format: 'uuid' },
            fanitude_points: { type: 'integer' },
            last_listening_minutes: { type: 'integer' },
            artists: { $ref: '#/components/schemas/Artist' }
          }
        },
        Platform: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            slug: { type: 'string' },
            logo_url: { type: 'string', nullable: true },
            is_active: { type: 'boolean' }
          }
        },
        Event: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            event_date: { type: 'string', format: 'date-time' },
            venue: { type: 'string', nullable: true },
            city: { type: 'string', nullable: true },
            country: { type: 'string', nullable: true },
            image_url: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    security: [{ BearerAuth: [] }],
    paths: {
      '/api/auth/me': {
        get: {
          tags: ['Auth'],
          summary: '🔐 P2 - Informations utilisateur courant',
          description: 'Récupère les informations de l\'utilisateur authentifié à partir du JWT token.',
          security: [{ BearerAuth: [] }],
          responses: {
            200: {
              description: 'Utilisateur authentifié',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/User' }
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
          summary: '🔐 P2 - Déconnexion',
          description: 'Déconnecte l\'utilisateur et invalide sa session.',
          security: [{ BearerAuth: [] }],
          responses: {
            200: {
              description: 'Déconnexion réussie',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Logged out successfully' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/user/profile': {
        get: {
          tags: ['User'],
          summary: '👤 P0 - Récupérer le profil utilisateur',
          description: '**CRITIQUE** - Récupère toutes les informations du profil de l\'utilisateur.',
          security: [{ BearerAuth: [] }],
          responses: {
            200: {
              description: 'Profil utilisateur',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/User' }
                    }
                  },
                  example: {
                    success: true,
                    data: {
                      id: '550e8400-e29b-41d4-a716-446655440000',
                      email: 'john.doe@example.com',
                      display_name: 'John Doe',
                      avatar_url: 'https://example.com/avatar.jpg',
                      city: 'Paris',
                      country: 'France',
                      location_lat: 48.8566,
                      location_lng: 2.3522,
                      created_at: '2025-01-15T10:30:00Z'
                    }
                  }
                }
              }
            },
            401: { description: 'Non authentifié', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
          }
        },
        put: {
          tags: ['User'],
          summary: '👤 P0 - Mettre à jour le profil',
          description: '**CRITIQUE** - Met à jour les informations du profil utilisateur.',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    display_name: { type: 'string' },
                    avatar_url: { type: 'string' },
                    city: { type: 'string' },
                    country: { type: 'string' }
                  }
                },
                example: {
                  display_name: 'John Doe',
                  avatar_url: 'https://example.com/avatar.jpg',
                  city: 'Paris',
                  country: 'France'
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
                      data: { $ref: '#/components/schemas/User' }
                    }
                  },
                  example: {
                    success: true,
                    data: {
                      id: '550e8400-e29b-41d4-a716-446655440000',
                      email: 'john.doe@example.com',
                      display_name: 'John Doe',
                      avatar_url: 'https://example.com/avatar.jpg',
                      city: 'Paris',
                      country: 'France',
                      location_lat: 48.8566,
                      location_lng: 2.3522,
                      created_at: '2025-01-15T10:30:00Z'
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
          description: 'Met à jour la ville, le pays et les coordonnées GPS de l\'utilisateur.',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['city', 'country'],
                  properties: {
                    city: { type: 'string' },
                    country: { type: 'string' },
                    location_lat: { type: 'number' },
                    location_lng: { type: 'number' }
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
                      data: { $ref: '#/components/schemas/User' }
                    }
                  },
                  example: {
                    success: true,
                    data: {
                      id: '550e8400-e29b-41d4-a716-446655440000',
                      email: 'john.doe@example.com',
                      display_name: 'John Doe',
                      avatar_url: 'https://example.com/avatar.jpg',
                      city: 'Paris',
                      country: 'France',
                      location_lat: 48.8566,
                      location_lng: 2.3522,
                      created_at: '2025-01-15T10:30:00Z'
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
          summary: '📊 P1 - Statistiques utilisateur',
          description: 'Récupère les statistiques de l\'utilisateur : nombre d\'artistes, points totaux, événements, scans QR.',
          security: [{ BearerAuth: [] }],
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
                          total_artists: { type: 'integer', example: 8 },
                          total_points: { type: 'integer', example: 2450 },
                          total_events: { type: 'integer', example: 3 },
                          total_qr_scans: { type: 'integer', example: 12 }
                        }
                      }
                    }
                  },
                  example: {
                    success: true,
                    data: {
                      total_artists: 8,
                      total_points: 2450,
                      total_events: 3,
                      total_qr_scans: 12
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/user/artists': {
        get: {
          tags: ['Artists'],
          summary: '🎤 P0 - Liste des artistes suivis',
          description: '**CRITIQUE** - Récupère la liste paginée des artistes suivis par l\'utilisateur avec leurs points de fanitude.',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 0 },
              description: 'Numéro de page (commence à 0)'
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 10 },
              description: 'Nombre d\'artistes par page'
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
                          total: { type: 'integer', example: 42 },
                          page: { type: 'integer', example: 0 },
                          hasMore: { type: 'boolean', example: true }
                        }
                      }
                    }
                  },
                  example: {
                    success: true,
                    data: {
                      artists: [
                        {
                          id: '550e8400-e29b-41d4-a716-446655440000',
                          name: 'Taylor Swift',
                          image_url: 'https://i.scdn.co/image/ab6761610000e5ebf0c20db5ef6c6fbe5135d2e4',
                          spotify_id: '06HL4z0CvFAxyc27GXpf02',
                          fanitude_points: 450
                        },
                        {
                          id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
                          name: 'The Weeknd',
                          image_url: 'https://i.scdn.co/image/ab6761610000e5eb214f3cf1cbe7139c1e26ffbb',
                          spotify_id: '1Xyo4u8uXC1ZmMpatF05PJ',
                          fanitude_points: 320
                        }
                      ],
                      total: 42,
                      page: 0,
                      hasMore: true
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
          summary: '🎤 P0 - Sauvegarder la sélection d\'artistes',
          description: '**CRITIQUE** - Sauvegarde la liste des artistes sélectionnés par l\'utilisateur. Remplace la liste existante.',
          security: [{ BearerAuth: [] }],
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
                      example: ['550e8400-e29b-41d4-a716-446655440000', '6ba7b810-9dad-11d1-80b4-00c04fd430c8', '7c9e6679-7425-40de-944b-e07fc1f90ae7']
                    }
                  }
                },
                example: {
                  artistIds: [
                    '550e8400-e29b-41d4-a716-446655440000',
                    '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
                    '7c9e6679-7425-40de-944b-e07fc1f90ae7'
                  ]
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
                          saved: { type: 'integer', example: 8 }
                        }
                      }
                    }
                  },
                  example: {
                    success: true,
                    data: {
                      saved: 3
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
          summary: '🎤 P0 - Top 3 artistes',
          description: '**CRITIQUE** - Récupère les 3 artistes avec le plus de points de fanitude pour l\'utilisateur.',
          security: [{ BearerAuth: [] }],
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
                        type: 'array',
                        items: { $ref: '#/components/schemas/UserArtist' }
                      }
                    }
                  },
                  example: {
                    success: true,
                    data: [
                      {
                        id: '550e8400-e29b-41d4-a716-446655440000',
                        name: 'Taylor Swift',
                        image_url: 'https://i.scdn.co/image/ab6761610000e5ebf0c20db5ef6c6fbe5135d2e4',
                        spotify_id: '06HL4z0CvFAxyc27GXpf02',
                        fanitude_points: 450
                      },
                      {
                        id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
                        name: 'The Weeknd',
                        image_url: 'https://i.scdn.co/image/ab6761610000e5eb214f3cf1cbe7139c1e26ffbb',
                        spotify_id: '1Xyo4u8uXC1ZmMpatF05PJ',
                        fanitude_points: 320
                      },
                      {
                        id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
                        name: 'Drake',
                        image_url: 'https://i.scdn.co/image/ab6761610000e5eb4293385d324db8558179afd9',
                        spotify_id: '3TVXtAsR1Inumwj472S9r4',
                        fanitude_points: 280
                      }
                    ]
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
          description: 'Récupère les informations détaillées d\'un artiste.',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID de l\'artiste'
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
                      data: { $ref: '#/components/schemas/Artist' }
                    }
                  }
                }
              }
            },
            404: {
              description: 'Artiste non trouvé',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/api/artists/{id}/leaderboard': {
        get: {
          tags: ['Artists'],
          summary: '🏆 P1 - Leaderboard d\'un artiste',
          description: 'Récupère le classement des fans pour un artiste spécifique.',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID de l\'artiste'
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 20 },
              description: 'Nombre de fans à retourner'
            }
          ],
          responses: {
            200: {
              description: 'Leaderboard',
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
                          currentUser: {
                            type: 'object',
                            properties: {
                              position: { type: 'integer', example: 42 },
                              country_position: { type: 'integer', example: 8 },
                              fanitude_points: { type: 'integer', example: 350 }
                            }
                          },
                          leaderboard: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                position: { type: 'integer' },
                                user_id: { type: 'string', format: 'uuid' },
                                display_name: { type: 'string' },
                                avatar_url: { type: 'string', nullable: true },
                                country: { type: 'string' },
                                fanitude_points: { type: 'integer' }
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
      '/api/platforms': {
        get: {
          tags: ['Platforms'],
          summary: '🔗 P0 - Liste des plateformes',
          description: '**CRITIQUE** - Récupère la liste de toutes les plateformes de streaming disponibles.',
          security: [{ BearerAuth: [] }],
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
                        type: 'array',
                        items: { $ref: '#/components/schemas/Platform' }
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
          summary: '🔗 P0 - Plateformes connectées',
          description: '**CRITIQUE** - Récupère les plateformes de streaming connectées par l\'utilisateur.',
          security: [{ BearerAuth: [] }],
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
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            platform_id: { type: 'string', format: 'uuid' },
                            connected_at: { type: 'string', format: 'date-time' },
                            platform: { $ref: '#/components/schemas/Platform' }
                          }
                        }
                      }
                    }
                  },
                  example: {
                    success: true,
                    data: [
                      {
                        platform_id: '550e8400-e29b-41d4-a716-446655440001',
                        connected_at: '2025-11-20T14:30:00Z',
                        platform: {
                          id: '550e8400-e29b-41d4-a716-446655440001',
                          name: 'Spotify',
                          is_active: true
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        },
        delete: {
          tags: ['Platforms'],
          summary: '🔗 P1 - Déconnecter une plateforme',
          description: 'Déconnecte une plateforme de streaming.',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: 'platformId',
              in: 'query',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID de la plateforme à déconnecter'
            }
          ],
          responses: {
            200: {
              description: 'Plateforme déconnectée',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Platform disconnected' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/qr/scan': {
        post: {
          tags: ['QR'],
          summary: '📱 P1 - Scanner un QR code',
          description: 'Scanne un QR code et ajoute des points de fanitude. Vérifie la validité et évite les doubles scans.',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['code'],
                  properties: {
                    code: { type: 'string', example: 'QR-ABC123' }
                  }
                },
                example: {
                  code: 'QR-ABC123'
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
                          points_earned: { type: 'integer', example: 50 },
                          artist_name: { type: 'string', example: 'Taylor Swift' },
                          item_type: { type: 'string', example: 'album' }
                        }
                      }
                    }
                  },
                  example: {
                    success: true,
                    data: {
                      points_earned: 50,
                      artist_name: 'Taylor Swift',
                      item_type: 'album',
                      item_name: 'Midnights',
                      total_points: 500
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
          summary: '📱 P1 - Historique des scans',
          description: 'Récupère l\'historique de tous les QR codes scannés par l\'utilisateur.',
          security: [{ BearerAuth: [] }],
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
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string', format: 'uuid' },
                            code: { type: 'string' },
                            scanned_at: { type: 'string', format: 'date-time' },
                            points_earned: { type: 'integer' },
                            qr_code: {
                              type: 'object',
                              properties: {
                                item_type: { type: 'string' },
                                item_name: { type: 'string' },
                                artist_id: { type: 'string', format: 'uuid', nullable: true }
                              }
                            }
                          }
                        }
                      }
                    }
                  },
                  example: {
                    success: true,
                    data: [
                      {
                        id: '550e8400-e29b-41d4-a716-446655440010',
                        code: 'QR-ABC123',
                        scanned_at: '2025-11-25T15:30:00Z',
                        points_earned: 50,
                        qr_code: {
                          item_type: 'album',
                          item_name: 'Midnights',
                          artist_id: '550e8400-e29b-41d4-a716-446655440000'
                        }
                      },
                      {
                        id: '6ba7b810-9dad-11d1-80b4-00c04fd430c9',
                        code: 'QR-DEF456',
                        scanned_at: '2025-11-24T10:15:00Z',
                        points_earned: 100,
                        qr_code: {
                          item_type: 'concert',
                          item_name: 'Eras Tour',
                          artist_id: '550e8400-e29b-41d4-a716-446655440000'
                        }
                      }
                    ]
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
          summary: '📱 P2 - Valider un QR code',
          description: 'Vérifie si un QR code est valide et actif sans le scanner.',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: 'code',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Code du QR à valider'
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
                          already_scanned: { type: 'boolean', example: false },
                          item_type: { type: 'string', example: 'album' },
                          item_name: { type: 'string', example: '1989 (Taylor\'s Version)' },
                          points_value: { type: 'integer', example: 50 }
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
      '/api/events/upcoming': {
        get: {
          tags: ['Events'],
          summary: '📅 P0 - Événements à venir',
          description: '**CRITIQUE** - Récupère les événements à venir pour les artistes suivis par l\'utilisateur.',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 10 },
              description: 'Nombre d\'événements à retourner'
            }
          ],
          responses: {
            200: {
              description: 'Événements à venir',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Event' }
                      }
                    }
                  },
                  example: {
                    success: true,
                    data: [
                      {
                        id: '550e8400-e29b-41d4-a716-446655440020',
                        name: 'Taylor Swift - Eras Tour Paris',
                        description: 'Concert exceptionnel au Stade de France',
                        event_date: '2025-12-15T20:00:00Z',
                        location: 'Stade de France, Paris',
                        artist_id: '550e8400-e29b-41d4-a716-446655440000',
                        artist_name: 'Taylor Swift',
                        image_url: 'https://example.com/event-image.jpg',
                        ticket_url: 'https://tickets.example.com/eras-tour'
                      },
                      {
                        id: '6ba7b810-9dad-11d1-80b4-00c04fd430d0',
                        name: 'The Weeknd - After Hours Tour',
                        description: 'Concert unique à l\'AccorHotels Arena',
                        event_date: '2025-12-20T19:30:00Z',
                        location: 'AccorHotels Arena, Paris',
                        artist_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
                        artist_name: 'The Weeknd',
                        image_url: 'https://example.com/weeknd-event.jpg',
                        ticket_url: 'https://tickets.example.com/weeknd-tour'
                      }
                    ]
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
          summary: '📅 P2 - Détails d\'un événement',
          description: 'Récupère les détails complets d\'un événement.',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID de l\'événement'
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
                      data: { $ref: '#/components/schemas/Event' }
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
          summary: '📅 P2 - Marquer intéressé par un événement',
          description: 'Marque l\'utilisateur comme intéressé par un événement.',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID de l\'événement'
            }
          ],
          responses: {
            200: {
              description: 'Intérêt enregistré',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Interest registered' }
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
          summary: '📅 P2 - Événements de l\'utilisateur',
          description: 'Récupère les événements pour lesquels l\'utilisateur a manifesté son intérêt.',
          security: [{ BearerAuth: [] }],
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
  apis: [] // Pas besoin de scanner les fichiers, tout est défini ci-dessus
}

const swaggerSpecMobile = swaggerJsdoc(options)

export default swaggerSpecMobile

