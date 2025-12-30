'use client'

import { useEffect, useState } from 'react'

interface Endpoint {
  method: string
  path: string
  tag: string
  summary: string
  description?: string
  priority: string
  auth: boolean
  requestBodyExample?: any
  responseExample?: any
}

export default function ApiDocsMobilePage() {
  const [spec, setSpec] = useState<any>(null)
  const [selectedTag, setSelectedTag] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null)
  const [testingEndpoint, setTestingEndpoint] = useState<string | null>(null)
  const [testToken, setTestToken] = useState('')
  const [testBody, setTestBody] = useState('{}')
  const [queryParams, setQueryParams] = useState<Record<string, string>>({})
  const [testEmail, setTestEmail] = useState('')
  const [testResult, setTestResult] = useState<any>(null)
  const [testLoading, setTestLoading] = useState(false)
  const [showOAuthDocs, setShowOAuthDocs] = useState(false)
  const [headerCollapsed, setHeaderCollapsed] = useState(false)
  
  // États pour le WebSocket Magic Link
  const [wsEmail, setWsEmail] = useState('')
  const [wsMessages, setWsMessages] = useState<Array<{timestamp: string, message: string, type?: string, data?: any}>>([])
  const [wsConnected, setWsConnected] = useState(false)
  
  // États pour le système de paiement
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState('')
  const [paymentUrl, setPaymentUrl] = useState('')
  const [customAmount, setCustomAmount] = useState('')
  const [paymentMessages, setPaymentMessages] = useState<Array<{timestamp: string, message: string}>>([])
  const [paymentEventSource, setPaymentEventSource] = useState<EventSource | null>(null)

  useEffect(() => {
    fetch('/api/docs-mobile')
      .then(res => res.json())
      .then(data => setSpec(data))

    // Charger le token depuis localStorage
    const savedToken = localStorage.getItem('dibs_test_token')
    if (savedToken) {
      setTestToken(savedToken)
    }

    // Override mobile-container styles for full-width
    const mobileContainer = document.querySelector('.mobile-container') as HTMLElement
    if (mobileContainer) {
      mobileContainer.style.maxWidth = '100%'
      mobileContainer.style.margin = '0'
      mobileContainer.style.boxShadow = 'none'
    }

    return () => {
      // Cleanup
      if (paymentEventSource) {
        paymentEventSource.close()
      }
    }
  }, [])

  // Charger le solde du wallet
  const refreshWalletBalance = async () => {
    if (!testToken) return
    
    try {
      const response = await fetch(`${spec?.servers?.[0]?.url || ''}/api/wallet/balance`, {
        headers: {
          'Authorization': `Bearer ${testToken}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setWalletBalance(data.data?.balance_cents || 0)
      }
    } catch (error) {
      console.error('Erreur récupération solde:', error)
    }
  }

  // Tester un paiement
  const testPayment = async (amountCents: number) => {
    if (!testToken || paymentLoading) return
    
    setPaymentLoading(true)
    setPaymentStatus('🔄 Création de la session de paiement...')
    setPaymentMessages([])
    
    try {
      // 1. Créer session de paiement
      const sessionResponse = await fetch(`${spec?.servers?.[0]?.url || ''}/api/payment/create-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount: amountCents })
      })
      
      if (!sessionResponse.ok) {
        throw new Error('Erreur création session')
      }
      
      const sessionData = await sessionResponse.json()
      const { session_id, checkout_url } = sessionData.data
      
      setPaymentStatus('✅ Session créée ! Écoute du WebSocket...')
      setPaymentUrl(checkout_url)
      
      // 2. Écouter le WebSocket
      const eventSource = new EventSource(
        `${spec?.servers?.[0]?.url || ''}/api/payment/ws?session_id=${session_id}&email=${testEmail || 'test@example.com'}`
      )
      
      setPaymentEventSource(eventSource)
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data)
        const timestamp = new Date().toLocaleTimeString()
        
        setPaymentMessages(prev => [...prev, {
          timestamp,
          message: `${data.type}: ${data.message}`
        }])
        
        switch (data.type) {
          case 'payment_connected':
            setPaymentStatus('🔌 WebSocket connecté, en attente du paiement...')
            break
          case 'payment_success':
            setPaymentStatus('✅ Paiement réussi !')
            setPaymentUrl('')
            refreshWalletBalance()
            eventSource.close()
            setPaymentLoading(false)
            break
          case 'payment_failed':
            setPaymentStatus('❌ Paiement échoué')
            setPaymentUrl('')
            eventSource.close()
            setPaymentLoading(false)
            break
          case 'payment_cancelled':
            setPaymentStatus('🚫 Paiement annulé')
            setPaymentUrl('')
            eventSource.close()
            setPaymentLoading(false)
            break
        }
      }
      
      eventSource.onerror = () => {
        setPaymentStatus('❌ Erreur WebSocket')
        setPaymentLoading(false)
      }
      
      // Timeout après 5 minutes
      setTimeout(() => {
        if (paymentLoading) {
          eventSource.close()
          setPaymentStatus('⏰ Timeout - Session expirée')
          setPaymentUrl('')
          setPaymentLoading(false)
        }
      }, 5 * 60 * 1000)
      
    } catch (error: any) {
      setPaymentStatus(`❌ Erreur: ${error.message}`)
      setPaymentLoading(false)
    }
  }

  // Charger le solde au chargement du token
  useEffect(() => {
    if (testToken) {
      refreshWalletBalance()
    }
  }, [testToken])

  const testWebSocket = (email: string) => {
    if (!email || wsConnected) return

    setWsConnected(true)
    setWsMessages([])

    console.log('🚀 Démarrage WebSocket pour:', email)
    
    const eventSource = new EventSource(`${spec?.servers?.[0]?.url || ''}/api/auth/ws-complete?email=${encodeURIComponent(email)}`)
    
    // Ajouter message de connexion
    setWsMessages([{
      timestamp: new Date().toLocaleTimeString(),
      message: '🔌 Connexion WebSocket en cours...',
      type: 'info',
      data: { email }
    }])
    
    eventSource.onopen = () => {
      console.log('✅ WebSocket ouvert')
      setWsMessages(prev => [...prev, {
        timestamp: new Date().toLocaleTimeString(),
        message: '✅ WebSocket connecté avec succès',
        type: 'success',
        data: {}
      }])
    }
    
    eventSource.onmessage = (event) => {
      console.log('📥 Message WebSocket reçu:', event.data)
      
      try {
        const data = JSON.parse(event.data)
        const timestamp = new Date().toLocaleTimeString()
        
        // Déterminer le type de message pour la couleur
        let messageType = 'info'
        if (data.status === 'error') messageType = 'error'
        else if (data.status === 'authenticated') messageType = 'success'
        else if (data.status === 'magic_link_sent') messageType = 'success'
        else if (data.status === 'timeout') messageType = 'warning'
        
        setWsMessages(prev => [...prev, {
          timestamp,
          message: `${data.status || 'message'}: ${data.message || 'Données reçues'}`,
          type: messageType,
          data: data
        }])

        // Fermer automatiquement sur certains statuts
        if (data.status === 'authenticated') {
          console.log('🎉 Authentification réussie, token reçu:', data.session?.access_token?.substring(0, 20) + '...')
          setTimeout(() => {
            eventSource.close()
            setWsConnected(false)
            setWsMessages(prev => [...prev, {
              timestamp: new Date().toLocaleTimeString(),
              message: '🔴 WebSocket fermé automatiquement (authentification réussie)',
              type: 'info',
              data: {}
            }])
          }, 2000)
        } else if (data.status === 'timeout' || data.status === 'error') {
          setTimeout(() => {
            eventSource.close()
            setWsConnected(false)
          }, 1000)
        }
      } catch (e) {
        console.error('❌ Erreur parsing JSON:', e)
        setWsMessages(prev => [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          message: `❌ Message non-JSON reçu: ${event.data}`,
          type: 'error',
          data: { raw: event.data }
        }])
      }
    }

    eventSource.onerror = (error) => {
      console.error('❌ Erreur WebSocket:', error)
      setWsConnected(false)
      setWsMessages(prev => [...prev, {
        timestamp: new Date().toLocaleTimeString(),
        message: '❌ Erreur de connexion WebSocket',
        type: 'error',
        data: { error }
      }])
    }

    // Timeout après 6 minutes (plus long que le serveur)
    const timeoutId = setTimeout(() => {
      if (wsConnected) {
        console.log('⏰ Timeout client WebSocket')
        eventSource.close()
        setWsConnected(false)
        setWsMessages(prev => [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          message: '⏰ Timeout client (6 minutes) - Connexion fermée',
          type: 'warning',
          data: {}
        }])
      }
    }, 6 * 60 * 1000)

    // Nettoyer le timeout si la connexion se ferme avant
    eventSource.addEventListener('close', () => {
      clearTimeout(timeoutId)
    })
  }

  const handleTokenChange = (value: string) => {
    setTestToken(value)
    localStorage.setItem('dibs_test_token', value)
  }

  const clearToken = () => {
    setTestToken('')
    localStorage.removeItem('dibs_test_token')
  }

  const setExampleToken = () => {
    const exampleToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzMzMDg2Mzk5LCJpYXQiOjE3MzMwODI3OTksImlzcyI6Imh0dHBzOi8vdWlrc2JoZ29qZ3Z5dGFwZWxidXEuc3VwYWJhc2UuY28vYXV0aC92MSIsInN1YiI6IjEyMzQ1Njc4LTEyMzQtMTIzNC0xMjM0LTEyMzQ1Njc4OTAxMiIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnt9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6Im90cCIsInRpbWVzdGFtcCI6MTczMzA4Mjc5OX1dLCJzZXNzaW9uX2lkIjoiMTIzNDU2NzgtMTIzNC0xMjM0LTEyMzQtMTIzNDU2Nzg5MDEyIn0.example_signature'
    handleTokenChange(exampleToken)
  }

  const testTokenValidity = async () => {
    if (!testToken) return

    try {
      const response = await fetch(`${spec?.servers?.[0]?.url || ''}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${testToken}`
        }
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        const userEmail = result.data?.user?.email || result.data?.email
        alert(`✅ Token valide !\nUtilisateur: ${userEmail || 'N/A'}`)
      } else {
        alert(`❌ Token invalide !\nErreur: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      alert(`❌ Erreur de test du token: ${error}`)
    }
  }

  const handleTestEndpoint = async (endpoint: Endpoint, queryParams?: Record<string, string>) => {
    setTestLoading(true)
    setTestResult(null)

    try {
      const baseUrl = spec?.servers?.[0]?.url || ''
      let url = `${baseUrl}${endpoint.path}`
      
      // Ajouter les paramètres de query s'ils sont fournis
      if (queryParams && Object.keys(queryParams).length > 0) {
        const params = new URLSearchParams()
        Object.entries(queryParams).forEach(([key, value]) => {
          if (value && value.trim() !== '') {
            params.append(key, value.trim())
          }
        })
        if (params.toString()) {
          url += `?${params.toString()}`
        }
      }
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }

      // Forcer l'ajout du token si la checkbox est cochée ou si l'endpoint nécessite une auth
      const forceToken = localStorage.getItem('dibs_force_token') === 'true'
      const shouldAddToken = endpoint.auth || forceToken

      if (shouldAddToken && testToken) {
        headers['Authorization'] = `Bearer ${testToken}`
      }

      // Validation côté client pour les endpoints authentifiés
      if (endpoint.auth && !testToken) {
        setTestResult({
          status: 400,
          statusText: 'Client Error',
          data: { 
            error: 'Token Bearer requis pour cet endpoint',
            auth_detected: endpoint.auth,
            token_present: false
          }
        })
        setTestLoading(false)
        return
      }

      const options: RequestInit = {
        method: endpoint.method,
        headers
      }

      if (endpoint.method !== 'GET' && endpoint.method !== 'DELETE') {
        options.body = testBody
      }

      console.log('🚀 Envoi requête:', {
        url,
        method: endpoint.method,
        headers,
        hasAuth: endpoint.auth,
        hasToken: !!testToken,
        forceToken,
        shouldAddToken
      })

      const response = await fetch(url, options)
      const data = await response.json()

      console.log('📥 Réponse reçue:', {
        status: response.status,
        ok: response.ok,
        data
      })

      setTestResult({
        status: response.status,
        statusText: response.ok ? 'Success' : 'Error',
        data,
        debug: {
          auth_detected: endpoint.auth,
          token_used: shouldAddToken ? (testToken ? 'Oui' : 'Non (manquant)') : 'Non (pas requis)',
          force_token: forceToken,
          headers_sent: headers
        }
      })
    } catch (error: any) {
      setTestResult({
        status: 0,
        statusText: 'Error',
        data: { error: error.message }
      })
    } finally {
      setTestLoading(false)
    }
  }

  if (!spec) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de la documentation...</p>
        </div>
      </div>
    )
  }

  // Extraire les endpoints de la spec
  const endpoints: Endpoint[] = []
  
  if (spec.paths) {
    Object.entries(spec.paths).forEach(([path, methods]: [string, any]) => {
      Object.entries(methods).forEach(([method, details]: [string, any]) => {
        if (details && typeof details === 'object') {
          const tag = details.tags?.[0] || 'Autres'
          const priority = tag === 'Authentification' ? 'P0' : 
                          tag === 'Utilisateur' || tag === 'Wallet' || tag === 'Paiement' ? 'P1' : 'P2'
          
          endpoints.push({
            method: method.toUpperCase(),
            path,
            tag,
            summary: details.summary || path,
            description: details.description || '',
            priority,
            auth: !!details.security?.length,
            requestBodyExample: details.requestBody?.content?.['application/json']?.examples,
            responseExample: details.responses?.['200']?.content?.['application/json']?.examples
          })
        }
      })
    })
  }

  // Filtrer les endpoints
  const filteredEndpoints = endpoints.filter(endpoint => {
    const matchesTag = selectedTag === 'all' || endpoint.tag === selectedTag
    const matchesSearch = endpoint.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         endpoint.summary.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTag && matchesSearch
  })

  // Obtenir les tags uniques
  const tags = Array.from(new Set(endpoints.map(e => e.tag)))

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P0': return 'bg-red-100 text-red-800'
      case 'P1': return 'bg-orange-100 text-orange-800'
      case 'P2': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800'
      case 'POST': return 'bg-blue-100 text-blue-800'
      case 'PUT': return 'bg-yellow-100 text-yellow-800'
      case 'PATCH': return 'bg-purple-100 text-purple-800'
      case 'DELETE': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">📱 API Mobile DIBS</h1>
              {!headerCollapsed && (
                <p className="text-gray-600">Documentation complète pour l'application mobile</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {!headerCollapsed && (
                <div className="text-sm text-gray-500">
                  Serveur: {spec.servers?.[0]?.url || 'N/A'}
                </div>
              )}
              <button
                onClick={() => setHeaderCollapsed(!headerCollapsed)}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm rounded-md transition-colors"
                title={headerCollapsed ? "Développer l'en-tête" : "Réduire l'en-tête"}
              >
                {headerCollapsed ? '▼ Développer' : '▲ Réduire'}
              </button>
            </div>
          </div>

          {/* Token Bearer Global - Version compacte si collapsed */}
          {headerCollapsed ? (
            <div className="bg-blue-50 p-2 rounded-lg">
              <div className="flex gap-2 items-center">
                <span className="text-xs text-blue-900 font-medium whitespace-nowrap">🔑 Token:</span>
                <input
                  type="text"
                  placeholder="Coller votre token Bearer ici..."
                  value={testToken}
                  onChange={(e) => handleTokenChange(e.target.value)}
                  className="flex-1 px-2 py-1 border rounded-md text-xs"
                />
                <button
                  onClick={testTokenValidity}
                  disabled={!testToken}
                  className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                >
                  🧪
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Token Bearer Global - Version complète */}
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-blue-900">🔑 Token Bearer Global</span>
                  <button
                    onClick={testTokenValidity}
                    disabled={!testToken}
                    className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    🧪 Tester
                  </button>
                </div>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Coller votre token Bearer ici..."
                    value={testToken}
                    onChange={(e) => handleTokenChange(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-md text-sm"
                  />
                  <button
                    onClick={setExampleToken}
                    className="px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                  >
                    Exemple
                  </button>
                  <button
                    onClick={clearToken}
                    className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                  >
                    Effacer
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="forceToken"
                    checked={localStorage.getItem('dibs_force_token') === 'true'}
                    onChange={(e) => {
                      localStorage.setItem('dibs_force_token', e.target.checked.toString())
                    }}
                    className="rounded"
                  />
                  <label htmlFor="forceToken" className="text-sm text-blue-800">
                    🔧 Forcer l'ajout du token à TOUS les endpoints
                  </label>
                </div>
              </div>

              {/* Information sur les révocations */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="font-semibold text-orange-800 mb-2">🚨 Gestion des tokens révoqués</h3>
                <div className="text-sm text-orange-700 space-y-2">
                  <p><strong>En mode développement</strong>, Spotify révoque fréquemment les tokens (max 25 utilisateurs).</p>
                  <p><strong>Si vous recevez :</strong> <code className="bg-orange-100 px-1 rounded">SPOTIFY_TOKEN_REVOKED</code></p>
                  <p><strong>Action :</strong> Reconnectez-vous à Spotify via <code>/connect-platform</code></p>
                  <p><strong>En production :</strong> Les révocations seront beaucoup plus rares.</p>
                </div>
              </div>

              {/* Filtres */}
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="🔍 Rechercher un endpoint..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="px-4 py-2 border rounded-lg"
                >
                  <option value="all">Tous les tags</option>
                  {tags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Guide d'authentification */}
        {!headerCollapsed && (
        <div className="bg-white rounded-lg shadow-sm border mb-6 p-6">
          <h2 className="text-xl font-bold mb-4">🔐 Guide d'authentification</h2>
          <div className="prose max-w-none">
            <p className="mb-4">
              La plupart des endpoints nécessitent un token Bearer dans le header <code>Authorization</code>.
            </p>
            
            <h3 className="text-lg font-semibold mb-2">📱 Comment obtenir un token :</h3>
            <ol className="list-decimal list-inside mb-4 space-y-1">
              <li>Utiliser <code>/api/auth/login</code> avec email/password</li>
              <li>Utiliser <code>/api/auth/ws-complete</code> avec Magic Link</li>
              <li>Le token est retourné dans la réponse : <code>access_token</code></li>
            </ol>

            <h3 className="text-lg font-semibold mb-2">🔧 Comment passer le token :</h3>
            <div className="bg-gray-100 p-3 rounded mb-4">
              <code>Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</code>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">✅ Endpoints SANS authentification :</h4>
                <ul className="text-sm space-y-1">
                  <li>• <code>/api/auth/login</code></li>
                  <li>• <code>/api/auth/register</code></li>
                  <li>• <code>/api/auth/ws-complete</code></li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">🔒 Endpoints AVEC authentification :</h4>
                <ul className="text-sm space-y-1">
                  <li>• <code>/api/auth/me</code></li>
                  <li>• <code>/api/wallet/*</code></li>
                  <li>• <code>/api/payment/*</code></li>
                  <li>• <code>/api/user/*</code></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Liste des endpoints */}
        <div className="space-y-4">
          {filteredEndpoints.map((endpoint, index) => (
            <div key={`${endpoint.method}-${endpoint.path}`} className="bg-white rounded-lg shadow-sm border">
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => {
                  const key = `${endpoint.method}-${endpoint.path}`
                  const isExpanding = expandedEndpoint !== key
                  setExpandedEndpoint(isExpanding ? key : null)
                  
                  // Pré-remplir automatiquement le corps avec le premier exemple
                  if (isExpanding && endpoint.requestBodyExample && (endpoint.method === 'POST' || endpoint.method === 'PUT' || endpoint.method === 'PATCH')) {
                    const firstExample = Object.values(endpoint.requestBodyExample)[0] as any
                    if (firstExample?.value) {
                      setTestBody(JSON.stringify(firstExample.value, null, 2))
                    }
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getMethodColor(endpoint.method)}`}>
                      {endpoint.method}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(endpoint.priority)}`}>
                      {endpoint.priority}
                    </span>
                    <code className="text-sm font-mono">{endpoint.path}</code>
                    {endpoint.auth && <span className="text-red-600 text-xs">🔒 Auth</span>}
                    {endpoint.requestBodyExample && <span className="text-blue-600 text-xs">📝 Avec exemple</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{endpoint.summary}</span>
                    <span className="text-gray-400">
                      {expandedEndpoint === `${endpoint.method}-${endpoint.path}` ? '▼' : '▶'}
                    </span>
                  </div>
                </div>
              </div>

              {expandedEndpoint === `${endpoint.method}-${endpoint.path}` && (
                <div className="border-t p-4">
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">📋 Description</h3>
                    <div className="text-gray-700 whitespace-pre-wrap">{endpoint.description}</div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">AUTHENTIFICATION REQUISE :</span>
                      <span className={`px-2 py-1 text-xs rounded ${endpoint.auth ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {endpoint.auth ? '🔒 OUI' : '✅ NON'}
                      </span>
                    </div>
                    {endpoint.auth && (
                      <div className="text-sm text-gray-600 bg-yellow-50 p-2 rounded">
                        💡 Cet endpoint nécessite un token Bearer dans le header Authorization
                      </div>
                    )}
                  </div>

                  {/* Exemples de requête */}
                  {endpoint.requestBodyExample && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">📤 Exemples de requête</h4>
                      <div className="space-y-2">
                        {Object.entries(endpoint.requestBodyExample).map(([key, example]: [string, any]) => (
                          <div key={key} className="border rounded p-3">
                            <div className="font-medium text-sm mb-1">{example.summary}</div>
                            <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
                              {JSON.stringify(example.value, null, 2)}
                            </pre>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Exemples de réponse */}
                  {endpoint.responseExample && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">📥 Exemples de réponse</h4>
                      <div className="space-y-2">
                        {Object.entries(endpoint.responseExample).map(([key, example]: [string, any]) => (
                          <div key={key} className="border rounded p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{example.summary}</span>
                              <span className={`px-2 py-1 text-xs rounded ${
                                key.includes('success') || key.includes('200') ? 'bg-green-100 text-green-800' : 
                                key.includes('error') || key.includes('400') || key.includes('401') ? 'bg-red-100 text-red-800' : 
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {key.includes('200') ? '200' : key.includes('400') ? '400' : key.includes('401') ? '401' : 'Response'}
                              </span>
                            </div>
                            <pre className="bg-gray-50 p-2 rounded text-sm overflow-x-auto">
                              {JSON.stringify(example.value, null, 2)}
                            </pre>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section de test */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">🧪 Tester cet endpoint</h4>
                      <button
                        onClick={() => setTestingEndpoint(
                          testingEndpoint === `${endpoint.method}-${endpoint.path}` 
                            ? null 
                            : `${endpoint.method}-${endpoint.path}`
                        )}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        {testingEndpoint === `${endpoint.method}-${endpoint.path}` ? 'Masquer' : 'Tester'}
                      </button>
                    </div>

                    {testingEndpoint === `${endpoint.method}-${endpoint.path}` && (
                      <div className="space-y-3">
                        {(endpoint.method === 'POST' || endpoint.method === 'PUT' || endpoint.method === 'PATCH') && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-sm font-medium">Corps de la requête (JSON)</label>
                              {endpoint.requestBodyExample && (
                                <button
                                  onClick={() => {
                                    const firstExample = Object.values(endpoint.requestBodyExample)[0] as any
                                    if (firstExample?.value) {
                                      setTestBody(JSON.stringify(firstExample.value, null, 2))
                                    }
                                  }}
                                  className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                >
                                  📋 Exemple
                                </button>
                              )}
                            </div>
                            <textarea
                              value={testBody}
                              onChange={(e) => setTestBody(e.target.value)}
                              className="w-full px-3 py-2 border rounded-md font-mono text-sm"
                              rows={4}
                              placeholder={endpoint.requestBodyExample ? 'Cliquez sur "Exemple" pour pré-remplir' : '{"key": "value"}'}
                            />
                          </div>
                        )}

                        {/* Paramètres de query pour différents endpoints */}
                        {((endpoint.path === '/api/user/artists' && endpoint.method === 'GET') || 
                          (endpoint.path === '/api/user/platforms' && endpoint.method === 'DELETE')) && (
                          <div className="space-y-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            {endpoint.path === '/api/user/artists' && endpoint.method === 'GET' && (
                              <>
                                <div className="font-medium text-blue-800">📄 Paramètres de pagination</div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Page (0, 1, 2...)
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={queryParams.page || '0'}
                                      onChange={(e) => setQueryParams(prev => ({ ...prev, page: e.target.value }))}
                                      className="w-full px-3 py-2 border rounded-md text-sm"
                                      placeholder="0"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Limite (1-50)
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      max="50"
                                      value={queryParams.limit || '10'}
                                      onChange={(e) => setQueryParams(prev => ({ ...prev, limit: e.target.value }))}
                                      className="w-full px-3 py-2 border rounded-md text-sm"
                                      placeholder="10"
                                    />
                                  </div>
                                </div>
                                <div className="text-xs text-blue-600">
                                  💡 URL finale: <code>{spec?.servers?.[0]?.url || ''}{endpoint.path}?page={queryParams.page || '0'}&limit={queryParams.limit || '10'}</code>
                                </div>
                              </>
                            )}
                            
                            {endpoint.path === '/api/user/platforms' && endpoint.method === 'DELETE' && (
                              <>
                                <div className="font-medium text-blue-800">🗑️ Paramètres de déconnexion</div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Platform ID
                                  </label>
                                  <input
                                    type="text"
                                    value={queryParams.platformId || ''}
                                    onChange={(e) => setQueryParams(prev => ({ ...prev, platformId: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-md text-sm"
                                    placeholder="550e8400-e29b-41d4-a716-446655440001"
                                  />
                                  <div className="text-xs text-gray-500 mt-1">
                                    💡 Utilisez d'abord GET /api/user/platforms pour récupérer les IDs
                                  </div>
                                </div>
                                <div className="text-xs text-blue-600">
                                  💡 URL finale: <code>{spec?.servers?.[0]?.url || ''}{endpoint.path}?platformId={queryParams.platformId || 'PLATFORM_ID'}</code>
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        <button
                          onClick={() => handleTestEndpoint(endpoint, queryParams)}
                          disabled={testLoading}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          {testLoading ? '⏳ Test en cours...' : '🚀 Envoyer la requête'}
                        </button>

                        {testResult && (
                          <div className="mt-3">
                            <div className={`p-3 rounded-md ${testResult.status < 400 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium">Statut:</span>
                                <span className={`px-2 py-1 text-xs rounded ${testResult.status < 400 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {testResult.status} {testResult.statusText}
                                </span>
                              </div>
                              
                              {testResult.debug && (
                                <div className="mb-2 p-2 bg-gray-100 rounded text-sm">
                                  <div className="font-medium mb-1">🔧 Debug Info:</div>
                                  <div>Auth détectée: {testResult.debug.auth_detected ? 'Oui' : 'Non'}</div>
                                  <div>Token utilisé: {testResult.debug.token_used}</div>
                                  <div>Force token: {testResult.debug.force_token ? 'Oui' : 'Non'}</div>
                                </div>
                              )}
                              
                              {/* Alerte spéciale pour les tokens révoqués */}
                              {testResult.data?.error === 'SPOTIFY_TOKEN_REVOKED' && (
                                <div className="mb-2 p-3 bg-orange-100 border border-orange-300 rounded-md">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">🚨</span>
                                    <span className="font-semibold text-orange-800">Token Spotify révoqué</span>
                                  </div>
                                  <p className="text-sm text-orange-700 mb-2">{testResult.data.message}</p>
                                  <div className="text-sm text-orange-600">
                                    <strong>Action requise :</strong> Allez sur <code className="bg-orange-200 px-1 rounded">/connect-platform</code> pour vous reconnecter à Spotify.
                                  </div>
                                </div>
                              )}
                              
                              <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
                                {JSON.stringify(testResult.data, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Test WebSocket Magic Link */}
                  {endpoint.path === '/api/auth/ws-complete' && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">🧪 Test WebSocket Magic Link</h4>
                      <div className="space-y-2">
                        <input
                          type="email"
                          placeholder="Email pour le test"
                          value={wsEmail}
                          onChange={(e) => setWsEmail(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => testWebSocket(wsEmail)}
                            disabled={!wsEmail || wsConnected}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                          >
                            {wsConnected ? '🔌 WebSocket Actif' : '🚀 Démarrer WebSocket'}
                          </button>
                          {wsConnected && (
                            <button
                              onClick={() => {
                                setWsConnected(false)
                                setWsMessages(prev => [...prev, {
                                  timestamp: new Date().toLocaleTimeString(),
                                  message: '🔴 WebSocket fermé manuellement par l\'utilisateur',
                                  type: 'warning',
                                  data: {}
                                }])
                              }}
                              className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                            >
                              🛑 Fermer
                            </button>
                          )}
                        </div>
                        {wsMessages.length > 0 && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-sm">📡 Messages WebSocket en temps réel:</h5>
                              <button
                                onClick={() => setWsMessages([])}
                                className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                              >
                                🗑️ Effacer
                              </button>
                            </div>
                            <div className="p-3 bg-black text-green-400 rounded text-xs max-h-60 overflow-y-auto font-mono">
                              {wsMessages.map((msg, i) => (
                                <div key={i} className="mb-2 border-b border-gray-700 pb-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-gray-400">[{msg.timestamp}]</span>
                                    <span className={`px-1 rounded text-xs ${
                                      msg.type === 'success' ? 'bg-green-600 text-white' :
                                      msg.type === 'error' ? 'bg-red-600 text-white' :
                                      msg.type === 'warning' ? 'bg-yellow-600 text-black' :
                                      'bg-blue-600 text-white'
                                    }`}>
                                      {msg.type?.toUpperCase() || 'INFO'}
                                    </span>
                                  </div>
                                  <div className="text-green-300 mb-1">{msg.message}</div>
                                  {msg.data && Object.keys(msg.data).length > 0 && (
                                    <details className="mt-1">
                                      <summary className="text-gray-400 cursor-pointer text-xs hover:text-gray-300">
                                        📋 Données JSON ({Object.keys(msg.data).length} propriétés)
                                      </summary>
                                      <pre className="mt-1 text-xs text-gray-300 bg-gray-800 p-2 rounded overflow-x-auto">
                                        {JSON.stringify(msg.data, null, 2)}
                                      </pre>
                                    </details>
                                  )}
                                </div>
                              ))}
                              {wsConnected && (
                                <div className="text-yellow-400 animate-pulse">
                                  ⚡ WebSocket actif - En attente de messages...
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Test Wallet & Paiement */}
                  {(endpoint.path === '/api/payment/create-session' || endpoint.path === '/api/wallet/balance') && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-3">💳 Test Système de Paiement</h4>
                      
                      {/* Solde actuel */}
                      <div className="mb-4 p-3 bg-white rounded border">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Solde Wallet:</span>
                          <button
                            onClick={refreshWalletBalance}
                            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                          >
                            🔄 Actualiser
                          </button>
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                          {walletBalance !== null ? `${(walletBalance / 100).toFixed(2)}€` : 'Chargement...'}
                        </div>
                      </div>

                      {/* Boutons de recharge */}
                      <div className="space-y-2">
                        <h5 className="font-medium">Recharger le wallet:</h5>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => testPayment(2000)}
                            disabled={paymentLoading}
                            className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            +20€
                          </button>
                          <button
                            onClick={() => testPayment(5000)}
                            disabled={paymentLoading}
                            className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            +50€
                          </button>
                          <button
                            onClick={() => testPayment(10000)}
                            disabled={paymentLoading}
                            className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            +100€
                          </button>
                        </div>
                        
                        {/* Montant personnalisé */}
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Montant en €"
                            value={customAmount}
                            onChange={(e) => setCustomAmount(e.target.value)}
                            className="flex-1 px-3 py-2 border rounded-md"
                            min="1"
                            max="500"
                          />
                          <button
                            onClick={() => testPayment(parseFloat(customAmount) * 100)}
                            disabled={paymentLoading || !customAmount}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            Recharger
                          </button>
                        </div>
                      </div>

                      {/* Status du paiement */}
                      {paymentStatus && (
                        <div className={`mt-3 p-2 rounded text-sm ${
                          paymentStatus.includes('✅') ? 'bg-green-100 text-green-800' :
                          paymentStatus.includes('❌') ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {paymentStatus}
                        </div>
                      )}

                      {/* WebView de paiement simulée */}
                      {paymentUrl && (
                        <div className="mt-3 p-3 bg-gray-100 rounded">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">🌐 WebView Stripe:</span>
                            <button
                              onClick={() => setPaymentUrl('')}
                              className="px-2 py-1 bg-red-500 text-white text-sm rounded"
                            >
                              ✕ Fermer
                            </button>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            URL: {paymentUrl}
                          </div>
                          <div className="bg-white p-3 rounded border-2 border-dashed">
                            <div className="text-center text-gray-500">
                              📱 Interface de paiement Stripe<br/>
                              (Ouvrirait dans une WebView sur mobile)
                            </div>
                            <div className="mt-2 text-xs text-gray-400">
                              💳 Cartes de test: 4242 4242 4242 4242 (succès), 4000 0000 0000 0002 (échec)
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Messages WebSocket */}
                      {paymentMessages.length > 0 && (
                        <div className="mt-3">
                          <h6 className="font-medium mb-2">📡 Messages WebSocket:</h6>
                          <div className="bg-gray-100 p-2 rounded text-sm max-h-32 overflow-y-auto">
                            {paymentMessages.map((msg, i) => (
                              <div key={i} className="mb-1">
                                <span className="text-gray-500">{msg.timestamp}</span>: {msg.message}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredEndpoints.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">Aucun endpoint trouvé</div>
            <div className="text-gray-400 text-sm mt-2">Essayez de modifier vos filtres</div>
          </div>
        )}
      </div>
    </div>
  )
}