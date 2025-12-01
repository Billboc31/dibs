# 💳 Système de Wallet DIBS

## 📋 Vue d'ensemble

Le système de wallet permet aux utilisateurs de :
- Recharger leur portefeuille numérique
- Payer des billets d'événements instantanément
- Configurer des recharges automatiques
- Suivre l'historique de leurs transactions

## 🏗️ Architecture

### 📊 Tables de base de données

#### `user_wallets`
- Portefeuille individuel par utilisateur
- Solde en centimes (évite les problèmes de virgules flottantes)
- Support multi-devises (EUR par défaut)

#### `wallet_transactions`
- Historique complet des transactions
- Types : `recharge`, `payment`, `refund`, `transfer`
- Statuts : `pending`, `completed`, `failed`, `cancelled`

#### `wallet_subscriptions`
- Abonnements de recharge automatique
- Fréquences : `weekly`, `monthly`, `yearly`
- Gestion via Stripe Subscriptions

### 🔌 API Endpoints

#### Gestion du wallet
```
GET  /api/wallet/balance      - Solde actuel
GET  /api/wallet/transactions - Historique des transactions
```

#### Paiements
```
POST /api/payment/create-session - Créer une session de paiement
GET  /api/payment/ws            - WebSocket pour écouter les résultats
POST /api/payment/webhook       - Webhook pour les notifications
POST /api/payment/simulate      - Simuler un paiement (tests)
```

## 🔄 Flux de paiement WebSocket

### 1. 📱 Côté Mobile
```javascript
// 1. Créer session de paiement
const response = await fetch('/api/payment/create-session', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ amount: 5000 }) // 50€
})

const { session_id, checkout_url } = await response.json()

// 2. Écouter le WebSocket
const eventSource = new EventSource(
  `/api/payment/ws?session_id=${session_id}&email=${user.email}`
)

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data)
  
  switch (data.type) {
    case 'payment_connected':
      console.log('Connexion WebSocket établie')
      break
    case 'payment_success':
      console.log('Paiement réussi !', data.amount)
      setPaymentUrl(null) // Fermer WebView
      refreshWalletBalance()
      break
    case 'payment_failed':
      console.log('Paiement échoué:', data.error)
      break
  }
}

// 3. Ouvrir WebView avec l'URL de paiement
setPaymentUrl(checkout_url)
```

### 2. 🖥️ Côté Backend

#### Création de session
```javascript
// /api/payment/create-session
const sessionId = `session_${Date.now()}_${randomString}`
const checkoutUrl = `${BASE_URL}/payment/checkout?session_id=${sessionId}`

return { session_id: sessionId, checkout_url: checkoutUrl }
```

#### WebSocket de surveillance
```javascript
// /api/payment/ws
const stream = new ReadableStream({
  start(controller) {
    // Message initial
    controller.enqueue('data: {"type":"payment_connected"}\n\n')
    
    // Stocker la connexion
    addPaymentConnection(sessionId, { controller, email, userId })
    
    // Heartbeat + timeout
  }
})
```

#### Webhook de notification
```javascript
// /api/payment/webhook (appelé par Stripe/Lydia)
if (status === 'completed') {
  // 1. Mettre à jour le wallet
  await updateUserWallet(userId, amount)
  
  // 2. Notifier via WebSocket
  notifyPaymentSuccess(sessionId, { amount, new_balance })
}
```

## 🧪 Tests

### Simulation de paiement
```bash
# Créer une session
curl -X POST /api/payment/create-session \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"amount": 5000}'

# Simuler le succès
curl -X POST /api/payment/simulate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"session_id": "session_xxx", "status": "success"}'
```

### Interface de test mobile
```javascript
const TestWallet = () => {
  const [balance, setBalance] = useState(0)
  const [paymentUrl, setPaymentUrl] = useState(null)
  
  const recharge = async (amount) => {
    // Créer session + écouter WebSocket
    const { session_id, checkout_url } = await createPaymentSession(amount)
    listenToPayment(session_id)
    setPaymentUrl(checkout_url)
  }
  
  return (
    <View>
      <Text>Solde: {balance / 100}€</Text>
      <Button title="Recharger 20€" onPress={() => recharge(2000)} />
      <Button title="Recharger 50€" onPress={() => recharge(5000)} />
      
      {paymentUrl && (
        <WebView source={{ uri: paymentUrl }} />
      )}
    </View>
  )
}
```

## 🔐 Sécurité

### Row Level Security (RLS)
- Chaque utilisateur ne voit que ses propres données
- Politiques Supabase pour tous les accès

### Validation des montants
- Soldes non-négatifs
- Montants de transaction non-nuls
- Contraintes de base de données

### Authentification
- Tous les endpoints nécessitent un Bearer token
- Vérification via Supabase Auth

## 🚀 Intégration Stripe (À venir)

```javascript
// Remplacer la simulation par Stripe
const session = await stripe.checkout.sessions.create({
  customer: user.stripe_customer_id,
  payment_method_types: ['card'],
  line_items: [{
    price_data: {
      currency: 'eur',
      unit_amount: amount,
      product_data: { name: 'Recharge Wallet DIBS' }
    },
    quantity: 1
  }],
  mode: 'payment',
  success_url: `${BASE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${BASE_URL}/payment/cancel`,
  metadata: { user_id: userId, type: 'wallet_recharge' }
})

return { checkout_url: session.url, session_id: session.id }
```

## 📱 Utilisation Mobile

### Recharge simple
```javascript
const rechargeWallet = async (amount) => {
  const { session_id, checkout_url } = await apiCall('/payment/create-session', {
    method: 'POST',
    body: { amount }
  })
  
  // Écouter WebSocket + ouvrir WebView
  listenToPaymentResult(session_id)
  openPaymentWebView(checkout_url)
}
```

### Paiement événement
```javascript
const buyTicket = async (eventId, ticketPrice) => {
  // Vérifier le solde
  const { balance_cents } = await apiCall('/wallet/balance')
  
  if (balance_cents >= ticketPrice) {
    // Paiement direct depuis le wallet
    await apiCall('/events/purchase', {
      method: 'POST',
      body: { event_id: eventId, amount: ticketPrice }
    })
  } else {
    // Recharge nécessaire
    const needed = ticketPrice - balance_cents
    await rechargeWallet(needed)
  }
}
```

## 🔧 Configuration

### Variables d'environnement
```env
# Stripe (production)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# URLs
NEXT_PUBLIC_BASE_URL=https://dibs-poc0.vercel.app
```

### Migration de base de données
```bash
# Appliquer la migration
psql -f supabase/migrations/003_create_wallet_tables.sql
```

## 📊 Monitoring

### Logs à surveiller
- Connexions WebSocket actives
- Échecs de paiement
- Timeouts de session
- Erreurs de webhook

### Métriques importantes
- Taux de succès des paiements
- Temps moyen de traitement
- Nombre de connexions WebSocket
- Volume de transactions par jour
