# Architecture DIBS

## 📐 Vue d'ensemble

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENTS                               │
├─────────────────────────────────────────────────────────┤
│  Web App (POC)  │  Mobile iOS  │  Mobile Android        │
│   Next.js       │   React Native / Swift / Kotlin       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  SUPABASE BACKEND                        │
├─────────────────────────────────────────────────────────┤
│  • PostgreSQL Database                                   │
│  • Auth (Email, Google, Apple, OAuth)                   │
│  • REST API Auto-générée                                │
│  • Row Level Security (RLS)                             │
│  • Edge Functions (Node.js/Deno)                        │
│  • Storage (Images, Assets)                             │
│  • Realtime Subscriptions                               │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              SERVICES EXTERNES                           │
├─────────────────────────────────────────────────────────┤
│  • Spotify API                                          │
│  • Apple Music API                                      │
│  • Deezer API                                           │
│  • Bandsintown / Songkick (concerts)                    │
│  • Stripe (paiements - Phase 2)                         │
└─────────────────────────────────────────────────────────┘
```

## 🗂️ Structure du Projet

```
dibs/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Page de connexion
│   ├── layout.tsx                # Layout global
│   ├── globals.css               # Styles globaux
│   ├── connect-platform/         # Connexion plateforme streaming
│   ├── select-artists/           # Sélection artistes favoris
│   ├── location/                 # Géolocalisation
│   ├── profile/                  # Profil utilisateur
│   ├── home/                     # Dashboard
│   ├── qr-scan/                  # Scanner QR
│   ├── qr-recap/                 # Récap points scan
│   └── community/[artistId]/     # Classement communauté
│
├── components/                   # Composants réutilisables
│   ├── DibsLogo.tsx             # Logo DIBS
│   ├── BottomNav.tsx            # Navigation bottom bar
│   └── StatusBar.tsx            # Barre de status mobile
│
├── lib/                         # Utilitaires & configuration
│   ├── supabase.ts              # Client Supabase + types
│   └── helpers.ts               # Fonctions utilitaires
│
├── supabase/                    # Backend Supabase
│   ├── schema.sql               # Schéma de base de données
│   └── README.md                # Documentation backend
│
├── public/                      # Assets statiques
│
├── .env.local                   # Variables d'environnement (local)
├── package.json                 # Dépendances npm
├── tsconfig.json                # Configuration TypeScript
├── tailwind.config.js           # Configuration Tailwind
├── next.config.js               # Configuration Next.js
├── README.md                    # Documentation principale
├── QUICKSTART.md                # Guide démarrage rapide
└── ARCHITECTURE.md              # Ce fichier
```

## 🗄️ Base de Données

### Schéma Entité-Relations

```
┌─────────────┐
│    users    │
└──────┬──────┘
       │
       ├──────────────────┐
       │                  │
       ▼                  ▼
┌──────────────────┐  ┌─────────────────────┐
│ user_streaming_  │  │   user_artists      │
│   platforms      │  │  (fanitude points)  │
└─────────┬────────┘  └──────┬──────────────┘
          │                  │
          ▼                  ▼
┌─────────────────┐   ┌─────────────┐
│   streaming_    │   │   artists   │
│   platforms     │   └──────┬──────┘
└─────────────────┘          │
                             │
         ┌───────────────────┼───────────────┐
         ▼                   ▼               ▼
  ┌─────────────┐    ┌──────────┐    ┌──────────┐
  │  qr_codes   │    │  events  │    │ leader-  │
  └──────┬──────┘    └────┬─────┘    │  boards  │
         │                │           └──────────┘
         ▼                ▼
  ┌─────────────┐   ┌────────────┐
  │  qr_scans   │   │ user_      │
  └─────────────┘   │  events    │
                    └────────────┘
```

### Tables Principales

#### `users`
- Profils utilisateurs étendus
- Localisation (lat/lng)
- Informations personnelles

#### `artists`
- Artistes musicaux
- IDs externes (Spotify, Apple Music, Deezer)
- Images

#### `user_artists`
- **Cœur du système de fanitude**
- Points par artiste
- Temps d'écoute
- Date de dernière sync

#### `qr_codes`
- Codes scannables sur produits
- Valeur en points
- Lien vers artiste
- Limite de scans

#### `events`
- Concerts et événements
- Localisation géographique
- Informations de vente (Phase 2)

#### `tickets` (Phase 2)
- Billets de concert
- Placement dans la salle
- QR code d'entrée

## 🔐 Sécurité

### Row Level Security (RLS)

Toutes les tables sensibles ont RLS activé :

```sql
-- Exemple: users ne peuvent voir que leur propre profil
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- user_artists: lecture/écriture propre uniquement
CREATE POLICY "Users can manage own artists" ON user_artists
    FOR ALL USING (auth.uid() = user_id);
```

### Authentification

```
┌──────────────────────────────────────┐
│     Méthodes d'authentification      │
├──────────────────────────────────────┤
│  1. Email + Magic Link (OTP)         │
│  2. Google OAuth                     │
│  3. Apple Sign-In                    │
│  4. OAuth Streaming (Phase 2)        │
│     - Spotify OAuth 2.0              │
│     - Apple Music OAuth              │
│     - Deezer OAuth                   │
└──────────────────────────────────────┘
```

## 🔄 Flux de Données

### 1. Onboarding

```
User → Sign Up
  ↓
