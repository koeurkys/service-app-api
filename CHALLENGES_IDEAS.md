# 📋 Liste complète des défis imaginables

> Cette document liste tous les défis possibles pour l'application et identifie les conditions manquantes

---

## 🎯 DÉFIS PAR CATÉGORIE

### 1️⃣ DÉFIS D'ACTIONS (Services & Transactions)

#### A. Service Creation & Posting
- [ ] **"Le nouveau commerçant"** - Publier son 1er service
  - Condition: `publish_services` (qty=1)
  
- [ ] **"Le productif"** - Publier 5 services
  - Condition: `publish_services` (qty=5)
  
- [ ] **"L'entrepreneur"** - Publier 10 services
  - Condition: `publish_services` (qty=10)
  
- [ ] **"L'arsenal"** - Avoir 20+ services actifs simultanément
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `active_services_count`
  
- [ ] **"Le spécialiste"** - Publier 5 services dans une même catégorie
  - ⚠️ **CONDITION À MODIFIER**: `publish_services` + catégorie spécifique

#### B. Buying & Purchasing
- [ ] **"L'acheteur curieux"** - Acheter 3 services
  - Condition: `buy_services` (qty=3)
  
- [ ] **"Le shopper"** - Acheter 10 services
  - Condition: `buy_services` (qty=10)
  
- [ ] **"Le collecteur"** - Acheter dans 5 catégories différentes
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `buy_from_categories_count`
  
- [ ] **"Sans préférence"** - Acheter des services de 5 prestataires différents
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `buy_from_different_providers`

#### C. Selling & Revenue
- [ ] **"Le vendeur"** - Vendre 1 service
  - Condition: `sell_services` (qty=1)
  
- [ ] **"Le businessman"** - Vendre 5 services
  - Condition: `sell_services` (qty=5)
  
- [ ] **"L'empire"** - Vendre 20 services
  - Condition: `sell_services` (qty=20)
  
- [ ] **"Le populaire"** - Vendre des services à 10 clients différents
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `sell_to_different_buyers`
  
- [ ] **"Le multitâche"** - Avoir 5+ services en cours de vente simultanément
  - ⚠️ **CONDITION À MODIFIER**: Besoin de vérifier les statuts

#### D. Booking & Reservations
- [ ] **"Le voyageur"** - Faire 3 réservations de taxi
  - ⚠️ **CONDITION À MODIFIER**: `book_services` pour catégorie taxi spécifiquement
  
- [ ] **"L'explorateur"** - Réserver 10 services/experiences
  - Condition: `book_services` (qty=10)
  
- [ ] **"Le nomade"** - Réserver dans 8 catégories différentes
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `book_from_categories_count`
  
- [ ] **"Le client fidèle"** - Réserver 3 fois chez le même prestataire
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `book_same_provider`

#### E. Rating & Reviews
- [ ] **"Le critique"** - Noter 3 services/expériences
  - Condition: `note_services` (qty=3)
  
- [ ] **"L'avis"** - Écrire 10 avis
  - Condition: `note_services` (qty=10)
  
- [ ] **"Le généreux"** - Donner 5 avis avec 5 étoiles
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `rate_with_minimum_stars`
  
- [ ] **"L'honnête"** - Donner des avis variés (au moins 1 de 1-2 stars, 3-4 stars, 5 stars)
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `diverse_ratings_pattern`
  
- [ ] **"L'équilibré"** - Maintenir une moyenne d'avis de 4.0+ sur 10 services notés
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `average_rating_on_transactions`

---

### 2️⃣ DÉFIS D'ÉCHANGES & PARTAGE

#### A. Object Exchanges
- [ ] **"L'échangiste"** - Faire 1 échange d'objet
  - Condition: `exchange_objects` (qty=1)
  
- [ ] **"Le négociateur"** - Faire 5 échanges
  - Condition: `exchange_objects` (qty=5)
  
- [ ] **"Le collecteur d'échanges"** - Faire 10 échanges réussis
  - Condition: `exchange_objects` (qty=10)
  
- [ ] **"L'échange rapide"** - Faire un échange dans les 24h après une demande
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `exchange_time_requirement`
  
