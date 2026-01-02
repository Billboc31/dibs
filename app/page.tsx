'use client'

import DibsLogo from '@/components/DibsLogo'

export default function HomePage() {

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

          {/* Message final */}
          <div className="text-center">
            <p className="text-gray-500 text-lg">
              Merci de votre intérêt pour DIBS ! 🎉
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
