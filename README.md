# DIBS - POC Web Application

Application web POC pour DIBS - Système de fidélité pour fans de musique avec accès prioritaire aux concerts.

## 🎯 Concept

DIBS permet aux utilisateurs de :
- Connecter leur plateforme de streaming musicale (Spotify principalement)
- Gagner des points de "fanitude" en écoutant leurs artistes préférés
- Scanner des QR codes sur albums/merchandise pour gagner des points bonus
- Accéder à une communauté de fans et voir leur classement
- Obtenir un accès prioritaire aux billets de concert (Phase 2)

> **Note** : Deezer n'accepte plus les nouvelles connexions. Nous recommandons Spotify qui offre une meilleure API et plus de fonctionnalités. Apple Music sera intégré prochainement.

## 🏗️ Architecture

### Backend : Supabase
- Base de données PostgreSQL avec Row Level Security
- Authentification (Email, Google, Apple)
- API REST auto-générée
- Storage pour assets

### Frontend : Next.js 14 + Tailwind CSS
- Application web responsive (design mobile-first)
- TypeScript pour la sécurité du code
- Design inspiré des maquettes Figma mobile

## 📦 Installation

### 1. Cloner le projet
```bash
git clone <repo-url>
cd dibs
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configurer Supabase

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Exécutez le script SQL dans `supabase/schema.sql`
3. Copiez vos credentials :

```bash
# Créez un fichier .env.local à la racine
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Configurer Spotify OAuth

Pour permettre la connexion avec Spotify (recommandé) :

1. Suivez le guide détaillé dans [`SPOTIFY_SETUP.md`](./SPOTIFY_SETUP.md)
2. Ajoutez les credentials à `.env.local` :

```bash
# Spotify OAuth
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
```

> 📖 **Guide complet** : Voir [`SPOTIFY_SETUP.md`](./SPOTIFY_SETUP.md) pour les instructions détaillées

### 5. Lancer en développement
```bash
npm run dev
```

