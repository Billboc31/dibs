# Backend Supabase - DIBS

## 🚀 Installation

### 1. Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez l'URL et la clé API (anon key)

### 2. Exécuter le schéma

Dans le dashboard Supabase :
1. Allez dans **SQL Editor**
2. Copiez le contenu de `schema.sql`
3. Exécutez le script

Ou via CLI :
```bash
npm install -g supabase
supabase login
supabase db push
```

### 3. Configuration

Copiez vos credentials dans le fichier `.env.local` du projet web :
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 📊 Structure de la base

### Tables principales
- `users` - Profils utilisateurs
- `artists` - Artistes musicaux
- `streaming_platforms` - Spotify, Apple Music, Deezer
- `user_streaming_platforms` - Connexions aux plateformes
- `user_artists` - Points de fanitude par artiste
- `qr_codes` - Codes QR scannables
- `qr_scans` - Historique des scans
- `events` - Concerts et événements
- `user_events` - Intérêt pour les événements
- `tickets` - Billets (Phase 2)
- `leaderboards` - Classements (cache)

## 🔐 Sécurité

- Row Level Security (RLS) activé
- Les utilisateurs ne peuvent accéder qu'à leurs propres données
- Données publiques accessibles en lecture seule (artistes, events, etc.)

## 📝 Données de test

Le schéma inclut des données de test :
- 6 artistes (Lady Gaga, Katy Perry, The Weeknd, etc.)
- 3 QR codes
- 3 concerts à Paris

## 🔄 Synchronisation API externes

Pour la Phase 1 (POC), les données de streaming sont mockées.
Pour la production, il faudra :
- Implémenter OAuth pour Spotify/Deezer/Apple Music
- Créer des Edge Functions pour synchroniser les données
- Mettre en place des webhooks si disponibles


