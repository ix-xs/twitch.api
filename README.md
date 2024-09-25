<div align=center>
    <span><b><code>@ix-xs/twitch.api</code></b></span><br><br>
</div>

<b>@ix-xs/twitch.api</b> est une bibliothèque JavaScript simplifiant les interactions avec l'API de Twitch. Conçue pour automatiser la gestion des tokens d'authentification, elle permet aux développeurs d'accéder facilement aux données de Twitch sans se soucier des tâches fastidieuses liées à la validation ou au renouvellement des tokens.

<h2>✨ Fonctionnalités principales</h2>
<ul>
    <li><b>Gestion automatique des tokens</b> : Génération, validation et renouvellement des tokens se font en arrière-plan.</li>
    <li><b>Intégration fluide</b> : Initialisez simplement le client avec votre clientId et clientSecret, et laissez la bibliothèque gérer le reste.</li>
    <li><b>API complète</b> : Accédez à des fonctionnalités essentielles de l'API Twitch comme les streams, utilisateurs, clips, émotes et bien plus encore.</li>
</ul>

<h2>✨Installation</h2>
<code>npm install @ix-xs/twitch.api</code>

<h2>👀Utilisation</h2>
<ul>
1. Créez un nouveau client en fournissant votre <code>client_id</code> et <code>client_secret</code> :

```js
const twitchAPI = require("@ix-xs/twitch.api");

const client = new twitchAPI({ clientId:"votre_id_client", clientSecret:"votre_secret_client" });
```

2. Initialisez le client avec la méthode initialize() pour démarrer la gestion automatique des tokens :

```js
await client.initialize();
```

<b>Note</b> : Cette fonction permet de mettre en place un système de validation périodique du token, effectué automatiquement une fois par heure. En raison de cette vérification régulière, l'utilisation de la console de développement devient indisponible pendant le processus. Pensez à utiliser un gestionnaire de processus comme PM2.
</ul>

<h2>📚 Documentation détaillée</h2>
Consultez la documentation ci-dessous pour en savoir plus sur les méthodes disponibles et leur utilisation, ou contactez-moi sur Discord (ix_xs) si vous avez des questions ou des difficultés.

<br>
<h3>Liste des appels</h3>
<br>

