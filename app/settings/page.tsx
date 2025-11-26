'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DibsLogo from '@/components/DibsLogo'
import StatusBar from '@/components/StatusBar'
import BottomNav from '@/components/BottomNav'
import { supabase } from '@/lib/supabase'

export default function SettingsPage() {
  const router = useRouter()
  const [resetting, setResetting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleResetData = async () => {
    if (!showConfirm) {
      setShowConfirm(true)
      return
    }

    setResetting(true)
    try {
      console.log('🔄 Réinitialisation des données...')
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('❌ Erreur: utilisateur non connecté')
        return
      }

      const response = await fetch('/api/reset-user-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: user.id })
      })

      if (response.ok) {
        console.log('✅ Données réinitialisées avec succès')
        alert('✅ Toutes tes données ont été réinitialisées !\n\nTu vas être redirigé vers la page de connexion des plateformes.')
        router.push('/connect-platform')
      } else {
        throw new Error('Reset failed')
      }
    } catch (error) {
      console.error('❌ Erreur:', error)
      alert('❌ Erreur lors de la réinitialisation. Vérifie la console.')
    } finally {
      setResetting(false)
      setShowConfirm(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <StatusBar />

      {/* Header */}
      <div className="px-6 py-4">
        <DibsLogo size="small" />
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-4">
        <h1 className="text-3xl font-bold mb-6">Paramètres</h1>

        {/* Danger Zone */}
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold text-red-700 mb-4">⚠️ Zone Dangereuse</h2>
          
          {/* Reset Data Button */}
          <div className="mb-4">
            <p className="text-sm text-red-600 mb-3">
              Réinitialise toutes tes données (artistes, connexions, scans, etc.)
            </p>
            <button
              onClick={handleResetData}
              disabled={resetting}
              className={`w-full py-3 rounded-xl font-bold transition-colors ${
                showConfirm
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              } disabled:opacity-50`}
            >
              {resetting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Réinitialisation...
                </span>
              ) : showConfirm ? (
                '⚠️ CONFIRMER LA RÉINITIALISATION'
              ) : (
                '🔄 Réinitialiser mes données'
              )}
            </button>
            {showConfirm && (
              <button
                onClick={() => setShowConfirm(false)}
                className="w-full mt-2 py-2 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Annuler
              </button>
            )}
          </div>

          {/* Logout Button */}
          <div>
            <p className="text-sm text-red-600 mb-3">
              Déconnexion de ton compte
            </p>
            <button
              onClick={handleLogout}
              className="w-full bg-gray-600 text-white py-3 rounded-xl font-bold hover:bg-gray-700 transition-colors"
            >
              🚪 Se déconnecter
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 mb-6">
          <h3 className="font-bold text-blue-900 mb-2">ℹ️ Information</h3>
          <p className="text-sm text-blue-700">
            Cette page est utile pour faire des démos ou pour recommencer à zéro. 
            <br /><br />
            Toutes les suppressions sont irréversibles.
          </p>
        </div>

        {/* API Documentation */}
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 mb-6">
          <h3 className="font-bold text-green-900 mb-2">📚 Documentation API Backend</h3>
          <p className="text-sm text-green-700 mb-4">
            Accède à la documentation interactive des endpoints backend avec Swagger UI. Tu peux tester tous les endpoints directement depuis ton navigateur.
          </p>
          <button
            onClick={() => window.open('/api-docs', '_blank')}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors"
          >
            📖 Ouvrir la documentation API Backend
          </button>
        </div>

        {/* API Mobile Documentation */}
        <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-6">
          <h3 className="font-bold text-purple-900 mb-2">📱 Documentation API Mobile</h3>
          <p className="text-sm text-purple-700 mb-4">
            Documentation séparée et complète pour l'application mobile avec 21 endpoints prêts à l'emploi. Tous les appels nécessitent une authentification JWT.
          </p>
          <button
            onClick={() => window.open('/api-docs-mobile', '_blank')}
            className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors"
          >
            📱 Ouvrir la documentation API Mobile
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