- [ ] **"L'équitable"** - Faire 3 échanges sans déséquilibre de valeur (rating du partenaire)
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `balanced_exchanges`

#### B. App Sharing & Referral
- [ ] **"L'ambassadeur"** - Inviter 3 amis (avec inscription validée)
  - Condition: `share_app` (qty=3)
  
- [ ] **"L'influenceur"** - Inviter 10 amis
  - Condition: `share_app` (qty=10)
  
- [ ] **"Le pirate de recrutement"** - Avoir 20 amis invités
  - Condition: `share_app` (qty=20)
  
- [ ] **"Le parrain"** - Inviter quelqu'un qui devient prestataire
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `invite_and_become_provider`
  
- [ ] **"Le réseau"** - Avoir au moins 15 amis sur l'app
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `total_friends_count`

#### C. Communication & Messages
- [ ] **"Le communicatif"** - Envoyer 10 messages
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `messages_sent_count`
  
- [ ] **"Le responsif"** - Envoyer une réponse dans les 2h en moyenne
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `average_response_time`
  
- [ ] **"La conversation"** - Avoir une conversation avec 10+ personnes différentes
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `unique_conversations`
  
- [ ] **"L'échange d'idées"** - Avoir une conversation ≥5 messages avec quelqu'un
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `conversation_depth`

---

### 3️⃣ DÉFIS DE PROFIL & RÉPUTATION

#### A. Profile Completion
- [ ] **"L'identité"** - Compléter 50% du profil
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `profile_completion_percentage`
  
- [ ] **"L'authentique"** - Compléter 90% du profil
  - ⚠️ **CONDITION À MODIFIER**: Même condition mais 90%
  
- [ ] **"La transparence"** - Tous les champs du profil remplis
  - ⚠️ **CONDITION À MODIFIER**: 100% profil complété
  
- [ ] **"La photo"** - Ajouter une photo de profil de bonne qualité
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `has_quality_avatar`
  
- [ ] **"La vérification"** - Être vérifié(e) par email + téléphone
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `verified_email_and_phone`

#### B. Rating & Reputation
- [ ] **"La fiabilité"** - Maintenir 90% de note de fiabilité
  - Condition: `reliability_score` (qty=90)
  
- [ ] **"L'excellent"** - Avoir une note globale ≥ 4.5/5
  - Condition: `global_rating` (qty=4.5)
  
- [ ] **"L'exceptionnel"** - Avoir une note de 5/5 avec minimum 10 avis
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `perfect_rating_with_min_reviews`
  
- [ ] **"La croissance"** - Augmenter sa note de 0.5+ points
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `rating_improvement`
  
- [ ] **"L'stable"** - Maintenir une note ≥ 4.0 pendant 30 jours
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `sustained_rating_period`

#### C. Badges & Achievements
- [ ] **"Le collecteur"** - Obtenir 5 badges
  - Condition: `collect_badges` (qty=5)
  
- [ ] **"L'expert"** - Obtenir 15 badges
  - Condition: `collect_badges` (qty=15)
  
- [ ] **"L'omniscient"** - Obtenir tous les badges disponibles
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `all_badges_collected`
  
- [ ] **"L'illustre"** - Avoir 3+ badges d'or
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `badges_by_tier`
  
- [ ] **"Le spécialiste"** - Avoir tous les badges d'une catégorie
  - ⚠️ **CONDITION À MODIFIER**: `collect_badges` pour catégorie spécifique

---

### 4️⃣ DÉFIS DE MOBILITÉ & TRAJETS

#### A. Taxi & Transport (Ride-sharing)
- [ ] **"Le mobile"** - Faire 1 trajet en taxi
  - Condition: `taxi_trip` (qty=1)
  
- [ ] **"Le voyageur"** - Faire 10 trajets en taxi
  - Condition: `taxi_trip` (qty=10)
  
- [ ] **"L'explorer"** - Faire un trajet de 50+ km
  - Condition: `taxi_trip` (qty=50)
  
- [ ] **"L'épique"** - Faire 500 km cumulés en taxi
  - Condition: `taxi_trip` (qty=500)
  
