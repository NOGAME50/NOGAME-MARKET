# Correspondance de migration — Flutter vers React

| Fonction de la version Flutter fournie | Version web |
|---|---|
| Accueil et liste de produits | `src/pages/Home.tsx` — lecture Supabase réelle |
| Détail produit | `src/pages/ProductDetail.tsx` |
| Connexion / inscription | `src/pages/Auth.tsx` — Supabase Auth |
| Compte utilisateur | `src/pages/Account.tsx` |
| Tableau vendeur | `src/pages/Merchant.tsx` |
| Création de boutique | `src/pages/ShopCreate.tsx` |
| Plans 1 / 6 / 12 mois | `src/pages/Plans.tsx` |
| Navigation et identité visuelle | `src/components` et `src/styles.css` |
| Schéma de données | `supabase/schema_v2.sql` |

## Différences assumées
- Le projet d'origine n'implémentait pas encore le panier, les commandes complètes, la livraison, les notifications, l'administration complète ni l'intégration grossiste. Ces éléments restent identifiés comme travaux à faire.
- Le rôle de grossiste est prévu dans le schéma de cette migration, mais les parcours grossiste détaillés restent à développer.
- Les pages non terminées affichent clairement leur état au lieu d'inventer des données.
- La création publique d'un compte commence avec le rôle acheteur. Le rôle vendeur/grossiste doit être accordé par une procédure serveur ou administrative de confiance.

## Règle métier abonnements
Les durées sont 1, 6 et 12 mois. L'abonnement ne devient actif qu'après confirmation réelle du paiement. Le compte à rebours commence à `verified_at`/`starts_at`, pas au clic de demande. À l'expiration, les boutiques et produits ne sont plus visibles publiquement mais restent dans la base.
