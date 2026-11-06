# Signature Android et génération AAB

## 1. Générer la clé (une seule fois)

Dans GitHub : dépôt > Actions > « Générer la clé de signature Android » > Run workflow.
À la fin, ouvrir l'exécution et télécharger l'artifact `NOGAME-MARKET-SIGNING-SECRETS`.

**Ne relancez pas ce workflow après avoir commencé à publier l'application.**
Une nouvelle clé ne remplace pas l'ancienne pour les mises à jour.

## 2. Enregistrer les 4 secrets du dépôt

Dans l'artifact téléchargé :
- Le contenu de `ANDROID_KEYSTORE_BASE64.txt` devient la valeur du secret `ANDROID_KEYSTORE_BASE64`.
- Les trois lignes de `REST_OF_SECRETS.txt` donnent les valeurs des secrets :
  `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.

Dans GitHub : Settings > Secrets and variables > Actions > New repository secret.
Créer les quatre secrets avec exactement ces noms. Pour chaque secret, coller uniquement sa valeur, sans le nom ni le signe `=`.

Après vérification, supprimer l'artifact téléchargé et ne pas partager les fichiers.
Le workflow de génération garde l'artifact pendant 1 jour seulement.

## 3. Construire le AAB

Dans GitHub : Actions > « Android (APK de test + AAB Play Store) » > Run workflow.
Laisser `build_aab` activé. Une fois terminé, ouvrir l'exécution puis télécharger
l'artifact `NOGAME-MARKET-aab-<numéro>`.

Le AAB signé est `NOGAME-MARKET.aab`. L'APK de test est distinct et ne remplace pas le AAB.

## Sécurité et sauvegarde

- Préférer un dépôt GitHub privé pendant cette opération.
- Ne jamais ajouter le keystore, les mots de passe ou le Base64 au code, à un commit ou à une issue.
- Conserver une sauvegarde hors ligne et sécurisée du fichier `.jks` et des mots de passe.
- Le workflow de build utilise les secrets du dépôt et ne les affiche pas volontairement.
