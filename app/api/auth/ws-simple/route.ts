import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')

  if (!email) {
    return new Response('Email parameter required', { status: 400 })
  }

  console.log('🔄 WebSocket simple démarré pour:', email)

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // Fonction pour envoyer des messages
      const send = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(message))
      }

      // Message de connexion
      send({
        status: 'connected',
        message: `WebSocket connecté pour ${email}`,
        email: email,
        timestamp: new Date().toISOString()
      })

      // Vérifier l'authentification
      const checkAuth = async () => {
        try {
          // Récupérer la session active pour cet email
          const { data, error } = await supabase.auth.admin.listUsers()
          
          if (error) {
            send({
              status: 'error',
              message: 'Erreur lors de la vérification',
              error: error.message,
              timestamp: new Date().toISOString()
            })
            return
          }

          // Vérifier que nous avons des utilisateurs
          if (!data || !data.users) {
            send({
              status: 'waiting',
              message: 'Aucun utilisateur trouvé',
              email: email,
              timestamp: new Date().toISOString()
            })
            return
          }

          // Chercher l'utilisateur par email
          const user = data.users.find((u: any) => u.email === email)
          
          if (user && user.last_sign_in_at) {
            const lastSignIn = new Date(user.last_sign_in_at)
            const now = new Date()
            const diffMinutes = (now.getTime() - lastSignIn.getTime()) / (1000 * 60)
            
            // Si l'utilisateur s'est connecté dans les 2 dernières minutes
            if (diffMinutes < 2) {
              // Générer un token de session pour l'utilisateur
              const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
                type: 'magiclink',
                email: email
              })

              if (sessionError) {
                send({
                  status: 'error',
                  message: 'Erreur génération token',
                  error: sessionError.message,
                  timestamp: new Date().toISOString()
                })
                return
              }

              // Utilisateur connecté ! Renvoyer les infos
              send({
                status: 'authenticated',
                message: 'Utilisateur connecté avec succès !',
                user: {
                  id: user.id,
                  email: user.email,
                  display_name: user.user_metadata?.display_name || null,
                  avatar_url: user.user_metadata?.avatar_url || null,
                  last_sign_in_at: user.last_sign_in_at,
                  created_at: user.created_at
                },
                // Note: En production, vous devriez utiliser la vraie session Supabase
                // Ici on simule avec les données utilisateur
                auth_info: {
                  user_id: user.id,
                  email: user.email,
                  authenticated_at: user.last_sign_in_at,
                  // Pour obtenir le vrai token, l'app mobile doit utiliser supabase.auth.getSession()
                  note: 'Utilisez supabase.auth.getSession() dans l\'app mobile pour récupérer le vrai token'
                },
                timestamp: new Date().toISOString()
              })
              
              // Fermer la connexion après authentification
              setTimeout(() => {
                controller.close()
              }, 1000)
              return
            }
          }

          // Pas encore connecté, envoyer un ping
          send({
            status: 'waiting',
            message: 'En attente de la connexion...',
            email: email,
            timestamp: new Date().toISOString()
          })

        } catch (error) {
          send({
            status: 'error',
            message: 'Erreur interne',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          })
        }
      }

      // Vérifier toutes les 2 secondes
      const interval = setInterval(checkAuth, 2000)

      // Timeout après 3 minutes
      const timeout = setTimeout(() => {
        clearInterval(interval)
        send({
          status: 'timeout',
          message: 'Timeout - Connexion fermée après 3 minutes',
          timestamp: new Date().toISOString()
        })
        controller.close()
      }, 3 * 60 * 1000)

      // Nettoyer quand la connexion se ferme
      return () => {
        clearInterval(interval)
        clearTimeout(timeout)
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
