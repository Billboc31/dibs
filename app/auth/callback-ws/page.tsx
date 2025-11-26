'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSearchParams } from 'next/navigation'

export default function AuthCallbackWS() {
  const [status, setStatus] = useState('Vérification en cours...')
  const [error, setError] = useState('')
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    // Timeout de sécurité
    const timeoutId = setTimeout(() => {
      setError('Timeout - La vérification a pris trop de temps (30s)')
      setDebugInfo({
        timeout: true,
        params: Object.fromEntries(searchParams.entries()),
        timestamp: new Date().toISOString()
      })
    }, 30000) // 30 secondes

    const handleAuthCallback = async () => {
      try {
        const email = searchParams.get('email')
        const allParams = Object.fromEntries(searchParams.entries())
        
        setDebugInfo({
          email,
          allParams,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        })
        
        if (!email) {
          setError('Email manquant dans l\'URL')
          clearTimeout(timeoutId)
          return
        }

        console.log('🔄 Callback WebSocket pour:', email)
        console.log('📋 Paramètres URL:', allParams)
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
          setStatus('Vérification OTP en cours...')
          
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as any
          })
          
          console.log('📤 Résultat verifyOtp:', { data: !!data, error: error?.message })

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
          setStatus('Établissement de la session...')
          
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token
          })
          
          console.log('📤 Résultat setSession:', { data: !!data, error: error?.message })

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
          setStatus('Échange du code d\'autorisation...')
          
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          
          console.log('📤 Résultat exchangeCode:', { data: !!data, error: error?.message })

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
          setStatus('Recherche de session existante...')
          
          const { data, error } = await supabase.auth.getSession()
          
          console.log('📤 Résultat getSession:', { data: !!data?.session, error: error?.message })
          
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

        if ((sessionData?.user || sessionData?.session?.user) && sessionData?.session) {
          clearTimeout(timeoutId) // Annuler le timeout
          setStatus('Authentification réussie ! Envoi du token...')
          
          const user = sessionData.user || sessionData.session.user
          console.log('✅ Session établie pour:', user.email)
          console.log('🎯 Token access:', sessionData.session.access_token?.substring(0, 20) + '...')
          console.log('🔄 Token refresh:', sessionData.session.refresh_token?.substring(0, 20) + '...')
          
          // Envoyer le token au WebSocket
          console.log('📡 Envoi notification WebSocket...')
          const notifyResponse = await fetch('/api/auth/ws-complete/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              step: 5,
              status: 'authenticated',
              message: 'Authentification réussie ! Token envoyé à l\'app mobile.',
              user: {
                id: user.id,
                email: user.email,
                display_name: user.user_metadata?.display_name || null,
                avatar_url: user.user_metadata?.avatar_url || null,
                created_at: user.created_at
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

          console.log('📡 Réponse notification:', notifyResponse.status, notifyResponse.ok)

          if (notifyResponse.ok) {
            setStatus('Token envoyé avec succès ! Vous pouvez fermer cette page.')
            
            // Fermer automatiquement après 3 secondes
            setTimeout(() => {
              window.close()
            }, 3000)
          } else {
            const errorText = await notifyResponse.text()
            console.error('❌ Erreur notification WebSocket:', errorText)
            setStatus('Authentification réussie mais erreur d\'envoi au WebSocket')
            setError(`Erreur notification: ${errorText}`)
          }
        } else {
          clearTimeout(timeoutId)
          console.error('❌ Aucune session valide trouvée')
          setError('Aucune session d\'authentification valide trouvée')
          
          setDebugInfo(prev => ({
            ...prev,
            sessionData,
            hasUser: !!(sessionData?.user || sessionData?.session?.user),
            hasSession: !!sessionData?.session,
            userLocation: sessionData?.user ? 'sessionData.user' : sessionData?.session?.user ? 'sessionData.session.user' : 'not found'
          }))
        }

      } catch (error) {
        clearTimeout(timeoutId)
        console.error('❌ Erreur callback auth:', error)
        setError(`Erreur inattendue: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
        
        setDebugInfo(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        }))
      }
    }

    handleAuthCallback()
    
    // Cleanup timeout si le composant est démonté
    return () => clearTimeout(timeoutId)
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
            
            {/* Afficher les informations de debug */}
            <details className="text-left bg-red-50 border border-red-200 rounded p-3">
              <summary className="text-xs text-red-700 cursor-pointer font-medium">
                🔍 Informations de debug
              </summary>
              <pre className="text-xs text-red-600 mt-2 overflow-x-auto">
                {JSON.stringify(debugInfo, null, 2)}
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

        {/* Bouton de fermeture manuelle */}
        {!status.includes('fermer') && !error && (
          <button
            onClick={() => window.close()}
            className="mt-4 px-4 py-2 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
          >
            🚪 Fermer cette page
          </button>
        )}

        {/* Bouton de retry si erreur */}
        {error && (
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            🔄 Réessayer
          </button>
        )}

        <div className="text-xs text-gray-400 mt-6">
          WebSocket Magic Link + Token automatique
        </div>
      </div>
    </div>
  )
}
