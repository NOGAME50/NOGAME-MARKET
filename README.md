# NOGAME MARKET — version gratuite React + TypeScript + Supabase

Marketplace haïtienne gratuite : acheteurs, vendeurs et grossistes peuvent s'inscrire sans frais. Les comptes commerciaux sont créés automatiquement avec le rôle demandé (buyer/merchant/wholesaler); le rôle admin ne peut jamais être choisi depuis l'inscription publique.

## Installation web

Pré-requis : Node.js 20+ et npm.

```bash
npm install
cp .env.example .env.local
# renseigner l'URL Supabase et la clé publique anon/publishable
npm run dev
```

Build de vérification : `npm run build`.

## Supabase — indispensable

1. Créer un projet Supabase neuf ou faire une sauvegarde avant migration.
2. Ouvrir SQL Editor et appliquer `supabase/schema_free_v3.sql`.
3. Vérifier les politiques RLS et les Storage policies dans un projet de test.
4. Créer un compte administrateur par inscription normale, récupérer son UUID dans Authentication, puis exécuter dans SQL Editor :

```sql
update public.profiles set role='admin' where id='UUID_DU_COMPTE_ADMIN';
```

Ne jamais donner le rôle admin via les métadonnées d'inscription. Ne jamais inclure `service_role` dans le navigateur, dans GitHub ou dans le ZIP.

Le SQL crée le bucket `product-images` en public pour lecture des photos, avec écriture limitée au dossier UUID de chaque utilisateur. Vérifier la politique sur le projet avant production.

## Fonctionnalités de cette livraison

- Authentification Supabase et inscription buyer / merchant / wholesaler.
- Rôle admin exclusivement attribué hors inscription publique.
- Accueil, recherche produits, liste de boutiques, fiche boutique et fiche produit.
- Espace vendeur, boutiques multiples, création et modification de boutique.
- Ajout, modification, publication/masquage, gestion du stock et suppression de produits.
- Signalements de boutique / produit / utilisateur.
- File de modération admin et passage en revue après trois signalements distincts.
- Aucune sanction définitive automatique sur la seule base de signalements.
- Logo SVG et icônes Lucide (SVG).
- Configuration Capacitor Android (`com.nogame.market`).

## Règles de modération

Trois signalements distincts sur une boutique ou un produit déclenchent le statut `review`, ce qui masque temporairement ce contenu des listes publiques. Ce mécanisme n'établit pas qu'une fraude a eu lieu. L'administrateur examine ensuite les signalements et tranche. Les suspensions de comptes et vérifications d'identité ne sont pas automatisées dans cette version.

## Android

Après `npm install` :

```bash
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

La génération de l'APK nécessite Android Studio / Android SDK / JDK compatibles. Le dossier Android natif est généré localement par Capacitor; ce ZIP fournit la configuration et les sources web.

## Limites à connaître avant production

- Le panier, les commandes, la livraison, les paiements et les notifications ne sont pas activés dans cette version. Aucun faux historique n'est affiché.
- Le formulaire de signalement exige l'ID de la boutique / du produit / du compte à signaler; les liens depuis les fiches remplissent automatiquement les IDs connus.
- Le niveau `verified` ou `trusted` n'est pas attribué automatiquement : il doit reposer sur un vrai processus de vérification.
- Le SQL est une base de déploiement à tester sur un projet de test, notamment les RLS, Storage, triggers et rôles. Cette livraison ne peut pas être déclarée « 100 % production » sans les identifiants du projet, tests multi-comptes et validation de l'environnement Supabase.

## Fichiers importants

- `src/lib/supabase.ts` : configuration client, conservée sans modification.
- `src/pages` : écrans de l'application.
- `src/components` : composants réutilisables.
- `supabase/schema_free_v3.sql` : schéma gratuit et politiques RLS.
- `.env.example` : modèle de configuration sans secret.
