/**
 * Script de test pour simuler une révocation de token Spotify
 * 
 * Ce script peut être utilisé pour tester le comportement de l'application
 * quand Spotify révoque un token d'accès.
 * 
 * Usage: node test-revocation-simulation.js
 */

const BASE_URL = 'http://127.0.0.1:3001'

async function testRevocationFlow() {
  console.log('🧪 Test de simulation de révocation Spotify')
  console.log('=' .repeat(50))

  // 1. Tester un endpoint qui nécessite Spotify
  console.log('\n1️⃣ Test de l\'endpoint /api/user/artists...')
  
  try {
    const response = await fetch(`${BASE_URL}/api/user/artists`, {
      headers: {
        'Authorization': 'Bearer fake_revoked_token_for_testing'
      }
    })
    
    const data = await response.json()
    
    console.log(`Statut: ${response.status}`)
    console.log('Réponse:', JSON.stringify(data, null, 2))
    
    if (data.error === 'SPOTIFY_TOKEN_REVOKED') {
      console.log('✅ Gestion de révocation détectée correctement!')
      console.log(`📝 Message: ${data.message}`)
      console.log(`🔧 Action requise: ${data.action_required}`)
    } else {
      console.log('⚠️ Pas de gestion de révocation détectée')
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message)
  }

  // 2. Tester l'endpoint de sync
  console.log('\n2️⃣ Test de l\'endpoint /api/user/artists/sync...')
  
  try {
    const response = await fetch(`${BASE_URL}/api/user/artists/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake_revoked_token_for_testing'
      },
      body: JSON.stringify({})
    })
    
    const data = await response.json()
    
    console.log(`Statut: ${response.status}`)
    console.log('Réponse:', JSON.stringify(data, null, 2))
    
    if (data.error === 'SPOTIFY_TOKEN_REVOKED') {
      console.log('✅ Gestion de révocation détectée correctement!')
    } else {
      console.log('⚠️ Pas de gestion de révocation détectée')
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message)
  }

  console.log('\n' + '='.repeat(50))
  console.log('🎯 Test terminé!')
  console.log('\n📖 Pour tester en réel:')
  console.log('1. Connectez-vous à Spotify via /connect-platform')
  console.log('2. Attendez que Spotify révoque le token (mode dev)')
  console.log('3. Testez les endpoints /api/user/artists')
  console.log('4. Vérifiez que vous recevez SPOTIFY_TOKEN_REVOKED')
}

// Exécuter le test
testRevocationFlow()
