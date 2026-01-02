'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DibsLogo from '@/components/DibsLogo'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password,
          display_name: displayName || undefined
        })
      })

      const data = await response.json()

      if (data.success) {
        // Rediriger vers la page de résultat avec succès
        router.push(`/register-result?success=true&email=${encodeURIComponent(email)}`)
      } else {
        // Rediriger vers la page de résultat avec erreur
        router.push(`/register-result?success=false&error=${encodeURIComponent(data.error || 'Erreur inconnue')}`)
      }
    } catch (error: any) {
      // En cas d'erreur réseau
      router.push(`/register-result?success=false&error=${encodeURIComponent('Erreur de connexion au serveur')}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <DibsLogo size="normal" />
          </div>

          {/* Titre */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            Créer un compte
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Inscris-toi pour rejoindre DIBS
          </p>

          {/* Formulaire */}
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="email@exemple.com"
                required
                disabled={loading}
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="••••••••"
                required
                disabled={loading}
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum 6 caractères
              </p>
            </div>

            {/* Nom d'affichage (optionnel) */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                Nom d'affichage <span className="text-gray-400">(optionnel)</span>
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="John Doe"
                disabled={loading}
              />
            </div>

            {/* Bouton submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Inscription en cours...
                </>
              ) : (
                'S\'inscrire'
              )}
            </button>
          </form>

          {/* Note */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              En t'inscrivant, tu acceptes nos conditions d'utilisation et notre politique de confidentialité
            </p>
          </div>
        </div>

        {/* Message app mobile */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            💡 Retourne sur l'app mobile après inscription
          </p>
        </div>
      </div>
    </div>
  )
}

