'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

export default function AuthCallback() {
  const [status, setStatus] = useState('Vérification en cours...')
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Récupérer les paramètres de l'URL (token_hash, type, etc.)
        const token_hash = searchParams.get('token_hash')
        const type = searchParams.get('type')
        const access_token = searchParams.get('access_token')
        const refresh_token = searchParams.get('refresh_token')

        console.log('Auth callback params:', { token_hash, type, access_token })

        if (token_hash && type) {
          // Vérifier le token Magic Link
          setStatus('Vérification du Magic Link...')
          
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as any
          })

          if (error) {
            console.error('Erreur vérification OTP:', error)
            setError(`Erreur de vérification: ${error.message}`)
            return
          }

          if (data.user && data.session) {
            setStatus('Authentification réussie ! ✅')
            
            // L'authentification va déclencher l'événement onAuthStateChange
            // dans l'app mobile qui écoute via WebSocket Supabase
            
            console.log('✅ Utilisateur authentifié:', data.user.email)
            console.log('✅ Session créée:', data.session.access_token)
            
            // Attendre un peu pour que l'app mobile reçoive l'événement
            setTimeout(() => {
              setStatus('Vous pouvez fermer cette page et retourner dans l\'app mobile.')
            }, 2000)
          }

        } else if (access_token && refresh_token) {
          // Si les tokens sont déjà dans l'URL (redirection directe)
          setStatus('Tokens détectés, authentification en cours...')
          
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token
          })

          if (error) {
            console.error('Erreur setSession:', error)
            setError(`Erreur de session: ${error.message}`)
            return
          }

          if (data.session) {
            setStatus('Authentification réussie ! ✅')
            console.log('✅ Session établie:', data.session.user?.email)
            
            setTimeout(() => {
              setStatus('Vous pouvez fermer cette page et retourner dans l\'app mobile.')
            }, 2000)
          }

        } else {
          // Pas de paramètres d'authentification
          setError('Paramètres d\'authentification manquants dans l\'URL')
        }

      } catch (error) {
        console.error('Erreur callback auth:', error)
        setError(`Erreur inattendue: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
      }
    }

    handleAuthCallback()
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">👑</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">DIBS</h1>
          <p className="text-gray-600">Authentification Magic Link</p>
        </div>

        {error ? (
          <div className="mb-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl text-red-600">❌</span>
            </div>
            <h2 className="text-lg font-semibold text-red-600 mb-2">Erreur</h2>
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        ) : (
          <div className="mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {status.includes('✅') ? (
                <span className="text-xl text-green-600">✅</span>
              ) : (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
              )}
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              {status.includes('✅') ? 'Connexion réussie !' : 'Authentification'}
            </h2>
            <p className="text-gray-600 text-sm">{status}</p>
          </div>
        )}

        {status.includes('fermer cette page') && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-800 text-sm font-medium">
              📱 Retournez dans l'app mobile DIBS
            </p>
            <p className="text-yellow-600 text-xs mt-1">
              Votre connexion a été détectée automatiquement
            </p>
          </div>
        )}

        <div className="text-xs text-gray-400 mt-6">
          Cette page se ferme automatiquement après l'authentification
        </div>
      </div>
    </div>
  )
}
