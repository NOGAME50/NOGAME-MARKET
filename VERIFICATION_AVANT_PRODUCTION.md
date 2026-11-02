# Vérification et limites de cette livraison

Cette archive contient une base de projet React/TypeScript actualisée et le SQL gratuit v3. Les fichiers de configuration JSON ont été validés et les fichiers TypeScript/TSX ont passé un contrôle de syntaxe (transpilation syntaxique). Le client `src/lib/supabase.ts` a été conservé sans modification. Aucun `.env.local`, mot de passe ni clé `service_role` n'est inclus.

## Vérifications non exécutées dans cet environnement

L'installation npm a expiré à deux reprises, faute d'accès réseau au registre npm. En conséquence, `npm run build` n'a pas pu être exécuté ici et aucune compilation réussie n'est revendiquée. Après extraction, exécuter `npm install`, puis `npm run build` dans un environnement connecté.

Le SQL n'a pas été exécuté contre ton instance Supabase. Il doit être appliqué d'abord sur un projet de test et vérifié avec des comptes séparés (acheteur, vendeur, grossiste, admin, utilisateur anonyme), en particulier les politiques RLS et Storage.

Le dossier Android natif n'est pas inclus car Capacitor doit le générer après installation des dépendances avec `npx cap add android`. La compilation APK requiert ensuite Android SDK/JDK.

## Fonctionnalités non livrées comme opérationnelles

Le panier, les commandes, la livraison, les notifications, le paiement et la messagerie ne sont pas implémentés. La modération automatique se limite à placer un shop/produit en revue après trois signalements uniques; un administrateur doit décider de le masquer ou de le rétablir. Aucune reconnaissance automatique de documents ou identité n'est prétendue.
