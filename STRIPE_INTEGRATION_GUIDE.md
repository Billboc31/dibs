# 💳 Guide d'intégration Stripe - DIBS

## 🚀 Configuration Stripe

### 1. 📋 Créer un compte Stripe

1. Va sur https://stripe.com et crée un compte
2. Active ton compte avec les informations de ton entreprise
3. Récupère tes clés API dans le Dashboard

### 2. 🔑 Configuration des clés API

#### Dans le Dashboard Stripe :
```
Developers > API Keys
- Publishable key: pk_test_... (pour le frontend)
- Secret key: sk_test_... (pour le backend)
```

#### Dans ton `.env.local` :
```env
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

### 3. 🔔 Configuration des Webhooks

#### Créer un endpoint webhook :
1. Dashboard Stripe > Developers > Webhooks
2. Cliquer "Add endpoint"
3. URL : `https://dibs-poc0.vercel.app/api/payment/webhook`
4. Événements à écouter :
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.payment_failed`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`

#### Récupérer le secret webhook :
```env
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## 🔄 Flux de paiement complet

### 1. 📱 Mobile crée une session
```javascript
const response = await fetch('/api/payment/create-session', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ amount: 5000 }) // 50€
})

const { session_id, checkout_url } = await response.json()
```

### 2. 🔌 Mobile écoute le WebSocket
```javascript
const eventSource = new EventSource(
  `/api/payment/ws?session_id=${session_id}&email=${user.email}`
)

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data)
  
  if (data.type === 'payment_success') {
    // Paiement réussi !
    setPaymentUrl(null) // Fermer WebView
    refreshWalletBalance()
  }
}
```

### 3. 🌐 Mobile ouvre WebView Stripe
```javascript
<WebView source={{ uri: checkout_url }} />
```

### 4. 💳 User paie sur Stripe
- Interface sécurisée Stripe
- Gestion des cartes
- 3D Secure automatique

### 5. 📡 Stripe notifie via webhook
```javascript
// /api/payment/webhook reçoit l'événement
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_...",
      "amount_total": 5000,
      "metadata": {
        "user_id": "...",
        "type": "wallet_recharge"
      }
    }
  }
}
```

### 6. 🔔 Backend notifie le mobile
```javascript
// Via WebSocket
notifyPaymentSuccess(session_id, {
  amount: 5000,
  new_balance: 15000
})
```

## 🧪 Tests en mode développement

### 1. 🎯 Cartes de test Stripe
```
Visa réussie:     4242 4242 4242 4242
Visa échouée:     4000 0000 0000 0002
3D Secure:        4000 0027 6000 3184
Expiration:       Toute date future (12/25)
CVC:              Tout code 3 chiffres (123)
```

### 2. 🔄 Simuler un paiement
```bash
# Créer session
curl -X POST https://dibs-poc0.vercel.app/api/payment/create-session \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"amount": 5000}'

# Écouter WebSocket
curl -N https://dibs-poc0.vercel.app/api/payment/ws?session_id=cs_xxx&email=test@example.com
```

### 3. 📊 Vérifier dans Stripe Dashboard
- Payments > All payments
- Voir les transactions test
- Logs des webhooks

## 🔄 Abonnements récurrents

### 1. 📅 Créer un abonnement
```javascript
const response = await fetch('/api/payment/subscription', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    amount: 5000,      // 50€
    frequency: 'monthly' // weekly, monthly, yearly
  })
})
```

### 2. ⚙️ Gérer l'abonnement
```javascript
// Récupérer l'abonnement
GET /api/payment/subscription

// Mettre en pause
PATCH /api/payment/subscription
{ "action": "pause" }

// Reprendre
PATCH /api/payment/subscription
{ "action": "resume" }

