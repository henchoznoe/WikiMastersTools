# Confidentialité

WikiMasters Tools n'a aucun serveur, aucune télémétrie et aucun compte propre.
L'extension s'exécute uniquement sur `www.wiki-masters.com`.

Elle lit les données nécessaires déjà accessibles au profil connecté : cartes
de collection, échanges, annonces et prix de ventes du jeu. Les moyennes par
carte et les réglages sont conservés dans `storage.local` du profil du
navigateur. Les moyennes expirent après 24 h ; une erreur de prix est retentée
après 5 min. La collection, les échanges et les récapitulatifs restent en
mémoire et disparaissent à la fermeture de l'onglet.

Les requêtes de l'extension vont directement à WikiMasters avec la session
normale du navigateur. Aucun cookie, jeton ou identifiant de session n'est
copié dans les journaux ou dans les événements de page. Un petit observateur de
page ne transmet que l'identifiant public de la carte inspectée.

Tu peux supprimer les données locales en retirant l'extension ou en effaçant
ses données dans ton profil Chrome/Dia. Le traitement par WikiMasters lui-même
relève de sa propre politique de confidentialité.
