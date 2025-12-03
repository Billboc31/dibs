import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { registerWebSocketConnection, unregisterWebSocketConnection } from '@/lib/websocket-manager'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')

  if (!email) {
    return new Response('Email parameter required', { status: 400 })
  }

  // Validation basique de l'email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return new Response('Invalid email format', { status: 400 })
  }

  console.log('🚀 WebSocket complet démarré pour:', email)

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // Stocker cette connexion pour pouvoir l'utiliser depuis le callback
      registerWebSocketConnection(email, controller)

      // Variables pour les timers (définis tôt pour pouvoir les utiliser dans les erreurs)
      let pingInterval: NodeJS.Timeout | null = null
      let timeout: NodeJS.Timeout | null = null

      // Variable pour tracker l'état du WebSocket
      let isClosed = false

      // Fonction pour envoyer des messages avec transmission forcée
      const send = (data: any) => {
        if (isClosed) {
          console.log('🚫 WebSocket fermé, message ignoré:', data.status || data.step)
          return
        }
        
        try {
          // Format EventSource correct avec double \n\n
          const message = `data: ${JSON.stringify(data)}\n\n`
          controller.enqueue(encoder.encode(message))
          
          // Forcer la transmission immédiate avec un message vide (Solution 1)
          // Cela force le navigateur/app à traiter les messages en buffer
          setTimeout(() => {
            if (!isClosed) {
              try {
                controller.enqueue(encoder.encode(': heartbeat\n\n'))
              } catch (e) {
                console.log('🔴 Heartbeat ignoré, WebSocket fermé')
              }
            }
          }, 10)
          
          console.log('📡 Message envoyé:', data.status || data.step)
        } catch (error) {
          console.error('Erreur envoi message WebSocket:', error)
          isClosed = true
        }
      }

      // Fonction pour fermer proprement le WebSocket
      const closeWebSocket = (reason: string) => {
        if (isClosed) return
        
        console.log(`🔴 Fermeture du WebSocket: ${reason}`)
        isClosed = true
        
        if (pingInterval) clearInterval(pingInterval)
        if (timeout) clearTimeout(timeout)
        unregisterWebSocketConnection(email)
        
        try {
          controller.close()
        } catch (e) {
          console.log('🔴 Controller déjà fermé')
        }
      }

      // 0. Message de test immédiat pour débloquer le buffer
      send({
        step: 0,
        status: 'initializing',
        message: 'Initialisation du WebSocket...',
        email: email,
        timestamp: new Date().toISOString()
      })

      // 1. Message de connexion
      send({
        step: 1,
        status: 'connected',
        message: `WebSocket connecté pour ${email}`,
        email: email,
        timestamp: new Date().toISOString()
      })

      // 2. Envoyer automatiquement le Magic Link
      const sendMagicLink = async () => {
        try {
          send({
            step: 2,
            status: 'sending_magic_link',
            message: 'Envoi du Magic Link en cours...',
            email: email,
            timestamp: new Date().toISOString()
          })

          // URL de redirection vers notre callback spécial
          // Utiliser l'URL de callback par défaut de Supabase (pas de emailRedirectTo)
          // Cela garantit que Supabase ajoute les bons paramètres d'authentification
          
          // Envoyer le Magic Link SANS redirection personnalisée
          const { data, error } = await supabase.auth.signInWithOtp({
            email: email,
            options: {
              shouldCreateUser: true,
              // Pas de emailRedirectTo - utilise l'URL par défaut configurée dans Supabase
            }
          })

          if (error) {
            send({
              step: 2,
              status: 'error',
              message: 'Erreur lors de l\'envoi du Magic Link',
              error: error.message,
              timestamp: new Date().toISOString()
            })
            
            // Fermer le stream immédiatement pour que l'app mobile reçoive l'erreur
            setTimeout(() => {
              closeWebSocket('Erreur Magic Link')
            }, 100) // Petit délai pour s'assurer que le message est envoyé
            return
          }

          send({
            step: 3,
            status: 'magic_link_sent',
            message: 'Magic Link envoyé ! Cliquez sur le lien dans votre email.',
            email: email,
            message_id: data?.messageId || null,
            timestamp: new Date().toISOString()
          })

          // 3. Attendre l'authentification via Supabase onAuthStateChange
          send({
            step: 4,
            status: 'waiting_for_click',
            message: 'En attente du clic sur le Magic Link... (Authentification automatique)',
            email: email,
            timestamp: new Date().toISOString()
          })

          // Écouter les changements d'authentification Supabase
          const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('🔔 Auth state change:', event, session?.user?.email)
            
            if (event === 'SIGNED_IN' && session && session.user?.email === email) {
              console.log('✅ Utilisateur authentifié via Magic Link:', session.user.email)
              
              if (!isClosed) {
                send({
                  step: 5,
                  status: 'authenticated',
                  message: 'Authentification réussie !',
                  session: {
                    access_token: session.access_token,
                    refresh_token: session.refresh_token,
                    expires_in: session.expires_in || 3600
                  },
                  user: {
                    id: session.user.id,
                    email: session.user.email,
                    display_name: session.user.user_metadata?.display_name || session.user.email
                  },
                  timestamp: new Date().toISOString()
                })

                // Fermer le WebSocket après succès
                setTimeout(() => {
                  closeWebSocket('Authentification réussie')
                }, 2000)
              }

              // Nettoyer le listener
              authListener?.subscription?.unsubscribe()
            }
          })

          // Modifier la fonction de fermeture pour nettoyer le listener
          const originalCloseWebSocket = closeWebSocket
          const closeWebSocketWithCleanup = (reason: string) => {
            console.log('🧹 Nettoyage du listener auth')
            authListener?.subscription?.unsubscribe()
            originalCloseWebSocket(reason)
          }

          // Remplacer les appels à closeWebSocket par closeWebSocketWithCleanup dans les timeouts
          if (timeout) {
            clearTimeout(timeout)
            timeout = setTimeout(() => {
              if (!isClosed) {
                send({
                  status: 'timeout',
                  message: 'Timeout - Connexion fermée après 5 minutes',
                  timestamp: new Date().toISOString()
                })
                setTimeout(() => {
                  closeWebSocketWithCleanup('Timeout 5 minutes')
                }, 100)
              }
            }, 5 * 60 * 1000)
          }

        } catch (error) {
          send({
            step: 2,
            status: 'error',
            message: 'Erreur interne lors de l\'envoi du Magic Link',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          })
          
          // Fermer le stream immédiatement pour que l'app mobile reçoive l'erreur
          setTimeout(() => {
            closeWebSocket('Erreur interne Magic Link')
          }, 100) // Petit délai pour s'assurer que le message est envoyé
        }
      }

      // Envoyer le Magic Link automatiquement
      sendMagicLink()

      // Ping fréquent pour maintenir la connexion ET débloquer les buffers
      pingInterval = setInterval(() => {
        if (!isClosed) {
          send({
            status: 'ping',
            message: 'Connexion active, en attente du Magic Link...',
            email: email,
            timestamp: new Date().toISOString()
          })
        }
      }, 2000) // Toutes les 2 secondes pour débloquer les buffers mobiles

      // Timeout après 5 minutes
      timeout = setTimeout(() => {
        if (!isClosed) {
          send({
            status: 'timeout',
            message: 'Timeout - Connexion fermée après 5 minutes',
            timestamp: new Date().toISOString()
          })
          setTimeout(() => {
            closeWebSocket('Timeout 5 minutes')
          }, 100)
        }
      }, 5 * 60 * 1000)

      // Nettoyer quand la connexion se ferme
      return () => {
        if (pingInterval) clearInterval(pingInterval)
        if (timeout) clearTimeout(timeout)
        unregisterWebSocketConnection(email)
      }
    }
  })

  return new Response(stream, {
    headers: {
      // Headers EventSource standards
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Connection': 'keep-alive',
      
      // Headers pour forcer le streaming temps réel (Solution 2)
      'X-Accel-Buffering': 'no',        // Nginx - pas de buffer
      'Transfer-Encoding': 'chunked',    // Transmission par chunks
      'Pragma': 'no-cache',             // HTTP/1.0 compatibility
      'Expires': '0',                    // Pas de cache
      
      // CORS
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

