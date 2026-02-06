# 🚀 Services App - Backend Configuration Guide

## Déploiement sur Render

### 1️⃣ Variables d'environnement requises

Sur Render, définissez ces variables d'environnement dans **Settings > Environment**:

#### 🔐 **Authentification Clerk**
```
CLERK_SECRET_KEY=sk_test_xxx  # Depuis Clerk Dashboard
CLERK_PUBLISHABLE_KEY=pk_test_xxx
```

#### 🗄️ **Base de données PostgreSQL**
```
DATABASE_URL=postgresql://user:password@host:port/database
```
*Utilisez Neon ou tout autre service PostgreSQL compatible*

#### 🏞️ **Stockage d'images (Cloudinary)**
```
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

#### ⚡ **Rate Limiting (Optionnel)**
```
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=token_xxx
```

#### 🌐 **Configuration serveur**
```
PORT=5001  # Render détecte automatiquement
NODE_ENV=production
API_URL=https://your-app-name.onrender.com
```

### 2️⃣ Guide de déploiement

1. **Créer un service Web sur Render**
   - Connecter votre repo GitHub
   - Branch: `main`
   - Root directory: `backend`

2. **Build command**
   ```bash
   npm install
   ```

3. **Start command**
   ```bash
   npm run start
   ```

4. **Attendre que les logs affichent**
   ```
   🚀 Server running on 0.0.0.0:5001
   ✅ Health check: http://...
   ```

### 3️⃣ Troubleshooting

**Le serveur s'arrête silencieusement?**
- Vérifier que `DATABASE_URL` est défini ✅
- Vérifier que `CLERK_SECRET_KEY` est défini ✅
- Regarder les logs: `Environment Check` doit afficher ✅ pour tous les éléments critiques

**"No open ports detected"?**
- C'est normal, attendez 10 secondes après que le log `🚀 Server running` s'affiche

**Erreurs de base de données?**
- Vérifier la chaîne `DATABASE_URL`
- S'assurer que PostgreSQL est accessible depuis Render
- Vérifier les pare-feu et les droits d'accès

### 4️⃣ Points de terminaison de test

- `GET /api/health` - Vérifier l'état du serveur
- `GET /api/test` - Réponse simple du serveur
- `GET /api/wake` - Endpoint pour keeper alive (cron job)

### 5️⃣ Base de données

Le schéma est créé automatiquement au premier démarrage:
- Tables: users, categories, profiles, services, bookings, reviews, badges, challenges, etc.
- Migrations: automatiques via `initDB()`
- Indexes: automatiquement créés pour les performances

---

**Besoin d'aide?** Vérifiez les logs Render pour plus de détails! 🔍
