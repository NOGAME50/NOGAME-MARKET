# NOGAME MARKET — Web Edition (React + TypeScript)

Cette version migre le projet Flutter fourni vers une application web React/TypeScript, sans le remplacer par une page HTML statique. L'objectif est de conserver les grands espaces fonctionnels et l'identité NOGAME MARKET, puis de permettre un emballage Android avec Capacitor dans une étape ultérieure.

## Démarrage

Pré-requis : Node.js 20+ et npm.

```bash
npm install
cp .env.example .env
# Remplir VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY avec les valeurs publiques du projet
npm run dev
```

Pour vérifier la compilation :

```bash
npm run build
```

## GitHub

1. Créer un dépôt GitHub vide.
2. Décompresser ce projet.
3. Envoyer tous les fichiers et dossiers du projet à la racine du dépôt.
4. Ne jamais publier `.env`, une clé `service_role`, un mot de passe ou une donnée privée.

## Structure

- `src/pages` : accueil, connexion/inscription, compte, espace vendeur, détail produit, plans et pages fonctionnelles en attente.
- `src/components` : navigation, marque, protection de routes, carte produit.
- `src/state` : état d'authentification.
- `src/lib` : client Supabase.
- `public/logo-nogame-market.svg` : logo vectoriel SVG.
- `supabase/schema_v2.sql` : schéma SQL de départ et politiques RLS.

## Règle SVG

Le logo est un fichier SVG. Les icônes de l'interface sont rendues par `lucide-react`, qui produit des éléments SVG. Ne pas remplacer les icônes par des emojis ou des images raster.

## Données réelles uniquement

Aucun faux magasin, produit, vendeur, commande ou chiffre de vente n'est injecté. Si la base ne contient pas de données, l'interface affiche un état vide explicite.

## Fonctionnalités incluses dans cette première migration

- Navigation responsive avec menu mobile et barre inférieure mobile.
- Accueil avec recherche et lecture des produits Supabase.
- Détail produit à partir de l'identifiant réel.
- Connexion et inscription Supabase Auth.
- Profil/compte.
- Centre vendeur et lecture des boutiques appartenant à l'utilisateur.
- Création de boutique (créée inactive pour éviter une publication prématurée).
- Présentation des plans de 1, 6 et 12 mois.
- Pages explicites pour commandes, assistance, paramètres et administration, signalées comme non finalisées plutôt que simulées.

## Points à terminer avant une mise en production

Le ZIP Flutter fourni ne contient pas encore une implémentation complète de panier/commandes/livraisons, d'administration, de notifications ou de grossistes. Ces fonctions ne sont donc pas présentées comme opérationnelles ici. Il faudra ajouter les tables et services correspondants, puis les tester.

Les paiements MonCash/NatCash ne sont pas intégrés automatiquement dans les sources fournies. Une capture d'écran ou un bouton côté navigateur ne doit jamais activer un abonnement. La confirmation doit venir d'une vérification fiable côté serveur (API/webhook du fournisseur si disponible, ou validation administrative contrôlée). L'abonnement commence à la date réelle de confirmation. À l'expiration, la boutique et ses produits doivent être masqués, jamais supprimés.

Le schéma SQL est une base de travail, pas une certification de sécurité. Il faut le tester sur un projet Supabase dédié avant production. Les rôles privilégiés ne doivent jamais être attribués depuis les métadonnées publiques du formulaire. L'administration doit être contrôlée côté base et côté serveur.

## Android ensuite

Après validation de la version web, Capacitor pourra être ajouté pour générer une application Android à partir de la même base React. Cette étape n'est pas incluse dans ce ZIP.


## Identité visuelle

Le logo officiel NOGAME MARKET est intégré dans `public/nogame-market-logo.png`. Il est utilisé dans l’en-tête, le pied de page, les écrans de connexion et comme favicon du site. Les icônes d’interface restent au format SVG via Lucide.
