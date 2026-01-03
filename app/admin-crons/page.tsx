'use client'

import { useState, useEffect } from 'react'
import DibsLogo from '@/components/DibsLogo'

export default function AdminCronsPage() {
  const [cronSecret, setCronSecret] = useState('')
  const [concertResult, setConcertResult] = useState<any>(null)
  const [cleanupResult, setCleanupResult] = useState<any>(null)
  const [loadingConcert, setLoadingConcert] = useState(false)
  const [loadingCleanup, setLoadingCleanup] = useState(false)
  
  // Cache management
  const [cacheStats, setCacheStats] = useState<any>(null)
  const [cacheResult, setCacheResult] = useState<any>(null)
  const [loadingCache, setLoadingCache] = useState(false)
  const [clearUserId, setClearUserId] = useState('')
  
  // Sections visibility
  const [showCrons, setShowCrons] = useState(true)
  const [showCache, setShowCache] = useState(false)

  // Charger le secret depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dibs_cron_secret')
    if (saved) setCronSecret(saved)
    
    // Charger stats du cache au démarrage
    loadCacheStats()
  }, [])

  // Sauvegarder le secret dans localStorage
  useEffect(() => {
    if (cronSecret) {
      localStorage.setItem('dibs_cron_secret', cronSecret)
    }
  }, [cronSecret])

  // Charger stats du cache
  const loadCacheStats = async () => {
    setLoadingCache(true)
    try {
      const res = await fetch('/api/cache/stats')
      const data = await res.json()
      setCacheStats(data.data || null)
    } catch (error) {
      setCacheStats(null)
    } finally {
      setLoadingCache(false)
    }
  }

  // Vider le cache
  const clearCache = async (userId?: string) => {
    setLoadingCache(true)
    setCacheResult(null)
    
    try {
      const url = userId 
        ? `/api/cache/clear?user_id=${userId}` 
        : '/api/cache/clear?all=true'
      
      const res = await fetch(url, { method: 'POST' })
      const data = await res.json()
      
      setCacheResult({ status: res.status, data })
      
      // Recharger les stats
      if (res.ok) {
        await loadCacheStats()
      }
    } catch (error: any) {
      setCacheResult({ error: error.message })
    } finally {
      setLoadingCache(false)
    }
  }

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
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <DibsLogo size="small" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">🔧 Administration DIBS</h1>
                <p className="text-gray-600 mt-1">Gestion des crons, cache et monitoring</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadCacheStats}
                disabled={loadingCache}
                className="px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50"
              >
                {loadingCache ? '⏳' : '🔄'} Refresh stats
              </button>
              <a
                href="/api-docs-mobile"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ← Retour à la doc
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Dashboard KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cache Artistes</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {cacheStats?.totalEntries || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">entrées actives</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Hits:</span>
                <span className="font-semibold text-green-600">{cacheStats?.hits || 0}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Misses:</span>
                <span className="font-semibold text-orange-600">{cacheStats?.misses || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Crons Vercel</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  2
                </p>
                <p className="text-xs text-gray-500 mt-1">tâches actives</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">⏰</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Concerts:</span>
                <span className="font-semibold">6h quotidien</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Cleanup:</span>
                <span className="font-semibold">Dim. 3h</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">API Ticketmaster</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  5000
                </p>
                <p className="text-xs text-gray-500 mt-1">appels/jour max</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🎫</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Optimisé:</span>
                <span className="font-semibold text-green-600">~150/jour</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Scope:</span>
                <span className="font-semibold">France 🇫🇷</span>
              </div>
            </div>
          </div>
        </div>

        {/* CRON Secret Input */}
        <div className="bg-white rounded-lg shadow-md p-6">
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
              💡 Le secret est sauvegardé localement. Il se trouve dans <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code> → <code className="bg-gray-100 px-2 py-1 rounded">CRON_SECRET</code>
            </p>
          </div>
        </div>

        {/* Section: Crons */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <button
            onClick={() => setShowCrons(!showCrons)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">⏰</span>
              <div className="text-left">
                <h2 className="text-xl font-bold text-gray-900">Tâches Programmées (Crons)</h2>
                <p className="text-sm text-gray-600">Synchronisation concerts et nettoyage automatique</p>
              </div>
            </div>
            <span className="text-gray-400">{showCrons ? '▲' : '▼'}</span>
          </button>
          
          {showCrons && (
            <div className="p-6 border-t border-gray-200">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Cron 1: Concerts + Notifications */}
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">🎵</span>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Sync Concerts + Notifications</h3>
                      <p className="text-xs text-gray-600">Ticketmaster → BDD → Notifications</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center text-gray-700">
                      <span className="font-medium mr-2">📅 Planification:</span>
                      <code className="bg-white px-2 py-1 rounded text-xs border">0 6 * * *</code>
                      <span className="ml-2 text-xs">(6h)</span>
                    </div>
                    <div className="bg-white rounded p-3 text-xs text-gray-600">
                      <div className="font-medium mb-1">Étapes:</div>
                      <ol className="list-decimal list-inside space-y-0.5">
                        <li>Artistes uniques suivis</li>
                        <li>Fetch Ticketmaster (FR, 6 mois)</li>
                        <li>Upsert table concerts</li>
                        <li>Génère notifications (GPS matching)</li>
                      </ol>
                    </div>
                  </div>

                  <button
                    onClick={runConcertCron}
                    disabled={!cronSecret || loadingConcert}
                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  >
                    {loadingConcert ? '⏳ Exécution...' : '▶️ Lancer maintenant'}
                  </button>

                  {/* Résultats */}
                  {concertResult && (
                    <div className={`mt-4 p-4 rounded-lg ${
                      concertResult.error || concertResult.status >= 400 
                        ? 'bg-red-50 border-2 border-red-300' 
                        : 'bg-white border-2 border-green-300'
                    }`}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">
                          {concertResult.error || concertResult.status >= 400 ? '❌' : '✅'}
                        </span>
                        <span className="font-bold text-gray-900">
                          {concertResult.error ? 'Erreur' : 'Succès'}
                        </span>
                      </div>
                      
                      {concertResult.data?.success && (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-purple-50 rounded p-2 text-center">
                            <div className="text-gray-600">Concerts</div>
                            <div className="text-xl font-bold text-purple-600">
                              {concertResult.data.stats?.concerts_synced || 0}
                            </div>
                          </div>
                          <div className="bg-blue-50 rounded p-2 text-center">
                            <div className="text-gray-600">API calls</div>
                            <div className="text-xl font-bold text-blue-600">
                              {concertResult.data.stats?.ticketmaster_api_calls || 0}
                            </div>
                          </div>
                          <div className="bg-green-50 rounded p-2 text-center">
                            <div className="text-gray-600">Notifs</div>
                            <div className="text-xl font-bold text-green-600">
                              {concertResult.data.stats?.notifications_created || 0}
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded p-2 text-center">
                            <div className="text-gray-600">Durée</div>
                            <div className="text-xl font-bold text-gray-700">
                              {concertResult.data.stats?.duration_seconds?.toFixed(1) || 0}s
                            </div>
                          </div>
                        </div>
                      )}

                      {(concertResult.error || concertResult.data?.error) && (
                        <p className="text-sm text-red-700 mt-2 font-medium">
                          {concertResult.error || concertResult.data?.error}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Cron 2: Cleanup */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-6 border border-orange-200">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">🧹</span>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Nettoyage Auto</h3>
                      <p className="text-xs text-gray-600">Supprime données obsolètes</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center text-gray-700">
                      <span className="font-medium mr-2">📅 Planification:</span>
                      <code className="bg-white px-2 py-1 rounded text-xs border">0 3 * * 0</code>
                      <span className="ml-2 text-xs">(Dim. 3h)</span>
                    </div>
                    <div className="bg-white rounded p-3 text-xs text-gray-600">
                      <div className="font-medium mb-1">Supprime:</div>
                      <ul className="list-disc list-inside space-y-0.5">
                        <li>Notifs lues passées (&gt;30j)</li>
                        <li>Notifs non lues passées (&gt;7j)</li>
                        <li>Concerts passés (&gt;7j)</li>
                        <li>Concerts non sync (&gt;30j)</li>
                      </ul>
                    </div>
                  </div>

                  <button
                    onClick={runCleanupCron}
                    disabled={!cronSecret || loadingCleanup}
                    className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  >
                    {loadingCleanup ? '⏳ Exécution...' : '🗑️ Lancer maintenant'}
                  </button>

                  {/* Résultats */}
                  {cleanupResult && (
                    <div className={`mt-4 p-4 rounded-lg ${
                      cleanupResult.error || cleanupResult.status >= 400 
                        ? 'bg-red-50 border-2 border-red-300' 
                        : 'bg-white border-2 border-green-300'
                    }`}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">
                          {cleanupResult.error || cleanupResult.status >= 400 ? '❌' : '✅'}
                        </span>
                        <span className="font-bold text-gray-900">
                          {cleanupResult.error ? 'Erreur' : 'Succès'}
                        </span>
                      </div>
                      
                      {cleanupResult.data?.success && (
                        <div className="space-y-2 text-xs">
                          <div className="bg-orange-50 rounded p-2">
                            <div className="font-semibold text-gray-700 mb-1">📬 Notifications</div>
                            <div className="flex justify-between">
                              <span>Total supprimé:</span>
                              <span className="font-bold text-red-600">
                                {cleanupResult.data.stats?.notifications?.total_deleted || 0}
                              </span>
                            </div>
                          </div>
                          <div className="bg-red-50 rounded p-2">
                            <div className="font-semibold text-gray-700 mb-1">🎫 Concerts</div>
                            <div className="flex justify-between">
                              <span>Total supprimé:</span>
                              <span className="font-bold text-red-600">
                                {cleanupResult.data.stats?.concerts?.total_deleted || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {(cleanupResult.error || cleanupResult.data?.error) && (
                        <p className="text-sm text-red-700 mt-2 font-medium">
                          {cleanupResult.error || cleanupResult.data?.error}
                        </p>
                      )}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Section: Cache Management */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <button
            onClick={() => setShowCache(!showCache)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📦</span>
              <div className="text-left">
                <h2 className="text-xl font-bold text-gray-900">Gestion du Cache</h2>
                <p className="text-sm text-gray-600">Cache in-memory des artistes (TTL: 3h)</p>
              </div>
            </div>
            <span className="text-gray-400">{showCache ? '▲' : '▼'}</span>
          </button>
          
          {showCache && (
            <div className="p-6 border-t border-gray-200 space-y-4">
              
              {/* Stats du cache */}
              {cacheStats && (
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
                  <h3 className="font-bold text-gray-900 mb-4">📊 Statistiques du Cache</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="text-sm text-gray-600">Entrées</div>
                      <div className="text-2xl font-bold text-purple-600">{cacheStats.totalEntries}</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="text-sm text-gray-600">Hits</div>
                      <div className="text-2xl font-bold text-green-600">{cacheStats.hits}</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="text-sm text-gray-600">Misses</div>
                      <div className="text-2xl font-bold text-orange-600">{cacheStats.misses}</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="text-sm text-gray-600">Stale Hits</div>
                      <div className="text-2xl font-bold text-red-600">{cacheStats.staleHits}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions cache */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">🗑️ Vider tout le cache</h4>
                  <p className="text-xs text-gray-600 mb-3">
                    Supprime toutes les entrées de cache pour tous les utilisateurs
                  </p>
                  <button
                    onClick={() => clearCache()}
                    disabled={loadingCache}
                    className="w-full px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {loadingCache ? '⏳ Traitement...' : '🗑️ Vider tout'}
                  </button>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">👤 Vider cache user spécifique</h4>
                  <input
                    type="text"
                    placeholder="User ID (UUID)"
                    value={clearUserId}
                    onChange={(e) => setClearUserId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
                  />
                  <button
                    onClick={() => clearUserId && clearCache(clearUserId)}
                    disabled={loadingCache || !clearUserId}
                    className="w-full px-4 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                  >
                    {loadingCache ? '⏳ Traitement...' : '🗑️ Vider ce user'}
                  </button>
                </div>
              </div>

              {/* Résultat cache */}
              {cacheResult && (
                <div className={`p-4 rounded-lg ${
                  cacheResult.error || cacheResult.status >= 400
                    ? 'bg-red-50 border-2 border-red-300'
                    : 'bg-green-50 border-2 border-green-300'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">
                      {cacheResult.error || cacheResult.status >= 400 ? '❌' : '✅'}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {cacheResult.data?.message || cacheResult.error || 'Opération effectuée'}
                    </span>
                  </div>
                  {cacheResult.data?.entriesCleared && (
                    <p className="text-sm text-gray-700">
                      {cacheResult.data.entriesCleared} entrée(s) supprimée(s)
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info Footer */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">Informations système</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                <div>
                  <div className="font-medium text-gray-900 mb-1">🚀 Déploiement</div>
                  <ul className="space-y-1 text-xs">
                    <li>• Crons planifiés via <code className="bg-white px-1 rounded">vercel.json</code></li>
                    <li>• CRON_SECRET dans variables Vercel</li>
                    <li>• Force dynamic rendering (Next.js)</li>
                  </ul>
                </div>
                <div>
                  <div className="font-medium text-gray-900 mb-1">🎫 API Ticketmaster</div>
                  <ul className="space-y-1 text-xs">
                    <li>• Limite : 5000 appels/jour</li>
                    <li>• Optimisé : ~150 appels/jour réels</li>
                    <li>• France uniquement (countryCode: FR)</li>
                    <li>• Concerts 6 mois à l'avance</li>
                  </ul>
                </div>
                <div>
                  <div className="font-medium text-gray-900 mb-1">📦 Cache Artistes</div>
                  <ul className="space-y-1 text-xs">
                    <li>• TTL : 3 heures par user</li>
                    <li>• In-memory (RAM serveur)</li>
                    <li>• Fallback si Spotify inaccessible</li>
                    <li>• Invalidation auto sur sync</li>
                  </ul>
                </div>
                <div>
                  <div className="font-medium text-gray-900 mb-1">🔄 Synchronisation</div>
                  <ul className="space-y-1 text-xs">
                    <li>• Concerts : quotidien 6h (si &gt;24h)</li>
                    <li>• Cleanup : hebdo dimanche 3h</li>
                    <li>• Upsert = pas de doublons</li>
                    <li>• GPS matching pour notifications</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
