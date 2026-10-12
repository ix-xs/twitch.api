---
title: "Appeler l'API"
description: "Comment les méthodes du client sont organisées, ce qu'elles prennent et ce qu'elles renvoient. Lisez cette page une fois et tous les groupes fonctionnent de la même façon."
sidebar:
  order: 1
---

Chaque endpoint de l'API Twitch est une méthode d'un groupe du client : `twitch.users`, `twitch.chat`, `twitch.moderation` et 27 autres. Tous suivent les mêmes quelques conventions, décrites ici.

## Un premier exemple

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({ clientId, clientSecret });

const user = await twitch.users.getByLogin("twitchdev");
if (!user) throw new Error("No such user");

const [channel] = await twitch.channels.get({ broadcaster_id: user.id });
const games = await twitch.games.get({ name: ["Fortnite", "Minecraft"] });
const clips = await twitch.clips.get({ broadcaster_id: user.id }).take(5);

console.log(channel?.title, games.length, clips.length);
```

## Passer des paramètres

Une méthode prend un seul objet de paramètres, avec les noms qu'utilise l'API Twitch : `broadcaster_id`, `user_id`, `first`, `started_at`. Rien n'est renommé : la référence officielle et cette bibliothèque se lisent donc de la même façon.

```ts
await twitch.chat.updateSettings({
  broadcaster_id: channelId,
  slow_mode: true,
  slow_mode_wait_time: 10,
});
```

Vous n'avez pas à savoir quels champs voyagent dans la chaîne de requête et lesquels dans le corps. Ici, `broadcaster_id` va dans la chaîne de requête et les deux autres dans le corps JSON, comme Twitch l'attend. Le `moderator_id` que cet endpoint réclame aussi est rempli pour vous, voir [Agir au nom d'un utilisateur](/basics/acting-as-a-user/).

Trois détails valent pour tous les groupes :

- Les identifiants sont des chaînes de caractères, dans les paramètres comme dans les résultats.
- Un champ qui accepte plusieurs valeurs prend une chaîne ou un tableau : `{ id: "141981764" }` et `{ id: ["141981764", "12826"] }` fonctionnent tous les deux.
- Quand tous les champs sont facultatifs, l'objet lui-même est facultatif : `twitch.streams.get()`.

Quelques méthodes qui n'ont besoin que d'une valeur la prennent directement : `twitch.users.getById(id)`, `twitch.users.getByLogin(login)`, `twitch.eventsub.unsubscribe(id)`, `twitch.conduits.delete(id)`.

Chaque méthode accepte aussi des options de requête en dernier argument, pour choisir un utilisateur ou fixer un délai d'attente pour un appel. Voir [Options de requête](/basics/request-options/).

## Savoir ce qui revient

Les méthodes renvoient l'une de cinq formes. Le type de retour vous dit laquelle, tout comme la page de référence de la méthode.

| Forme | Type | Exemples |
| --- | --- | --- |
| Une liste | `Promise<T[]>` | `users.get`, `channels.get`, `games.get`, `chat.colors` |
| Un objet | `Promise<T>` | `users.me`, `chat.send`, `chat.settings`, `polls.create` |
| Un objet, ou rien de trouvé | `Promise<T \| null>` | `users.getById`, `users.getByLogin`, `teams.get`, `subscriptions.check` |
| Rien | `Promise<void>` | `chat.announce`, `moderation.unban`, `channels.update` |
| Un paginateur | `Paginator<T>` | `streams.get`, `channels.followers`, `clips.get`, `moderation.bans` |

```ts
// Une liste : les éléments que Twitch ne trouve pas sont absents, le tableau peut être vide.
const users = await twitch.users.get({ login: ["twitchdev", "nobody_has_this_login"] });

// Un objet ou null.
const team = await twitch.teams.get({ name: "livecoders" });
if (team) console.log(team.users.length, "members");

// Un paginateur : rien n'est récupéré tant que vous ne l'utilisez pas.
const followers = await twitch.channels.followers({ broadcaster_id: channelId }).total();
```

Un élément manquant n'est pas une erreur : une liste l'omet, et une recherche qui peut ne rien trouver renvoie `null`. Les rares exceptions sont signalées sur la méthode, comme `channelPoints.rewards`, à laquelle Twitch répond par un `404` quand aucun des identifiants demandés n'existe. Tout autre problème lève une erreur typée, voir [Erreurs](/basics/errors/).

Un paginateur est le résultat de chaque endpoint que Twitch sert page par page. [Pagination](/basics/pagination/) décrit ce que vous pouvez en faire.

Une poignée de méthodes renvoient ce qui convient le mieux à leur endpoint : `streams.key()` renvoie la clé de stream sous forme de chaîne, `schedule.icalendar()` du texte iCalendar, `videos.delete()` les identifiants supprimés, `chat.globalEmotes()` les emotes et leur modèle d'URL.

## Rechercher beaucoup d'identifiants à la fois

Twitch plafonne la plupart des recherches à 100 identifiants par requête. La bibliothèque supprime ce plafond : passez-en autant que vous en avez, la liste est découpée, les requêtes sont envoyées en parallèle et les réponses sont fusionnées en un seul tableau.

```ts
declare const ids: string[]; // disons 450 identifiants d'utilisateur

