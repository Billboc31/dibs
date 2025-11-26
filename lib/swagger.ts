export const getApiDocs = () => {
  const spec = {
    openapi: '3.0.0',
    info: {
      title: 'DIBS API Documentation',
      version: '1.0.0',
      description: 'Documentation complète de l\'API DIBS - Fan engagement platform.\n\n⭐ **Endpoints actuellement utilisés par le frontend:** 2\n- POST /api/sync-spotify\n- POST /api/reset-user-data\n\n📝 Les autres endpoints sont documentés mais non utilisés actuellement (Supabase Edge Functions).',
      contact: {
        name: 'DIBS Team',
        email: 'support@dibs.app'
      }
    },
    servers: [
      {
        url: 'http://127.0.0.1:3001',
        description: 'Development server (Next.js API Routes)'
      },
      {
        url: 'http://localhost:3001',
        description: 'Local server (Next.js API Routes)'
      },
      {
        url: 'https://your-project.supabase.co/functions/v1',
        description: 'Supabase Edge Functions'
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'Endpoints d\'authentification OAuth (Spotify, Deezer)'
      },
      {
        name: 'Spotify',
        description: 'Synchronisation et gestion des données Spotify'
      },
      {
        name: 'User',
        description: 'Gestion des données utilisateur'
      },
      {
        name: 'Artists',
        description: 'Gestion des artistes favoris de l\'utilisateur'
      },
      {
        name: 'QR Codes',
        description: 'Scan de QR codes et gain de points'
      },
      {
        name: 'Streaming',
        description: 'Synchronisation des plateformes de streaming'
      }
    ],
    paths: {
      '/api/auth/spotify/callback': {
        get: {
          tags: ['Authentication', 'Spotify'],
          summary: '🔄 Callback OAuth Spotify (AUTOMATIQUE)',
          description: '✅ **Utilisé automatiquement** par le flow OAuth\n\nEndpoint appelé par Spotify après l\'authentification OAuth. Échange le code d\'autorisation contre un access token et sauvegarde la connexion.\n\n**Flow:** User → Spotify OAuth → Callback automatique → Redirection /select-artists',
          parameters: [
            {
              name: 'code',
              in: 'query',
              required: true,
              schema: { type: 'string' },
              description: 'Code d\'autorisation fourni par Spotify'
            },
            {
              name: 'state',
              in: 'query',
              required: true,
              schema: { type: 'string' },
              description: 'State contenant le code verifier (PKCE) et l\'user ID encodés en base64'
            },
            {
              name: 'error',
              in: 'query',
              required: false,
              schema: { type: 'string' },
              description: 'Erreur si l\'utilisateur refuse l\'autorisation'
            }
          ],
          responses: {
            '302': {
              description: 'Redirection vers /select-artists en cas de succès ou /connect-platform en cas d\'erreur'
            }
          }
        }
      },
      '/api/auth/deezer/callback': {
        get: {
          tags: ['Authentication'],
          summary: 'Callback OAuth Deezer (DEPRECATED)',
          description: '⚠️ DEPRECATED - Deezer n\'accepte plus les nouvelles connexions. Endpoint conservé pour compatibilité.',
          deprecated: true,
          parameters: [
            {
              name: 'code',
              in: 'query',
              required: true,
              schema: { type: 'string' },
              description: 'Code d\'autorisation fourni par Deezer'
            }
          ],
          responses: {
            '302': {
              description: 'Redirection après traitement'
            }
          }
        }
      },
      '/api/sync-spotify': {
        post: {
          tags: ['Spotify'],
          summary: '⭐ Synchroniser les données Spotify (UTILISÉ)',
          description: '✅ **Actuellement utilisé par le frontend**\n\nRécupère les top artists, followed artists et recently played tracks depuis Spotify. Sauvegarde les artistes et calcule les points de fanitude.\n\n**Utilisé dans:** `/select-artists` (chargement automatique + resync manuel)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['userId'],
                  properties: {
                    userId: {
                      type: 'string',
                      format: 'uuid',
                      description: 'ID de l\'utilisateur Supabase',
                      example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
                    }
                  }
                },
                example: {
                  userId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Synchronisation réussie',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SyncResult' },
                  example: {
                    success: true,
                    synced: 8,
                    message: '8 artistes synchronisés'
                  }
                }
              }
            },
            '400': {
              description: 'userId manquant ou invalide',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '500': {
              description: 'Erreur serveur',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/api/reset-user-data': {
        post: {
          tags: ['User'],
          summary: '⭐ Réinitialiser les données utilisateur (UTILISÉ)',
          description: '✅ **Actuellement utilisé par le frontend**\n\nSupprime toutes les données de l\'utilisateur : artistes suivis, connexions aux plateformes, scans QR, événements, tickets et leaderboards. Réinitialise le profil utilisateur. ⚠️ Opération irréversible.\n\n**Utilisé dans:** `/settings` (bouton réinitialiser)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['userId'],
                  properties: {
                    userId: {
                      type: 'string',
                      format: 'uuid',
                      description: 'ID de l\'utilisateur Supabase',
                      example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
                    }
                  }
                },
                example: {
                  userId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Réinitialisation réussie',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Success' },
                  example: {
                    success: true,
                    message: 'Toutes tes données ont été réinitialisées'
                  }
                }
              }
            },
            '400': {
              description: 'userId manquant',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '500': {
              description: 'Erreur serveur',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/functions/v1/add-user-artists': {
        post: {
          tags: ['Artists'],
          summary: '❌ Ajouter/Mettre à jour les artistes (NON UTILISÉ)',
          description: '⚠️ **Non utilisé par le frontend actuel**\n\nLe frontend utilise directement `supabase.from(\'user_artists\').insert()` dans `/select-artists`.\n\nCet endpoint Edge Function est disponible mais pas implémenté côté client.\n\n---\n\nRemplace la liste complète des artistes suivis par l\'utilisateur. Supprime tous les artistes existants et insère les nouveaux. Nécessite un token d\'authentification Supabase.',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['artist_ids'],
                  properties: {
                    artist_ids: {
                      type: 'array',
                      items: {
                        type: 'string',
                        format: 'uuid'
                      },
                      description: 'Liste des IDs d\'artistes à sauvegarder',
                      example: ['uuid1', 'uuid2', 'uuid3']
                    }
                  }
                },
                example: {
                  artist_ids: [
                    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
                    'b2c3d4e5-f6a7-8901-bcde-f12345678901'
                  ]
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Artistes sauvegardés avec succès',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      count: { type: 'integer' },
                      message: { type: 'string' }
                    }
                  },
                  example: {
                    success: true,
                    count: 8,
                    message: '8 artists saved'
                  }
                }
              }
            },
            '400': {
              description: 'Données invalides ou utilisateur non autorisé',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': {
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
      '/functions/v1/scan-qr-code': {
        post: {
          tags: ['QR Codes'],
          summary: '❌ Scanner un QR code (NON UTILISÉ)',
          description: '⚠️ **Non utilisé par le frontend actuel**\n\nLa page `/qr-scan` existe mais n\'implémente pas encore le scan de QR codes.\n\nCet endpoint Edge Function est disponible et fonctionnel pour une future implémentation.\n\n---\n\nScanne un QR code (album, merch, etc.) et ajoute des points de fanitude. Vérifie que le code est valide, actif et pas déjà scanné. Met à jour automatiquement les points si un artiste est lié au QR code.',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['qr_code'],
                  properties: {
                    qr_code: {
                      type: 'string',
                      description: 'Code du QR (unique identifier)',
                      example: 'ALBUM_MAYHEM_2024'
                    }
                  }
                },
                example: {
                  qr_code: 'ALBUM_MAYHEM_2024'
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'QR code scanné avec succès',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      points_earned: { type: 'integer' },
                      qr_code_id: { type: 'string', format: 'uuid' },
                      product_name: { type: 'string' },
                      artist_id: { type: 'string', format: 'uuid' }
                    }
                  },
                  example: {
                    success: true,
                    points_earned: 500,
                    qr_code_id: 'uuid',
                    product_name: 'Mayhem Vinyl (Collector Edition)',
                    artist_id: 'uuid'
                  }
                }
              }
            },
            '400': {
              description: 'qr_code manquant ou utilisateur non autorisé',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'QR code invalide ou inactif',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                  example: {
                    error: 'Invalid or inactive QR code'
                  }
                }
              }
            },
            '409': {
              description: 'QR code déjà scanné',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                  example: {
                    error: 'QR code already scanned'
                  }
                }
              }
            }
          }
        }
      },
      '/functions/v1/sync-streaming-data': {
        post: {
          tags: ['Streaming'],
          summary: '❌ Synchroniser les données de streaming (NON UTILISÉ)',
          description: '⚠️ **Non utilisé par le frontend actuel**\n\nRemplacé par `/api/sync-spotify` qui est utilisé à la place.\n\nCet endpoint Edge Function est disponible mais redondant avec la logique Next.js.\n\n---\n\nSynchronise les données depuis une plateforme de streaming (Spotify, Deezer, Apple Music). Récupère les top artists et met à jour la base de données avec les artistes et leurs points.',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['platform'],
                  properties: {
                    platform: {
                      type: 'string',
                      enum: ['spotify', 'deezer', 'apple_music'],
                      description: 'Plateforme de streaming à synchroniser',
                      example: 'spotify'
                    }
                  }
                },
                example: {
                  platform: 'spotify'
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Synchronisation réussie',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      synced: { type: 'integer' }
                    }
                  },
                  example: {
                    success: true,
                    synced: 15
                  }
                }
              }
            },
            '400': {
              description: 'Plateforme non connectée ou données invalides',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                  example: {
                    error: 'Platform not connected'
                  }
                }
              }
            },
            '401': {
              description: 'Non authentifié',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      }
    },
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT Supabase obtenu après authentification'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Message d\'erreur'
            }
          },
          example: {
            error: 'Error message here'
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indique si l\'opération a réussi'
            },
            message: {
              type: 'string',
              description: 'Message de succès'
            }
          },
          example: {
            success: true,
            message: 'Operation completed successfully'
          }
        },
        SyncResult: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean'
            },
            synced: {
              type: 'integer',
              description: 'Nombre d\'artistes synchronisés'
            },
            message: {
              type: 'string'
            }
          },
          example: {
            success: true,
            synced: 8,
            message: '8 artistes synchronisés'
          }
        }
      }
    }
  }

  return spec
}