- [ ] **"Le routard"** - Faire 10 trajets différents (pas le même trajet)
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `unique_taxi_routes`
  
- [ ] **"Le fiable"** - Faire 5 trajets sans aucune plainte
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `taxi_trips_without_complaints`
  
- [ ] **"La confiance"** - Avoir une moyenne ≥ 4.5 sur les trajets en taxi
  - ⚠️ **CONDITION À MODIFIER**: Rating spécifique taxi

#### B. Trajectory Patterns
- [ ] **"Le régulier"** - Utiliser le même itinéraire 5 fois
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `repeated_route`
  
- [ ] **"Le matinal"** - Faire 3 trajets avant 8h du matin
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `time_based_trips`
  
- [ ] **"Le social"** - Faire un trajet avec 2+ passagers en même temps
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `shared_rides_count`

---

### 5️⃣ DÉFIS D'ENGAGEMENT & LOYAUTÉ

#### A. Duration & Longevity
- [ ] **"L'ancien"** - Être membre depuis 30 jours
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `account_age_days`
  
- [ ] **"Le vétéran"** - Être membre depuis 1 an
  - ⚠️ **CONDITION À MODIFIER**: 365 jours
  
- [ ] **"L'immortel"** - Être le plus ancien profil (top 1)
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `oldest_member_rank`
  
- [ ] **"L'habitué"** - Faire une transaction par semaine pendant 4 semaines
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `weekly_activity_streak`

#### B. Streaks & Consistency
- [ ] **"Le constant"** - Faire une action chaque jour pendant 7 jours
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `daily_action_streak`
  
- [ ] **"L'indefectible"** - Maintenir 30 jours sans inactivité
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `inactivity_free_days`
  
- [ ] **"Le feu"** - Avoir une streak de 50 jours d'activité
  - ⚠️ **CONDITION À MODIFIER**: 50 jours

#### C. Seasonal & Limited Time
- [ ] **"Le noël"** - Faire une transaction en décembre
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `seasonal_activity_month`
  
- [ ] **"L'épique"** - Compléter un événement limité (Ex: Défi du mois)
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `event_participation`
  
- [ ] **"Le rapide"** - Compléter une action dans 48h après activation
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `time_limited_challenge`

---

### 6️⃣ DÉFIS SOCIAUX & COLLECTIFS

#### A. Community Participation
- [ ] **"Le social"** - Avoir 20 followers
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `followers_count`
  
- [ ] **"La célébrité"** - Avoir 100 followers
  - ⚠️ **CONDITION À MODIFIER**: 100 followers
  
- [ ] **"L'influent"** - Être suivi par plus de 1% de la communauté
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `followers_percentage`
  
- [ ] **"L'admiré"** - Avoir 10 personnes qui le suivent
  - ⚠️ **CONDITION À MODIFIER**: 10 followers

#### B. Helping & Support
- [ ] **"L'aide"** - Aider quelqu'un (être noté positivement dans une critique)
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `positive_mentions_in_reviews`
  
- [ ] **"Le confiant"** - Être recommandé 5 fois
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `recommendations_count`
  
- [ ] **"Le héros"** - Résoudre un problème (commentaire positif après conflit)
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `positive_conflict_resolution`

#### C. Trust & Vouching
- [ ] **"Le garant"** - Valider/vérifier le profil de 3 personnes
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `verified_others_count`
  
- [ ] **"Le fiable"** - Être verrouillé comme prestataire de confiance par quelqu'un
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `trusted_by_users_count`

---

### 7️⃣ DÉFIS DE SPÉCIALISATION

#### A. Category Mastery
- [ ] **"L'expert taxi"** - Avoir 20 trajets en taxi + rating ≥ 4.5
  - ⚠️ **CONDITION COMPOSITE REQUISE**
  
- [ ] **"L'expert service"** - Vendre 10 services d'une catégorie spécifique
  - ⚠️ **CONDITION À MODIFIER**: `sell_services` par catégorie
  
- [ ] **"L'ami des autos"** - Faire 50+ km en taxi + noter bien le chauffeur
  - ⚠️ **CONDITION COMPOSITE REQUISE**
  