Create Auth User (Supabase Auth)
  ↓
Create User Profile (users table)
  ↓
Connect Streaming Platform (OAuth)
  ↓
Store Tokens (user_streaming_platforms)
  ↓
Fetch Top Artists (API externe)
  ↓
User Selects Artists
  ↓
Create user_artists entries
  ↓
Calculate Initial Points (listening time × 2)
```

### 2. Scan QR Code

```
User Scans QR
  ↓
Validate QR Code (qr_codes table)
  ↓
Check if already scanned (qr_scans)
  ↓
Record Scan (insert qr_scans)
  ↓
Update Fanitude Points (user_artists)
  ↓
Show Recap with Animation
```

### 3. Synchronisation Écoutes (Production)

```
Cron Job (toutes les heures)
  ↓
For each user:
  ↓
  Fetch new listening data (Spotify/Deezer API)
  ↓
  Calculate new minutes listened
  ↓
  Convert to points (1 min = 2 points)
  ↓
  Update user_artists
  ↓
  Recalculate leaderboards
```

## 🎨 Frontend - Next.js

### Architecture des Pages

```
App Router (Next.js 14)
├── Server Components (par défaut)
│   └── Layout, logos statiques
│
└── Client Components ('use client')
    ├── Forms avec états
    ├── Navigation interactive
    ├── Appels API Supabase
    └── Gestion auth
```

### State Management

**Pas de Redux/Zustand nécessaire** pour le POC :
- State local avec `useState`
- Supabase queries avec `useEffect`
- Navigation avec Next.js Router

Pour production :
- Ajouter React Query pour cache
- Ou SWR pour fetching optimisé

### Styling

**Tailwind CSS** + Design System personnalisé :
```css
--dibs-yellow: #FDB913
--spotify-green: #1DB954
--apple-red: #FC3C44
--deezer-purple: #A238FF
```

Mobile-first : `max-width: 480px` centré

## 🔌 API & Intégrations

### Supabase Client

```typescript
import { supabase } from '@/lib/supabase'

// Queries
const { data } = await supabase
  .from('artists')
  .select('*')
  .order('name')

// Inserts
await supabase
  .from('qr_scans')
  .insert({ user_id, qr_code_id, points_earned })

// Auth
await supabase.auth.signInWithOAuth({ provider: 'google' })
```

### API Externes (Phase 2)

#### Spotify API
```
GET /v1/me/top/artists
GET /v1/me/player/recently-played
```

#### Concerts API (Bandsintown)
```
GET /artists/{artist_name}/events
```

## 📊 Calcul des Points

### Formule de Base

```
Fanitude Points = (Listening Minutes × 2) + QR Scan Points
```

### Sources de Points

| Source | Points | Fréquence |
|--------|--------|-----------|
| 1 minute d'écoute | 2 points | Continu |
| Scan QR Album | 500 points | Une fois |
| Scan QR Merch | 300 points | Une fois |
| Concert assisté | 1000 points | Par concert |
| Fan meetup | 200 points | Par meetup |

## 🚀 Déploiement

### POC (Actuel)
```
Vercel (recommandé pour Next.js)
├── Push to GitHub
├── Connect Vercel
├── Add env variables
└── Auto-deploy on push
```

### Production

```
Frontend: Vercel / Netlify
Backend: Supabase Cloud
CDN: Vercel Edge Network
```

### Variables d'Environnement

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# OAuth (Phase 2)
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
APPLE_MUSIC_KEY=
DEEZER_APP_ID=

# Stripe (Phase 3)
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
```

## 🔮 Évolution Future

### Phase 1 : POC ✅
- Backend Supabase
- Authentification
- Sélection artistes (mock)
- Scan QR
- Classements

### Phase 2 : MVP
- Vraies API OAuth streaming
- Sync automatique écoutes
- API concerts externes
- Notifications push
- App mobile native

### Phase 3 : Ticketing
- Vente de billets
- File d'attente prioritaire
- Paiement Stripe
- QR codes d'entrée
- Gestion des places

### Phase 4 : Scale
- Analytics avancés
- Recommendations IA
- Social features
- Gamification
- Partenariats labels

## 🧪 Tests (À implémenter)

```
tests/
├── unit/
│   ├── helpers.test.ts
│   └── components.test.tsx
│
├── integration/
│   ├── auth.test.ts
│   └── qr-scan.test.ts
│
└── e2e/
    ├── onboarding.spec.ts
    └── full-workflow.spec.ts
```

## 📈 Monitoring (Production)

```
Outils recommandés:
├── Sentry (error tracking)
├── Vercel Analytics (web vitals)
├── Supabase Logs (backend)
└── Mixpanel / Amplitude (user analytics)
```

## 🤝 Contribution

Architecture modulaire permet :
- Backend réutilisable par mobile
- Composants React isolés
- API claire et documentée
- Ajout de features sans breaking changes

---

**Version:** 1.0.0 (POC)  
**Dernière mise à jour:** 2025-01-13



