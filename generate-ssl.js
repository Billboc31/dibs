const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const certDir = path.join(__dirname, 'certificates')

// Créer le dossier certificates s'il n'existe pas
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir)
  console.log('✅ Dossier certificates créé')
}

// Générer les certificats SSL auto-signés avec OpenSSL
try {
  console.log('🔐 Génération des certificats SSL...')
  
  // Commande OpenSSL pour générer un certificat auto-signé
  const command = `openssl req -x509 -newkey rsa:4096 -keyout certificates/localhost-key.pem -out certificates/localhost.pem -days 365 -nodes -subj "/C=FR/ST=France/L=Paris/O=DIBS/CN=localhost"`
  
  execSync(command, { stdio: 'inherit' })
  
  console.log('✅ Certificats SSL générés avec succès !')
  console.log('📁 Fichiers créés :')
  console.log('   - certificates/localhost-key.pem')
  console.log('   - certificates/localhost.pem')
  console.log('')
  console.log('🚀 Tu peux maintenant lancer : npm run dev:https')
} catch (error) {
  console.error('❌ Erreur lors de la génération des certificats')
  console.error('⚠️  Assure-toi d\'avoir OpenSSL installé')
  console.error('   Windows : https://slproweb.com/products/Win32OpenSSL.html')
  console.error('   Mac : brew install openssl')
  console.error('   Linux : sudo apt install openssl')
}