- [ ] **"L'écologiste"** - Partager 20 trajets (split rides)
  - ⚠️ **CONDITION À MODIFIER**: shared_rides
  
- [ ] **"Le routier"** - Faire 1000+ km cumulés
  - Condition: `taxi_trip` (qty=1000)

#### B. Provider Expertise
- [ ] **"Le master"** - Avoir les 5 meilleurs services (top rated)
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `top_rated_services_count`
  
- [ ] **"L'artisan"** - Avoir un service avec 50+ avis
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `service_with_min_reviews`
  
- [ ] **"Le premium"** - Tous les services avoir ≥ 4.5 rating
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `all_services_min_rating`

---

### 8️⃣ DÉFIS MONÉTAIRES & FINANCIERS

#### A. Revenue Milestones
- [ ] **"Le revenu"** - Générer 50k en ventas (API stats)
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `total_revenue_earned`
  
- [ ] **"Le riche"** - Générer 100k+
  - ⚠️ **CONDITION À MODIFIER**: 100k
  
- [ ] **"Le profitable"** - Avoir profit/cost ratio ≥ 2
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `profit_ratio`
  
- [ ] **"Le dépensier"** - Dépenser 50k (total spending)
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `total_spent`

#### B. Economic Activity
- [ ] **"L'actif"** - Faire 3 transactions par semaine en moyenne
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `weekly_transaction_rate`
  
- [ ] **"Le constant"** - Revenu constant (≥ 2 transactions/semaine pendant 2 mois)
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `sustained_activity_period`

---

### 9️⃣ DÉFIS ACHÈVEMENT & MILESTONES

#### A. Complete Collections
- [ ] **"Le complétiste"** - Utiliser toutes les features de l'app
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `features_used_count`
  
- [ ] **"L'omniscient"** - Avoir au moins 1 transaction dans 10+ catégories
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `categories_engaged_count`
  
- [ ] **"L'encyclopédie"** - Avoir acheté, vendus, et échangé
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `action_types_completed`

#### B. Milestone Achievements
- [ ] **"Le mille"** - Faire 1000 transactions cumulés
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `total_transactions`
  
- [ ] **"Le héros"** - Atteindre tous les défis d'une catégorie
  - ⚠️ **NOUVELLE CONDITION REQUISE**: `category_challenges_completed`

---

## 📊 ANALYSE DES CONDITIONS MANQUANTES

### Conditions EXISTANTES (12):
1. ✅ `none` - Pas de condition
2. ✅ `sell_services` - Vendre X services
3. ✅ `buy_services` - Acheter X services
4. ✅ `book_services` - Réserver X services
5. ✅ `publish_services` - Publier X services
6. ✅ `note_services` - Noter X services
7. ✅ `exchange_objects` - Échanger X objets
8. ✅ `share_app` - Inviter X amis
9. ✅ `collect_badges` - Obtenir X badges
10. ✅ `reliability_score` - Fiabilité ≥ X%
11. ✅ `taxi_trip` - Trajet ≥ X km
12. ✅ `global_rating` - Note globale ≥ X/5

### Conditions À AJOUTER (28):

#### Actions & Transactions
- [ ] `active_services_count` - Nombre de services actifs
- [ ] `buy_from_categories_count` - Acheter dans X catégories différentes
- [ ] `buy_from_different_providers` - Acheter de X fournisseurs différents
- [ ] `sell_to_different_buyers` - Vendre à X clients différents
- [ ] `book_from_categories_count` - Réserver dans X catégories différentes
- [ ] `book_same_provider` - Réserver X fois chez le même prestataire
- [ ] `rate_with_minimum_stars` - Noter X services avec ≥ Y étoiles
- [ ] `diverse_ratings_pattern` - Avoir des avis variés (1-5 stars)
- [ ] `average_rating_on_transactions` - Note moyenne ≥ X/5 sur Y transactions

