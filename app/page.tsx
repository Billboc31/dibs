'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DibsLogo from '@/components/DibsLogo'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirection automatique après 3 secondes
    const timer = setTimeout(() => {
      router.push('/api-docs-mobile')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Card principale */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center border border-gray-100">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <DibsLogo size="large" />
          </div>

          {/* Icône */}
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-5xl">📱</span>
            </div>
          </div>

          {/* Titre */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Interface Web Désactivée
          </h1>

          {/* Message */}
          <p className="text-lg text-gray-600 mb-6">
            Le frontend de test n'est plus accessible. DIBS est maintenant une application 100% mobile.
          </p>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6 text-left">
            <h3 className="font-semibold text-blue-900 mb-3 text-center">📱 Comment utiliser DIBS :</h3>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-start gap-2">
                <span className="mt-1">1️⃣</span>
                <span>Télécharge l'application mobile DIBS</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1">2️⃣</span>
                <span>Connecte-toi avec ton compte</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1">3️⃣</span>
                <span>Profite de toutes les fonctionnalités !</span>
              </li>
            </ul>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-gray-50 text-gray-700 px-4 py-2 rounded-full mb-6 border border-gray-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="font-medium">Documentation API disponible</span>
          </div>

          {/* Boutons */}
          <div className="space-y-3">
            <button
              onClick={() => router.push('/api-docs-mobile')}
              className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-all transform hover:scale-105 active:scale-95"
            >
              📚 Consulter la documentation API
            </button>
            
            <p className="text-sm text-gray-400">
              Redirection automatique dans 3 secondes...
            </p>
          </div>
        </div>

        {/* Note développeur */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            💻 Développeurs : Accédez à la <a href="/api-docs-mobile" className="underline hover:text-gray-700">documentation API complète</a>
          </p>
        </div>
      </div>
    </div>
  )
}
