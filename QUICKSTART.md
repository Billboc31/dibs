# 🚀 Guide de Démarrage Rapide - DIBS POC

## ⚡ Installation en 5 minutes

### 1. Pré-requis
- Node.js 18+ installé
- Un compte Supabase (gratuit)

### 2. Setup du Backend Supabase

#### Créer le projet Supabase
1. Allez sur [supabase.com](https://supabase.com)
2. Cliquez sur "New Project"
3. Donnez un nom à votre projet (ex: "dibs-poc")
4. Notez votre mot de passe de base de données
5. Attendez que le projet soit créé (~2 minutes)

#### Exécuter le schéma SQL
1. Dans votre dashboard Supabase, allez dans **SQL Editor** (icône dans le menu de gauche)
2. Cliquez sur "New Query"
3. Ouvrez le fichier `supabase/schema.sql` de ce projet
4. Copiez tout le contenu
5. Collez-le dans l'éditeur SQL
6. Cliquez sur "Run" (ou Ctrl+Enter)
7. Attendez le message de succès ✅

#### Récupérer vos credentials
1. Dans votre dashboard Supabase, allez dans **Settings** > **API**
2. Copiez ces deux valeurs :
   - `Project URL` (ex: `https://xxxxx.supabase.co`)
   - `anon public` key (commence par `eyJhbG...`)

### 3. Setup du Frontend

#### Installer les dépendances
```bash
npm install
```

#### Configurer l'environnement
Créez un fichier `.env.local` à la racine du projet :

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> ⚠️ Remplacez les valeurs par vos vraies credentials Supabase

#### Lancer l'application
```bash
npm run dev
```

Ouvrez votre navigateur sur [http://localhost:3000](http://localhost:3000)

## 🎮 Tester l'Application

### Workflow de Test Complet

#### 1. Créer un compte
- Allez sur `http://localhost:3000`
- Entrez votre email
- Cliquez sur "Continue"
- Vérifiez votre email et cliquez sur le lien de confirmation
- Ou utilisez Google/Apple Sign-In (nécessite configuration OAuth)

#### 2. Connecter une plateforme
- Choisissez Spotify, Apple Music ou Deezer
- (Pour le POC, c'est mocké - ça crée juste une connexion factice)

#### 3. Sélectionner des artistes
- La liste des artistes de test s'affiche
- Cliquez sur "ADD ON DIBS" pour au moins 3 artistes
- Cliquez sur "Continue"

#### 4. Autoriser la géolocalisation
- Cliquez sur "Autoriser une fois" ou "Autoriser lorsque l'app est active"
- Votre navigateur demandera la permission
- Acceptez ou refusez (optionnel pour le POC)

#### 5. Voir votre profil
- Vous êtes maintenant sur votre page profil
- Vous voyez vos statistiques
- Vos 3 artistes préférés
- Les concerts à venir

#### 6. Scanner un QR Code
- Cliquez sur l'icône 📧 en bas
- Cliquez sur "Where can I find my DIBS QR code ?"
- Entrez un code de test :
  - `ALBUM_MAYHEM_2024` (Lady Gaga, 500 points)
  - `MERCH_WEEKND_TOUR` (The Weeknd, 300 points)
  - `ALBUM_KATY_SMILE` (Katy Perry, 500 points)
- Cliquez sur "Validate Code"
- Admirez l'animation de points ! 👑

#### 7. Voir la communauté
- Retournez au profil
- Cliquez sur un artiste
- Ou allez sur `http://localhost:3000/community/[artist-id]`
- Voyez le classement des fans

## 🔍 Pages Disponibles

| Route | Description |
|-------|-------------|
| `/` | Connexion / Création de compte |
| `/connect-platform` | Choix de plateforme streaming |
| `/select-artists` | Sélection d'artistes favoris |
| `/location` | Autorisation géolocalisation |
| `/profile` | Profil utilisateur |
| `/home` | Page d'accueil (dashboard) |
| `/qr-scan` | Scanner un QR code |
| `/qr-recap?code=xxx` | Récap des points gagnés |
| `/community/[artistId]` | Classement pour un artiste |

## 🎨 Données de Test

### Artistes pré-chargés
- Lady Gaga
- Katy Perry  
- The Weeknd
- Ava Max
- Taylor Swift
- Eminem

### QR Codes de test
```
ALBUM_MAYHEM_2024    → Lady Gaga, 500 points
MERCH_WEEKND_TOUR    → The Weeknd, 300 points
ALBUM_KATY_SMILE     → Katy Perry, 500 points
```

### Concerts
- Lady Gaga - 15 juillet 2025 - AccorHotels Arena, Paris
- The Weeknd - 22 août 2025 - Stade de France, Saint-Denis
- Katy Perry - 10 septembre 2025 - La Seine Musicale, Boulogne

## 🐛 Dépannage

### "Invalid API Key"
➡️ Vérifiez que votre `.env.local` contient les bonnes credentials Supabase

### "relation does not exist"
➡️ Le schéma SQL n'a pas été exécuté. Retournez dans SQL Editor et exécutez `supabase/schema.sql`

### "User not found"
➡️ Vous devez d'abord créer un compte via la page de connexion

### L'app ne démarre pas
➡️ Vérifiez que vous avez bien exécuté `npm install`

### Problème de géolocalisation
➡️ Utilisez Chrome ou Firefox. Safari peut bloquer la géolocalisation en localhost. Ou cliquez sur "Ne pas autoriser" pour continuer sans.

## 📱 Version Mobile

Cette application web est responsive et s'affiche bien sur mobile. Pour tester :

1. Ouvrez Chrome DevTools (F12)
2. Cliquez sur l'icône mobile (Ctrl+Shift+M)
3. Choisissez "iPhone 12 Pro" ou similaire
4. Rechargez la page

Ou accédez depuis votre téléphone en utilisant l'IP locale :
```bash
npm run dev -- -H 0.0.0.0
# Puis allez sur http://[votre-ip-locale]:3000
```

## 🚀 Prochaines Étapes

Une fois le POC testé :
1. Configurer les vraies API OAuth (Spotify, Deezer, Apple Music)
2. Implémenter la synchronisation automatique des écoutes
3. Intégrer une API de concerts (Bandsintown, Songkick)
4. Développer l'application mobile native (réutilisera le même backend)
5. Ajouter le système de vente de billets (Phase 2)

## 💡 Astuces

- Les données sont partagées entre tous les utilisateurs (base commune)
- Vous pouvez créer plusieurs comptes pour tester la communauté
- Les points de fanitude sont calculés automatiquement lors de la sélection d'artistes
- La navigation se fait via les icônes en bas de page

## 📞 Support

En cas de problème :
1. Vérifiez les logs dans la console du navigateur (F12)
2. Vérifiez les logs dans le terminal où tourne `npm run dev`
3. Vérifiez les tables Supabase dans **Table Editor**

Bon test ! 🎉



