# Configuration OAuth avec Supabase

## 🎯 Le code est déjà prêt !

Supabase gère automatiquement l'OAuth. Il suffit de configurer les providers dans le dashboard.

## 🔧 Configuration Rapide

### 1. Dans Supabase Dashboard

1. Va sur [supabase.com](https://supabase.com) et ouvre ton projet
2. **Authentication** → **Providers** (menu de gauche)

### 2. Configurer Google OAuth (Recommandé - le plus simple)

#### A. Dans Google Cloud Console

1. Va sur [Google Cloud Console](https://console.cloud.google.com/)
2. Crée un nouveau projet ou sélectionne un projet existant
3. **APIs & Services** → **Credentials**
4. **Create Credentials** → **OAuth 2.0 Client ID**
5. Si demandé, configure l'écran de consentement OAuth :
   - User Type: **External**
   - App name: **DIBS**
   - Support email: ton email
   - Scopes: email, profile
6. Type d'application : **Web application**
7. **Authorized redirect URIs** - Ajoute :
   ```
   https://[ton-projet-id].supabase.co/auth/v1/callback
   ```
   Remplace `[ton-projet-id]` par ton vrai ID Supabase
8. Clique **Create**
9. **Copie** le Client ID et Client Secret

#### B. Dans Supabase

1. **Authentication** → **Providers** → **Google**
2. Active le toggle **Enable Sign in with Google**
3. Colle le **Client ID**
4. Colle le **Client Secret**
5. **Save**

✅ **C'est tout ! Google OAuth fonctionne maintenant.**

### 3. Configurer Apple Sign In (Plus complexe)

#### A. Dans Apple Developer

1. Va sur [Apple Developer](https://developer.apple.com/)
2. **Certificates, Identifiers & Profiles**
3. **Identifiers** → **+** → **Services IDs**
4. Description: **DIBS Auth**
5. Identifier: `com.dibs.auth` (ou ton propre bundle ID)
6. Continue → **Sign In with Apple** → Configure
7. Primary App ID: sélectionne ou crée un App ID
8. **Return URLs** :
   ```
   https://[ton-projet-id].supabase.co/auth/v1/callback
   ```
9. **Save** → **Continue** → **Register**

#### B. Créer une clé privée

1. **Keys** → **+**
2. Key Name: **DIBS Apple Key**
3. **Sign in with Apple** → Configure
4. Primary App ID: même que ci-dessus
5. **Save** → **Continue** → **Register**
6. **Download** la clé (fichier .p8) - tu ne pourras la télécharger qu'une fois !
7. Note le **Key ID** (10 caractères)

#### C. Dans Supabase

1. **Authentication** → **Providers** → **Apple**
2. Active **Enable Sign in with Apple**
3. **Services ID**: ton identifier (ex: `com.dibs.auth`)
4. **Team ID**: trouve-le dans Apple Developer → Membership
5. **Key ID**: celui noté à l'étape précédente
6. **Private Key**: ouvre le fichier .p8 et copie tout le contenu
7. **Save**

✅ **Apple Sign In est configuré !**

## 🚀 Autres Providers Simples

### GitHub (Le plus rapide à configurer)

1. Va sur [GitHub Settings](https://github.com/settings/developers)
2. **OAuth Apps** → **New OAuth App**
3. **Application name**: DIBS
4. **Homepage URL**: `http://localhost:3001` (ou ton domaine)
5. **Authorization callback URL**:
   ```
   https://[ton-projet-id].supabase.co/auth/v1/callback
   ```
6. **Register application**
7. Copie le **Client ID**
8. **Generate a new client secret** → Copie-le
9. Dans Supabase : **Authentication** → **Providers** → **GitHub**
10. Colle Client ID et Secret → **Save**

### Facebook

1. [Facebook Developers](https://developers.facebook.com/)
2. **My Apps** → **Create App**
3. Type: **Consumer**
4. **Settings** → **Basic**
5. Copie **App ID** et **App Secret**
6. **Add Platform** → **Website**
7. Site URL: ton domaine
8. Dans Supabase : active Facebook et colle les credentials

## 📧 Email uniquement (Pas besoin de config OAuth)

Pour tester rapidement **sans configurer OAuth** :

1. Utilise juste l'email sur la page de connexion
2. Supabase enverra un **magic link** à l'email
3. Clique sur le lien dans l'email → tu es connecté !

**Note** : Pour que les emails fonctionnent en prod, configure un service SMTP dans Supabase → **Authentication** → **Email Templates**

## 🧪 Test en Local

Après configuration :

1. Lance l'app : `npm run dev`
2. Va sur `http://localhost:3001`
3. Clique sur **Continue with Google** (ou autre provider)
4. Tu seras redirigé vers Google
5. Connecte-toi
6. Tu reviendras sur `/connect-platform` ✅

## ⚠️ Important

### Redirect URLs en Production

Quand tu déploies en production, ajoute aussi l'URL de prod dans :
- Les redirect URIs de Google/Apple/GitHub
- **Supabase** → **Authentication** → **URL Configuration** → **Redirect URLs**

Exemple :
```
https://dibs.app/connect-platform
```

### Sécurité

- Ne commit **JAMAIS** les secrets dans Git
- Les credentials OAuth restent dans Supabase (côté serveur)
- Les clients reçoivent uniquement des tokens JWT

## 📝 Résumé

| Provider | Difficulté | Temps config |
|----------|-----------|--------------|
| Email (Magic Link) | ✅ Facile | 0 min (déjà actif) |
| GitHub | ✅ Facile | 5 min |
| Google | 🟡 Moyen | 10 min |
| Apple | 🔴 Complexe | 20 min |
| Facebook | 🟡 Moyen | 10 min |

## 🆘 Debug

Si OAuth ne fonctionne pas :

1. Vérifie que le provider est **activé** dans Supabase
2. Vérifie les **Redirect URLs** (doivent être identiques partout)
3. Regarde les logs : Supabase Dashboard → **Authentication** → **Logs**
4. Console du navigateur (F12) pour voir les erreurs

## 🔗 Liens Utiles

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Google OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Apple Sign In Setup](https://supabase.com/docs/guides/auth/social-login/auth-apple)
- [GitHub OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-github)



