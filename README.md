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

<img width="1254" height="1254" alt="Logo Free TV ZEN dans la forêt zen" src="https://github.com/user-attachments/assets/d3798e8a-4204-4c5d-a799-f91004ae7224" />
<img width="3840" height="1911" alt="6 Fav3" src="https://github.com/user-attachments/assets/02e59db1-aca4-4ccd-a144-6b18847577d3" />
<img width="3840" height="1911" alt="5 Fav2" src="https://github.com/user-attachments/assets/bb5e75df-0221-48e5-b13e-1ec6f5e065ea" />
<img width="3840" height="1911" alt="4 Fav1" src="https://github.com/user-attachments/assets/cedeb8be-6cba-44df-ad07-84e062989e46" />
<img width="3840" height="1911" alt="3 lecteur" src="https://github.com/user-attachments/assets/bf4afda5-6e42-474a-958b-feb9bc8737c3" />
<img width="3840" height="1911" alt="2 lecteur" src="https://github.com/user-attachments/assets/aa9dd3f2-b4f8-4563-a596-20769131a5c3" />
<img width="3840" height="1911" alt="1 lecteur" src="https://github.com/user-attachments/assets/128140be-6b76-49a0-b043-99a114d3a755" />



