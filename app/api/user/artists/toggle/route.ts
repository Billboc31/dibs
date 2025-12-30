import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { artistsCache } from '@/lib/artists-cache'

// Force dynamic rendering pour éviter les erreurs de build Vercel
export const dynamic = 'force-dynamic'

// POST /api/user/artists/toggle - Sélectionner/désélectionner un ou plusieurs artistes
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

    // Récupérer les paramètres (support pour un seul artiste ou une liste)
    const body = await request.json()
    
    // Support pour les deux formats :
    // Format simple: { artistId: "123", selected: true }
    // Format multiple: { artists: [{ artistId: "123", selected: true }, { artistId: "456", selected: false }] }
    let artistsToToggle: Array<{ artistId: string, selected: boolean }> = []
    
    if (body.artistId !== undefined) {
      // Format simple (rétrocompatibilité)
      artistsToToggle = [{ artistId: body.artistId, selected: body.selected }]
    } else if (body.artists && Array.isArray(body.artists)) {
      // Format multiple
      artistsToToggle = body.artists
    } else {
      return NextResponse.json(
        { success: false, error: 'artistId or artists array is required' },
        { status: 400 }
      )
    }

    console.log(`🔄 Toggle ${artistsToToggle.length} artiste(s) pour l'utilisateur ${user.id}`)

    const results = []
    const selectedArtistIds = []

    for (const { artistId, selected } of artistsToToggle) {
      // Vérifier si l'artiste existe dans la table globale artists
      const { data: artist, error: artistError } = await supabaseAdmin
        .from('artists')
        .select('id, name, spotify_id')
        .eq('id', artistId)
        .single()

      if (artistError || !artist) {
        console.log(`⚠️ Artiste ${artistId} non trouvé dans la table globale`)
        results.push({
          artistId,
          success: false,
          error: 'Artist not found'
        })
        continue
      }

      // Vérifier si l'artiste est déjà dans user_artists
      const { data: existingUserArtist } = await supabaseAdmin
        .from('user_artists')
        .select('*')
        .eq('user_id', user.id)
        .eq('artist_id', artistId)
        .single()

      if (selected) {
        // Sélectionner l'artiste
        if (!existingUserArtist) {
          // Ajouter à user_artists avec des valeurs initiales
          const { error: insertError } = await supabaseAdmin
            .from('user_artists')
            .insert({
              user_id: user.id,
              artist_id: artistId,
              fanitude_points: 0, // Sera calculé par le sync
              last_listening_minutes: 0 // Sera calculé par le sync
            })

          if (insertError) {
            console.error(`❌ Erreur sélection artiste ${artist.name}:`, insertError)
            results.push({
              artistId,
              success: false,
              error: 'Failed to select artist'
            })
            continue
          }
          
          console.log(`✅ Artiste ${artist.name} sélectionné`)
          selectedArtistIds.push(artistId)
        }
        
        results.push({
          artistId,
          success: true,
          selected: true,
          name: artist.name
        })
      } else {
        // Désélectionner l'artiste
        if (existingUserArtist) {
          // Supprimer de user_artists
          const { error: deleteError } = await supabaseAdmin
            .from('user_artists')
            .delete()
            .eq('user_id', user.id)
            .eq('artist_id', artistId)

          if (deleteError) {
            console.error(`❌ Erreur désélection artiste ${artist.name}:`, deleteError)
            results.push({
              artistId,
              success: false,
              error: 'Failed to unselect artist'
            })
            continue
          }
          
          console.log(`✅ Artiste ${artist.name} désélectionné`)
        }
        
        results.push({
          artistId,
          success: true,
          selected: false,
          name: artist.name
        })
      }
    }

    // Déclencher le sync pour les artistes nouvellement sélectionnés
    if (selectedArtistIds.length > 0) {
      console.log(`🔄 Déclenchement du sync pour ${selectedArtistIds.length} nouveaux artistes...`)
      
      try {
        // Appeler l'endpoint de sync
        const syncResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/user/artists/sync`, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ artistIds: selectedArtistIds })
        })
        
        if (syncResponse.ok) {
          console.log(`✅ Sync terminé pour les nouveaux artistes`)
        } else {
          console.log(`⚠️ Erreur lors du sync: ${syncResponse.status}`)
        }
      } catch (syncError) {
        console.log(`⚠️ Erreur appel sync:`, syncError)
      }
    }

    // Compter le nombre total d'artistes sélectionnés
    const { count: selectedCount } = await supabaseAdmin
      .from('user_artists')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Mettre à jour le cache pour chaque artiste modifié (sans tout vider)
    for (const { artistId, selected } of artistsToToggle) {
      artistsCache.updateArtistSelected(user.id, artistId, selected)
    }
    console.log(`✅ Cache mis à jour pour ${artistsToToggle.length} artiste(s)`)

    return NextResponse.json({
      success: true,
      data: {
        results,
        total_processed: artistsToToggle.length,
        total_selected: selectedCount || 0,
        sync_triggered: selectedArtistIds.length > 0
      }
    })

  } catch (error: any) {
    console.error('❌ Error in POST /api/user/artists/toggle:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
