# 🔐 Configuration des Secrets Vercel

Ce guide explique comment créer les secrets Vercel référencés dans `vercel.json`.

## 📋 Prérequis

Installer la CLI Vercel :
```bash
npm install -g vercel
```

Se connecter :
```bash
vercel login
```

## 🔧 Créer les secrets

Exécuter ces commandes une par une en **remplaçant les valeurs** par tes vraies valeurs :

```bash
# 1. Supabase URL
vercel secrets add supabase-url "https://xxxxx.supabase.co"

# 2. Supabase Anon Key
vercel secrets add supabase-anon-key "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 3. Supabase Service Key
vercel secrets add supabase-service-key "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 4. Spotify Client ID
vercel secrets add spotify-client-id "7552cb4398ce47c588e72d59219dc512"

# 5. Spotify Client Secret
vercel secrets add spotify-client-secret "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# 6. Spotify Redirect URI
vercel secrets add spotify-redirect-uri "https://ton-app.vercel.app/api/auth/spotify/callback"

# 7. Base URL
vercel secrets add base-url "https://ton-app.vercel.app"
```

## ✅ Vérifier les secrets

```bash
vercel secrets ls
```

Tu devrais voir :
```
Name                    Created
supabase-url            XX ago
supabase-anon-key       XX ago
supabase-service-key    XX ago
spotify-client-id       XX ago
spotify-client-secret   XX ago
spotify-redirect-uri    XX ago
base-url               XX ago
```

## 🔄 Redéployer

Une fois les secrets créés, push le code :

```bash
git add vercel.json VERCEL_SECRETS_SETUP.md
git commit -m "Add Vercel secrets configuration"
git push
```

Vercel va automatiquement redéployer et utiliser les secrets ! 🚀

## 🔧 Mettre à jour un secret

```bash
vercel secrets rm nom-du-secret
vercel secrets add nom-du-secret "nouvelle-valeur"
```

Puis redéployer :
```bash
vercel --prod
```

## 📝 Notes importantes

- ⚠️ Les secrets sont **globaux** à ton compte Vercel (pas par projet)
- ✅ Les secrets ne sont **jamais** exposés dans les logs
- ✅ Le fichier `vercel.json` peut être versionné sur Git (il ne contient que des références, pas les valeurs)
- 🔒 Les secrets sont chiffrés par Vercel

## 🆘 Problème : Secret déjà existant

Si tu as l'erreur "secret already exists", supprime-le d'abord :

```bash
vercel secrets rm nom-du-secret
vercel secrets add nom-du-secret "nouvelle-valeur"
```

## 🎯 Alternative rapide

Si tu préfères ne pas utiliser la CLI, tu peux aussi :
1. Supprimer la section `"env"` de `vercel.json`
2. Garder les variables dans l'interface Vercel (Project Settings → Environment Variables)

Les deux méthodes fonctionnent ! La CLI est juste plus pratique pour partager la config.

