# 🔐 HTTPS en local pour Spotify

Spotify exige parfois HTTPS même pour le développement. Voici comment le configurer.

## 🎯 Solution Recommandée : ngrok (Le plus simple !)

### 1. Installer ngrok

Télécharge et installe ngrok : https://ngrok.com/download

### 2. Lancer ton app Next.js

```bash
npm run dev
```

### 3. Dans un autre terminal, lancer ngrok

```bash
ngrok http 3000
```

### 4. Copier l'URL HTTPS

ngrok te donnera une URL comme :
```
https://abc123-456-789.ngrok-free.app
```

### 5. Configurer Spotify

Dans le [Spotify Dashboard](https://developer.spotify.com/dashboard) :

**Redirect URI** :
```
https://abc123-456-789.ngrok-free.app/api/auth/spotify/callback
```

### 6. Tester

Ouvre l'URL ngrok dans ton navigateur au lieu de localhost !

---

## 🛠️ Solution Alternative : HTTPS Local (Plus complexe)

Si tu veux vraiment HTTPS sur localhost (certificat auto-signé) :

### Sur Windows

1. **Installer OpenSSL**
   - Télécharge : https://slproweb.com/products/Win32OpenSSL.html
   - Installe "Win64 OpenSSL v3.x.x Light"

2. **Générer les certificats**
   ```bash
   node generate-ssl.js
   ```

3. **Lancer avec HTTPS**
   ```bash
   node server.js
   ```

4. **Accéder à**
   ```
   https://localhost:3000
   ```

5. **Accepter le certificat**
   - Ton navigateur va afficher un avertissement
   - Clique sur "Avancé" → "Continuer vers localhost"

6. **Configurer Spotify**
   ```
   https://localhost:3000/api/auth/spotify/callback
   ```

---

## ✅ Recommandation

**Utilise ngrok** ! C'est beaucoup plus simple et ça fonctionne immédiatement.

### Avantages ngrok :
- ✅ Pas besoin d'installer OpenSSL
- ✅ Certificat HTTPS valide (pas d'avertissement)
- ✅ Fonctionne immédiatement
- ✅ Tu peux même tester depuis ton téléphone !

### Inconvénient :
- ⚠️ L'URL change à chaque redémarrage (gratuit)
- ⚠️ URL fixe avec compte payant ($8/mois)

---

## 🚀 Commandes Rapides

### Avec ngrok (recommandé)

Terminal 1 :
```bash
npm run dev
```

Terminal 2 :
```bash
ngrok http 3000
```

Puis utilise l'URL HTTPS fournie par ngrok !

---

## 💡 Note

Une fois en production sur Vercel/Netlify, tu auras automatiquement HTTPS et tu n'auras plus besoin de ngrok.


