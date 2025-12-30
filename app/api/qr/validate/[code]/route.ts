import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'


// Force dynamic rendering pour éviter les erreurs de build Vercel
export const dynamic = 'force-dynamic'

// GET /api/qr/validate/[code] - Valider un QR code sans le scanner
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
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

    const code = params.code

    // Vérifier que le QR code existe
    const { data: qrCode, error: qrError } = await supabaseAdmin
      .from('qr_codes')
      .select('*')
      .eq('code', code)
      .single()

    if (qrError || !qrCode) {
      return NextResponse.json({
        success: true,
        data: {
          valid: false,
          already_scanned: false
        }
      })
    }

    // Vérifier si déjà scanné par cet utilisateur
    const { data: existingScan } = await supabaseAdmin
      .from('qr_scans')
      .select('id')
      .eq('user_id', user.id)
      .eq('qr_code_id', qrCode.id)
      .single()

    const isValid = qrCode.is_active === true
    const alreadyScanned = !!existingScan

    console.log(`✅ Validated QR code ${code}: valid=${isValid}, scanned=${alreadyScanned}`)
    
    return NextResponse.json({
      success: true,
      data: {
        valid: isValid,
        already_scanned: alreadyScanned,
        item_type: qrCode.item_type,
        item_name: qrCode.item_name,
        points_value: qrCode.points_value
      }
    })
  } catch (error: any) {
    console.error('❌ Error in GET /api/qr/validate/[code]:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}