Ouvrez [http://localhost:3001](http://localhost:3001)

## 🗺️ Workflow Utilisateur

### Phase 1 : Onboarding
1. **Création de compte** (`/`) - Email, Google ou Apple
2. **Connexion plateforme** (`/connect-platform`) - Spotify (recommandé)
3. **Sélection artistes** (`/select-artists`) - Synchronisation automatique depuis Spotify
4. **Géolocalisation** (`/location`) - Autoriser la position (optionnel)

### Phase 2 : Utilisation
5. **Profil** (`/profile`) - Voir ses stats, artistes suivis, événements
6. **Communauté** (`/community/[artistId]`) - Classement des fans par artiste
7. **Scan QR** (`/qr-scan`) - Scanner des codes sur produits pour gagner des points
8. **Récap points** (`/qr-recap`) - Confirmation des points gagnés

## 📊 Structure de la Base de Données

### Tables principales
- `users` - Profils utilisateurs
- `artists` - Artistes musicaux (avec IDs Spotify, Apple Music, Deezer)
- `streaming_platforms` - Plateformes de streaming
- `user_streaming_platforms` - Connexions OAuth avec refresh tokens
- `user_artists` - Points de fanitude par artiste
- `qr_codes` - Codes QR scannables
- `qr_scans` - Historique des scans
- `events` - Concerts et événements
- `user_events` - Intérêt pour les événements
- `leaderboards` - Classements (cache)

### Tables Phase 2 (vente billets)
- `tickets` - Billets de concert
- `priority_queue` - File d'attente prioritaire

## 🎨 Couleurs du Thème

```css
--dibs-yellow: #FDB913      /* Jaune de la couronne */
--spotify-green: #1DB954    /* Vert Spotify (plateforme principale) */
--apple-red: #FC3C44        /* Rouge Apple Music (à venir) */
--deezer-purple: #A238FF    /* Violet Deezer (legacy) */
```

## 🔐 Sécurité

- Row Level Security (RLS) activé sur toutes les tables sensibles
- Les utilisateurs ne peuvent accéder qu'à leurs propres données
- Authentification via Supabase Auth
- Tokens OAuth stockés de manière sécurisée

## 🧪 Données de Test

Le schéma SQL inclut des données de test :

### Artistes
- Lady Gaga
- Katy Perry
- The Weeknd
- Ava Max
- Taylor Swift
- Eminem

### QR Codes de test
- `ALBUM_MAYHEM_2024` - Lady Gaga (500 points)
- `MERCH_WEEKND_TOUR` - The Weeknd (300 points)
- `ALBUM_KATY_SMILE` - Katy Perry (500 points)

### Concerts (Paris)
- Lady Gaga - AccorHotels Arena
- The Weeknd - Stade de France
- Katy Perry - La Seine Musicale

## 📱 Séparation Backend/Frontend

### Backend (Supabase)
Le backend est **totalement indépendant** et peut être utilisé par :
- ✅ L'application web POC (ce projet)
- ✅ Une future application mobile native (iOS/Android)
- ✅ D'autres clients via l'API REST

### API Endpoints
Toutes les opérations passent par l'API Supabase :
- `GET /artists` - Liste des artistes
- `GET /user_artists` - Points de l'utilisateur
- `POST /qr_scans` - Enregistrer un scan
- `GET /events` - Concerts à venir
- etc.

## 🚀 Prochaines Étapes

### Phase 1 - POC (Actuel)
- ✅ Authentification
- ✅ Connexion Spotify avec OAuth 2.0
- ✅ Synchronisation automatique des artistes
- ✅ Sélection artistes
- ✅ Scan QR codes
- ✅ Profil & communauté

### Phase 2 - Production
- ✅ Intégration OAuth Spotify (avec refresh token)
- 🔄 Intégration Apple Music
- 🔄 Synchronisation temps réel des écoutes
- 🔄 Webhooks pour mises à jour en temps réel
- 🔄 Calcul automatique des classements
- 🔄 Notifications push

### Phase 3 - Ticketing
- 📋 Récupération concerts via API externe (Bandsintown, Ticketmaster)
- 📋 Système de vente de billets
- 📋 File d'attente prioritaire basée sur fanitude
- 📋 Intégration paiement (Stripe)
- 📋 Génération QR codes pour entrée concerts

## 🛠️ Technologies Utilisées

- **Next.js 14** - Framework React
- **TypeScript** - Typage statique
- **Tailwind CSS** - Styles utilitaires
- **Supabase** - Backend as a Service
- **react-qr-code** - Génération QR codes

## 📝 Scripts NPM

```bash
npm run dev      # Développement local
npm run build    # Build production
npm run start    # Serveur production
npm run lint     # Linter ESLint
```

## 🚀 Déploiement

### Déploiement rapide sur Vercel (Recommandé)

**5 minutes pour mettre le backend en production !**

1. Pousser sur GitHub
2. Importer sur [Vercel](https://vercel.com/new)
3. Ajouter les variables d'environnement
4. Déployer ✅

**Guides détaillés :**
- 📖 [Guide complet de déploiement](./DEPLOYMENT_GUIDE.md) - Vercel, Firebase, sécurité
- ⚡ [Déploiement rapide](./DEPLOIEMENT_RAPIDE.md) - 5 minutes chrono
- 🔧 [Variables d'environnement](./env.production.example) - Template de configuration

Une fois déployé, partager ces URLs à l'équipe mobile :
```
API Base URL : https://votre-app.vercel.app
Documentation : https://votre-app.vercel.app/api-docs-mobile
```

## 📚 Documentation

### Guides de configuration
- [`SPOTIFY_SETUP.md`](./SPOTIFY_SETUP.md) - Configuration OAuth Spotify (étape par étape)
- [`MIGRATION_DEEZER_TO_SPOTIFY.md`](./MIGRATION_DEEZER_TO_SPOTIFY.md) - Pourquoi Spotify au lieu de Deezer
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) - Architecture technique détaillée
- [`QUICKSTART.md`](./QUICKSTART.md) - Guide de démarrage rapide

### Documentation API
- 📖 **[API Backend (Swagger UI)](http://127.0.0.1:3001/api-docs)** - Documentation interactive des endpoints backend
- 📱 **[API Mobile (Swagger UI)](http://127.0.0.1:3001/api-docs-mobile)** - Documentation complète pour l'app mobile (21 endpoints)
- [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md) - Guide complet d'utilisation de la documentation API
- [`API_MOBILE_COMPLETE.md`](./API_MOBILE_COMPLETE.md) - Documentation complète de l'API mobile
- [`API_MOBILE_REQUIREMENTS.md`](./API_MOBILE_REQUIREMENTS.md) - Requirements et architecture API mobile
- [`API_ENDPOINTS_LIST.md`](./API_ENDPOINTS_LIST.md) - Liste de tous les endpoints avec exemples

> **Note** : L'API mobile est 100% prête avec 21 endpoints pour l'application mobile native. Tous les appels nécessitent une authentification JWT via Supabase Auth.

## 🤝 Contribution

Ce projet est un POC pour démonstration. L'application mobile native sera développée séparément en réutilisant le même backend Supabase.

## 📄 Licence

Propriétaire - DIBS © 2025


