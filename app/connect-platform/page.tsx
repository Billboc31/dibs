'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DibsLogo from '@/components/DibsLogo'
import StatusBar from '@/components/StatusBar'
import BottomNav from '@/components/BottomNav'
import { supabase } from '@/lib/supabase'
import { redirectToSpotifyAuth } from '@/lib/spotify-api'

export default function ConnectPlatformPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [connectedPlatforms, setConnectedPlatforms] = useState<{ [key: string]: any }>({})
  const [checkingConnection, setCheckingConnection] = useState(true)

  useEffect(() => {
    checkConnectedPlatforms()
  }, [])

  useEffect(() => {
    // Check for connection status from callback
    const errorParam = searchParams.get('error')
    const connectedParam = searchParams.get('connected')
    const platformParam = searchParams.get('platform')

    if (errorParam === 'spotify_denied') {
      setError('Vous avez refusé l\'accès à Spotify')
    } else if (errorParam === 'spotify_error') {
      setError('Erreur lors de la connexion à Spotify')
    } else if (connectedParam === 'true' && platformParam) {
      setSuccess(`${platformParam.charAt(0).toUpperCase() + platformParam.slice(1)} connecté avec succès !`)
      // Redirect to select artists after 2 seconds
      setTimeout(() => router.push('/select-artists'), 2000)
    }
  }, [searchParams, router])

  const checkConnectedPlatforms = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setCheckingConnection(false)
        return
      }

      // Get user's connected platforms
      const { data, error } = await supabase
        .from('user_streaming_platforms')
        .select(`
          platform_id,
          connected_at,
          streaming_platforms (
            slug,
            name
          )
        `)
        .eq('user_id', user.id)

      if (error) throw error

      const connected: { [key: string]: any } = {}
      data?.forEach((connection: any) => {
        connected[connection.streaming_platforms.slug] = {
          name: connection.streaming_platforms.name,
          connectedAt: connection.connected_at
        }
      })
      
      setConnectedPlatforms(connected)
      console.log('✅ Plateformes connectées:', Object.keys(connected))
    } catch (error) {
      console.error('❌ Erreur vérification connexions:', error)
    } finally {
      setCheckingConnection(false)
    }
  }

  const handlePlatformConnect = async (platform: 'spotify' | 'apple_music' | 'deezer') => {
    // Check if already connected
    if (connectedPlatforms[platform]) {
      alert(`${platform === 'spotify' ? 'Spotify' : platform} est déjà connecté !`)
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }

      // Create user profile if it doesn't exist
      await supabase.from('users').upsert({
        id: user.id,
        email: user.email,
      }, { onConflict: 'id' })

      // Handle different platforms
      if (platform === 'spotify') {
        // Redirect to Spotify OAuth
        await redirectToSpotifyAuth()
        return // Don't setLoading(false) here as we're redirecting
      } else if (platform === 'deezer') {
        // Deezer n'accepte plus les nouvelles connexions
        alert('Deezer n\'accepte plus les nouvelles connexions. Utilisez Spotify !')
        setLoading(false)
      } else if (platform === 'apple_music') {
        // TODO: Implement Apple Music
        alert('Apple Music à configurer (voir OAUTH_SETUP.md)')
        setLoading(false)
      } else {
        // Fallback: mock connection (pour le POC)
        const { data: platforms } = await supabase
          .from('streaming_platforms')
          .select('id')
          .eq('slug', platform)
          .single()

        if (platforms) {
          await supabase.from('user_streaming_platforms').insert({
            user_id: user.id,
            platform_id: platforms.id,
            platform_user_id: `mock_${platform}_${user.id}`,
            connected_at: new Date().toISOString(),
          })
        }

        router.push('/select-artists')
      }
    } catch (error) {
      console.error('Error connecting platform:', error)
      setError('Erreur lors de la connexion')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Status Bar */}
      <StatusBar />

      {/* Content */}
      <div className="flex-1 flex flex-col p-6">
        {/* Logo */}
        <div className="mb-8">
          <DibsLogo size="normal" />
        </div>

        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Connecte ta plateforme
          </h1>
          <p className="text-gray-600 text-base">
            Choisis ta plateforme de streaming pour synchroniser<br />tes artistes favoris et gagner des points
          </p>
        </div>

        {/* Platform Buttons */}
        <div className="space-y-4 max-w-md mx-auto w-full">
        {/* Spotify - Recommandé */}
        <button
          onClick={() => handlePlatformConnect('spotify')}
          disabled={loading || checkingConnection || !!connectedPlatforms.spotify}
          className={`relative group w-full border-2 rounded-2xl p-6 transition-all duration-300 shadow-sm disabled:cursor-not-allowed ${
            connectedPlatforms.spotify
              ? 'bg-green-50 border-spotify-green'
              : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-spotify-green hover:shadow-xl'
          } ${loading || checkingConnection ? 'opacity-50' : ''}`}
        >
          <div className="flex items-center gap-5">
            {/* Spotify Logo */}
            <div className="w-16 h-16 bg-gradient-to-br from-[#1DB954] to-[#1ed760] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
              {connectedPlatforms.spotify ? (
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                </svg>
              ) : (
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="white">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold text-gray-900">Spotify</h3>
                {connectedPlatforms.spotify ? (
                  <span className="bg-spotify-green text-white text-xs font-bold px-2 py-1 rounded-full">
                    ✓ CONNECTÉ
                  </span>
                ) : (
                  <span className="bg-spotify-green text-white text-xs font-bold px-2 py-1 rounded-full">
                    RECOMMANDÉ
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {connectedPlatforms.spotify 
                  ? `Connecté le ${new Date(connectedPlatforms.spotify.connectedAt).toLocaleDateString('fr-FR')}`
                  : 'Synchronisation automatique de tes artistes'
                }
              </p>
            </div>

            {/* Arrow or Check */}
            {connectedPlatforms.spotify ? (
              <svg className="w-6 h-6 text-spotify-green" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
              </svg>
            ) : (
              <svg className="w-6 h-6 text-gray-400 group-hover:text-spotify-green group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </div>
        </button>

        {/* Apple Music - Coming Soon */}
        <button
          disabled
          className="relative group w-full bg-white border-2 border-gray-200 rounded-2xl p-6 opacity-60 cursor-not-allowed"
        >
          <div className="flex items-center gap-5">
            {/* Apple Music Logo */}
            <div className="w-16 h-16 bg-gradient-to-br from-[#FC3C44] to-[#ff6b72] rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-10 h-10" viewBox="0 0 24 24" fill="white">
                <path d="M23.994 6.124a9.23 9.23 0 0 0-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.79 5.79 0 0 0-1.877-.726 11.4 11.4 0 0 0-2.073-.167c-.64 0-5.2-.041-5.2-.041L12.25 0h-.26c-.24 0-2.28 0-4.97.028-1.43.023-2.87.296-4.17.897a5.81 5.81 0 0 0-1.89 1.44C.45 3.186.115 4.45.037 5.807c-.023.407-.037.827-.037 1.237v8.016c0 .976.078 1.94.23 2.9.304 1.91 1.29 3.33 2.88 4.12.524.26 1.1.45 1.68.57.905.19 1.83.26 2.76.26 1.42 0 2.84-.015 4.26-.015 1.42 0 2.84 0 4.26.015 1.43 0 2.86-.015 4.29-.26 1.91-.33 3.47-1.29 4.35-3.08.38-.78.59-1.64.72-2.52.13-.88.2-1.77.2-2.67 0-.265.008-.53.008-.795v-7.22c0-.33-.005-.66-.005-.995zm-12 9.608c-2.483 0-4.5-2.017-4.5-4.5s2.017-4.5 4.5-4.5 4.5 2.017 4.5 4.5-2.017 4.5-4.5 4.5z"/>
              </svg>
            </div>
            
            {/* Content */}
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold text-gray-900">Apple Music</h3>
                <span className="bg-gray-400 text-white text-xs font-bold px-2 py-1 rounded-full">
                  BIENTÔT
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Intégration en cours de développement
              </p>
            </div>
          </div>
        </button>

        {/* Deezer - Non disponible */}
        <button
          disabled
          className="relative group w-full bg-white border-2 border-gray-200 rounded-2xl p-6 opacity-50 cursor-not-allowed"
        >
          <div className="flex items-center gap-5">
            {/* Deezer Logo */}
            <div className="w-16 h-16 bg-gradient-to-br from-[#A238FF] to-[#b966ff] rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-10 h-10" viewBox="0 0 24 24" fill="white">
                <path d="M18.81 4.16v2.5h2.48v-2.5h-2.48zm0 2.94v2.5h2.48v-2.5h-2.48zm-3.1 0v2.5h2.48v-2.5h-2.48zm0 2.94v2.5h2.48v-2.5h-2.48zm0 2.94v2.5h2.48v-2.5h-2.48zM12.6 10.04v2.5h2.48v-2.5H12.6zm0 2.94v2.5h2.48v-2.5H12.6zm0 2.94v2.5h2.48v-2.5H12.6zM9.5 12.98v2.5h2.48v-2.5H9.5zm0 2.94v2.5h2.48v-2.5H9.5zM6.4 12.98v2.5h2.48v-2.5H6.4zm0 2.94v2.5h2.48v-2.5H6.4zM3.3 15.92v2.5h2.48v-2.5H3.3z"/>
              </svg>
            </div>
            
            {/* Content */}
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold text-gray-900">Deezer</h3>
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  NON DISPONIBLE
                </span>
              </div>
              <p className="text-sm text-gray-600">
                N'accepte plus les nouvelles connexions
              </p>
            </div>
          </div>
        </button>
        </div>

        {/* Messages */}
        {loading && (
          <div className="mt-8 flex items-center justify-center gap-3 text-gray-700">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="font-medium">Connexion en cours...</span>
          </div>
        )}

        {error && (
          <div className="mt-8 p-5 bg-red-50 border-2 border-red-200 rounded-xl shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mt-8 p-5 bg-green-50 border-2 border-green-200 rounded-xl shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-green-700 font-semibold">{success}</p>
                <p className="text-green-600 text-sm mt-1">Redirection en cours...</p>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 p-5 bg-blue-50 border-2 border-blue-100 rounded-xl">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-blue-900 font-semibold mb-1">Pourquoi Spotify ?</h4>
              <p className="text-blue-700 text-sm leading-relaxed">
                Spotify offre la meilleure intégration avec synchronisation automatique de tes artistes favoris et de ton historique d'écoute. Tes points de fanitude sont calculés en temps réel !
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}

