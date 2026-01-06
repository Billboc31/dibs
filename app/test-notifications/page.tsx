'use client'

import { useState } from 'react'
import DibsLogo from '@/components/DibsLogo'

export default function TestNotificationsPage() {
  const [token, setToken] = useState('')
  const [debugResult, setDebugResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runDebug = async () => {
    if (!token) {
      alert('❌ Veuillez entrer un token d\'authentification')
      return
    }

    setLoading(true)
    setDebugResult(null)

    try {
      const response = await fetch('/api/debug/notifications', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      setDebugResult({ status: response.status, data })
    } catch (error: any) {
      setDebugResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <DibsLogo size="small" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🔍 Debug Notifications</h1>
              <p className="text-gray-600">Diagnostique pourquoi un user ne reçoit pas de notifications</p>
            </div>
          </div>

          {/* Input token */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token d'authentification (Bearer token du user)
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Tu peux le récupérer depuis l'app mobile (localStorage) ou depuis Supabase Auth
              </p>
            </div>

            <button
              onClick={runDebug}
              disabled={loading || !token}
              className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '⏳ Analyse en cours...' : '🔍 Analyser'}
            </button>
          </div>
        </div>

        {/* Résultats */}
        {debugResult && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Résultats</h2>

            {debugResult.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-semibold">❌ Erreur</p>
                <p className="text-red-700 text-sm mt-1">{debugResult.error}</p>
              </div>
            )}

            {debugResult.data && (
              <div className="space-y-4">
                {/* Summary */}
                {debugResult.data.summary && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-bold text-blue-900 mb-2">🎯 Résumé</h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Localisation:</span> {debugResult.data.summary.has_location ? '✅' : '❌'}</p>
                      <p><span className="font-medium">Artistes suivis:</span> {debugResult.data.summary.followed_artists}</p>
                      <p><span className="font-medium">Concerts trouvés:</span> {debugResult.data.summary.total_concerts}</p>
                      <p><span className="font-medium">Concerts dans le rayon:</span> {debugResult.data.summary.concerts_in_radius}</p>
                      <p><span className="font-medium">Notifications existantes:</span> {debugResult.data.summary.existing_notifications}</p>
                      <p className="pt-2 border-t border-blue-300">
                        <span className="font-bold">Verdict:</span>{' '}
                        <span className={debugResult.data.summary.should_have_notifications.startsWith('OUI') ? 'text-green-600' : 'text-orange-600'}>
                          {debugResult.data.summary.should_have_notifications}
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Problem */}
                {debugResult.data.problem && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-900 font-semibold">⚠️ Problème identifié</p>
                    <p className="text-yellow-800 text-sm mt-1">{debugResult.data.problem}</p>
                  </div>
                )}

                {/* Debug complet */}
                <details className="border border-gray-200 rounded-lg">
                  <summary className="px-4 py-3 cursor-pointer hover:bg-gray-50 font-medium text-gray-700">
                    🔧 Détails complets (JSON)
                  </summary>
                  <pre className="p-4 bg-gray-50 text-xs overflow-auto max-h-96">
                    {JSON.stringify(debugResult.data, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        )}

        {/* Info */}
        <div className="mt-6 text-center">
          <a
            href="/admin-crons"
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            ← Retour à l'admin
          </a>
        </div>
      </div>
    </div>
  )
}

