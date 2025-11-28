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

      // Fonction pour envoyer des messages
      const send = (data: any) => {
        try {
          const message = `data: ${JSON.stringify(data)}\n\n`
          controller.enqueue(encoder.encode(message))
        } catch (error) {
          console.error('Erreur envoi message WebSocket:', error)
        }
      }

      // Fonction pour fermer proprement le WebSocket
      const closeWebSocket = (reason: string) => {
        console.log(`🔴 Fermeture du WebSocket: ${reason}`)
        if (pingInterval) clearInterval(pingInterval)
        if (timeout) clearTimeout(timeout)
        unregisterWebSocketConnection(email)
        controller.close()
      }

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
          const redirectTo = process.env.NEXT_PUBLIC_BASE_URL 
            ? `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback-ws?email=${encodeURIComponent(email)}`
            : `https://dibs-poc0.vercel.app/auth/callback-ws?email=${encodeURIComponent(email)}`

          // Envoyer le Magic Link
          const { data, error } = await supabase.auth.signInWithOtp({
            email: email,
            options: {
              shouldCreateUser: true,
              emailRedirectTo: redirectTo,
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
            redirect_to: redirectTo,
            timestamp: new Date().toISOString()
          })

          // 3. Attendre le callback (le token sera envoyé par le callback)
          send({
            step: 4,
            status: 'waiting_for_click',
            message: 'En attente du clic sur le Magic Link...',
            email: email,
            timestamp: new Date().toISOString()
          })

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

      // Ping périodique pour maintenir la connexion
      pingInterval = setInterval(() => {
        send({
          status: 'ping',
          message: 'Connexion active, en attente du Magic Link...',
          email: email,
          timestamp: new Date().toISOString()
        })
      }, 10000) // Toutes les 10 secondes

      // Timeout après 5 minutes
      timeout = setTimeout(() => {
        send({
          status: 'timeout',
          message: 'Timeout - Connexion fermée après 5 minutes',
          timestamp: new Date().toISOString()
        })
        setTimeout(() => {
          closeWebSocket('Timeout 5 minutes')
        }, 100)
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
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

