'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import DibsLogo from '@/components/DibsLogo'

export default function AuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Vérification en cours...')
  const [error, setError] = useState('')
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Lire les paramètres depuis l'URL (query string)
        let token_hash = searchParams.get('token_hash')
        let type = searchParams.get('type')
        let access_token = searchParams.get('access_token')
        let refresh_token = searchParams.get('refresh_token')
        let redirect_to = searchParams.get('redirect_to')

        // Si pas de paramètres dans la query string, lire depuis le hash
        if (!access_token && !token_hash && window.location.hash) {
          const hash = window.location.hash.substring(1) // Enlever le #
          const params = new URLSearchParams(hash)
          
          token_hash = params.get('token_hash')
          type = params.get('type')
          access_token = params.get('access_token')
          refresh_token = params.get('refresh_token')
          redirect_to = params.get('redirect_to')
          
          console.log('Auth callback params (from hash):', { token_hash, type, access_token, redirect_to })
        } else {
          console.log('Auth callback params (from query):', { token_hash, type, access_token, redirect_to })
        }

        if (token_hash && type) {
          setMessage('Vérification du Magic Link...')
          
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as any
          })

          if (error) {
            console.error('Erreur vérification OTP:', error)
            setStatus('error')
            setError(`Erreur de vérification: ${error.message}`)
            return
          }

          if (data.user && data.session) {
            setStatus('success')
            setMessage('Authentification réussie !')
            console.log('✅ Utilisateur authentifié:', data.user.email)
            
            if (redirect_to) {
              const redirectUrl = new URL(redirect_to)
              redirectUrl.searchParams.set('access_token', data.session.access_token)
              redirectUrl.searchParams.set('refresh_token', data.session.refresh_token)
              
              setTimeout(() => {
                window.location.href = redirectUrl.toString()
              }, 1000)
            }
          }

        } else if (access_token && refresh_token) {
          setMessage('Tokens détectés, authentification en cours...')
          
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token
          })

          if (error) {
            console.error('Erreur setSession:', error)
            setStatus('error')
            setError(`Erreur de session: ${error.message}`)
            return
          }

          if (data.session) {
            setStatus('success')
            setMessage('Authentification réussie !')
            console.log('✅ Session établie:', data.session.user?.email)
            
            if (redirect_to) {
              const redirectUrl = new URL(redirect_to)
              redirectUrl.searchParams.set('access_token', data.session.access_token)
              redirectUrl.searchParams.set('refresh_token', data.session.refresh_token)
              
              setTimeout(() => {
                window.location.href = redirectUrl.toString()
              }, 1000)
            }
          }

        } else {
          setStatus('error')
          setError('Paramètres d\'authentification manquants dans l\'URL')
        }

      } catch (error) {
        console.error('Erreur callback auth:', error)
        setStatus('error')
        setError(`Erreur inattendue: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
      }
    }

    handleAuthCallback()
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-yellow-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center border border-gray-100">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <DibsLogo size="normal" />
          </div>

          {/* Animation/Icône selon le statut */}
          <div className="mb-8 relative">
            {status === 'loading' && (
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
                <svg className="animate-spin h-12 w-12 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}

            {status === 'success' && (
              <>
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg animate-scale-in">
                  <svg 
                    className="w-16 h-16 text-white animate-check-draw" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={3} 
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-40 h-40 border-4 border-green-200 rounded-full animate-ping-slow opacity-30"></div>
                </div>
              </>
            )}

            {status === 'error' && (
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-6xl text-white">❌</span>
              </div>
            )}
          </div>

          {/* Titre et message */}
          {status === 'loading' && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Authentification en cours
              </h1>
              <p className="text-lg text-gray-600 mb-2">
                {message}
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                🎉 Inscription réussie !
              </h1>
              <p className="text-lg text-gray-600 mb-2">
                Ton compte a été créé avec succès.
              </p>
              <p className="text-md text-gray-500 mb-8">
                Tu peux maintenant retourner sur l'application mobile DIBS.
              </p>

              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full mb-8 border border-green-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-semibold">Compte activé</span>
              </div>

              {/* Message final */}
              <div className="text-center">
                <p className="text-gray-500 text-sm">
                  Tu peux fermer cette page et retourner sur l'application mobile
                </p>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <h1 className="text-2xl font-bold text-red-700 mb-4">
                Erreur d'authentification
              </h1>
              <p className="text-md text-red-600 mb-8">
                {error}
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">
                  Si le problème persiste, contacte le support.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Instruction supplémentaire */}
        {status === 'success' && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              💡 Retourne sur l'app mobile pour continuer
            </p>
          </div>
        )}
      </div>

      {/* Styles pour les animations */}
      <style jsx>{`
        @keyframes scale-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes check-draw {
          0% {
            stroke-dasharray: 0, 100;
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            stroke-dasharray: 100, 0;
            opacity: 1;
          }
        }

        @keyframes ping-slow {
          0% {
            transform: scale(1);
            opacity: 0.3;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        .animate-scale-in {
          animation: scale-in 0.6s ease-out;
        }

        .animate-check-draw {
          animation: check-draw 0.8s ease-in-out 0.3s both;
        }

        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  )
}