Méthode | options | Description |
| --- | --- | --- |
| `initialize()` |  | 👀 **Démarre le client**<br>💡 **Note** : Cette fonction est requise afin de démarrer la surveillance du token qui doit maintenant être valider toutes les heures |
| `generateToken()` |  | 👀 **Génère un nouveau token**<br>💡 **Note** : Le token se gère de façon automatique, cette fonction sert uniquement a son auto-gestion|
| `isExpiredToken()` |  | 👀 **Renvoi la validité du token actuel** (true ou false)<br>💡 **Note** : Le token se gère de façon automatique, cette fonction sert uniquement a son auto-gestion |
| `refreshToken()` |  | 👀 **Génère un nouveau token**<br>💡 **Note** : Le token se gère de façon automatique, cette fonction sert uniquement a son auto-gestion |
| `validateToken()` |  | 👀 **Valide le token**<br>💡 **Note** : Le token se gère de façon automatique, cette fonction sert uniquement a son auto-gestion |
| `updateTokenFile()` |  | 👀 **Met à jour le token**<br>💡 **Note** : Le token se gère de façon automatique, cette fonction sert uniquement a son auto-gestion |
| `startPeriodicValidation()` |  | 👀 **Démarre la surveillance pour la validation periodique du token (toutes les heures)**<br>💡 **Note** : Le token se gère de façon automatique, cette fonction sert uniquement a son auto-gestion |
| `getStreams()` | {<br>`users_names?`:Array\<string\>;<br>`games_names?`:Array\<string\>;<br>`type?`:"all"\|"live";<br>`languages?`:Array\<string\>;<br>`first?`:number;<br>`before?`:string;<br>`after?`:string;<br>} | 👀 **Renvoi une liste des streams**<br>💡 **Note** : La liste est classée par ordre décroissant du nombre de téléspectateurs regardant le flux. Étant donné que les spectateurs vont et viennent pendant un flux, il est possible de trouver des flux en double ou manquants dans la liste au fur et à mesure que vous parcourez les résultats. |
| `getUsers()` | `usernames`:Array\<string\>; | 👀 **Renvoi les informations d'un ou plusieurs utilisateur(s)** |
| `getCheermotes()` |  | 👀 **Renvoi une liste de Cheermotes que les utilisateurs peuvent utiliser pour encourager Bits dans la salle de discussion de n'importe quelle chaîne compatible Bits.**<br>💡 **Note** : Les cheermotes sont des émoticônes animées auxquelles les spectateurs peuvent attribuer des Bits. |
| `getChatEmotes()` | `username?`:string; | 👀 **Obtient la liste des [émotes globales](https://www.twitch.tv/creatorcamp/fr-fr/paths/getting-started-on-twitch/emotes/) ou la liste des émotes personnalisées du diffuseur.**<br>💡 **Note** : Les émotes globales sont des émoticônes créées par Twitch que les utilisateurs peuvent utiliser dans n'importe quel chat Twitch. Les diffuseurs créent ces émotes personnalisées pour les utilisateurs qui s'abonnent ou suivent la chaîne ou encouragent Bits dans la fenêtre de discussion de la chaîne. [En savoir plus](https://dev.twitch.tv/docs/irc/emotes/).<br>💡 **Note** : À l'exception des émoticônes personnalisées, les utilisateurs peuvent utiliser des émoticônes personnalisées dans n'importe quel chat Twitch. |
| `getChatBadges()` | `username?`:string; |  👀 **Obtient la liste des badges de discussion de Twitch, que les utilisateurs peuvent utiliser dans la salle de discussion de n'importe quelle chaîne, ou la liste des badges de discussion personnalisés du diffuseur.**<br>💡 **Note** : Pour plus d'informations sur les badges de chat, consultez le [Guide des badges de chat Twitch](https://help.twitch.tv/s/article/twitch-chat-badges-guide?langue=en_US).<br>💡 **Note** : La liste est vide si le diffuseur n'a pas créé de badges de discussion personnalisés. Pour plus d'informations sur les badges personnalisés, consultez [badges d'abonné](https://help.twitch.tv/s/article/subscriber-badge-guide?langue=en_US) et [badges Bits](https://help.twitch.tv/s/article/custom-bit-badges-guide?langue=en_US). |
| `getChatSettings()` | `username`:string; | 👀 **Renvoi les paramètres de discussion du diffuseur** |
| `getUsersChatColor()` | `usernames`:Array\<string>; | 👀 **Renvoi la couleur utilisée pour le nom de l'utilisateur dans le chat.** |
| `getClips()` | `username`:string; | 👀 **Obtient un ou plusieurs clips vidéo capturés à partir de flux**<br>💡 **Note** : Pour plus d'informations sur les clips, consultez [Comment utiliser les clips](https://help.twitch.tv/s/article/how-to-use-clips?langage=en_US). |
| `getTopGames()` | `params?`:<br>{<br>`first?`:number;<br>`after?`:string;<br>`before?`:string;<br>} | 👀 **Renvoi des informations sur toutes les diffusions sur Twitch** |
| `getGames()` | `gameNames`:Array\<string\>; | 👀 **Renvoi des informations sur les catégories ou les jeux spécifiés.**<br>💡 **Note** : Vous pouvez obtenir jusqu'à 100 catégories ou jeux en spécifiant leur identifiant ou leur nom. Vous pouvez spécifier tous les identifiants, tous les noms ou une combinaison d'identifiants et de noms. Si vous spécifiez une combinaison d'ID et de noms, le nombre total d'ID et de noms ne doit pas dépasser 100. |
| `getVideos()` | `username`:string; | 👀 **Obtient des informations sur une ou plusieurs vidéos publiées. Vous pouvez obtenir des vidéos par identifiant, par utilisateur ou par jeu/catégorie.**<br>💡 **Note** : Vous pouvez appliquer plusieurs filtres pour obtenir un sous-ensemble de vidéos. Les filtres sont appliqués sous forme d’opération ET à chaque vidéo. Par exemple, si la langue est définie sur « de » et que game_id est défini sur 21779, la réponse inclut uniquement les vidéos montrant des utilisateurs jouant à League of Legends en allemand. Les filtres s'appliquent uniquement si vous obtenez des vidéos par ID utilisateur ou ID de jeu. |
___

<h2>💡 Exemples</h2>

```js
const twitchAPI = require("@ix-xs/twitch.api");
const client = new twitchAPI({ client_id:"votre_client_id", client_secret:"votre_client_secret" });

client.getStreams().then(console.log); // Renvoi les 20 flux les plus actifs

client.getStreams({
    users_names:["twitchdev"],
}); // Renvoi les flux pour les connexions spécifiées. Si l’utilisateur n’est pas en direct, la réponse ne l’inclut pas.

client.getUsers(["twitchdev"]).then(console.log); // Renvoi les informations sur l'utilisateur

client.getCheermotes(); // Renvoi une liste des cheermotes

client.getChatEmotes().then(console.log); // Renvoi toutes les émoticônes globales

client.getChatEmotes("twitchdev").then(console.log); // Renvoi les émoticônes personnalisées créées par la chaîne utilisateur

client.getChatBadges().then(console.log); // Renvoi la liste des badges de discussion globaux
client.getChatBadges("twitchdev").then(console.log); // Renvoi la liste des badges de discussion personnalisés créés par la chaîne utilisateur

client.getChatSettings("twitchdev").then(console.log); // Renvoi les paramètre de discussion du diffuseur

client.getUsersChatColor(["twitchdev"]).then(console.log); // Renvoi la couleur utilisée pour le nom de l'utilisateur dans le chat

client.getClips("twitchdev").then(console.log) // Renvoi les clips de l'utilisateur

client.getTopGames().then(console.log); // Renvoi des informations sur toutes les diffusions sur Twitch

client.getGames(["Fortnite"]).then(console.log); // Renvoi des informations sur les catégories ou les jeux spécifiés

client.getVideos("twitchdev").then(console.log); // Renvoi des informations sur une ou plusieurs vidéos publiées.
```
