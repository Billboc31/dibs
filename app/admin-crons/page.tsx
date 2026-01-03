'use client'

import { useState } from 'react'
import DibsLogo from '@/components/DibsLogo'

export default function AdminCronsPage() {
  const [cronSecret, setCronSecret] = useState('')
  const [concertResult, setConcertResult] = useState<any>(null)
  const [cleanupResult, setCleanupResult] = useState<any>(null)
  const [loadingConcert, setLoadingConcert] = useState(false)
  const [loadingCleanup, setLoadingCleanup] = useState(false)

  // Lancer le cron de synchronisation concerts + notifications
  const runConcertCron = async () => {
    if (!cronSecret) {
      alert('❌ Veuillez entrer le CRON_SECRET')
      return
    }

    setLoadingConcert(true)
    setConcertResult(null)

    try {
      const response = await fetch('/api/cron/concert-notifications', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cronSecret}`
        }
      })

      const data = await response.json()
      setConcertResult({ status: response.status, data })
    } catch (error: any) {
      setConcertResult({ error: error.message })
    } finally {
      setLoadingConcert(false)
    }
  }

  // Lancer le cron de nettoyage
  const runCleanupCron = async () => {
    if (!cronSecret) {
      alert('❌ Veuillez entrer le CRON_SECRET')
      return
    }

    setLoadingCleanup(true)
    setCleanupResult(null)

    try {
      const response = await fetch('/api/cron/clean-notifications', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cronSecret}`
        }
      })

      const data = await response.json()
      setCleanupResult({ status: response.status, data })
    } catch (error: any) {
      setCleanupResult({ error: error.message })
    } finally {
      setLoadingCleanup(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <DibsLogo size="small" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Crons</h1>
                <p className="text-gray-600 mt-1">Gestion manuelle des tâches programmées</p>
              </div>
            </div>
            <a
              href="/api-docs-mobile"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ← Retour à la doc
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* CRON Secret Input */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🔐 Authentification</h2>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              CRON_SECRET
            </label>
            <input
              type="password"
              value={cronSecret}
              onChange={(e) => setCronSecret(e.target.value)}
              placeholder="Entrer le CRON_SECRET depuis .env.local"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500">
              💡 Le secret se trouve dans <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code> → <code className="bg-gray-100 px-2 py-1 rounded">CRON_SECRET</code>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Cron 1: Concerts + Notifications */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🎵</span>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Sync Concerts + Notifications</h2>
                <p className="text-sm text-gray-600">Synchronise les concerts depuis Ticketmaster et génère les notifications</p>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-medium mr-2">Planification:</span>
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">0 6 * * *</code>
                <span className="ml-2">(tous les jours à 6h)</span>
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Étapes:</span>
                <ol className="list-decimal list-inside ml-4 mt-1 space-y-1">
                  <li>Récupère les artistes uniques suivis</li>
                  <li>Sync concerts depuis Ticketmaster (France, 6 mois)</li>
                  <li>Upsert dans table <code className="bg-gray-100 px-1 rounded">concerts</code></li>
                  <li>Génère notifications pour users à proximité</li>
                </ol>
              </div>
            </div>

            <button
              onClick={runConcertCron}
              disabled={!cronSecret || loadingConcert}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingConcert ? '⏳ Exécution en cours...' : '▶️ Lancer maintenant'}
            </button>

            {/* Résultats */}
            {concertResult && (
              <div className={`mt-4 p-4 rounded-lg ${
                concertResult.error || concertResult.status >= 400 
                  ? 'bg-red-50 border border-red-200' 
                  : 'bg-green-50 border border-green-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">
                    {concertResult.error || concertResult.status >= 400 ? '❌' : '✅'}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {concertResult.error ? 'Erreur' : `Status: ${concertResult.status}`}
                  </span>
                </div>
                
                {concertResult.data?.success && (
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white rounded p-2">
                        <div className="text-gray-600">Concerts synchro</div>
                        <div className="text-2xl font-bold text-purple-600">
                          {concertResult.data.stats?.concerts_synced || 0}
                        </div>
                      </div>
                      <div className="bg-white rounded p-2">
                        <div className="text-gray-600">API calls</div>
                        <div className="text-2xl font-bold text-blue-600">
                          {concertResult.data.stats?.ticketmaster_api_calls || 0}
                        </div>
                      </div>
                      <div className="bg-white rounded p-2">
                        <div className="text-gray-600">Notifications créées</div>
                        <div className="text-2xl font-bold text-green-600">
                          {concertResult.data.stats?.notifications_created || 0}
                        </div>
                      </div>
                      <div className="bg-white rounded p-2">
                        <div className="text-gray-600">Durée</div>
                        <div className="text-2xl font-bold text-gray-700">
                          {concertResult.data.stats?.duration_seconds?.toFixed(1) || 0}s
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {concertResult.error && (
                  <p className="text-sm text-red-700 mt-2">{concertResult.error}</p>
                )}

                {concertResult.data?.error && (
                  <p className="text-sm text-red-700 mt-2">{concertResult.data.error}</p>
                )}
              </div>
            )}
          </div>

          {/* Cron 2: Cleanup */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🧹</span>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Nettoyage</h2>
                <p className="text-sm text-gray-600">Supprime les anciennes notifications et concerts passés</p>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-medium mr-2">Planification:</span>
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">0 3 * * 0</code>
                <span className="ml-2">(dimanches à 3h)</span>
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Actions:</span>
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li>Notifications lues + passées (>30j)</li>
                  <li>Notifications non lues + passées (>7j)</li>
                  <li>Concerts passés (>7j)</li>
                  <li>Concerts obsolètes (non synchro >30j)</li>
                </ul>
              </div>
            </div>

            <button
              onClick={runCleanupCron}
              disabled={!cronSecret || loadingCleanup}
              className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingCleanup ? '⏳ Exécution en cours...' : '🗑️ Lancer maintenant'}
            </button>

            {/* Résultats */}
            {cleanupResult && (
              <div className={`mt-4 p-4 rounded-lg ${
                cleanupResult.error || cleanupResult.status >= 400 
                  ? 'bg-red-50 border border-red-200' 
                  : 'bg-green-50 border border-green-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">
                    {cleanupResult.error || cleanupResult.status >= 400 ? '❌' : '✅'}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {cleanupResult.error ? 'Erreur' : `Status: ${cleanupResult.status}`}
                  </span>
                </div>
                
                {cleanupResult.data?.success && (
                  <div className="space-y-2 text-sm">
                    <div className="bg-white rounded p-3">
                      <div className="font-semibold text-gray-700 mb-2">📬 Notifications</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>Lues anciennes: <span className="font-bold">{cleanupResult.data.stats?.notifications?.old_read_deleted || 0}</span></div>
                        <div>Non lues: <span className="font-bold">{cleanupResult.data.stats?.notifications?.old_unread_deleted || 0}</span></div>
                        <div className="col-span-2 mt-1 pt-2 border-t">
                          Total: <span className="font-bold text-red-600">{cleanupResult.data.stats?.notifications?.total_deleted || 0}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded p-3">
                      <div className="font-semibold text-gray-700 mb-2">🎫 Concerts</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>Passés: <span className="font-bold">{cleanupResult.data.stats?.concerts?.past_concerts_deleted || 0}</span></div>
                        <div>Obsolètes: <span className="font-bold">{cleanupResult.data.stats?.concerts?.stale_concerts_deleted || 0}</span></div>
                        <div className="col-span-2 mt-1 pt-2 border-t">
                          Total: <span className="font-bold text-red-600">{cleanupResult.data.stats?.concerts?.total_deleted || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {cleanupResult.error && (
                  <p className="text-sm text-red-700 mt-2">{cleanupResult.error}</p>
                )}

                {cleanupResult.data?.error && (
                  <p className="text-sm text-red-700 mt-2">{cleanupResult.data.error}</p>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Informations importantes</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Les crons sont planifiés sur Vercel via <code className="bg-blue-100 px-1 rounded">vercel.json</code></li>
                <li>• Cette page permet de les tester manuellement sans attendre</li>
                <li>• Le CRON_SECRET est également configuré dans les variables d'environnement Vercel</li>
                <li>• Les concerts sont limités à la France (<code className="bg-blue-100 px-1 rounded">countryCode: FR</code>) pour optimiser les appels API</li>
                <li>• Limite Ticketmaster : 5000 appels/jour (largement suffisant avec le cache)</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

