'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import DibsLogo from '@/components/DibsLogo'

export default function RegisterResultPage() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'success' | 'error'>('success')
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Récupérer les paramètres de l'URL
    const success = searchParams.get('success') === 'true'
    const error = searchParams.get('error')
    const email = searchParams.get('email')

    if (success) {
      setStatus('success')
      setMessage(email || '')
    } else {
      setStatus('error')
      setMessage(error || 'Une erreur est survenue lors de l\'inscription')
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center border border-gray-100">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <DibsLogo size="normal" />
          </div>

          {/* Animation/Icône selon le statut */}
          <div className="mb-8 relative">
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
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center shadow-lg animate-scale-in">
                <svg 
                  className="w-16 h-16 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={3} 
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Contenu selon le statut */}
          {status === 'success' ? (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                🎉 Inscription réussie !
              </h1>
              <p className="text-lg text-gray-600 mb-2">
                Ton compte a été créé avec succès.
              </p>
              {message && (
                <p className="text-md text-gray-500 mb-6">
                  📧 {message}
                </p>
              )}
              <p className="text-md text-gray-500 mb-8">
                Tu peux maintenant retourner sur l'application mobile DIBS.
              </p>

              {/* Badge succès */}
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full mb-8 border border-green-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-semibold">Compte créé</span>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-blue-800 font-medium mb-2">
                  📱 Prochaines étapes :
                </p>
                <ol className="text-left text-sm text-blue-700 space-y-1">
                  <li>1. Retourne sur l'application mobile</li>
                  <li>2. Connecte-toi avec ton email</li>
                  <li>3. Profite de DIBS !</li>
                </ol>
              </div>

              {/* Message final */}
              <div className="text-center">
                <p className="text-gray-500 text-sm">
                  Tu peux fermer cette page et retourner sur l'application mobile
                </p>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-red-700 mb-4">
                ❌ Erreur d'inscription
              </h1>
              <p className="text-lg text-red-600 mb-8">
                {message}
              </p>

              {/* Badge erreur */}
              <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-full mb-8 border border-red-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="font-semibold">Échec de l'inscription</span>
              </div>

              {/* Instructions */}
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-orange-800 font-medium mb-2">
                  🔄 Que faire ?
                </p>
                <ul className="text-left text-sm text-orange-700 space-y-1">
                  <li>• Retourne sur l'application mobile</li>
                  <li>• Réessaie avec une autre adresse email</li>
                  <li>• Vérifie que ton mot de passe est valide</li>
                  <li>• Contacte le support si le problème persiste</li>
                </ul>
              </div>

              {/* Message final */}
              <div className="text-center">
                <p className="text-gray-500 text-sm">
                  Tu peux fermer cette page et retourner sur l'application mobile
                </p>
              </div>
            </>
          )}
        </div>

        {/* Instruction supplémentaire */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            💡 Retourne sur l'app mobile pour continuer
          </p>
        </div>
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

