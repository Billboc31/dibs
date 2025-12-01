import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { addPaymentConnection, sendPaymentMessage } from '@/lib/payment-websocket'

// GET /api/payment/ws - WebSocket pour écouter les résultats de paiement
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')
    const email = searchParams.get('email')

    if (!sessionId || !email) {
      return new Response('Missing session_id or email', { status: 400 })
    }

    // Vérifier que l'utilisateur existe
    const { data: user } = await supabaseAdmin.auth.admin.getUserByEmail(email)
    if (!user) {
      return new Response('User not found', { status: 404 })
    }

    console.log(`💳 Payment WebSocket connection for:`)
    console.log(`  - Session: ${sessionId}`)
    console.log(`  - Email: ${email}`)
    console.log(`  - User ID: ${user.id}`)

    // Créer le stream
    const stream = new ReadableStream({
      start(controller) {
        // Message initial
        controller.enqueue(`data: ${JSON.stringify({
          type: 'payment_connected',
          message: 'Connexion établie, en attente du paiement...',
          sessionId,
          timestamp: new Date().toISOString()
        })}\n\n`)

        // Ajouter la connexion au manager
        addPaymentConnection(sessionId, {
          controller,
          email,
          userId: user.id,
          sessionId,
          createdAt: new Date()
        })

        // Heartbeat toutes les 30 secondes
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(`data: ${JSON.stringify({
              type: 'heartbeat',
              timestamp: new Date().toISOString()
            })}\n\n`)
          } catch (error) {
            clearInterval(heartbeat)
          }
        }, 30000)

        // Timeout après 30 minutes
        const timeout = setTimeout(() => {
          try {
            controller.enqueue(`data: ${JSON.stringify({
              type: 'payment_timeout',
              message: 'Session de paiement expirée',
              sessionId,
              timestamp: new Date().toISOString()
            })}\n\n`)
            controller.close()
          } catch (error) {
            // Connexion déjà fermée
          }
          clearInterval(heartbeat)
        }, 30 * 60 * 1000)

        // Nettoyage à la fermeture
        const cleanup = () => {
          clearInterval(heartbeat)
          clearTimeout(timeout)
        }

        // Gérer la fermeture
        controller.close = new Proxy(controller.close, {
          apply(target, thisArg, argumentsList) {
            cleanup()
            return target.apply(thisArg, argumentsList)
          }
        })
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    })
  } catch (error: any) {
    console.error('❌ Error in payment WebSocket:', error)
    return new Response(`Error: ${error.message}`, { status: 500 })
  }
}
