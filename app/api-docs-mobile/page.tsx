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
  const [testResult, setTestResult] = useState<any>(null)
  const [testLoading, setTestLoading] = useState(false)
  const [showOAuthDocs, setShowOAuthDocs] = useState(false)

  useEffect(() => {
    fetch('/api/docs-mobile')
      .then(res => res.json())
      .then(data => setSpec(data))

    // Override mobile-container styles for full-width
    const mobileContainer = document.querySelector('.mobile-container') as HTMLElement
    if (mobileContainer) {
      mobileContainer.style.maxWidth = '100%'
      mobileContainer.style.margin = '0'
      mobileContainer.style.boxShadow = 'none'
    }

    return () => {
      // Cleanup
      if (mobileContainer) {
        mobileContainer.style.maxWidth = '480px'
        mobileContainer.style.margin = '0 auto'
        mobileContainer.style.boxShadow = '0 0 30px rgba(0, 0, 0, 0.1)'
      }
    }
  }, [])

  const handleTestEndpoint = async (endpoint: Endpoint) => {
    setTestLoading(true)
    setTestResult(null)

    try {
      const headers: any = {
        'Content-Type': 'application/json'
      }

      if (endpoint.auth && testToken) {
        headers['Authorization'] = `Bearer ${testToken}`
      }

      const options: RequestInit = {
        method: endpoint.method,
        headers
      }

      if (endpoint.method !== 'GET' && endpoint.method !== 'DELETE') {
        options.body = testBody
      }

      const response = await fetch(`${spec.servers[0].url}${endpoint.path}`, options)
      const data = await response.json()

      setTestResult({
        status: response.status,
        statusText: response.ok ? 'Success' : 'Error',
        data
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
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-xl">Chargement...</p>
        </div>
      </div>
    )
  }

  const endpoints: Endpoint[] = []
  
  if (spec.paths) {
    Object.entries(spec.paths).forEach(([path, methods]: [string, any]) => {
      Object.entries(methods).forEach(([method, details]: [string, any]) => {
        if (method !== 'parameters') {
          // Extraire l'exemple de request body
          let requestBodyExample = null
          if (details.requestBody?.content?.['application/json']?.example) {
            requestBodyExample = details.requestBody.content['application/json'].example
          } else if (details.requestBody?.content?.['application/json']?.schema?.example) {
            requestBodyExample = details.requestBody.content['application/json'].schema.example
          }

          // Extraire l'exemple de response
          let responseExample = null
          if (details.responses?.['200']?.content?.['application/json']?.example) {
            responseExample = details.responses['200'].content['application/json'].example
          } else if (details.responses?.['200']?.content?.['application/json']?.schema?.properties) {
            const props = details.responses['200'].content['application/json'].schema.properties
            if (props.data?.example) {
              responseExample = { success: true, data: props.data.example }
            }
          }

          endpoints.push({
            method: method.toUpperCase(),
            path: path,
            tag: details.tags?.[0] || 'Other',
            summary: details.summary || '',
            description: details.description || '',
            priority: details['x-priority'] || 'P2',
            auth: details.security && details.security.length > 0,
            requestBodyExample,
            responseExample
          })
        }
      })
    })
  }

  const filteredEndpoints = endpoints.filter(ep => {
    const matchesTag = selectedTag === 'all' || ep.tag === selectedTag
    const matchesSearch = 
      ep.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.summary.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTag && matchesSearch
  })

  const tags = ['all', ...Array.from(new Set(endpoints.map(ep => ep.tag)))]

  const methodColors: Record<string, string> = {
    'GET': 'bg-green-600 text-white',
    'POST': 'bg-blue-600 text-white',
    'PUT': 'bg-yellow-600 text-white',
    'DELETE': 'bg-red-600 text-white',
    'PATCH': 'bg-purple-600 text-white'
  }

  const priorityColors: Record<string, string> = {
    'P0': 'bg-red-100 text-red-800',
    'P1': 'bg-orange-100 text-orange-800',
    'P2': 'bg-blue-100 text-blue-800'
  }

  const tagIcons: Record<string, string> = {
    'Auth': '🔐',
    'User': '👤',
    'Artists': '🎤',
    'Platforms': '🔗',
    'QR': '📱',
    'Events': '📅'
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Header fixe */}
      <div className="bg-white border-b border-gray-200 py-6 px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📱 DIBS Mobile API Documentation
        </h1>
        <p className="text-gray-600 mb-4">
          {endpoints.length} endpoints disponibles • Version {spec.info.version}
        </p>
        
        {/* Barre de recherche */}
        <input
          type="text"
          placeholder="Rechercher un endpoint..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-xl px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Bouton pour afficher la doc OAuth */}
        <div className="mt-4">
          <button
            onClick={() => setShowOAuthDocs(!showOAuthDocs)}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all shadow-md"
          >
            {showOAuthDocs ? '▲ Masquer' : '▼ Voir'} la documentation OAuth Spotify
          </button>
        </div>
      </div>

      {/* Section Documentation OAuth */}
      {showOAuthDocs && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-b border-green-200 px-8 py-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              🎵 Connexion aux plateformes de streaming (Spotify)
            </h2>
            
            <div className="bg-white rounded-lg border border-green-200 p-6 space-y-6">
              {/* Introduction */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">📖 Vue d'ensemble</h3>
                <p className="text-gray-700 leading-relaxed">
                  L'application DIBS utilise OAuth 2.0 avec PKCE pour connecter les utilisateurs à leurs plateformes de streaming.
                  Actuellement, <strong>Spotify</strong> est supporté. Apple Music et Deezer seront disponibles prochainement.
                </p>
              </div>

              {/* Flow OAuth */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">🔄 Flow OAuth pour Spotify</h3>
                <div className="space-y-4">
                  {/* Étape 1 */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-1">Générer le Code Verifier et Challenge</h4>
                      <p className="text-sm text-gray-700 mb-2">
                        L'application mobile doit générer un code aléatoire pour PKCE :
                      </p>
                      <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
{`// Générer un string aléatoire de 128 caractères
const codeVerifier = generateRandomString(128)

// Créer le code challenge (SHA-256 hash)
const codeChallenge = await sha256(codeVerifier)
const codeChallengeBase64 = base64UrlEncode(codeChallenge)`}
                      </pre>
                    </div>
                  </div>

                  {/* Étape 2 */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-1">Rediriger vers Spotify</h4>
                      <p className="text-sm text-gray-700 mb-2">
                        Ouvrir un navigateur (WebView ou browser externe) avec l'URL d'autorisation :
                      </p>
                      <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
{`const spotifyAuthUrl = \`https://accounts.spotify.com/authorize?
  client_id=YOUR_SPOTIFY_CLIENT_ID
  &response_type=code
  &redirect_uri=${spec.servers[0].url}/api/auth/spotify/callback
  &scope=user-read-email user-read-private user-top-read user-read-recently-played user-follow-read
  &code_challenge_method=S256
  &code_challenge=\${codeChallengeBase64}
  &state=\${userId}_\${codeVerifier}\`

// Ouvrir dans un navigateur
window.open(spotifyAuthUrl, '_blank')`}
                      </pre>
                      <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-xs text-yellow-800">
                          ⚠️ <strong>Important :</strong> Le paramètre <code className="bg-yellow-100 px-1 rounded">state</code> doit contenir 
                          le <code className="bg-yellow-100 px-1 rounded">userId</code> et le <code className="bg-yellow-100 px-1 rounded">codeVerifier</code> 
                          séparés par un underscore : <code className="bg-yellow-100 px-1 rounded">userId_codeVerifier</code>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Étape 3 */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                      3
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-1">Autorisation Spotify</h4>
                      <p className="text-sm text-gray-700">
                        L'utilisateur se connecte à Spotify et autorise l'application. 
                        Spotify redirige ensuite vers <code className="bg-gray-100 px-1 rounded text-xs">/api/auth/spotify/callback</code>
                      </p>
                    </div>
                  </div>

                  {/* Étape 4 */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                      4
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-1">Traitement Backend</h4>
                      <p className="text-sm text-gray-700 mb-2">
                        Le backend DIBS :
                      </p>
                      <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                        <li>Reçoit le code d'autorisation</li>
                        <li>Échange le code contre un access_token et refresh_token</li>
                        <li>Enregistre la connexion dans la base de données</li>
                        <li>Synchronise automatiquement les artistes Spotify de l'utilisateur</li>
                        <li>Redirige vers la page de connexion avec un message de succès</li>
                      </ul>
                    </div>
                  </div>

                  {/* Étape 5 */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                      5
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-1">Vérification de la connexion</h4>
                      <p className="text-sm text-gray-700 mb-2">
                        L'app mobile peut vérifier si l'utilisateur est connecté à Spotify :
                      </p>
                      <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
{`GET ${spec.servers[0].url}/api/user/platforms
Authorization: Bearer YOUR_JWT_TOKEN

Response:
{
  "success": true,
  "data": {
    "platforms": [
      {
        "id": "spotify-uuid",
        "name": "Spotify",
        "connected_at": "2025-11-26T10:30:00Z"
      }
    ]
  }
}`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

              {/* Configuration requise */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">⚙️ Configuration Spotify requise</h3>
                <div className="bg-blue-50 border border-blue-200 rounded p-4">
                  <p className="text-sm text-gray-700 mb-3">
                    Pour utiliser l'authentification Spotify, vous devez configurer une application Spotify Developer :
                  </p>
                  <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                    <li>Aller sur <a href="https://developer.spotify.com/dashboard" target="_blank" className="text-blue-600 underline">Spotify Developer Dashboard</a></li>
                    <li>Créer une nouvelle application</li>
                    <li>Ajouter l'URL de redirection : <code className="bg-blue-100 px-2 py-1 rounded text-xs">{spec.servers[0].url}/api/auth/spotify/callback</code></li>
                    <li>Copier le <strong>Client ID</strong> et le <strong>Client Secret</strong></li>
                    <li>Ajouter ces credentials dans vos variables d'environnement :
                      <pre className="mt-2 text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
{`NEXT_PUBLIC_SPOTIFY_CLIENT_ID=votre_client_id
SPOTIFY_CLIENT_SECRET=votre_client_secret
NEXT_PUBLIC_SPOTIFY_REDIRECT_URI=${spec.servers[0].url}/api/auth/spotify/callback`}
                      </pre>
                    </li>
                  </ol>
                </div>
              </div>

              {/* Exemple complet */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">💻 Exemple complet (React Native)</h3>
                <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto">
{`import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import * as Crypto from 'expo-crypto'

// Fonction pour se connecter à Spotify
async function connectToSpotify(userId: string) {
  // 1. Générer le code verifier
  const codeVerifier = generateRandomString(128)
  
  // 2. Créer le code challenge
  const codeChallenge = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    codeVerifier,
    { encoding: Crypto.CryptoEncoding.BASE64 }
  )
  const codeChallengeBase64 = codeChallenge
    .replace(/\\+/g, '-')
    .replace(/\\//g, '_')
    .replace(/=/g, '')

  // 3. Construire l'URL d'autorisation
  const params = new URLSearchParams({
    client_id: 'YOUR_SPOTIFY_CLIENT_ID',
    response_type: 'code',
    redirect_uri: '${spec.servers[0].url}/api/auth/spotify/callback',
    scope: 'user-read-email user-read-private user-top-read user-read-recently-played user-follow-read',
    code_challenge_method: 'S256',
    code_challenge: codeChallengeBase64,
    state: \`\${userId}_\${codeVerifier}\`
  })

  const authUrl = \`https://accounts.spotify.com/authorize?\${params}\`

  // 4. Ouvrir le navigateur
  const result = await WebBrowser.openAuthSessionAsync(authUrl, 'your-app://callback')

  if (result.type === 'success') {
    console.log('✅ Connexion Spotify réussie!')
    // L'app peut maintenant recharger les données utilisateur
  }
}

function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let text = ''
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}`}
                </pre>
              </div>

              {/* Notes importantes */}
              <div className="bg-purple-50 border border-purple-200 rounded p-4">
                <h3 className="text-lg font-bold text-purple-900 mb-2">📝 Notes importantes</h3>
                <ul className="text-sm text-purple-800 space-y-1 list-disc list-inside">
                  <li>Le <code className="bg-purple-100 px-1 rounded">codeVerifier</code> doit être généré côté mobile et passé via le paramètre <code className="bg-purple-100 px-1 rounded">state</code></li>
                  <li>Ne jamais stocker les tokens Spotify côté mobile, ils sont gérés par le backend</li>
                  <li>La synchronisation des artistes est automatique après la connexion</li>
                  <li>L'utilisateur peut se déconnecter via l'endpoint <code className="bg-purple-100 px-1 rounded">DELETE /api/user/platforms</code></li>
                  <li>Les tokens sont automatiquement rafraîchis par le backend quand nécessaire</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 mb-4">Catégories</h3>
          <div className="space-y-2">
            {tags.map(tag => {
              const count = tag === 'all' 
                ? endpoints.length 
                : endpoints.filter(ep => ep.tag === tag).length
              const icon = tag === 'all' ? '📋' : tagIcons[tag] || '📌'
              
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    selectedTag === tag
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {icon} {tag === 'all' ? 'Tous' : tag}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      selectedTag === tag 
                        ? 'bg-white/20 text-white' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {count}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Légende priorités */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-bold text-gray-900 mb-3 text-sm">Priorités</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-red-100 text-red-800 rounded font-medium">P0</span>
                <span className="text-gray-600">Critique</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded font-medium">P1</span>
                <span className="text-gray-600">Important</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded font-medium">P2</span>
                <span className="text-gray-600">Optionnel</span>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des endpoints */}
        <div className="flex-1 p-8 pb-20">
          {filteredEndpoints.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Aucun endpoint trouvé
              </h3>
              <p className="text-gray-600">
                Modifiez votre recherche ou changez de catégorie
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-w-5xl">
              {filteredEndpoints.map((endpoint, index) => {
                const endpointKey = `${endpoint.method}-${endpoint.path}`
                const isExpanded = expandedEndpoint === endpointKey
                const isTesting = testingEndpoint === endpointKey
                
                return (
                  <div
                    key={index}
                    className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    {/* Header de l'endpoint */}
                    <div className="flex items-start gap-4 mb-3">
                      <span className={`px-3 py-1 rounded font-bold text-sm ${methodColors[endpoint.method] || 'bg-gray-600 text-white'}`}>
                        {endpoint.method}
                      </span>
                      <code className="flex-1 text-gray-900 font-mono text-sm bg-gray-50 px-3 py-1 rounded border border-gray-200">
                        {endpoint.path}
                      </code>
                      <span className={`px-3 py-1 rounded text-xs font-bold ${priorityColors[endpoint.priority]}`}>
                        {endpoint.priority}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-gray-700 mb-3">
                      {endpoint.summary}
                    </p>

                    {/* Badges et boutons */}
                    <div className="flex items-center gap-2 justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                          {tagIcons[endpoint.tag] || '📌'} {endpoint.tag}
                        </span>
                        {endpoint.auth && (
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                            🔒 Auth requise
                          </span>
                        )}
                        {endpoint.requestBodyExample && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                            📝 Avec exemple
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setExpandedEndpoint(isExpanded ? null : endpointKey)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                        >
                          {isExpanded ? '▲ Masquer' : '▼ Détails'}
                        </button>
                        <button
                          onClick={() => {
                            if (!isTesting && endpoint.requestBodyExample) {
                              setTestBody(JSON.stringify(endpoint.requestBodyExample, null, 2))
                            }
                            setTestingEndpoint(isTesting ? null : endpointKey)
                            setTestResult(null)
                          }}
                          className="px-3 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700"
                        >
                          🧪 Tester
                        </button>
                      </div>
                    </div>

                    {/* Détails étendus */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1 font-medium">URL complète:</p>
                          <code className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded block">
                            {spec.servers[0].url}{endpoint.path}
                          </code>
                        </div>

                        {endpoint.auth && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1 font-medium">Headers requis:</p>
                            <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
{`Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json`}
                            </pre>
                          </div>
                        )}

                        {endpoint.requestBodyExample && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1 font-medium">📝 Exemple de requête (Body):</p>
                            <pre className="text-xs bg-green-900 text-green-100 p-3 rounded overflow-x-auto">
                              {JSON.stringify(endpoint.requestBodyExample, null, 2)}
                            </pre>
                            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                              <p className="text-xs text-green-800">
                                💡 Copiez cet exemple et modifiez les valeurs selon vos besoins
                              </p>
                            </div>
                          </div>
                        )}

                        {endpoint.responseExample && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1 font-medium">✅ Exemple de réponse:</p>
                            <pre className="text-xs bg-blue-900 text-blue-100 p-3 rounded overflow-x-auto">
                              {JSON.stringify(endpoint.responseExample, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Curl example */}
                        <div>
                          <p className="text-xs text-gray-500 mb-1 font-medium">🔧 Exemple cURL:</p>
                          <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
{`curl -X ${endpoint.method} ${spec.servers[0].url}${endpoint.path} \\
${endpoint.auth ? `  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\\n` : ''}  -H "Content-Type: application/json"${endpoint.requestBodyExample ? ` \\\n  -d '${JSON.stringify(endpoint.requestBodyExample, null, 2)}'` : ''}`}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Zone de test */}
                    {isTesting && (
                      <div className="mt-4 pt-4 border-t border-gray-100 bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-bold text-gray-900 mb-3 text-sm">🧪 Tester l'endpoint</h4>
                        
                        {endpoint.auth && (
                          <div className="mb-3">
                            <label className="block text-xs text-gray-700 mb-1 font-medium">
                              Bearer Token (optionnel):
                            </label>
                            <input
                              type="text"
                              value={testToken}
                              onChange={(e) => setTestToken(e.target.value)}
                              placeholder="Votre JWT token..."
                              className="w-full px-3 py-2 border border-gray-300 rounded text-xs font-mono"
                            />
                          </div>
                        )}

                        {endpoint.method !== 'GET' && endpoint.method !== 'DELETE' && (
                          <div className="mb-3">
                            <label className="block text-xs text-gray-700 mb-1 font-medium">
                              Body (JSON):
                            </label>
                            <textarea
                              value={testBody}
                              onChange={(e) => setTestBody(e.target.value)}
                              rows={8}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-xs font-mono"
                              placeholder='{"key": "value"}'
                            />
                            {endpoint.requestBodyExample && (
                              <p className="mt-1 text-xs text-green-600">
                                ✅ Exemple prérempli - modifiez les valeurs selon vos besoins
                              </p>
                            )}
                          </div>
                        )}

                        <button
                          onClick={() => handleTestEndpoint(endpoint)}
                          disabled={testLoading}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          {testLoading ? '⏳ Envoi...' : `🚀 Envoyer ${endpoint.method} request`}
                        </button>

                        {testResult && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-bold text-gray-900 text-sm">Résultat:</h5>
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                testResult.status >= 200 && testResult.status < 300
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {testResult.status} {testResult.statusText}
                              </span>
                            </div>
                            <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto max-h-64">
                              {JSON.stringify(testResult.data, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
