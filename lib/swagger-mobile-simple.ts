import swaggerJsdoc from 'swagger-jsdoc'

const options: any = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DIBS Mobile API',
      version: '1.0.0',
      description: 'API pour l\'application mobile DIBS - Exemples exhaustifs et tests'
    },
    servers: [
      {
        url: 'https://dibs-poc0.vercel.app',
        description: 'Production'
      },
      {
        url: 'http://127.0.0.1:3001',
        description: 'Local'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: []
}

// Spec manuelle avec exemples exhaustifs
const spec = {
  ...options.definition,
  paths: {
    // === AUTHENTIFICATION ===
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: '🔑 Connexion email/mot de passe',
        'x-priority': 'P0',
        requestBody: {
          content: {
            'application/json': {
              examples: {
                login: {
                  summary: 'Connexion standard',
                  value: {
                    email: 'user@example.com',
                    password: 'motdepasse123'
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Connexion réussie',
            content: {
              'application/json': {
                examples: {
                  success: {
                    summary: 'Succès',
                    value: {
                      success: true,
                      data: {
                        user: {
                          id: '550e8400-e29b-41d4-a716-446655440000',
                          email: 'user@example.com',
                          display_name: 'John Doe'
                        },
                        session: {
                          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzMzMDg2Mzk5LCJpYXQiOjE3MzMwODI3OTksImlzcyI6Imh0dHBzOi8vdWlrc2JoZ29qZ3Z5dGFwZWxidXEuc3VwYWJhc2UuY28vYXV0aC92MSIsInN1YiI6IjU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAwMCIsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSJ9.example_signature',
                          refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzMzNjg3NTk5LCJpYXQiOjE3MzMwODI3OTksInN1YiI6IjU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAwMCJ9.refresh_signature',
                          expires_in: 3600,
                          token_type: 'bearer'
                        }
                      }
                    }
                  },
                  error: {
                    summary: 'Erreur - Identifiants invalides',
                    value: {
                      success: false,
                      error: 'Invalid login credentials'
                    }
                  }
                }
              }
            }
          },
          400: {
            description: 'Erreur de validation',
            content: {
              'application/json': {
                examples: {
                  missing_fields: {
                    summary: 'Champs manquants',
                    value: {
                      success: false,
                      error: 'Email and password are required'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: '📝 Inscription',
        'x-priority': 'P0',
        requestBody: {
          content: {
            'application/json': {
              examples: {
                register: {
                  summary: 'Inscription standard',
                  value: {
                    email: 'newuser@example.com',
                    password: 'motdepasse123',
                    display_name: 'Jane Doe'
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Inscription réussie',
            content: {
              'application/json': {
                examples: {
                  success: {
                    summary: 'Succès',
                    value: {
                      success: true,
                      data: {
                        user: {
                          id: '550e8400-e29b-41d4-a716-446655440001',
                          email: 'newuser@example.com',
                          display_name: 'Jane Doe',
                          email_confirmed_at: null,
                          created_at: '2024-12-03T10:30:00Z'
                        },
                        message: 'Inscription réussie ! Vérifiez votre email pour confirmer votre compte.'
                      }
                    }
                  },
                  error_email_exists: {
                    summary: 'Email déjà utilisé',
                    value: {
                      success: false,
                      error: 'User already registered'
                    }
                  }
                }
              }
            }
          },
          400: {
            description: 'Erreur de validation',
            content: {
              'application/json': {
                examples: {
                  weak_password: {
                    summary: 'Mot de passe trop faible',
                    value: {
                      success: false,
                      error: 'Password should be at least 6 characters'
                    }
                  },
                  invalid_email: {
                    summary: 'Email invalide',
                    value: {
                      success: false,
                      error: 'Invalid email format'
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
        summary: '🚀 WebSocket Magic Link + Token',
        'x-priority': 'P0',
        description: 'WebSocket qui envoie le Magic Link et renvoie le token automatiquement.',
        parameters: [
          {
            name: 'email',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            example: 'user@example.com'
          }
        ],
        responses: {
          200: {
            description: 'Messages WebSocket',
            content: {
              'text/event-stream': {
                examples: {
                  connected: {
                    summary: 'Connexion établie',
                    value: {
                      status: 'connected',
                      message: 'WebSocket connecté'
                    }
                  },
                  magic_link_sent: {
                    summary: 'Magic Link envoyé',
                    value: {
                      status: 'magic_link_sent',
                      message: 'Magic Link envoyé avec succès',
                      message_id: 'msg_123456'
                    }
                  },
                  authenticated: {
                    summary: 'Token reçu',
                    value: {
                      status: 'authenticated',
                      message: 'Authentification réussie',
                      session: {
                        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                        refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                        expires_in: 3600
                      },
                      user: {
                        id: '550e8400-e29b-41d4-a716-446655440000',
                        email: 'user@example.com',
                        display_name: 'John Doe'
                      }
                    }
                  },
                  error: {
                    summary: 'Erreur',
                    value: {
                      status: 'error',
                      error: 'Email invalide',
                      message: 'Veuillez vérifier votre email'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    // === UTILISATEUR ===
    '/api/user/profile': {
      get: {
        tags: ['User'],
        summary: '👤 Profil utilisateur',
        'x-priority': 'P0',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Profil utilisateur',
            content: {
              'application/json': {
                examples: {
                  success: {
                    summary: 'Profil complet',
                    value: {
                      success: true,
                      data: {
                        id: '550e8400-e29b-41d4-a716-446655440000',
                        email: 'user@example.com',
                        display_name: 'John Doe',
                        avatar_url: 'https://example.com/avatar.jpg',
                        city: 'Paris',
                        country: 'France',
                        location_lat: 48.8566,
                        location_lng: 2.3522,
                        created_at: '2024-01-15T10:30:00Z',
                        updated_at: '2024-12-03T10:30:00Z'
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
                examples: {
                  unauthorized: {
                    summary: 'Token manquant ou invalide',
                    value: {
                      success: false,
                      error: 'Authorization header required'
                    }
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
        summary: '🎵 Liste des artistes disponibles (triés par popularité)',
        'x-priority': 'P0',
        'x-auth': true,
        security: [{ BearerAuth: [] }],
        description: 'Retourne TOUS les artistes disponibles pour l\'utilisateur sur toutes ses plateformes connectées. **NOUVEAU**: Les artistes sont automatiquement triés par score de fanitude calculé en temps réel (basé sur top artists, écoutes récentes, artistes suivis). Le score est inclus dans la réponse pour affichage mobile. Chaque artiste indique s\'il est sélectionné ou non.',
        parameters: [
          {
            name: 'page',
            in: 'query',
            required: false,
            schema: { type: 'integer', default: 0 },
            description: 'Numéro de page (commence à 0)',
            example: 0
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer', default: 10, minimum: 1, maximum: 50 },
            description: 'Nombre d\'artistes par page (1-50)',
            example: 10
          }
        ],
        responses: {
          200: {
            description: 'Liste des artistes',
            content: {
              'application/json': {
                examples: {
                  success: {
                    summary: 'Artistes triés par popularité temps réel',
                    value: {
                      success: true,
                      data: {
                        artists: [
                          {
                            id: '550e8400-e29b-41d4-a716-446655440010',
                            name: 'Taylor Swift',
                            spotify_id: '06HL4z0CvFAxyc27GXpf02',
                            apple_music_id: null,
                            deezer_id: null,
                            image_url: 'https://i.scdn.co/image/ab67616d0000b273e787cffec20aa2a396a61647',
                            selected: true,
                            fanitude_score: 185
                          },
                          {
                            id: '550e8400-e29b-41d4-a716-446655440011',
                            name: 'Ed Sheeran',
                            spotify_id: '6eUKZXaKkcviH0Ku9w2n3V',
                            apple_music_id: null,
                            deezer_id: null,
                            image_url: 'https://i.scdn.co/image/ab6761610000e5eb12a2ef08d00dd7451a6dbed6',
                            selected: false,
                            fanitude_score: 92
                          },
                          {
                            id: '550e8400-e29b-41d4-a716-446655440012',
                            name: 'Billie Eilish',
                            spotify_id: '6qqNVTkY8uBg9cP3Jd8DAH',
                            apple_music_id: null,
                            deezer_id: null,
                            image_url: 'https://i.scdn.co/image/ab6761610000e5eb4f7b3c6ac5a7e9c6b2c5f1a2',
                            selected: true,
                            fanitude_score: 67
                          }
                        ],
                        pagination: {
                          page: 0,
                          limit: 10,
                          total: 186,
                          hasMore: true
                        },
                        stats: {
                          total_artists: 186,
                          selected_artists: 23,
                          displayed_artists: 3
                        },
                        note: "🎯 Artistes triés par score de fanitude temps réel. Score inclus pour affichage mobile (basé sur: top artists + écoutes récentes + suivis)."
                      }
                    }
                  }
                }
              }
            }
          },
          401: {
            description: 'Non autorisé ou connexion révoquée',
            content: {
              'application/json': {
                examples: {
                  unauthorized: {
                    summary: 'Token manquant',
                    value: {
                      success: false,
                      error: 'Authorization header required'
                    }
                  },
                  spotify_revoked: {
                    summary: 'Connexion Spotify révoquée',
                    value: {
                      success: false,
                      error: 'SPOTIFY_TOKEN_REVOKED',
                      message: 'Votre connexion Spotify a été révoquée. Veuillez vous reconnecter.',
                      action_required: 'reconnect_spotify'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    '/api/user/artists/toggle': {
      post: {
        tags: ['Artists'],
        summary: '⭐ Sélectionner/Désélectionner artiste(s)',
        'x-priority': 'P0',
        'x-auth': true,
        security: [{ BearerAuth: [] }],
        description: 'Sélectionne ou désélectionne un ou plusieurs artistes. **RECOMMANDÉ**: Utilisez le format avec liste d\'artistes pour de meilleures performances. Déclenche automatiquement un sync pour recalculer les scores de fanitude des nouveaux artistes sélectionnés.',
        requestBody: {
          content: {
            'application/json': {
              examples: {
                multiple_toggle: {
                  summary: '🎯 RECOMMANDÉ: Toggle plusieurs artistes en une fois',
                  value: {
                    artists: [
                      {
                        artistId: '550e8400-e29b-41d4-a716-446655440010',
                        selected: true
                      },
                      {
                        artistId: '550e8400-e29b-41d4-a716-446655440011',
                        selected: false
                      },
                      {
                        artistId: '550e8400-e29b-41d4-a716-446655440012',
                        selected: true
                      },
                      {
                        artistId: '550e8400-e29b-41d4-a716-446655440013',
                        selected: true
                      },
                      {
                        artistId: '550e8400-e29b-41d4-a716-446655440014',
                        selected: false
                      }
                    ]
                  }
                },
                single_select: {
                  summary: 'Format simple: Sélectionner un seul artiste',
                  value: {
                    artistId: '550e8400-e29b-41d4-a716-446655440010',
                    selected: true
                  }
                },
                single_deselect: {
                  summary: 'Format simple: Désélectionner un seul artiste',
                  value: {
                    artistId: '550e8400-e29b-41d4-a716-446655440010',
                    selected: false
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Sélections mises à jour',
            content: {
              'application/json': {
              examples: {
                multiple_success: {
                  summary: '🎯 EXEMPLE PRINCIPAL: Réponse format multiple (5 artistes)',
                  value: {
                    success: true,
                    data: {
                      results: [
                        {
                          artistId: '550e8400-e29b-41d4-a716-446655440010',
                          success: true,
                          selected: true,
                          name: 'Taylor Swift'
                        },
                        {
                          artistId: '550e8400-e29b-41d4-a716-446655440011',
                          success: true,
                          selected: false,
                          name: 'Ed Sheeran'
                        },
                        {
                          artistId: '550e8400-e29b-41d4-a716-446655440012',
                          success: true,
                          selected: true,
                          name: 'Adele'
                        },
                        {
                          artistId: '550e8400-e29b-41d4-a716-446655440013',
                          success: true,
                          selected: true,
                          name: 'The Weeknd'
                        },
                        {
                          artistId: '550e8400-e29b-41d4-a716-446655440014',
                          success: true,
                          selected: false,
                          name: 'Billie Eilish'
                        }
                      ],
                      total_processed: 5,
                      total_selected: 12,
                      sync_triggered: true
                    }
                  }
                },
                single_success: {
                  summary: 'Réponse format simple (1 artiste)',
                  value: {
                    success: true,
                    data: {
                      results: [
                        {
                          artistId: '550e8400-e29b-41d4-a716-446655440010',
                          success: true,
                          selected: true,
                          name: 'Taylor Swift'
                        }
                      ],
                      total_processed: 1,
                      total_selected: 8,
                      sync_triggered: true
                    }
                  }
                }
              }
              }
            }
          },
          400: {
            description: 'Paramètres manquants',
            content: {
              'application/json': {
                examples: {
                  missing_params: {
                    summary: 'Paramètres manquants',
                    value: {
                      success: false,
                      error: 'artistId or artists array is required'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    '/api/user/artists/followed': {
      get: {
        tags: ['Artists'],
        summary: '⭐ Artistes suivis avec stats à jour',
        'x-priority': 'P0',
        'x-auth': true,
        security: [{ BearerAuth: [] }],
        description: 'Récupère la liste des artistes sélectionnés par l\'utilisateur avec leurs scores de fanitude et minutes d\'écoute. Effectue automatiquement un sync pour mettre à jour les données avant de les retourner.',
        responses: {
          200: {
            description: 'Liste des artistes suivis avec stats',
            content: {
              'application/json': {
                examples: {
                  success: {
                    summary: 'Artistes suivis avec stats mises à jour',
                    value: {
                      success: true,
                      data: {
                        artists: [
                          {
                            id: '550e8400-e29b-41d4-a716-446655440010',
                            name: 'Taylor Swift',
                            spotify_id: '06HL4z0CvFAxyc27GXpf02',
                            apple_music_id: null,
                            deezer_id: null,
                            image_url: 'https://i.scdn.co/image/ab67616d0000b273e787cffec20aa2a396a61647',
                            fanitude_points: 1450,
                            last_listening_minutes: 520,
                            followed_since: '2024-11-15T14:30:00Z',
                            last_updated: '2024-12-03T16:45:00Z'
                          },
                          {
                            id: '550e8400-e29b-41d4-a716-446655440011',
                            name: 'Ed Sheeran',
                            spotify_id: '6eUKZXaKkcviH0Ku9w2n3V',
                            apple_music_id: null,
                            deezer_id: null,
                            image_url: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96',
                            fanitude_points: 1250,
                            last_listening_minutes: 450,
                            followed_since: '2024-11-20T09:15:00Z',
                            last_updated: '2024-12-03T16:45:00Z'
                          },
                          {
                            id: '550e8400-e29b-41d4-a716-446655440012',
                            name: 'Adele',
                            spotify_id: '4dpARuHxo51G3z768sgnrY',
                            apple_music_id: null,
                            deezer_id: null,
                            image_url: 'https://i.scdn.co/image/ab67616d0000b273c6b2c87a75b2d2ccbf4e4c3b',
                            fanitude_points: 980,
                            last_listening_minutes: 320,
                            followed_since: '2024-11-25T12:00:00Z',
                            last_updated: '2024-12-03T16:45:00Z'
                          }
                        ],
                        stats: {
                          total_followed: 3,
                          total_fanitude_points: 3680,
                          total_listening_minutes: 1290,
                          average_fanitude_points: 1227
                        },
                        sync_performed: true
                      }
                    }
                  },
                  no_artists: {
                    summary: 'Aucun artiste suivi',
                    value: {
                      success: true,
                      data: {
                        artists: [],
                        stats: {
                          total_followed: 0,
                          total_fanitude_points: 0,
                          total_listening_minutes: 0,
                          average_fanitude_points: 0
                        },
                        sync_performed: true
                      }
                    }
                  }
                }
              }
            }
          },
          401: {
            description: 'Non autorisé',
            content: {
              'application/json': {
                examples: {
                  unauthorized: {
                    summary: 'Token manquant',
                    value: {
                      success: false,
                      error: 'Authorization header required'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    '/api/artists/{id}/followers': {
      get: {
        tags: ['Artists'],
        summary: '🏆 Followers d\'un artiste (paginé)',
        'x-priority': 'P1',
        'x-auth': true,
        security: [{ BearerAuth: [] }],
        description: 'Retourne la liste paginée des utilisateurs qui suivent un artiste, triée par score de fanitude décroissant.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID de l\'artiste',
            example: '550e8400-e29b-41d4-a716-446655440002'
          },
          {
            name: 'page',
            in: 'query',
            required: false,
            schema: { type: 'integer', default: 0 },
            description: 'Numéro de page (commence à 0)',
            example: 0
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer', default: 20, minimum: 1, maximum: 50 },
            description: 'Nombre de followers par page (1-50)',
            example: 20
          }
        ],
        responses: {
          200: {
            description: 'Liste paginée des followers',
            content: {
              'application/json': {
                examples: {
                  success: {
                    summary: 'Followers triés par fanitude',
                    value: {
                      success: true,
                      data: {
                        artist: {
                          id: '550e8400-e29b-41d4-a716-446655440002',
                          name: 'Lady Gaga',
                          image_url: 'https://example.com/ladygaga.jpg'
                        },
                        followers: [
                          {
                            position: 1,
                            user_id: '550e8400-e29b-41d4-a716-446655440000',
                            display_name: 'John Doe',
                            avatar_url: 'https://example.com/avatar.jpg',
                            country: 'France',
                            fanitude_points: 1250,
                            last_listening_minutes: 350
                          },
                          {
                            position: 2,
                            user_id: '550e8400-e29b-41d4-a716-446655440007',
                            display_name: 'Jane Smith',
                            avatar_url: 'https://example.com/avatar2.jpg',
                            country: 'USA',
                            fanitude_points: 980,
                            last_listening_minutes: 210
                          }
                        ],
                        pagination: {
                          page: 0,
                          limit: 20,
                          total: 125,
                          hasMore: true
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          401: {
            description: 'Non autorisé',
            content: {
              'application/json': {
                examples: {
                  unauthorized: {
                    summary: 'Token manquant ou invalide',
                    value: {
                      success: false,
                      error: 'Authorization header required'
                    }
                  }
                }
              }
            }
          },
          404: {
            description: 'Artiste introuvable',
            content: {
              'application/json': {
                examples: {
                  not_found: {
                    summary: 'Artiste introuvable',
                    value: {
                      success: false,
                      error: 'Artist not found'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    '/api/user/artists/sync': {
      post: {
        tags: ['Artists'],
        summary: '🔄 Synchroniser les scores de fanitude',
        'x-priority': 'P1',
        'x-auth': true,
        security: [{ BearerAuth: [] }],
        description: 'Recalcule les scores de fanitude et minutes d\'écoute pour les artistes sélectionnés. Peut synchroniser tous les artistes ou seulement une liste spécifique.',
        requestBody: {
          content: {
            'application/json': {
              examples: {
                sync_all: {
                  summary: 'Synchroniser tous les artistes sélectionnés',
                  value: {}
                },
                sync_specific: {
                  summary: 'Synchroniser des artistes spécifiques',
                  value: {
                    artistIds: [
                      '550e8400-e29b-41d4-a716-446655440010',
                      '550e8400-e29b-41d4-a716-446655440011',
                      '550e8400-e29b-41d4-a716-446655440012'
                    ]
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Synchronisation terminée',
            content: {
              'application/json': {
                examples: {
                  success: {
                    summary: 'Synchronisation réussie',
                    value: {
                      success: true,
                      data: {
                        updated_artists: 3,
                        artists: [
                          {
                            id: '550e8400-e29b-41d4-a716-446655440010',
                            name: 'Taylor Swift',
                            fanitude_points: 1250,
                            last_listening_minutes: 450
                          },
                          {
                            id: '550e8400-e29b-41d4-a716-446655440011',
                            name: 'Ed Sheeran',
                            fanitude_points: 980,
                            last_listening_minutes: 320
                          },
                          {
                            id: '550e8400-e29b-41d4-a716-446655440012',
                            name: 'Adele',
                            fanitude_points: 1450,
                            last_listening_minutes: 520
                          }
                        ]
                      }
                    }
                  }
                }
              }
            }
          },
          401: {
            description: 'Non autorisé ou connexion révoquée',
            content: {
              'application/json': {
                examples: {
                  unauthorized: {
                    summary: 'Token manquant',
                    value: {
                      success: false,
                      error: 'Authorization header required'
                    }
                  },
                  spotify_revoked: {
                    summary: 'Connexion Spotify révoquée',
                    value: {
                      success: false,
                      error: 'SPOTIFY_TOKEN_REVOKED',
                      message: 'Votre connexion Spotify a été révoquée. Veuillez vous reconnecter.',
                      action_required: 'reconnect_spotify'
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
    '/api/user/platforms/disconnect': {
      post: {
        tags: ['Platforms'],
        summary: '🔌 Déconnecter une plateforme',
        'x-priority': 'P1',
        'x-auth': true,
        security: [{ BearerAuth: [] }],
        description: 'Déconnecte une plateforme de streaming (ex: après révocation token). Permet la reconnexion via /connect-platform.',
        requestBody: {
          content: {
            'application/json': {
              examples: {
                disconnect_spotify: {
                  summary: 'Déconnecter Spotify',
                  value: {
                    platform_slug: 'spotify'
                  }
                },
                disconnect_apple: {
                  summary: 'Déconnecter Apple Music',
                  value: {
                    platform_slug: 'apple_music'
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Plateforme déconnectée',
            content: {
              'application/json': {
                examples: {
                  success: {
                    summary: 'Déconnexion réussie',
                    value: {
                      success: true,
                      data: {
                        message: 'Spotify déconnecté avec succès',
                        platform: {
                          slug: 'spotify',
                          name: 'Spotify'
                        },
                        action_available: 'reconnect_via_connect_platform'
                      }
                    }
                  }
                }
              }
            }
          },
          401: {
            description: 'Non autorisé',
            content: {
              'application/json': {
                examples: {
                  unauthorized: {
                    summary: 'Token manquant',
                    value: {
                      success: false,
                      error: 'Authorization header required'
                    }
                  }
                }
              }
            }
          },
          404: {
            description: 'Plateforme non trouvée',
            content: {
              'application/json': {
                examples: {
                  not_found: {
                    summary: 'Plateforme inexistante',
                    value: {
                      success: false,
                      error: 'Plateforme \'invalid_platform\' non trouvée'
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
        summary: '🎵 Liste de toutes les plateformes',
        'x-priority': 'P0',
        'x-auth': true,
        security: [{ BearerAuth: [] }],
        description: 'Retourne la liste complète des plateformes de streaming disponibles (Spotify, Apple Music, Deezer, etc.)',
        responses: {
          200: {
            description: 'Liste des plateformes',
            content: {
              'application/json': {
                examples: {
                  success: {
                    summary: 'Toutes les plateformes',
                    value: {
                      success: true,
                      data: [
                        {
                          id: '550e8400-e29b-41d4-a716-446655440001',
                          name: 'Spotify',
                          slug: 'spotify',
                          logo_url: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/spotify.svg',
                          color_hex: '#1DB954',
                          created_at: '2024-01-15T10:30:00Z',
                          updated_at: '2024-01-15T10:30:00Z'
                        },
                        {
                          id: '550e8400-e29b-41d4-a716-446655440002',
                          name: 'Apple Music',
                          slug: 'apple_music',
                          logo_url: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/applemusic.svg',
                          color_hex: '#FA243C',
                          created_at: '2024-01-15T10:30:00Z',
                          updated_at: '2024-01-15T10:30:00Z'
                        },
                        {
                          id: '550e8400-e29b-41d4-a716-446655440003',
                          name: 'Deezer',
                          slug: 'deezer',
                          logo_url: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/deezer.svg',
                          color_hex: '#FEAA2D',
                          created_at: '2024-01-15T10:30:00Z',
                          updated_at: '2024-01-15T10:30:00Z'
                        }
                      ]
                    }
                  }
                }
              }
            }
          },
          401: {
            description: 'Token manquant ou invalide',
            content: {
              'application/json': {
                examples: {
                  unauthorized: {
                    summary: 'Non autorisé',
                    value: {
                      success: false,
                      error: 'Authorization header required'
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
        summary: '🔗 Plateformes connectées par l\'utilisateur',
        'x-priority': 'P0',
        'x-auth': true,
        security: [{ BearerAuth: [] }],
        description: 'Retourne les plateformes de streaming connectées par l\'utilisateur avec les détails de connexion',
        responses: {
          200: {
            description: 'Plateformes connectées',
            content: {
              'application/json': {
                examples: {
                  with_platforms: {
                    summary: 'Utilisateur avec plateformes connectées',
                    value: {
                      success: true,
                      data: [
                        {
                          platform_id: '550e8400-e29b-41d4-a716-446655440001',
                          connected_at: '2024-11-15T14:30:00Z',
                          streaming_platforms: {
                            id: '550e8400-e29b-41d4-a716-446655440001',
                            name: 'Spotify',
                            slug: 'spotify',
                            logo_url: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/spotify.svg',
                            color_hex: '#1DB954'
                          }
                        },
                        {
                          platform_id: '550e8400-e29b-41d4-a716-446655440002',
                          connected_at: '2024-11-20T09:15:00Z',
                          streaming_platforms: {
                            id: '550e8400-e29b-41d4-a716-446655440002',
                            name: 'Apple Music',
                            slug: 'apple_music',
                            logo_url: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/applemusic.svg',
                            color_hex: '#FA243C'
                          }
                        }
                      ]
                    }
                  },
                  no_platforms: {
                    summary: 'Aucune plateforme connectée',
                    value: {
                      success: true,
                      data: []
                    }
                  }
                }
              }
            }
          },
          401: {
            description: 'Token manquant ou invalide',
            content: {
              'application/json': {
                examples: {
                  unauthorized: {
                    summary: 'Non autorisé',
                    value: {
                      success: false,
                      error: 'Authorization header required'
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
        summary: '🗑️ Déconnecter une plateforme',
        'x-priority': 'P1',
        'x-auth': true,
        security: [{ BearerAuth: [] }],
        description: 'Déconnecte l\'utilisateur d\'une plateforme de streaming spécifique',
        parameters: [
          {
            name: 'platformId',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'ID de la plateforme à déconnecter',
            example: '550e8400-e29b-41d4-a716-446655440001'
          }
        ],
        responses: {
          200: {
            description: 'Plateforme déconnectée',
            content: {
              'application/json': {
                examples: {
                  success: {
                    summary: 'Déconnexion réussie',
                    value: {
                      success: true,
                      message: 'Platform disconnected'
                    }
                  }
                }
              }
            }
          },
          400: {
            description: 'Paramètre manquant',
            content: {
              'application/json': {
                examples: {
                  missing_param: {
                    summary: 'platformId manquant',
                    value: {
                      success: false,
                      error: 'platformId is required'
                    }
                  }
                }
              }
            }
          },
          401: {
            description: 'Token manquant ou invalide',
            content: {
              'application/json': {
                examples: {
                  unauthorized: {
                    summary: 'Non autorisé',
                    value: {
                      success: false,
                      error: 'Authorization header required'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    // === WALLET ===
    '/api/wallet/balance': {
      get: {
        tags: ['Wallet'],
        summary: '💰 Solde du wallet',
        'x-priority': 'P1',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Solde actuel',
            content: {
              'application/json': {
                examples: {
                  success: {
                    summary: 'Solde disponible',
                    value: {
                      success: true,
                      data: {
                        balance_cents: 2500,
                        balance_euros: 25.00,
                        currency: 'EUR',
                        created_at: '2024-01-15T10:30:00Z',
                        updated_at: '2024-01-20T14:45:00Z'
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

    '/api/payment/create-session': {
      post: {
        tags: ['Wallet'],
        summary: '💳 Créer session de paiement',
        'x-priority': 'P1',
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              examples: {
                recharge_20: {
                  summary: 'Recharge 20€',
                  value: {
                    amount: 20
                  }
                },
                recharge_50: {
                  summary: 'Recharge 50€',
                  value: {
                    amount: 50
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Session créée',
            content: {
              'application/json': {
                examples: {
                  success: {
                    summary: 'Session Stripe',
                    value: {
                      success: true,
                      data: {
                        session_id: 'cs_test_123456789',
                        checkout_url: 'https://checkout.stripe.com/pay/cs_test_123456789',
                        amount_cents: 2000,
                        amount_euros: 20,
                        currency: 'EUR'
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

    '/api/payment/ws': {
      get: {
        tags: ['Wallet'],
        summary: '🔔 WebSocket paiement',
        'x-priority': 'P1',
        parameters: [
          {
            name: 'session_id',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            example: 'cs_test_123456789'
          },
          {
            name: 'email',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            example: 'user@example.com'
          }
        ],
        responses: {
          200: {
            description: 'Messages de paiement',
            content: {
              'text/event-stream': {
                examples: {
                  pending: {
                    summary: 'Paiement en attente',
                    value: {
                      status: 'payment_pending',
                      message: 'En attente du paiement...',
                      session_id: 'cs_test_123456789'
                    }
                  },
                  success: {
                    summary: 'Paiement réussi',
                    value: {
                      status: 'success',
                      message: 'Paiement réussi ! Votre wallet a été rechargé.',
                      amount: 2000,
                      currency: 'EUR',
                      transaction_id: 'cs_test_123456789'
                    }
                  },
                  failed: {
                    summary: 'Paiement échoué',
                    value: {
                      status: 'failed',
                      message: 'Échec du paiement. Veuillez réessayer.',
                      transaction_id: 'cs_test_123456789'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    // === LOCALISATION UTILISATEUR ===
    '/api/user/location': {
      get: {
        tags: ['User'],
        summary: '📍 Récupérer la localisation de l\'utilisateur',
        'x-priority': 'P2',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Localisation récupérée',
            content: {
              'application/json': {
                examples: {
                  with_location: {
                    summary: 'Utilisateur avec localisation',
                    value: {
                      success: true,
                      data: {
                        location_city: 'Paris',
                        location_country: 'FR',
                        location_lat: 48.8566,
                        location_lng: 2.3522,
                        notification_radius_km: 50
                      }
                    }
                  },
                  no_location: {
                    summary: 'Pas de localisation définie',
                    value: {
                      success: true,
                      data: {
                        location_city: null,
                        location_country: null,
                        location_lat: null,
                        location_lng: null,
                        notification_radius_km: 50
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
                examples: {
                  unauthorized: {
                    summary: 'Token manquant ou invalide',
                    value: {
                      success: false,
                      error: 'Invalid or expired token'
                    }
                  }
                }
              }
            }
          }
        }
      },
      patch: {
        tags: ['User'],
        summary: '📍 Définir/modifier la localisation de l\'utilisateur',
        'x-priority': 'P2',
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              examples: {
                set_location: {
                  summary: 'Définir localisation complète',
                  value: {
                    location_city: 'Paris',
                    location_country: 'FR',
                    location_lat: 48.8566,
                    location_lng: 2.3522,
                    notification_radius_km: 50
                  }
                },
                update_radius: {
                  summary: 'Modifier uniquement le rayon',
                  value: {
                    notification_radius_km: 100
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Localisation mise à jour',
            content: {
              'application/json': {
                examples: {
                  success: {
                    summary: 'Succès',
                    value: {
                      success: true,
                      data: {
                        location_city: 'Paris',
                        location_country: 'FR',
                        location_lat: 48.8566,
                        location_lng: 2.3522,
                        notification_radius_km: 50
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

    // === NOTIFICATIONS ===
    '/api/notifications': {
      get: {
        tags: ['Notifications'],
        summary: '🔔 Liste des notifications de l\'utilisateur',
        'x-priority': 'P2',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'read',
            in: 'query',
            description: 'Filtrer par statut lu/non lu',
            schema: {
              type: 'string',
              enum: ['true', 'false']
            }
          }
        ],
        responses: {
          200: {
            description: 'Liste des notifications',
            content: {
              'application/json': {
                examples: {
                  concert_notifications: {
                    summary: 'Notifications de concerts',
                    value: {
                      success: true,
                      data: [
                        {
                          id: '550e8400-e29b-41d4-a716-446655440000',
                          user_id: '550e8400-e29b-41d4-a716-446655440001',
                          artist_id: '550e8400-e29b-41d4-a716-446655440002',
                          type: 'concert',
                          title: 'Metallica en concert !',
                          message: 'Metallica sera à Stade de France, Paris le vendredi 15 mars 2024',
                          event_id: 'vvG1zZ9dXgX7P',
                          event_name: 'Metallica - World Tour 2024',
                          event_date: '2024-03-15T20:00:00Z',
                          event_venue: 'Stade de France',
                          event_city: 'Paris',
                          event_url: 'https://www.ticketmaster.fr/...',
                          image_url: 'https://s1.ticketm.net/dam/a/123/xyz.jpg',
                          read: false,
                          created_at: '2024-01-10T06:00:00Z'
                        },
                        {
                          id: '550e8400-e29b-41d4-a716-446655440003',
                          user_id: '550e8400-e29b-41d4-a716-446655440001',
                          artist_id: '550e8400-e29b-41d4-a716-446655440004',
                          type: 'concert',
                          title: 'Coldplay en concert !',
                          message: 'Coldplay sera à AccorHotels Arena, Paris le samedi 20 avril 2024',
                          event_id: 'vvG1zZ9dXgX8Q',
                          event_name: 'Coldplay - Music of the Spheres Tour',
                          event_date: '2024-04-20T19:30:00Z',
                          event_venue: 'AccorHotels Arena',
                          event_city: 'Paris',
                          event_url: 'https://www.ticketmaster.fr/...',
                          image_url: 'https://s1.ticketm.net/dam/a/456/abc.jpg',
                          read: true,
                          created_at: '2024-01-08T06:00:00Z'
                        }
                      ]
                    }
                  },
                  empty: {
                    summary: 'Aucune notification',
                    value: {
                      success: true,
                      data: []
                    }
                  },
                  filtered_unread: {
                    summary: 'Seulement non lues (read=false)',
                    value: {
                      success: true,
                      data: [
                        {
                          id: '550e8400-e29b-41d4-a716-446655440000',
                          type: 'concert',
                          title: 'Metallica en concert !',
                          read: false,
                          created_at: '2024-01-10T06:00:00Z'
                        }
                      ]
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    '/api/notifications/{id}': {
      patch: {
        tags: ['Notifications'],
        summary: '✅ Marquer une notification comme lue',
        'x-priority': 'P2',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID de la notification',
            schema: {
              type: 'string',
              format: 'uuid'
            }
          }
        ],
        requestBody: {
          content: {
            'application/json': {
              examples: {
                mark_as_read: {
                  summary: 'Marquer comme lue',
                  value: {
                    read: true
                  }
                },
                mark_as_unread: {
                  summary: 'Marquer comme non lue',
                  value: {
                    read: false
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Notification mise à jour',
            content: {
              'application/json': {
                examples: {
                  success: {
                    summary: 'Succès',
                    value: {
                      success: true,
                      data: {
                        id: '550e8400-e29b-41d4-a716-446655440000',
                        read: true,
                        updated_at: '2024-01-11T10:30:00Z'
                      }
                    }
                  }
                }
              }
            }
          },
          404: {
            description: 'Notification non trouvée',
            content: {
              'application/json': {
                examples: {
                  not_found: {
                    summary: 'Notification inexistante',
                    value: {
                      success: false,
                      error: 'Notification not found'
                    }
                  }
                }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Notifications'],
        summary: '🗑️ Supprimer une notification',
        'x-priority': 'P2',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID de la notification',
            schema: {
              type: 'string',
              format: 'uuid'
            }
          }
        ],
        responses: {
          200: {
            description: 'Notification supprimée',
            content: {
              'application/json': {
                examples: {
                  success: {
                    summary: 'Succès',
                    value: {
                      success: true,
                      message: 'Notification deleted successfully'
                    }
                  }
                }
              }
            }
          },
          404: {
            description: 'Notification non trouvée',
            content: {
              'application/json': {
                examples: {
                  not_found: {
                    summary: 'Notification inexistante',
                    value: {
                      success: false,
                      error: 'Notification not found'
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

export const swaggerSpecMobile = spec

