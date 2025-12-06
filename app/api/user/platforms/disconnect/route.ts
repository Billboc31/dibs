import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { artistsCache } from '@/lib/artists-cache'

/**
 * Déconnecte une plateforme de streaming pour l'utilisateur
 * Utilisé notamment quand un token est révoqué pour permettre la reconnexion
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
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

    const { platform_slug } = await request.json()

    if (!platform_slug) {
      return NextResponse.json(
        { success: false, error: 'platform_slug is required' },
        { status: 400 }
      )
    }

    console.log(`🔌 Déconnexion de ${platform_slug} pour user: ${user.id}`)

    // Récupérer l'ID de la plateforme
    const { data: platform, error: platformError } = await supabaseAdmin
      .from('streaming_platforms')
      .select('id, name')
      .eq('slug', platform_slug)
      .single()

    if (platformError || !platform) {
      return NextResponse.json(
        { success: false, error: `Plateforme '${platform_slug}' non trouvée` },
        { status: 404 }
      )
    }

    // Supprimer la connexion de la base de données
    const { error: deleteError } = await supabaseAdmin
      .from('user_streaming_platforms')
      .delete()
      .eq('user_id', user.id)
      .eq('platform_id', platform.id)

    if (deleteError) {
      console.error('❌ Erreur suppression connexion:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la déconnexion' },
        { status: 500 }
      )
    }

    // Invalider le cache utilisateur car les plateformes connectées ont changé
    artistsCache.invalidateUser(user.id)
    console.log('🗑️ Cache utilisateur invalidé après déconnexion plateforme')

    console.log(`✅ ${platform.name} déconnecté avec succès`)

    return NextResponse.json({
      success: true,
      data: {
        message: `${platform.name} déconnecté avec succès`,
        platform: {
          slug: platform_slug,
          name: platform.name
        },
        action_available: 'reconnect_via_connect_platform'
      }
    })

  } catch (error: any) {
    console.error('❌ Error in POST /api/user/platforms/disconnect:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