const users = await twitch.users.get({ id: ids }); // 5 requêtes, un seul tableau
```

Cela s'applique aux méthodes qui renvoient une simple liste :

| Méthode | Champs découpés | Par requête |
| --- | --- | --- |
| `users.get` | `id`, `login` | 100 au total |
| `channels.get` | `broadcaster_id` | 100 |
| `games.get` | `id`, `name`, `igdb_id` | 100 au total |
| `chat.colors` | `user_id` | 100 |
| `chat.emoteSets` | `emote_set_id` | 25 |
| `channelPoints.rewards` | `id` | 50 |
| `bits.customPowerUps` | `id` | 50 |
| `clips.downloads` | `clip_id` | 10 |
| `users.authorization` | `user_id` | 10 |

Les endpoints paginés ne sont pas découpés. `streams.get({ user_id })`, par exemple, accepte jusqu'à 100 identifiants, comme l'indique la documentation de son paramètre.

## Rechercher un élément plusieurs fois

Le cas inverse est courant dans les bots : plusieurs parties du programme ont chacune besoin d'un utilisateur au même moment. `users.getById` et `users.getByLogin` fusionnent en une seule requête les appels faits dans le même tick.

```ts
// Une seule requête HTTP, pas trois.
const [a, b, c] = await Promise.all([
  twitch.users.getById("141981764"),
  twitch.users.getById("12826"),
  twitch.users.getById("57781936"),
]);
```

Ce qu'il faut savoir sur cette fusion :

- « Le même tick » désigne des appels lancés l'un après l'autre sans `await` entre eux : un `Promise.all`, un `map`, plusieurs gestionnaires d'événements qui s'exécutent à la suite.
- Chacune des deux méthodes a son propre lot. Un mélange d'appels à `getById` et à `getByLogin` coûte deux requêtes.
- Demander deux fois le même identifiant dans un même tick partage une seule recherche.
- `getByLogin` met le nom de connexion en minuscules avant de le rechercher.
- Un appel qui passe des options de requête est envoyé seul, puisque ses options peuvent différer de celles de ses voisins.
- Si la requête fusionnée échoue, chaque appel qui en faisait partie est rejeté avec la même erreur.

## Travailler avec les dates

Twitch envoie les horodatages sous forme de chaînes RFC 3339, et la bibliothèque les laisse tels quels : `created_at`, `started_at`, `followed_at` sont des chaînes.

```ts
const stream = await twitch.streams.get({ user_login: "twitchdev" }).first();

if (stream) {
  const minutes = Math.round((Date.now() - new Date(stream.started_at).getTime()) / 60_000);
  console.log(`Live for ${minutes} minutes`);
}
```

Dans les paramètres, un champ qui attend un horodatage accepte une chaîne ou une `Date`. Une `Date` est envoyée au format ISO 8601.

```ts
const lastWeek = new Date(Date.now() - 7 * 24 * 3_600_000);

const clips = await twitch.clips.get({ broadcaster_id: channelId, started_at: lastWeek }).take(20);
```

## Trouver la méthode qu'il vous faut

- La [référence](/reference/overview/) liste chaque groupe et chaque méthode, avec ses paramètres, son type de retour, le jeton nécessaire et un exemple.
- La page d'accueil de ce site propose un outil de recherche : tapez ce que vous voulez faire (« ban », « followers », « poll ») et il affiche les méthodes et les types d'événements correspondants.
- Dans votre éditeur, tapez `twitch.` et laissez l'autocomplétion lister les groupes, puis les méthodes. Chaque méthode porte sa documentation : ce qu'elle fait, le jeton et le scope nécessaires, un exemple et un lien vers la référence officielle de Twitch. Les paramètres et les résultats sont typés, champ par champ.

Les noms de méthode sont courts et suivent un même schéma : `get` pour la lecture principale d'un groupe (`users.get`, `streams.get`, `polls.get`), un nom pour les autres lectures (`channels.followers`, `moderation.bans`), un verbe pour les actions (`chat.send`, `moderation.ban`, `polls.create`).

## Voir aussi

- [Agir au nom d'un utilisateur](/basics/acting-as-a-user/) : comment le jeton de chaque appel est choisi.
- [Pagination](/basics/pagination/) : tout ce qu'un paginateur sait faire.
- [Erreurs](/basics/errors/) : ce qui est levé et comment distinguer les erreurs.
- [Options de requête](/basics/request-options/) : les réglages par appel, et l'appel d'un endpoint que la bibliothèque n'a pas encore.
- [Référence](/reference/overview/) : tous les groupes et toutes les méthodes.
