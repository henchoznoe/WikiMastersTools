# Validation manuelle avant publication

Les tests automatisés couvrent les prix, leur cache, les chargements partiels,
les copies déjà en vente et l'arrêt des paquets sur une limite. Ils ne prouvent
pas la compatibilité de l'interface avec une future version du jeu.

## Vérification effectuée dans Dia le 23 septembre 2026

- Extension non empaquetée chargée en version 0.1.0 ; popup et ses trois réglages
  visibles.
- Barre d'outils près du titre sur les pages Paquets, Collection, Échanges,
  Marché et Collection globale.
- Prix affichés auprès de cartes de la collection et d'annonces du marché,
  ainsi que dans le détail d'une annonce.
- Avec l'autorisation expresse du titulaire du compte, **un paquet** ouvert par
  le panneau : cinq cartes reçues, progression et récapitulatif classé par prix.
- L'estimation des échanges se termine correctement quand il n'y a aucun
  échange en cours ; l'historique est exclu par défaut.

Aucune carte n'a été mise en vente et aucune action de perte de carte n'a été
effectuée. Le récapitulatif après une ouverture normale, l'inspection d'une
carte globale, le chargement de toute la collection, une série de paquets et
les deux profils avec deux comptes restent à valider manuellement. Le test de
l'interface Chrome, ainsi que les captures destinées au Store, restent aussi
à faire avant une publication publique.

## Pages et actions

- Collection : badge auprès des cartes visibles ; sélection de raretés ;
  chargement partiel ; classement ; vente d'une copie disponible sur un compte
  de test, après confirmation.
- Paquets : sélection d'une quantité ; confirmation ; progression ; prix triés ;
  arrêt sur vérification ou limite ; récap d'une ouverture normale si la
  collection complète a été chargée.
- Échanges : estimation des deux côtés et affichage d'une erreur réseau.
- Marché : badges des annonces et détail d'une annonce.
- Toutes les cartes : inspection d'une carte et prix par rareté.
- Popup : changement des trois réglages, fermeture et réouverture.
- Accessibilité : clavier, focus visible, fenêtre étroite.
- Profils : scénario à deux comptes de [FEASIBILITY.md](FEASIBILITY.md).

Ne pas déclencher de mise en vente ou d'ouverture de paquet sur un compte réel
pour un simple test sans autorisation explicite. Les pages du site peuvent
imposer une vérification humaine.
