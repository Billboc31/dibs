import { NextRequest, NextResponse } from 'next/server'
import { sendToWebSocket } from '@/lib/websocket-manager'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { email, ...messageData } = data

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email required' }, { status: 400 })
    }

    console.log('📡 Notification WebSocket pour:', email, messageData.status)

    // Envoyer le message au WebSocket actif
    const sent = sendToWebSocket(email, messageData)

    if (sent) {
      return NextResponse.json({ 
        success: true, 
        message: 'Message envoyé au WebSocket',
        email: email,
        status: messageData.status
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Aucune connexion WebSocket active pour cet email',
        email: email
      }, { status: 404 })
    }

  } catch (error) {
    console.error('Erreur notification WebSocket:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    }, { status: 500 })
  }
}

