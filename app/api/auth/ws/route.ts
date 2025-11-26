import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')

  if (!email) {
    return new Response('Email parameter required', { status: 400 })
  }

  // Vérifier si c'est une requête WebSocket
  const upgrade = request.headers.get('upgrade')
  if (upgrade !== 'websocket') {
    return new Response('Expected WebSocket connection', { status: 426 })
  }

  // En production, vous utiliseriez une vraie implémentation WebSocket
  // Pour Next.js, on simule avec Server-Sent Events (SSE)
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // Fonction pour envoyer des données
      const sendEvent = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(message))
      }

      // Envoyer un message de connexion
      sendEvent({
        type: 'connected',
        message: 'WebSocket connecté, en attente de l\'authentification...',
        email: email,
        timestamp: new Date().toISOString()
      })

      // Simuler la vérification périodique de l'authentification
      const checkAuth = async () => {
        try {
          // Vérifier si l'utilisateur s'est connecté
          const { data: { users }, error } = await supabase.auth.admin.listUsers()
          
          if (error) {
            sendEvent({
              type: 'error',
              message: 'Erreur lors de la vérification',
              error: error.message,
              timestamp: new Date().toISOString()
            })
            return
          }

          // Chercher l'utilisateur par email
          const user = users.find(u => u.email === email)
          
          if (user && user.last_sign_in_at) {
            const lastSignIn = new Date(user.last_sign_in_at)
            const now = new Date()
            const diffMinutes = (now.getTime() - lastSignIn.getTime()) / (1000 * 60)
            
            // Si l'utilisateur s'est connecté dans les 2 dernières minutes
            if (diffMinutes < 2) {
              sendEvent({
                type: 'authenticated',
                message: 'Utilisateur authentifié avec succès !',
                user: {
                  id: user.id,
                  email: user.email,
                  display_name: user.user_metadata?.display_name || null,
                  last_sign_in_at: user.last_sign_in_at
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

          // Envoyer un ping pour maintenir la connexion
          sendEvent({
            type: 'ping',
            message: 'En attente de l\'authentification...',
            timestamp: new Date().toISOString()
          })

        } catch (error) {
          sendEvent({
            type: 'error',
            message: 'Erreur interne',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          })
        }
      }

      // Vérifier toutes les 3 secondes
      const interval = setInterval(checkAuth, 3000)

      // Nettoyer l'intervalle après 5 minutes (timeout)
      setTimeout(() => {
        clearInterval(interval)
        sendEvent({
          type: 'timeout',
          message: 'Timeout - Connexion fermée après 5 minutes',
          timestamp: new Date().toISOString()
        })
        controller.close()
      }, 5 * 60 * 1000) // 5 minutes

      // Nettoyer l'intervalle si la connexion se ferme
      return () => {
        clearInterval(interval)
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
