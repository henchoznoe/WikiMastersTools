# Isolation des comptes : décision de conception

Le critère initial demandait deux comptes WikiMasters dans deux onglets d'un
même profil Chrome ou Dia. L'étude du 23 septembre 2026 a montré que les cookies
d'authentification et le stockage du site sont partagés entre ces onglets. Les
API d'extension ne créent pas un magasin de cookies par onglet. Une réécriture
des requêtes par onglet ne garantit pas l'isolation de toutes les connexions,
déconnexions, navigations et écritures du site.

**Décision explicite du projet : utiliser un profil Chrome ou Dia distinct par
compte.** Chaque profil possède son propre magasin de cookies et son propre
stockage d'extension. L'extension s'installe dans chaque profil. Elle ne gère
aucun jeton de session et n'ouvre pas de prétendu « onglet isolé ».

## Vérification manuelle requise

1. Créer deux profils du navigateur et installer l'extension dans chacun.
2. Connecter un compte de test différent dans chaque profil.
3. Vérifier les comptes et les collections, puis actualiser les deux pages.
4. Déconnecter le premier compte et vérifier que le second reste connecté.
5. Ouvrir un lien WikiMasters depuis chaque profil et vérifier le compte affiché.
6. Refaire dans Dia si son usage est prévu.

Ce test dépend des deux comptes de test et de l'installation locale. Le build et
les tests automatisés ne le remplacent pas.

## Sources

- [API Chrome cookies](https://developer.chrome.com/docs/extensions/reference/api/cookies)
- [Règles réseau par onglet](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest)
