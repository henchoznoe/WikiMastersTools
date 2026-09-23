# WikiMasters Tools

Extension Manifest V3 non officielle pour [WikiMasters](https://www.wiki-masters.com/),
réécrite en WXT, TypeScript strict et React. Le projet est **100 % vibecodé** :
sa conception et son code ont été produits avec l'aide d'une IA puis relus et
testés. Il n'est ni affilié à WikiMasters ni à l'auteur de l'extension de
référence. Aucun fichier ou graphisme de cette extension n'est repris.

> **Risque pour le compte.** Les [règles de WikiMasters](https://www.wiki-masters.com/rules)
> interdisent l'automatisation et les multi-comptes. Utiliser ces fonctions peut
> entraîner une sanction. L'ouverture en série s'arrête sur une vérification,
> un refus ou une limite du jeu, sans contournement.

## Fonctions

- Prix moyen par rareté sur les cartes reconnues de la collection et du marché,
  dans le détail d'une annonce et lors de l'inspection d'une carte du catalogue.
- Cache local des moyennes pendant 24 h ; nouvel essai après 5 min si le réseau
  échoue. Les prix sont des estimations de ventes passées, pas une garantie.
- Chargement de la collection par raretés, calcul des prix manquants, classement
  des cartes et mise en vente confirmée depuis le classement.
- Estimation des deux côtés d'un échange, cartes et WikiBidous compris.
- Ouverture séquentielle de 1 à 1000 paquets ou de tous les paquets disponibles
  (limite de sécurité de 1000 par action), avec confirmation, progression et
  récapitulatif trié par prix. Récap après une ouverture normale en option.
- Interface sombre et menthe près du titre des pages, popup de réglages et logo
  original « W » sur une carte.

Le jeu peut modifier ses API ou son interface sans prévenir. Les prix intégrés
aux cartes dépendent de la reconnaissance des cartes visibles. Le récapitulatif
après une ouverture normale compare la collection avant et après l'ouverture ;
il n'apparaît pas si le chargement de la collection est incomplet. Voir les
[limites de validation](docs/VALIDATION.md).

## Plusieurs comptes

Ouvre **un profil Chrome ou Dia distinct par compte** et installe l'extension
dans chaque profil. Les onglets d'un même profil partagent les cookies et ne
peuvent pas garantir deux connexions isolées. L'extension n'accède pas aux
identifiants de session. La [décision technique](docs/FEASIBILITY.md) explique
ce choix et le test à faire avec deux comptes de test.

## Installer localement

Prérequis : Node.js 24 et pnpm 12.

```bash
pnpm install
pnpm check
```

Dans Chrome ou Dia, ouvre `chrome://extensions`, active le mode développeur,
clique sur **Charger l'extension non empaquetée** et choisis le dossier
`.output/chrome-mv3`. Actualise ensuite WikiMasters. Pour le développement :

```bash
pnpm dev
```

Pour produire le ZIP à publier :

```bash
pnpm zip
```

Le fichier se trouve dans `.output/`. Il contient les fichiers compilés ; ne
dépose pas le ZIP du code source GitHub sur le Chrome Web Store.

## Versions et contributions

Les changements passent par des PR vers `main` avec titre
[Conventional Commits](https://www.conventionalcommits.org/fr/v1.0.0/) :
`feat: ...`, `fix: ...`, `docs: ...`. Configure GitHub pour fusionner par
**squash** en utilisant le titre de la PR comme message de commit. La CI teste,
vérifie les types et construit l'extension. Après fusion, `semantic-release`
calcule la version, met à jour le changelog et `package.json`, crée le tag et
la GitHub Release et y attache le ZIP Chrome. WXT copie la version de
`package.json` dans le manifeste. Une GitHub Release **ne publie pas**
automatiquement sur le Chrome Web Store. Voir [CONTRIBUTING.md](CONTRIBUTING.md).

## Première publication sur le Chrome Web Store

1. Créer un [compte développeur Chrome Web Store](https://chrome.google.com/webstore/devconsole)
   et satisfaire les étapes de vérification demandées.
2. Exécuter `pnpm check && pnpm zip` sur la version à publier.
3. Préparer la fiche : nom, description française, icône 128 px, visuel
   `assets/store/small-promo-tile.png` et captures réelles de l'extension dans
   WikiMasters. Ne montrer aucun nom de compte ni donnée privée dans les captures.
4. Déclarer l'usage des permissions : `storage` pour les réglages et le cache ;
   accès à `www.wiki-masters.com` pour afficher les outils et appeler les API
   du jeu. Répondre au questionnaire de confidentialité conformément à
   [PRIVACY.md](PRIVACY.md).
5. Déposer le ZIP de `.output/` dans le tableau de bord, vérifier la fiche,
   puis soumettre à l'examen du Store. Attendre sa décision avant de présenter
   l'extension comme disponible publiquement.
6. Pour chaque mise à jour, reprendre le ZIP de la GitHub Release puis créer
   une nouvelle version dans le tableau de bord du Store.

Le [guide officiel de publication](https://developer.chrome.com/docs/webstore/publish/)
fait autorité pour les exigences en vigueur.

## Confidentialité et licence

Il n'y a ni serveur propre, ni télémétrie, ni copie des cookies de connexion.
Le cache des prix et les réglages résident dans le profil du navigateur.
Consulte [PRIVACY.md](PRIVACY.md). Code sous [licence MIT](LICENSE).
