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
        summary: '🎵 Artistes utilisateur',
        'x-priority': 'P0',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Liste des artistes',
            content: {
              'application/json': {
                examples: {
                  success: {
                    summary: 'Artistes avec sélection',
                    value: {
                      success: true,
                      data: {
                        artists: [
                          {
                            id: '550e8400-e29b-41d4-a716-446655440010',
                            name: 'Taylor Swift',
                            image_url: 'https://example.com/taylor.jpg',
                            spotify_id: 'spotify123',
                            selected: true,
                            fanitude_points: 1250
                          },
                          {
                            id: '550e8400-e29b-41d4-a716-446655440011',
                            name: 'Ed Sheeran',
                            image_url: 'https://example.com/ed.jpg',
                            spotify_id: 'spotify456',
                            selected: false,
                            fanitude_points: 0
                          }
                        ],
                        stats: {
                          total_spotify_artists: 150,
                          selected_artists: 12,
                          displayed_artists: 2
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

    '/api/user/artists/toggle': {
      post: {
        tags: ['Artists'],
        summary: '⭐ Sélectionner/Désélectionner artiste',
        'x-priority': 'P0',
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              examples: {
                select: {
                  summary: 'Sélectionner un artiste',
                  value: {
                    artistId: '550e8400-e29b-41d4-a716-446655440010',
                    selected: true
                  }
                },
                deselect: {
                  summary: 'Désélectionner un artiste',
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
            description: 'Sélection mise à jour',
            content: {
              'application/json': {
                examples: {
                  success: {
                    summary: 'Succès',
                    value: {
                      success: true,
                      data: {
                        artistId: '550e8400-e29b-41d4-a716-446655440010',
                        selected: true,
                        fanitude_points: 1250
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
    }
  }
}

export const swaggerSpecMobile = spec
