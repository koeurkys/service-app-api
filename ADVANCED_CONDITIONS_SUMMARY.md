# 🆕 Système de défis avancés (Phase 4)

## 📋 Résumé des 6 nouveaux types de conditions

### 1. **Échange d'objets** (`exchange_objects`)
- **Description**: Les utilisateurs doivent effectuer X échanges
- **Paramètre**: `requirement_value` (nombre d'échanges)
- **Interface Frontend**: 
  - Input numérique
  - Texte d'aide: "Les utilisateurs doivent effectuer X échanges d'objets"
- **Validation Backend**: Entier positif

### 2. **Partager l'application** (`share_app`)
- **Description**: Les utilisateurs doivent inviter X amis
- **Paramètre**: `requirement_value` (nombre d'amis)
- **Interface Frontend**: 
  - Input numérique
  - Texte d'aide: "Les utilisateurs doivent inviter X amis avec une référence réussie"
- **Validation Backend**: Entier positif

### 3. **Collecter des badges** (`collect_badges`)
- **Description**: Les utilisateurs doivent obtenir X badges (optionnellement dans certaines catégories)
- **Paramètres**:
  - `requirement_value` (nombre de badges)
  - `requirement_categories` (JSONB array de category IDs, null = tous les badges)
- **Interface Frontend**: 
  - Sélecteur de catégories (multi-select avec checkmarks)
  - Input numérique pour le nombre de badges
  - Texte de catégories visibles
- **Validation Backend**: 
  - Entier positif pour le nombre
  - Array d'IDs ou null pour les catégories

### 4. **Score de fiabilité** (`reliability_score`)
- **Description**: Les utilisateurs doivent maintenir X% de taux de réussite
- **Paramètre**: `requirement_value` (0-100)
- **Interface Frontend**: 
  - Input numérique
  - Symbole "%"
  - Validation max 100%
  - Texte d'aide: "Les utilisateurs doivent avoir X% ou plus de taux de réussite"
- **Validation Backend**: 
  - Entier entre 0 et 100
  - Rejet automatique si > 100 ou < 0

### 5. **Trajet en taxi** (`taxi_trip`)
- **Description**: Les utilisateurs doivent faire un trajet de X km dans la catégorie taxi
- **Paramètre**: `requirement_value` (distance en km)
- **Interface Frontend**: 
  - Input numérique
  - Symbole "km"
  - Texte d'aide: "Les utilisateurs doivent faire un trajet en taxi de X km"
- **Validation Backend**: Entier positif

### 6. **Note globale** (`global_rating`)
- **Description**: Les utilisateurs doivent avoir une note minimale de X/5
- **Paramètre**: `requirement_value` (rating * 10, ex: 4.5 → 45)
- **Interface Frontend**: 
  - Input décimal (0-5)
  - Symbole "/5"
  - Validation max 5.0
  - Texte d'aide: "Les utilisateurs doivent avoir une note globale d'au moins X/5"
- **Validation Backend**: 
  - Décimal entre 0 et 5
  - Conversion: stocké comme (value * 10) en entier
  - Rejet automatique si > 5.0

---

## 🎨 Organisation Frontend

### Groupes de condition dans `mobile/app/admin.jsx`

#### Groupe "Actions" (5 éléments)
- Vendre (`sell_services`) 🔺 *existant*
- Acheter (`buy_services`) 🔻 *existant*
- Réserver (`book_services`) 📅 *existant*
- Publier (`publish_services`) 🚀 *existant*
- Noter (`note_services`) ⭐ *existant*

#### Groupe "Communauté" (2 nouveaux éléments)
- Échanger (`exchange_objects`) 🔄
- Partager (`share_app`) 📤

#### Groupe "Performances" (4 nouveaux éléments)
- Badges (`collect_badges`) 🎀
- Fiabilité (`reliability_score`) ✓
- Taxi (`taxi_trip`) 🚕
- Note (`global_rating`) ❤️

---

## 🔧 Implémentation Technique

### Base de données (pas de changement)
Les colonnes existantes suffisent:
```sql
requirement_type VARCHAR(100)        -- Type de condition (exchange_objects, etc.)
requirement_value INTEGER            -- Valeur numérique (nombre, pourcentage, distance, rating*10)
requirement_service_type VARCHAR(50) -- 'service', 'booking', 'both'
requirement_categories JSONB         -- Array d'IDs ou null
```

### Frontend - État du formulaire
```javascript
formData = {
  requirement_type: "exchange_objects|share_app|collect_badges|reliability_score|taxi_trip|global_rating",
  requirement_value: <integer>,
  requirement_service_type: "both", // Non utilisé pour les nouveaux types
  requirement_categories: [], // Utilisé avec collect_badges
}
```

### Frontend - Styles ajoutés
```css
.helperText             /* Texte d'aide descriptif */
.percentageInputGroup   /* Container flex pour input + symbole */
.percentageSymbol       /* Symbole "%" */
.distanceInputGroup     /* Container flex pour input + symbole */
.distanceSymbol         /* Symbole "km" */
.ratingInputGroup       /* Container flex pour input + symbole */
.ratingSymbol          /* Symbole "/5" */
```

### Backend - Validations
```javascript
// Dans adminController.js
validRequirementTypes = [
  "none",
  "sell_services",
  "buy_services",
  "book_services",
  "publish_services",
  "note_services",
  "exchange_objects",    // NOUVEAU
  "share_app",           // NOUVEAU
  "collect_badges",      // NOUVEAU
  "reliability_score",   // NOUVEAU
  "taxi_trip",           // NOUVEAU
  "global_rating"        // NOUVEAU
]

// Validation des valeurs:
- Valeurs négatives: rejet
- Pourcentages > 100: rejet
- Ratings > 5.0: rejet
```

---

## ✅ Checklist d'implémentation

### Testing
- [x] Syntaxe frontend validée (ESLint)
- [x] Syntaxe backend validée
- [ ] Création de défi exchange_objects
- [ ] Création de défi share_app
- [ ] Création de défi collect_badges (avec catégories)
- [ ] Création de défi reliability_score
- [ ] Création de défi taxi_trip
- [ ] Création de défi global_rating
- [ ] Édition et mise à jour des défis
- [ ] Affichage correct dans la liste des défis
- [ ] Validation des valeurs min/max

### Documentation
- [x] Résumé des modifications
- [ ] Guides utilisateur pour l'admin
- [ ] Documentation API
- [ ] Notes de release pour les utilisateurs

---

## 🚀 Déploiement

Aucun changement de schéma BD requis - peut être déployé immédiatement!

### Fichiers modifiés:
1. `mobile/app/admin.jsx` - Interface admin + UI pour conditions
2. `backend/src/controllers/adminController.js` - Validations backend
3. `backend/ADVANCED_CONDITIONS_SUMMARY.md` - Ce fichier

### Pas de migration BD requise ✅
Les colonnes existantes sont suffisantes.

---

**Status**: ✅ Prêt pour le testing!
