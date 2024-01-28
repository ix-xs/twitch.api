<div align=center>
<span style="font-size:30px;">@ix-xs/twitch.api</span><br>
<br>
</div>

<h2>✨Installation</h2>

`npm install @ix-xs/twitch.api`
<br>
<h2>👀Utilisation</h2>
<h3>1. Créez un nouveau client en fournissant votre ID et secret client :</h3>

```js
const TwtichAPI = require("@ix-xs/twitch.api");

const client = new MetamobAPI({ clientId:"votre_id_client", clientSecret:"votre_secret_client" });
```

<br>
<h3>2. Liste des appels possibles</h3>
<br>

Méthode | options | Description |
| --- | --- | --- |
| `generateToken()` |  | 👀 **Génère un nouveau token**<br>💡 **Note** : Le token se gère de façon automatique, cette fonction sert uniquement a son auto-gestion|
| `isExpiredToken()` |  | 👀 **Renvoi la validité du token actuel** (true ou false) |
| `refreshToken()` |  | 👀 **Génère un nouveau token**<br>💡 **Note** : Le token se gère de façon automatique, cette fonction sert uniquement a son auto-gestion |
| `getStreams()` | {<br>`users_names?`:Array\<string\>;<br>`games_names?`:Array\<string\>;<br>`type?`:"all"\|"live";<br>`languages?`:Array\<string\>;<br>`first?`:number;<br>`before?`:string;<br>`after?`:string;<br>} | 👀 **Renvoi une liste des streams**<br>💡 **Note** : La liste est classée par ordre décroissant du nombre de téléspectateurs regardant le flux. Étant donné que les spectateurs vont et viennent pendant un flux, il est possible de trouver des flux en double ou manquants dans la liste au fur et à mesure que vous parcourez les résultats. |
| `getUsers()` | `usernames`:Array\<string\>; | 👀 **Renvoi les informations d'un ou plusieurs utilisateur(s)** |
| `getCheermotes()` |  | 👀 **Renvoi une liste de Cheermotes que les utilisateurs peuvent utiliser pour encourager Bits dans la salle de discussion de n'importe quelle chaîne compatible Bits.**<br>💡 **Note** : Les cheermotes sont des émoticônes animées auxquelles les spectateurs peuvent attribuer des Bits. |
| `getChatEmotes()` | `username?`:string; | 👀 **Obtient la liste des [émotes globales](https://www.twitch.tv/creatorcamp/fr-fr/paths/getting-started-on-twitch/emotes/) ou la liste des émotes personnalisées du diffuseur.**<br>💡 **Note** : Les émotes globales sont des émoticônes créées par Twitch que les utilisateurs peuvent utiliser dans n'importe quel chat Twitch. Les diffuseurs créent ces émotes personnalisées pour les utilisateurs qui s'abonnent ou suivent la chaîne ou encouragent Bits dans la fenêtre de discussion de la chaîne. [En savoir plus](https://dev.twitch.tv/docs/irc/emotes/).<br>💡 **Note** : À l'exception des émoticônes personnalisées, les utilisateurs peuvent utiliser des émoticônes personnalisées dans n'importe quel chat Twitch. |
| `getChatBadges()` | `username?`:string; |  👀 **Obtient la liste des badges de discussion de Twitch, que les utilisateurs peuvent utiliser dans la salle de discussion de n'importe quelle chaîne, ou la liste des badges de discussion personnalisés du diffuseur.**<br>💡 **Note** : Pour plus d'informations sur les badges de chat, consultez le [Guide des badges de chat Twitch](https://help.twitch.tv/s/article/twitch-chat-badges-guide?langue=en_US).<br>💡 **Note** : La liste est vide si le diffuseur n'a pas créé de badges de discussion personnalisés. Pour plus d'informations sur les badges personnalisés, consultez [badges d'abonné](https://help.twitch.tv/s/article/subscriber-badge-guide?langue=en_US) et [badges Bits](https://help.twitch. tv/s/article/custom-bit-badges-guide?langue=en_US). |
| `getChatSettings()` | `username`:string; | 👀 **Renvoi les paramètres de discussion du diffuseur** |
| `getUsersChatColor()` | `usernames`:Array\<string>; | 👀 **Renvoi la couleur utilisée pour le nom de l'utilisateur dans le chat.** |
| `getClips()` | `username`:string; | 👀 **Obtient un ou plusieurs clips vidéo capturés à partir de flux**<br>💡 **Note** : Pour plus d'informations sur les clips, consultez [Comment utiliser les clips](https://help.twitch.tv/s/article/how-to-use-clips?langage=en_US). |
| `getTopGames()` | `params?`:<br>{<br>`first?`:number;<br>`after?`:string;<br>`before?`:string;<br>} | 👀 **Renvoi des informations sur toutes les diffusions sur Twitch** |
| `getGames()` | `gameNames`:Array\<string\>; | 👀 **Renvoi des informations sur les catégories ou les jeux spécifiés.**<br>💡 **Note** : Vous pouvez obtenir jusqu'à 100 catégories ou jeux en spécifiant leur identifiant ou leur nom. Vous pouvez spécifier tous les identifiants, tous les noms ou une combinaison d'identifiants et de noms. Si vous spécifiez une combinaison d'ID et de noms, le nombre total d'ID et de noms ne doit pas dépasser 100. |
| `getVideos()` | `username`:string; | 👀 **Obtient des informations sur une ou plusieurs vidéos publiées. Vous pouvez obtenir des vidéos par identifiant, par utilisateur ou par jeu/catégorie.**<br>💡 **Note** : Vous pouvez appliquer plusieurs filtres pour obtenir un sous-ensemble de vidéos. Les filtres sont appliqués sous forme d’opération ET à chaque vidéo. Par exemple, si la langue est définie sur « de » et que game_id est défini sur 21779, la réponse inclut uniquement les vidéos montrant des utilisateurs jouant à League of Legends en allemand. Les filtres s'appliquent uniquement si vous obtenez des vidéos par ID utilisateur ou ID de jeu. |
___
<br>
<br>
Contactez moi sur Discord si vous rencontrez des difficultés : ix_xs
