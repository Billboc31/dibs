'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSearchParams } from 'next/navigation'

export default function AuthCallbackWS() {
  const [status, setStatus] = useState('Vérification en cours...')
  const [error, setError] = useState('')
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const email = searchParams.get('email')
        
        if (!email) {
          setError('Email manquant dans l\'URL')
          return
        }

        console.log('🔄 Callback WebSocket pour:', email)
        console.log('📋 Paramètres URL:', Object.fromEntries(searchParams.entries()))
        setStatus('Vérification du Magic Link...')

        let sessionData = null

        // Récupérer tous les paramètres possibles
        const token_hash = searchParams.get('token_hash')
        const type = searchParams.get('type')
        const access_token = searchParams.get('access_token')
        const refresh_token = searchParams.get('refresh_token')
        
        // Autres paramètres possibles de Supabase
        const code = searchParams.get('code')
        const error_code = searchParams.get('error_code')
        const error_description = searchParams.get('error_description')

        // Vérifier s'il y a une erreur dans l'URL
        if (error_code || error_description) {
          const errorMsg = error_description || `Erreur d'authentification: ${error_code}`
          console.error('❌ Erreur dans URL:', errorMsg)
          setError(errorMsg)
          
          // Envoyer l'erreur au WebSocket
          await fetch('/api/auth/ws-complete/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              step: 5,
              status: 'error',
              message: 'Erreur d\'authentification',
              error: errorMsg
            })
          })
          return
        }

        // Méthode 1: Vérification OTP avec token_hash
        if (token_hash && type) {
          console.log('🔑 Vérification OTP avec token_hash')
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as any
          })

          if (error) {
            console.error('❌ Erreur vérification OTP:', error)
            setError(`Erreur de vérification: ${error.message}`)
            
            // Envoyer l'erreur au WebSocket
            await fetch('/api/auth/ws-complete/notify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email,
                step: 5,
                status: 'error',
                message: 'Erreur de vérification du Magic Link',
                error: error.message
              })
            })
            return
          }

          sessionData = data
        } 
        // Méthode 2: Session directe avec access_token/refresh_token
        else if (access_token && refresh_token) {
          console.log('🔑 Établissement session avec tokens')
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token
          })

          if (error) {
            console.error('❌ Erreur setSession:', error)
            setError(`Erreur de session: ${error.message}`)
            
            // Envoyer l'erreur au WebSocket
            await fetch('/api/auth/ws-complete/notify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email,
                step: 5,
                status: 'error',
                message: 'Erreur d\'établissement de session',
                error: error.message
              })
            })
            return
          }

          sessionData = data
        }
        // Méthode 3: Échange de code (OAuth flow)
        else if (code) {
          console.log('🔑 Échange de code OAuth')
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)

          if (error) {
            console.error('❌ Erreur échange code:', error)
            setError(`Erreur d'échange de code: ${error.message}`)
            
            // Envoyer l'erreur au WebSocket
            await fetch('/api/auth/ws-complete/notify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email,
                step: 5,
                status: 'error',
                message: 'Erreur d\'échange de code',
                error: error.message
              })
            })
            return
          }

          sessionData = data
        }
        // Méthode 4: Essayer de récupérer la session actuelle
        else {
          console.log('🔑 Tentative récupération session actuelle')
          const { data, error } = await supabase.auth.getSession()
          
          if (error || !data.session) {
            console.error('❌ Aucune session trouvée:', error?.message || 'Session null')
            setError('Paramètres d\'authentification manquants ou session expirée')
            
            // Envoyer l'erreur au WebSocket
            await fetch('/api/auth/ws-complete/notify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email,
                step: 5,
                status: 'error',
                message: 'Aucune session d\'authentification trouvée',
                error: 'Paramètres manquants dans l\'URL de callback'
              })
            })
            return
          }
          
          sessionData = data
        }

        if (sessionData?.user && sessionData?.session) {
          setStatus('Authentification réussie ! Envoi du token...')
          
          console.log('✅ Session établie pour:', sessionData.user.email)
          console.log('🎯 Token access:', sessionData.session.access_token?.substring(0, 20) + '...')
          console.log('🔄 Token refresh:', sessionData.session.refresh_token?.substring(0, 20) + '...')
          
          // Envoyer le token au WebSocket
          const notifyResponse = await fetch('/api/auth/ws-complete/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              step: 5,
              status: 'authenticated',
              message: 'Authentification réussie ! Token envoyé à l\'app mobile.',
              user: {
                id: sessionData.user.id,
                email: sessionData.user.email,
                display_name: sessionData.user.user_metadata?.display_name || null,
                avatar_url: sessionData.user.user_metadata?.avatar_url || null,
                created_at: sessionData.user.created_at
              },
              session: {
                access_token: sessionData.session.access_token,
                refresh_token: sessionData.session.refresh_token,
                expires_at: sessionData.session.expires_at,
                expires_in: sessionData.session.expires_in
              },
              timestamp: new Date().toISOString()
            })
          })

          if (notifyResponse.ok) {
            setStatus('Token envoyé avec succès ! Vous pouvez fermer cette page.')
            
            // Fermer automatiquement après 3 secondes
            setTimeout(() => {
              window.close()
            }, 3000)
          } else {
            setStatus('Authentification réussie mais erreur d\'envoi au WebSocket')
          }
        }

      } catch (error) {
        console.error('Erreur callback auth:', error)
        setError(`Erreur inattendue: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
      }
    }

    handleAuthCallback()
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚡</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">DIBS WebSocket</h1>
          <p className="text-gray-600">Magic Link + Token automatique</p>
        </div>

        {error ? (
          <div className="mb-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl text-red-600">❌</span>
            </div>
            <h2 className="text-lg font-semibold text-red-600 mb-2">Erreur</h2>
            <p className="text-red-500 text-sm mb-4">{error}</p>
            
            {/* Afficher les paramètres pour debug */}
            <details className="text-left bg-red-50 border border-red-200 rounded p-3">
              <summary className="text-xs text-red-700 cursor-pointer font-medium">
                🔍 Paramètres reçus (debug)
              </summary>
              <pre className="text-xs text-red-600 mt-2 overflow-x-auto">
                {JSON.stringify(Object.fromEntries(searchParams.entries()), null, 2)}
              </pre>
            </details>
          </div>
        ) : (
          <div className="mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {status.includes('succès') || status.includes('fermer') ? (
                <span className="text-xl text-blue-600">✅</span>
              ) : (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              )}
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              {status.includes('succès') ? 'Token envoyé !' : 'Traitement...'}
            </h2>
            <p className="text-gray-600 text-sm">{status}</p>
          </div>
        )}

        {status.includes('fermer') && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-blue-800 text-sm font-medium">
              📱 Le token a été envoyé à votre app mobile
            </p>
            <p className="text-blue-600 text-xs mt-1">
              Cette page se ferme automatiquement dans 3 secondes
            </p>
          </div>
        )}

        <div className="text-xs text-gray-400 mt-6">
          WebSocket Magic Link + Token automatique
        </div>
      </div>
    </div>
  )
}
