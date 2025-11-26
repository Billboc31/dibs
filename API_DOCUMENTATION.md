# 📚 DIBS API Documentation

Documentation complète et interactive de l'API DIBS avec Swagger UI.

## 🚀 Accéder à la documentation

### En développement

Ouvre ton navigateur et va sur :

```
http://127.0.0.1:3001/api-docs
```

Ou :

```
http://localhost:3001/api-docs
```

## ✨ Fonctionnalités

✅ **Documentation complète** de tous les endpoints  
✅ **Interface interactive** pour tester les API  
✅ **Schémas de données** détaillés  
✅ **Exemples de requêtes** et réponses  
✅ **Support OAuth** et authentification  

## 📋 Endpoints documentés

### 🔐 Authentication

- **GET** `/api/auth/spotify/callback` - Callback OAuth Spotify
- **GET** `/api/auth/deezer/callback` - Callback OAuth Deezer (DEPRECATED)

### 🎵 Spotify

- **POST** `/api/sync-spotify` - Synchroniser les données Spotify (Next.js API Route)

### 👤 User

- **POST** `/api/reset-user-data` - Réinitialiser les données utilisateur

### 🎤 Artists (Supabase Edge Functions)

- **POST** `/functions/v1/add-user-artists` - Ajouter/Mettre à jour les artistes de l'utilisateur

### 📱 QR Codes (Supabase Edge Functions)

- **POST** `/functions/v1/scan-qr-code` - Scanner un QR code et gagner des points

### 🔄 Streaming (Supabase Edge Functions)

- **POST** `/functions/v1/sync-streaming-data` - Synchroniser les données de streaming

## 🧪 Tester les endpoints

### Depuis Swagger UI

1. Va sur `http://127.0.0.1:3001/api-docs`
2. Trouve l'endpoint que tu veux tester
3. Clique sur **"Try it out"**
4. Remplis les paramètres requis
5. Clique sur **"Execute"**
6. Vois la réponse en temps réel !

### Exemple : Tester `/api/sync-spotify`

```json
{
  "userId": "ton-user-id-ici"
}
```

Clique sur **Execute** et tu verras :

```json
{
  "success": true,
  "synced": 8,
  "message": "8 artistes synchronisés"
}
```

## 🔑 Obtenir ton User ID

Pour tester les endpoints qui nécessitent un `userId`, tu peux :

### Option 1 : Depuis la console du navigateur

1. Va sur n'importe quelle page de l'app
2. Ouvre la console (F12)
3. Tape :
```javascript
supabase.auth.getUser().then(r => console.log(r.data.user.id))
```

### Option 2 : Depuis Supabase Dashboard

1. Va sur **Supabase Dashboard** → **Authentication** → **Users**
2. Copie l'ID de ton utilisateur

## 📖 Format OpenAPI

La documentation suit le standard **OpenAPI 3.0**, ce qui te permet de :

- **Générer des clients** automatiquement
- **Importer dans Postman** ou Insomnia
- **Partager** facilement avec ton équipe
- **Versionner** la documentation

## 🔄 Exporter la spec

Pour obtenir la spec JSON brute :

```bash
curl http://127.0.0.1:3001/api/docs
```

Ou va directement sur :
```
http://127.0.0.1:3001/api/docs
```

## 🛠️ Ajouter un nouvel endpoint

Pour documenter un nouvel endpoint, modifie `lib/swagger.ts` :

```typescript
'/api/ton-endpoint': {
  post: {
    tags: ['Tag'],
    summary: 'Résumé court',
    description: 'Description détaillée',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              param: { type: 'string' }
            }
          }
        }
      }
    },
    responses: {
      '200': {
        description: 'Success',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Success' }
          }
        }
      }
    }
  }
}
```

## 📚 Ressources

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/docs/open-source-tools/swagger-ui/)
- [HTTP Status Codes](https://httpstatuses.com/)

## 🎯 Alternatives

Si tu préfères d'autres outils :

### Postman
1. Exporte la spec : `http://127.0.0.1:3001/api/docs`
2. Importe dans Postman : **Import** → **Raw text** → Colle le JSON

### Insomnia
1. Exporte la spec
2. Importe dans Insomnia : **Import/Export** → **Import Data**

### Bruno / Thunder Client
Compatible avec OpenAPI 3.0 spec

## ⚡ Astuces

- **Raccourci**: Ajoute un favori vers `/api-docs` dans ton navigateur
- **Dark mode**: Swagger UI supporte le dark mode automatiquement
- **Search**: Utilise Ctrl+F pour chercher dans la doc
- **Collapse all**: Ferme toutes les sections pour une vue d'ensemble

---

**Happy Testing!** 🎉

