# Configuration Deezer OAuth

## 🎯 Ce qui a été fait

✅ Module Deezer API complet (`lib/deezer-api.ts`)  
✅ Page de callback OAuth (`app/api/auth/deezer/callback/route.ts`)  
✅ Intégration dans l'app (bouton Deezer fonctionne)  
✅ Synchronisation automatique des artistes favoris  
✅ Calcul des points de fanitude  

## 🔧 Configuration Requise

### 1. Créer une Application Deezer

1. Va sur [Deezer Developers](https://developers.deezer.com/myapps)
2. **Create a new application**
3. Remplis les informations :
   - **Application Name** : DIBS
   - **Description** : Music fan loyalty platform
   - **Application domain** : `localhost` (pour dev) ou ton domaine (pour prod)
   - **Redirect URL after authentication** :
     ```
     http://localhost:3001/api/auth/deezer/callback
     ```
     (Change le port si nécessaire)

4. **Submit** et attends la validation (peut prendre quelques heures)

### 2. Récupérer les Credentials

Une fois approuvé :

1. Va dans **My Apps** → Ton app
2. Tu verras :
   - **Application ID** (c'est ton Client ID)
   - **Secret Key**

### 3. Configurer les Variables d'Environnement

Ajoute ces lignes à ton fichier `.env.local` :

```bash
# Deezer OAuth
NEXT_PUBLIC_DEEZER_CLIENT_ID=your-app-id-here
DEEZER_SECRET_KEY=your-secret-key-here
```

⚠️ **Important** : 
- `NEXT_PUBLIC_DEEZER_CLIENT_ID` est public (commence par `NEXT_PUBLIC_`)
- `DEEZER_SECRET_KEY` est privée (ne commence PAS par `NEXT_PUBLIC_`)

### 4. Redémarrer l'App

```bash
# Arrête le serveur (Ctrl+C)
npm run dev
```

## 🧪 Tester la Connexion

1. Lance l'app : `npm run dev`
2. Connecte-toi avec ton email
3. Va sur `/connect-platform`
4. Clique sur **"LOG IN WITH DEEZER"**
5. Tu seras redirigé vers Deezer
6. Autorise l'accès
7. Tu reviens sur `/select-artists` avec tes artistes Deezer !

## 📊 Ce qui est récupéré

Une fois connecté, Deezer fournit :

✅ **Artistes favoris** (jusqu'à 50)  
✅ **Historique d'écoute** (200 dernières écoutes)  
✅ **Temps d'écoute par artiste** (calculé)  
✅ **Images des artistes**  
✅ **Nombre de fans par artiste**  

## 🔄 Synchronisation

### Automatique

La première connexion synchronise automatiquement :
1. Les artistes favoris de l'utilisateur
2. Le temps d'écoute estimé
3. Calcul des points de fanitude (temps × 2)

### Manuelle

Pour re-synchroniser plus tard :

```typescript
import { syncDeezerData } from '@/lib/deezer-api'

// Bouton "Sync" dans le profil
async function handleSync() {
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await syncDeezerData(user.id)
    alert('Données Deezer synchronisées !')
  }
}
```

## 🔐 Sécurité

### Token Storage

Le token d'accès Deezer est stocké de manière sécurisée dans Supabase :
- Table `user_streaming_platforms`
- Column `access_token` (encrypted at rest par Supabase)
- Row Level Security activée

### Permissions Demandées

```
- basic_access : Accès de base
- email : Email de l'utilisateur
- listening_history : Historique d'écoute
```

Pas de permission d'écriture = l'app ne peut rien modifier sur Deezer.

## 🌐 Production

### URL de Callback en Production

Quand tu déploies :

1. Retourne sur [Deezer Developers](https://developers.deezer.com/myapps)
2. Édite ton app
3. Ajoute l'URL de prod dans **Redirect URL** :
   ```
   https://ton-domaine.com/api/auth/deezer/callback
   ```
4. Garde aussi l'URL locale pour le dev

### Variables d'Environnement

Sur Vercel / Netlify / etc. :
1. Va dans **Settings** → **Environment Variables**
2. Ajoute :
   - `NEXT_PUBLIC_DEEZER_CLIENT_ID`
   - `DEEZER_SECRET_KEY`

## 🐛 Dépannage

### Erreur "Application not authorized"

➡️ L'app Deezer n'est pas encore approuvée. Attends l'email de validation.

### Erreur "Invalid redirect URI"

➡️ Vérifie que l'URL de callback dans Deezer correspond exactement à celle de ton app.

### Token expiré

Les tokens Deezer expirent après un certain temps. Pour refresh :

```typescript
// TODO: Implémenter le refresh token
// Deezer ne fournit pas de refresh token natif
// Solution : redemander l'autorisation
router.push('/connect-platform')
```

### "Failed to get access token"

➡️ Vérifie que `DEEZER_SECRET_KEY` est bien définie dans `.env.local`

## 📱 Mobile

L'API Deezer fonctionne aussi sur mobile ! Voir `MOBILE_INTEGRATION.md`.

## 🔗 Ressources

- [Deezer Developers](https://developers.deezer.com/)
- [Deezer API Documentation](https://developers.deezer.com/api)
- [OAuth Documentation](https://developers.deezer.com/api/oauth)

## ✅ Checklist

- [ ] Créer app sur Deezer Developers
- [ ] Attendre validation
- [ ] Copier App ID et Secret Key
- [ ] Ajouter dans `.env.local`
- [ ] Redémarrer l'app
- [ ] Tester la connexion
- [ ] Vérifier que les artistes sont synchronisés
- [ ] Ajouter callback URL de prod (plus tard)

---

**Connexion Deezer prête à l'emploi ! 🎵**



