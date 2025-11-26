'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DibsLogo from '@/components/DibsLogo'
import { supabase, Artist } from '@/lib/supabase'

export default function SelectArtistsPage() {
  const router = useRouter()
  const [artists, setArtists] = useState<(Artist & { listening_minutes?: number; rank?: string })[]>([])
  const [selectedArtists, setSelectedArtists] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [noArtistsFound, setNoArtistsFound] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const ARTISTS_PER_PAGE = 10

  useEffect(() => {
    initializePage()
  }, [])

  const initializePage = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.error('❌ Utilisateur non connecté')
        router.push('/')
        return
      }

      // Check if user has Spotify connected
      const { data: connection } = await supabase
        .from('user_streaming_platforms')
        .select('platform_id, streaming_platforms!inner(slug)')
        .eq('user_id', user.id)
        .eq('streaming_platforms.slug', 'spotify')
        .single()

      if (!connection) {
        console.log('⚠️ Spotify non connecté')
        setIsConnected(false)
        setNoArtistsFound(true)
        setLoading(false)
        return
      }

      setIsConnected(true)

      // Don't pre-select artists - user must manually select them
      // This ensures a clean UX for first-time users

      // Auto-sync Spotify on page load
      console.log('🔄 Synchronisation automatique Spotify...')
      setSyncing(true)
      
      try {
        const response = await fetch('/api/sync-spotify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        })

        if (response.ok) {
          const result = await response.json()
          console.log(`✅ ${result.synced} artistes synchronisés automatiquement`)
        }
      } catch (syncError) {
        console.error('⚠️ Erreur sync auto (non-bloquant):', syncError)
      } finally {
        setSyncing(false)
      }

      // Load artists after sync (will preserve selection from above)
      await loadArtists(true)
    } catch (error) {
      console.error('❌ Erreur initialisation:', error)
      setLoading(false)
    }
  }

  // Detect scroll to load more
  useEffect(() => {
    const handleScroll = () => {
      if (loadingMore || !hasMore) return

      const scrollContainer = document.querySelector('.artists-scroll-container')
      if (!scrollContainer) return

      const { scrollTop, scrollHeight, clientHeight } = scrollContainer
      
      // Load more when user is 200px from bottom
      if (scrollHeight - scrollTop - clientHeight < 200) {
        loadArtists(false)
      }
    }

    const scrollContainer = document.querySelector('.artists-scroll-container')
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll)
      return () => scrollContainer.removeEventListener('scroll', handleScroll)
    }
  }, [loadingMore, hasMore, page])

  const loadArtists = async (reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true)
        setPage(0)
        setHasMore(true)
      } else {
        setLoadingMore(true)
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.error('❌ Utilisateur non connecté')
        router.push('/')
        return
      }

      // Check if user has Spotify connected (only on first load)
      if (reset) {
        const { data: connection } = await supabase
          .from('user_streaming_platforms')
          .select('platform_id, streaming_platforms!inner(slug)')
          .eq('user_id', user.id)
          .eq('streaming_platforms.slug', 'spotify')
          .single()

        if (!connection) {
          console.log('⚠️ Spotify non connecté')
          setIsConnected(false)
          setNoArtistsFound(true)
          setLoading(false)
          return
        }

        setIsConnected(true)
      }

      const currentPage = reset ? 0 : page
      const from = currentPage * ARTISTS_PER_PAGE
      const to = from + ARTISTS_PER_PAGE - 1

      // Load user's artists from Spotify sync with pagination
      const { data: userArtists, error } = await supabase
        .from('user_artists')
        .select(`
          artist_id,
          fanitude_points,
          last_listening_minutes,
          artists:artist_id (
            id,
            name,
            spotify_id,
            image_url
          )
        `)
        .eq('user_id', user.id)
        .order('last_listening_minutes', { ascending: false })
        .range(from, to)

      if (error) {
        console.error('❌ Erreur chargement artistes:', error)
        throw error
      }

      if (!userArtists || userArtists.length === 0) {
        if (reset) {
          console.log('⚠️ Aucun artiste Spotify trouvé dans la base.')
          setNoArtistsFound(true)
          setLoading(false)
        } else {
          console.log('📭 Plus d\'artistes à charger')
          setHasMore(false)
        }
        return
      }

      // Transform data for display
      const artistsWithData = userArtists.map((ua: any) => ({
        id: ua.artists.id,
        name: ua.artists.name,
        spotify_id: ua.artists.spotify_id,
        image_url: ua.artists.image_url,
        listening_minutes: ua.last_listening_minutes,
        rank: `${ua.fanitude_points} points`,
      }))

      if (reset) {
        setArtists(artistsWithData)
        setNoArtistsFound(false)
        // Keep existing selections if resetting (after sync)
        // Only clear if it's the very first load
      } else {
        setArtists(prev => [...prev, ...artistsWithData])
      }

      // Check if there are more artists to load
      if (userArtists.length < ARTISTS_PER_PAGE) {
        setHasMore(false)
        console.log('✅ Tous les artistes chargés')
      } else {
        setPage(currentPage + 1)
      }
      
      console.log(`✅ ${artistsWithData.length} artistes chargés (page ${currentPage + 1})`)
    } catch (error) {
      console.error('Error loading artists:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const resyncSpotify = async () => {
    setSyncing(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      console.log('🔄 Resynchronisation Spotify...')
      
      // Save current selection before sync
      const currentSelection = new Set(selectedArtists)
      console.log(`📌 Sauvegarde de ${currentSelection.size} artistes sélectionnés`)
      
      // Call the sync endpoint
      const response = await fetch('/api/sync-spotify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })

      if (!response.ok) {
        throw new Error('Sync failed')
      }

      const result = await response.json()
      console.log('✅ Sync terminée:', result)

      // Reload artists from beginning (selection is preserved)
      await loadArtists(true)
      
      // Log the result without popup
      if (result.synced > 0) {
        console.log(`✅ ${result.synced} artistes synchronisés !`)
      } else {
        console.log('⚠️ Aucun artiste trouvé sur ton compte Spotify.')
      }
    } catch (error) {
      console.error('❌ Erreur sync:', error)
    } finally {
      setSyncing(false)
    }
  }

  const toggleArtist = (artistId: string) => {
    const newSelected = new Set(selectedArtists)
    if (newSelected.has(artistId)) {
      newSelected.delete(artistId)
    } else {
      newSelected.add(artistId)
    }
    setSelectedArtists(newSelected)
  }

  const handleContinue = async () => {
    if (selectedArtists.size === 0) {
      alert('Sélectionnez au moins un artiste !')
      return
    }

    setLoading(true)
    try {
      console.log('🎤 Sauvegarde des artistes...', selectedArtists.size)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('❌ Utilisateur non connecté')
        router.push('/')
        return
      }

      console.log('👤 Utilisateur:', user.id)

      // Create user profile if it doesn't exist
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email,
        }, { onConflict: 'id' })

      if (profileError) {
        console.error('❌ Erreur création profil:', profileError)
      } else {
        console.log('✅ Profil utilisateur créé/mis à jour')
      }

      // Add selected artists to user profile with initial points
      const artistsToAdd = artists
        .filter(a => selectedArtists.has(a.id))
        .map(artist => ({
          user_id: user.id,
          artist_id: artist.id,
          fanitude_points: Math.floor((artist.listening_minutes || 0) * 2), // 1 minute = 2 points
          last_listening_minutes: artist.listening_minutes || 0,
          last_sync_at: new Date().toISOString(),
        }))

      console.log('📝 Artistes à ajouter:', artistsToAdd.length)

      // First, delete all user's artists
      const { error: deleteError } = await supabase
        .from('user_artists')
        .delete()
        .eq('user_id', user.id)

      if (deleteError) {
        console.error('❌ Erreur lors de la suppression:', deleteError)
        throw deleteError
      }

      console.log('🗑️ Anciens artistes supprimés')

      // Then, insert only selected artists
      if (artistsToAdd.length > 0) {
        const { error: insertError } = await supabase
          .from('user_artists')
          .insert(artistsToAdd)

        if (insertError) {
          console.error('❌ Erreur lors de la sauvegarde:', insertError)
          throw insertError
        }
      }

      console.log('✅ Artistes sauvegardés ! Redirection...')
      router.push('/home')
    } catch (error) {
      console.error('❌ Erreur complète:', error)
      alert('Erreur lors de la sauvegarde. Vérifiez la console.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col p-6">
      {/* Status bar */}
      <div className="flex justify-between items-center mb-6">
        <span className="text-sm font-semibold">9:41</span>
        <div className="flex gap-1">
          <div className="w-4 h-4">📶</div>
          <div className="w-4 h-4">📡</div>
          <div className="w-4 h-4">🔋</div>
        </div>
      </div>

      {/* Logo */}
      <div className="mb-6">
        <DibsLogo size="small" />
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold mb-6">
        Select Your Favorite Artists :
      </h1>

      {/* Artists List */}
      <div className="flex-1 space-y-4 overflow-y-auto artists-scroll-container">
        {loading || syncing ? (
          <div className="flex flex-col items-center justify-center py-12">
            <svg className="animate-spin h-12 w-12 text-spotify-green mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600 font-medium">
              {syncing ? '🔄 Synchronisation avec Spotify...' : 'Chargement...'}
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Récupération de tes artistes favoris
            </p>
          </div>
        ) : noArtistsFound ? (
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <span className="text-5xl">🎵</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">
              {isConnected ? 'Aucun artiste trouvé' : 'Aucune plateforme connectée'}
            </h2>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              {isConnected ? (
                <>
                  Nous n'avons trouvé aucun artiste sur ton compte Spotify.
                  <br /><br />
                  Cela peut arriver si :
                  <ul className="text-left mt-3 space-y-2">
                    <li>• Tu n'as pas encore écouté de musique sur Spotify</li>
                    <li>• Tu ne suis aucun artiste</li>
                    <li>• La synchronisation a échoué</li>
                  </ul>
                </>
              ) : (
                'Connecte d\'abord une plateforme de streaming pour synchroniser tes artistes favoris.'
              )}
            </p>
            {isConnected ? (
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={resyncSpotify}
                  disabled={syncing}
                  className="bg-spotify-green text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-[#1aa34a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {syncing ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Synchronisation...
                    </>
                  ) : (
                    <>
                      🔄 Resynchroniser manuellement
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-500">
                  La synchronisation est automatique à chaque visite
                </p>
              </div>
            ) : (
              <button
                onClick={() => router.push('/connect-platform')}
                className="bg-black text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors"
              >
                Connecter une plateforme
              </button>
            )}
          </div>
        ) : (
          artists.map((artist) => (
            <div
              key={artist.id}
              className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-black transition-colors"
            >
              {/* Artist Image */}
              <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                {artist.image_url ? (
                  <img
                    src={artist.image_url}
                    alt={artist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    🎤
                  </div>
                )}
              </div>

              {/* Artist Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg truncate">{artist.name}</h3>
                <p className="text-sm text-gray-600">
                  Listened for : {artist.listening_minutes} minutes
                </p>
                <p className="text-xs text-gray-500">
                  Your position : {artist.rank}
                </p>
              </div>

              {/* Add Button */}
              <button
                onClick={() => toggleArtist(artist.id)}
                className={`px-6 py-2 rounded-full font-bold text-sm transition-colors ${
                  selectedArtists.has(artist.id)
                    ? 'bg-dibs-yellow text-black'
                    : 'bg-white text-black border-2 border-black hover:bg-gray-100'
                }`}
              >
                {selectedArtists.has(artist.id) ? '✓ ADDED' : 'ADD ON DIBS'}
              </button>
            </div>
          ))
        )}
        
        {/* Loading more indicator */}
        {loadingMore && (
          <div className="flex items-center justify-center py-6">
            <svg className="animate-spin h-8 w-8 text-gray-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}

        {/* End of list indicator */}
        {!loading && !noArtistsFound && !hasMore && artists.length > 0 && (
          <div className="text-center py-6 text-gray-500 text-sm">
            🎉 Tous les artistes chargés !
          </div>
        )}
      </div>

      {/* Continue Button */}
      {selectedArtists.size > 0 && (
        <button
          onClick={handleContinue}
          disabled={loading}
          className="mt-6 w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          Continue ({selectedArtists.size} artist{selectedArtists.size > 1 ? 's' : ''})
        </button>
      )}

      {/* Bottom Navigation */}
      <div className="flex justify-around items-center pt-6 mt-6 border-t border-gray-200">
        <button className="text-2xl">🏠</button>
        <button className="text-2xl">📅</button>
        <button className="text-2xl">📧</button>
        <button className="text-2xl relative">
          🔔
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            5
          </span>
        </button>
        <button className="text-2xl">👤</button>
      </div>
    </div>
  )
}

