# Free TV Zen — Une meilleure expérience Free TV
Extension Firefox pour personnaliser le gestionnaire de favoris et la navigation du lecteur sur [Free TV](https://tv.free.fr).

**Naviguez facilement entre vos chaînes et vos favoris, gérez vos préférences en quelques clics et profitez d'une interface sombre au thème zen.**

## Fonctionnalités principales

### 📺 Navigation entre les chaînes
- **Chaîne en cours :** affichage du nom de la chaîne actuellement regardée.
- **Zapping classique :** deux boutons « Chaîne précédente » et « Chaîne suivante » pour naviguer dans la liste complète des chaînes.
- **Zapping des favoris :** deux boutons dédiés pour passer directement d'une chaîne favorite à une autre.

### ⭐ Gestion simplifiée des favoris
- **Menu des favoris :** accès rapide à toutes vos chaînes favorites.
- **Tri rapide :** boutons permettant de réorganiser facilement la liste.
- **3 modes d'affichage :** choisissez la présentation qui vous convient.
- **Gestion directe :** bouton « Gérer les favoris » intégré au menu des favoris de la télécommande.

### 🎮 Télécommande améliorée
- **Bouton Accueil :** retour direct à l'accueil de Free TV depuis le volet de la télécommande.
- **Zapping intelligent :** les boutons « Chaîne précédente » et « Chaîne suivante » ignorent automatiquement les chaînes mosaïques et les chaînes 4K non prises en charge.

## Corrections et améliorations

- **Correction des doublons dans les favoris :** lorsqu'une chaîne possède plusieurs versions identiques, seule la version sélectionnée est ajoutée aux favoris, évitant ainsi l'ajout involontaire de deux chaînes.

---

**Free TV Zen : moins de manipulations, plus de confort et une navigation plus fluide dans Free TV.**

## Fonctionnalités

- Ajout du display du nom de la chaîne en cours de lecture 
- Ajout de 4 boutons de Navigation chaines précédentes /suivantes : 2 pour pour toutes les chaînes et 2 pour vos favoris, avec compteurs de position. (ex: Chaine suivante 8/10 favoris ou 123/338 liste complète des chaines)
- Ajout boutons Gérer ses favoris directement dans le volet favoris de télécommande du lecteur (+ un bouton "home" pour revenir à la page d'accueil de Free TV)
- Menu de gestion des favoris a 3 vues disponible : standard (4 icones de chaine par ligne), compacte (8 icones de chaines par ligne) et liste (1 chaine par ligne).
- Dix filtres de tri de catégories, appliqués aux chaînes disponibles sur le compte.(Généralistes / TNT, Cinéma / Séries, Sport, Jeunesse, Divertissement / Découverte, Information, Musique, Locales / Régionales, Internationales)
- Sélection indépendante des chaînes en doublons reconnus.
- Chaînes Mosaïques ignorées pendant le zapping ; elles restent disponible dans le volet de la telecommande.
- Thème sombre et vert, fond zen et interface réduite proportionnellement avec la fenêtre.

## Installation 
https://addons.mozilla.org/fr/firefox/addon/free-tv-zen/

## Utilisation
**📺 Navigation dans le lecteur**

- **Boutons du haut :** passez à la chaîne précédente ou suivante parmi toutes les chaînes.
- **Boutons du bas :** naviguez uniquement entre vos chaînes favorites.
- **Compteurs :** visualisez la position de la chaîne en cours dans chacune des deux listes.

**⭐ Gestion de vos favoris**

- **Sélectionnez vos chaînes favorites** à l'aide de leur bouton de sélection. Elles apparaissent automatiquement dans la colonne de gauche.
- **Trouvez facilement vos chaînes** grâce à la recherche, aux catégories et aux 3 modes d'affichage.
- **Enregistrez vos modifications** en cliquant sur « Valider la sélection ».

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


<p align="center">
  <a href="https://github.com/user-attachments/assets/d3798e8a-4204-4c5d-a799-f91004ae7224">
    <img width="100" alt="Logo Free TV Zen" src="https://github.com/user-attachments/assets/d3798e8a-4204-4c5d-a799-f91004ae7224" />
  </a>
</p>

<p align="center">
<a href="https://athor.github.io/Free-TV-Zen/#image-1">
  <img width="300" alt="6 Fav3" src="https://github.com/user-attachments/assets/02e59db1-aca4-4ccd-a144-6b18847577d3" />
</a>
<a href="https://athor.github.io/Free-TV-Zen/#image-2">
  <img width="300" alt="5 Fav2" src="https://github.com/user-attachments/assets/bb5e75df-0221-48e5-b13e-1ec6f5e065ea" />
</a>
<a href="https://athor.github.io/Free-TV-Zen/#image-3">
  <img width="300" alt="4 Fav1" src="https://github.com/user-attachments/assets/cedeb8be-6cba-44df-ad07-84e062989e46" />
</a>
<a href="https://athor.github.io/Free-TV-Zen/#image-4">
  <img width="300" alt="3 lecteur" src="https://github.com/user-attachments/assets/bf4afda5-6e42-474a-958b-feb9bc8737c3" />
</a>
<a href="https://athor.github.io/Free-TV-Zen/#image-5">
  <img width="300" alt="2 lecteur" src="https://github.com/user-attachments/assets/aa9dd3f2-b4f8-4563-a596-20769131a5c3" />
</a>
<a href="https://athor.github.io/Free-TV-Zen/#image-6">
  <img width="300" alt="1 lecteur" src="https://github.com/user-attachments/assets/128140be-6b76-49a0-b043-99a114d3a755" />
</a>
</p>

