# Free TV Zen

Extension Firefox pour personnaliser le gestionnaire de favoris et la navigation du lecteur sur [Free TV](https://tv.free.fr).

## Fonctionnalités

- Volet des favoris avec numéros, logos et noms des chaînes.
- Trois vues : standard, compacte et liste.
- Dix filtres de catégories, appliqués aux chaînes disponibles sur le compte.
- Sélection indépendante des numéros lorsque Free partage un favori entre des doublons reconnus.
- Navigation précédente/suivante pour toutes les chaînes et les favoris, avec compteurs de position.
- Mosaïques reconnues ignorées pendant le zapping ; elles restent dans la liste native.
- Accès au gestionnaire de favoris et à l’accueil depuis le volet du lecteur.
- Thème sombre et vert, fond zen et interface réduite proportionnellement avec la fenêtre.

## Installation temporaire

1. Téléchargez ou clonez ce dépôt.
2. Dans Firefox, ouvrez `about:debugging#/runtime/this-firefox`.
3. Cliquez sur **Charger un module complémentaire temporaire…** et sélectionnez `manifest.json` à la racine.
4. Rechargez Free TV avec `Ctrl+Maj+R`.

L’installation temporaire doit être renouvelée après redémarrage de Firefox. Version minimale : Firefox 140.

## Utilisation

Dans le gestionnaire, un clic sur une catégorie filtre les résultats ; un second clic revient à **Toutes**. Les filtres ne modifient pas les favoris. Enregistrez avec **Valider la sélection**.

Dans le lecteur, les boutons du haut parcourent toutes les chaînes ; ceux du bas parcourent les favoris. Les compteurs indiquent la position de la chaîne en cours dans chaque liste. Le lecteur Free conserve la gestion de la lecture et de ses droits d’accès.

## Données et ressources

Aucune collecte ni serveur ajouté. Les préférences relatives aux doublons sont enregistrées localement dans le navigateur. Les images et icônes sont fournies avec l’extension. Le classement suit les blocs thématiques du plan Free du 25 août 2026 et les chaînes effectivement chargées ; les chaînes non reconnues restent dans **Toutes**.

## Structure

- `manifest.json` : configuration Firefox.
- `content.js`, `content.css` : gestionnaire et thème.
- `channel-categories.js` : classement des chaînes.
- `player-favorites.js`, `player-zapping.js` : intégration au lecteur.
- `assets/`, `icons/` : ressources locales.

Les sauvegardes de développement et les copies de pages personnelles ne sont pas incluses dans ce dépôt.

## Support

[Support me on Ko-fi](https://ko-fi.com/T0J72545CL)
