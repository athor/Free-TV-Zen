# Free TV Zen

Extension Firefox pour personnaliser le gestionnaire de favoris et la navigation du lecteur sur [Free TV](https://tv.free.fr).

## Fonctionnalités

- Ajout du nom de la chaîne en cours 
- Ajout de 4 boutons de Navigation chaines précédente/suivante : 2 pour pour toutes les chaînes et 2 pour vos favoris, avec compteurs de position. (ex: Chaine suivante 8/10 favoris ou 123/338 liste complète des chaines)
- Ajout boutons Gérer ses favoris directement dans le volet favoris de telecommande du lecteur (+ un bouton "home" pour revenir à la page d'accueil de Free TV)
- Menu de gestion des favoris a 3 vues disponible : standard (4 icones de chaine par ligne), compacte (8 icones de chaines par ligne) et liste (1 chaine par ligne).
- Dix filtres de tri de catégories, appliqués aux chaînes disponibles sur le compte.(Généralistes / TNT, Cinéma / Séries, Sport, Jeunesse, Divertissement / Découverte, Information, Musique, Locales / Régionales, Internationales)
- Sélection indépendante des chaînes en doublons reconnus.
- Chaînes Mosaïques ignorées pendant le zapping ; elles restent disponible dans le volet de la telecommande.
- Thème sombre et vert, fond zen et interface réduite proportionnellement avec la fenêtre.

## Installation 

Addon en cours de submission Mozilla Firefox


## Utilisation

Dans le gestionnaire, un clic sur une catégorie filtre les résultats ; un second clic revient à **Toutes**. Les filtres ne modifient pas les favoris. Enregistrez avec **Valider la sélection**.

Dans le lecteur, les boutons chaines précentes / suivantes du haut parcourent toutes les chaînes ; ceux du bas parcourent les favoris. Les compteurs indiquent la position de la chaîne en cours dans chaque liste. Le lecteur Free conserve la gestion de la lecture et de ses droits d’accès.

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

<img width="627" height="627" alt="Logo Free TV ZEN dans la forêt zen" src="https://github.com/user-attachments/assets/d3798e8a-4204-4c5d-a799-f91004ae7224" />
<img width="1920" height="955.5" alt="6 Fav3" src="https://github.com/user-attachments/assets/02e59db1-aca4-4ccd-a144-6b18847577d3" />
<img width="1920" height="955.5" alt="5 Fav2" src="https://github.com/user-attachments/assets/bb5e75df-0221-48e5-b13e-1ec6f5e065ea" />
<img width="1920" height="955.5" alt="4 Fav1" src="https://github.com/user-attachments/assets/cedeb8be-6cba-44df-ad07-84e062989e46" />
<img width="1920" height="955.5" alt="3 lecteur" src="https://github.com/user-attachments/assets/bf4afda5-6e42-474a-958b-feb9bc8737c3" />
<img width="1920" height="955.5" alt="2 lecteur" src="https://github.com/user-attachments/assets/aa9dd3f2-b4f8-4563-a596-20769131a5c3" />
<img width="1920" height="955.5" alt="1 lecteur" src="https://github.com/user-attachments/assets/128140be-6b76-49a0-b043-99a114d3a755" />



