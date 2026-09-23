# Contribuer

1. Créer une branche `codex/...` ou `feat/...` depuis `main`.
2. Garder les fonctions séparées par domaine dans `src/features/`. Ne copier
   aucun fichier ou graphisme de l'extension de référence, qui ne possède pas
   de licence permettant cette réutilisation.
3. Exécuter `pnpm check` et vérifier manuellement la page concernée.
4. Ouvrir une PR vers `main` avec un titre Conventional Commit, par exemple
   `feat: afficher le prix moyen du marché`.
5. Fusionner par squash avec ce titre. La release se lance sur `main` après la CI.

Les changements d'API du jeu doivent être validés avec des réponses simulées
et, si possible, sur un compte de test. Ne publier aucune capture contenant des
jetons, des cookies ou des informations de compte.