#### Échanges & Partage
- [ ] `exchange_time_requirement` - Échanger dans les X heures
- [ ] `balanced_exchanges` - Échanger X fois équitablement
- [ ] `invite_and_become_provider` - Inviter quelqu'un qui devient prestataire
- [ ] `total_friends_count` - Avoir au minimum X amis

#### Communication
- [ ] `messages_sent_count` - Envoyer X messages
- [ ] `average_response_time` - Temps de réponse moyen ≤ X heures
- [ ] `unique_conversations` - Converser avec X personnes différentes
- [ ] `conversation_depth` - Avoir conversations ≥ X messages

#### Profil & Réputation
- [ ] `profile_completion_percentage` - Profil ≥ X% complet
- [ ] `has_quality_avatar` - Avoir une photo de profil
- [ ] `verified_email_and_phone` - Vérifié(e) email + téléphone
- [ ] `perfect_rating_with_min_reviews` - Note 5/5 avec ≥ X avis
- [ ] `rating_improvement` - Améliorer sa note de X points
- [ ] `sustained_rating_period` - Note ≥ X/5 pendant Y jours
- [ ] `all_badges_collected` - Tous les badges
- [ ] `badges_by_tier` - X badges d'une rareté donnée
- [ ] `followers_count` - Avoir X followers
- [ ] `followers_percentage` - Être suivi par X% de la communauté

#### Trajets & Mobilité
- [ ] `unique_taxi_routes` - X trajets différents
- [ ] `taxi_trips_without_complaints` - X trajets sans plainte
- [ ] `taxi_rating_category` - Rating ≥ X/5 spécifique aux trajets
- [ ] `repeated_route` - Faire le même trajet X fois
- [ ] `time_based_trips` - Trajets à une heure donnée (ex: matin)
- [ ] `shared_rides_count` - X trajets partagés
- [ ] `weekly_activity_streak` - Y transactions/semaine durant X semaines
- [ ] `daily_action_streak` - Activité quotidienne durant X jours

#### Temps & Engagement  
- [ ] `account_age_days` - Compte ≥ X jours ancien
- [ ] `inactivity_free_days` - X jours sans inactivité
- [ ] `seasonal_activity_month` - Action dans le mois X
- [ ] `event_participation` - Participer à événement X
- [ ] `time_limited_challenge` - Compléter dans X heures

#### Social & Communauté
- [ ] `positive_mentions_in_reviews` - X mentions positives dans avis
- [ ] `recommendations_count` - Être recommandé X fois
- [ ] `positive_conflict_resolution` - Résoudre X conflits positivement
- [ ] `verified_others_count` - Vérifier X profils
- [ ] `trusted_by_users_count` - Être de confiance pour X personnes
- [ ] `top_rated_services_count` - Avoir X services top rated
- [ ] `service_with_min_reviews` - Service avec ≥ X avis
- [ ] `all_services_min_rating` - Tous les services ≥ X/5

#### Monétaire
- [ ] `total_revenue_earned` - Gagner ≥ X CFA/€
- [ ] `total_spent` - Dépenser ≥ X CFA/€
- [ ] `profit_ratio` - Ratio profit/dépense ≥ X
- [ ] `weekly_transaction_rate` - ≥ X transactions/semaine
- [ ] `sustained_activity_period` - Activité régulière pendant X jours

#### Achèvement & Milestones
- [ ] `features_used_count` - Utiliser X features
- [ ] `categories_engaged_count` - Être actif dans X catégories
- [ ] `action_types_completed` - Compléter X types d'actions (vendre, acheter, échanger...)
- [ ] `total_transactions` - Faire ≥ X transactions cumulées
- [ ] `category_challenges_completed` - Compléter tous défis d'une catégorie
- [ ] `oldest_member_rank` - Être du top X plus anciens utilisateurs
- [ ] `composite_challenge` - Combinaison de X conditions

---

## 🎯 RÉSUMÉ

- **Défis actuellement supportables**: ~25 défis
- **Défis idéaux avec nouvelles conditions**: ~80+ défis
- **Nouvelles conditions à ajouter**: 28+ types
- **Conditions composites**: Certains défis nécessitent 2-3 conditions liées

---

**Prochaine étape**: Ajouter progressivement les conditions les plus importantes!