// Annuler
DELETE /api/payment/subscription
```

### 3. 🔄 Paiements automatiques
- Stripe facture automatiquement
- Webhook `invoice.payment_succeeded`
- Wallet rechargé automatiquement

## 🔐 Sécurité

### 1. 🛡️ Validation des webhooks
```javascript
// Vérification signature obligatoire
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
)
```

### 2. 🔒 Clés API sécurisées
- Secret keys côté serveur uniquement
- Publishable keys côté client OK
- Jamais de clés dans le code frontend

### 3. 📊 Métadonnées utilisateur
```javascript
// Toujours inclure l'ID utilisateur
metadata: {
  user_id: user.id,
  type: 'wallet_recharge',
  source: 'mobile_app'
}
```

## 📱 Interface mobile recommandée

### 1. 💰 Écran Wallet
```javascript
const WalletScreen = () => {
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(false)
  
  const recharge = async (amount) => {
    setLoading(true)
    
    try {
      // Créer session Stripe
      const { session_id, checkout_url } = await createPaymentSession(amount)
      
      // Écouter WebSocket
      listenToPaymentResult(session_id, (result) => {
        if (result.type === 'payment_success') {
          setBalance(result.new_balance / 100)
          Alert.alert('Succès', 'Wallet rechargé !')
        }
      })
      
      // Ouvrir WebView Stripe
      setPaymentUrl(checkout_url)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <View>
      <Text>Solde: {balance}€</Text>
      
      <Button 
        title="Recharger 20€" 
        onPress={() => recharge(2000)}
        disabled={loading}
      />
      
      <Button 
        title="Recharger 50€" 
        onPress={() => recharge(5000)}
        disabled={loading}
      />
      
      <Button 
        title="Abonnement 50€/mois" 
        onPress={setupSubscription}
      />
    </View>
  )
}
```

### 2. 🌐 WebView de paiement
```javascript
const PaymentWebView = ({ url, onResult }) => (
  <Modal visible={!!url} animationType="slide">
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', padding: 10 }}>
        <Button title="Fermer" onPress={() => onResult(null)} />
        <Text style={{ flex: 1, textAlign: 'center' }}>
          Paiement sécurisé Stripe
        </Text>
      </View>
      
      <WebView 
        source={{ uri: url }}
        style={{ flex: 1 }}
      />
    </SafeAreaView>
  </Modal>
)
```

## 🚀 Déploiement en production

### 1. 🔄 Passer en mode live
```env
# Remplacer les clés test par les clés live
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
```

### 2. 🔔 Webhook en production
- URL : `https://dibs-poc0.vercel.app/api/payment/webhook`
- Même événements que le test
- Nouveau secret webhook live

### 3. 📊 Monitoring
- Dashboard Stripe pour les paiements
- Logs Vercel pour les erreurs
- Alertes sur les échecs de webhook

## 💡 Conseils d'optimisation

### 1. ⚡ Performance
- Cache des customers Stripe
- Réutilisation des sessions
- Timeout appropriés

### 2. 🎨 UX/UI
- Indicateurs de chargement
- Messages d'erreur clairs
- Confirmation visuelle

### 3. 📊 Analytics
- Tracking des conversions
- Analyse des échecs
- Optimisation des montants

## 🆘 Dépannage courant

### 1. ❌ Webhook non reçu
```bash
# Vérifier l'URL
curl -X POST https://dibs-poc0.vercel.app/api/payment/webhook \
  -H "stripe-signature: test" \
  -d '{"type": "test"}'
```

### 2. 🔑 Erreur de clé API
```
Error: No such customer: cus_xxx
→ Vérifier STRIPE_SECRET_KEY
```

### 3. 🔒 Signature webhook invalide
```
Error: Invalid signature
→ Vérifier STRIPE_WEBHOOK_SECRET
```

### 4. 💳 Paiement bloqué
- Vérifier les cartes de test
- Contrôler les montants (min/max)
- Vérifier la devise (EUR)

## 📞 Support

- **Documentation Stripe** : https://stripe.com/docs
- **Dashboard Stripe** : https://dashboard.stripe.com
- **Support Stripe** : Via le dashboard
- **Logs en temps réel** : Stripe CLI `stripe listen`
