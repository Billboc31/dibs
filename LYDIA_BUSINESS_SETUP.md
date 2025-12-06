# 🚀 Setup Lydia Business - Guide express

## 📧 Contact immédiat
**Email** : business@lydia-app.com
**Objet** : "POC Billetterie - Demande API Wallet"

**Message type** :
```
Bonjour,

Je développe une plateforme de billetterie événementielle et cherche 
une solution de wallet pour permettre aux utilisateurs de :
- Recharger leur compte
- Payer des tickets
- Gérer leur solde

Pouvez-vous me fournir :
- Accès API sandbox
- Documentation technique
- Tarifs détaillés

Merci,
[Ton nom]
[Ton entreprise]
```

## ⚡ Setup express (24h)

### Étape 1: Inscription (2h)
1. **Réponse** de Lydia Business
2. **Formulaire** d'inscription
3. **Documents** : Kbis + RIB

### Étape 2: Sandbox (24h)
1. **Clés API** de test
2. **Documentation** complète
3. **Environnement** de développement

### Étape 3: Intégration (4h)
1. **Installation** SDK
2. **Création** utilisateurs
3. **Tests** wallet

### Étape 4: Production (48h)
1. **Validation** du compte
2. **Clés** de production
3. **Go live** !

## 💻 Code d'intégration

### Installation
```bash
npm install lydia-business-sdk
```

### Configuration
```javascript
const lydia = new LydiaAPI({
  clientId: process.env.LYDIA_CLIENT_ID,
  clientSecret: process.env.LYDIA_CLIENT_SECRET,
  environment: 'sandbox' // ou 'production'
})
```

### Créer un wallet
```javascript
const wallet = await lydia.wallets.create({
  userId: user.id,
  currency: 'EUR'
})
```

### Recharger
```javascript
const recharge = await lydia.payments.create({
  walletId: wallet.id,
  amount: 2000, // 20€ en centimes
  returnUrl: 'https://ton-app.com/callback'
})
```

## 📱 Avantages mobile
- **SDK React Native** natif
- **Deep links** automatiques
- **Notifications** push
- **Interface** optimisée

## 💰 Tarification
- **Recharge** : 1.5% + 0.25€
- **Paiement** : Gratuit (wallet vers wallet)
- **Retrait** : 0.50€
- **Pas** de frais mensuels

## 🎯 Pourquoi Lydia ?
1. ✅ **Français** (support réactif)
2. ✅ **Mobile-first** (comme ton app)
3. ✅ **Setup rapide** (24-48h)
4. ✅ **API complète** (tout ce qu'il faut)
5. ✅ **Légal** (établissement de paiement)
6. ✅ **Tarifs** compétitifs
