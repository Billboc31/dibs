import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'


// Force dynamic rendering pour éviter les erreurs de build Vercel
export const dynamic = 'force-dynamic'

// POST /api/payment/simulate - Simuler un paiement (pour les tests)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Authorization header required' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const { session_id, status = 'success', amount = 5000 } = await request.json()

    if (!session_id) {
      return NextResponse.json(
        { success: false, error: 'Missing session_id' },
        { status: 400 }
      )
    }

    console.log(`🧪 Simulating payment:`)
    console.log(`  - Session: ${session_id}`)
    console.log(`  - Status: ${status}`)
    console.log(`  - Amount: ${amount}`)
    console.log(`  - User: ${user.email}`)

    // Simuler un délai de paiement
    setTimeout(async () => {
      // Appeler le webhook avec les données simulées
      const webhookUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/webhook`
      
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            session_id,
            status,
            amount,
            user_id: user.id,
            error_message: status === 'failed' ? 'Simulated payment failure' : undefined
          })
        })

        if (response.ok) {
          console.log(`✅ Simulated payment webhook sent for session ${session_id}`)
        } else {
          console.error(`❌ Failed to send simulated webhook for session ${session_id}`)
        }
      } catch (error) {
        console.error(`❌ Error sending simulated webhook:`, error)
      }
    }, 3000) // Délai de 3 secondes pour simuler le traitement

    return NextResponse.json({
      success: true,
      message: `Payment simulation started for session ${session_id}`,
      data: {
        session_id,
        status,
        amount,
        estimated_completion: new Date(Date.now() + 3000).toISOString()
      }
    })
  } catch (error: any) {
    console.error('❌ Error simulating payment:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
