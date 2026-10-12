---
title: "Pagination"
description: "Les endpoints de liste renvoient un paginateur. Attendez-le pour une page, parcourez-le pour tous les éléments, ou demandez un tableau, le premier élément ou le total."
sidebar:
  order: 3
---

Twitch sert les listes page par page, avec un curseur à transmettre pour obtenir la suivante. La bibliothèque cache le curseur : chaque endpoint de liste renvoie un `Paginator`, et vous choisissez quelle part de la liste vous voulez par la façon dont vous l'utilisez.

## Un premier exemple

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({ clientId, clientSecret });

// Une page.
const page = await twitch.streams.get({ game_id: "509658", first: 20 });
console.log(page.data.length, page.hasNext);

// Tous les éléments, page après page.
for await (const stream of twitch.streams.get({ game_id: "509658" })) {
  console.log(stream.user_name, stream.viewer_count);
}

// Les 250 premiers éléments, dans un tableau.
const top = await twitch.streams.get().take(250);
```

Appeler `twitch.streams.get()` n'envoie rien. Un paginateur récupère des données quand vous l'attendez avec `await`, quand vous le parcourez ou quand vous appelez l'une de ses méthodes.

## Choisir comment lire une liste

| Vous voulez | Écrivez | Requêtes |
| --- | --- | --- |
| Une page | `await paginator` | 1 |
| Tous les éléments | `for await (const item of paginator)` | Une par page, à mesure que la boucle avance |
| Toutes les pages | `for await (const page of paginator.pages())` | Une par page, à mesure que la boucle avance |
| Tous les éléments dans un tableau | `await paginator.all()` | Une par page |
| Au plus `n` éléments | `await paginator.take(n)` ou `.all({ limit: n })` | Aussi peu que `n` le permet |
| Le premier élément | `await paginator.first()` | 1 |
| Le total annoncé par Twitch | `await paginator.total()` | 1 |

## Lire une page

Attendre un paginateur avec `await` récupère sa première page et vous donne une `Page`.

```ts
const page = await twitch.streams.get({ language: "fr", first: 50 });

page.data; // les éléments de cette page
page.cursor; // curseur de la page suivante, undefined sur la dernière
page.hasNext; // indique si une autre page suit
page.total; // total sur l'ensemble des pages, pour les endpoints qui en annoncent un
page.raw; // le corps de la réponse tel que Twitch l'a envoyé

for (const stream of page) console.log(stream.title); // une page est itérable
```

`page.next()` récupère la page suivante avec la même taille de page, et renvoie `null` après la dernière.

```ts
let page = await twitch.clips.get({ broadcaster_id: channelId, first: 20 });

while (true) {
  for (const clip of page.data) console.log(clip.title, clip.view_count);
  const next = await page.next();
  if (!next) break;
  page = next;
}
```

Pour reprendre plus tard, par exemple au prochain clic sur un bouton « charger plus », conservez `page.cursor` et repassez-le dans `after` :

```ts
declare const savedCursor: string;

const page = await twitch.clips.get({ broadcaster_id: channelId, first: 20, after: savedCursor });
```

## Parcourir tous les éléments

`for await` parcourt toute la liste et récupère chaque page quand la boucle l'atteint. Quittez la boucle avec `break` ou `return` et aucune autre page n'est demandée.

```ts
// Diffusions passées d'une chaîne, les plus récentes d'abord, jusqu'au début de 2026.
for await (const video of twitch.videos.get({ user_id: channelId, type: "archive" })) {
  if (video.created_at < "2026-01-01") break;
  console.log(video.created_at, video.title, video.duration);
}
```

Quand vous préférez travailler page par page, par exemple pour écrire chaque page dans une base de données en une seule requête, parcourez `pages()` :

```ts
declare function saveAll(rows: { user_id: string; user_login: string }[]): Promise<void>;

for await (const page of twitch.chat.chatters({ broadcaster_id: channelId }).pages()) {
  await saveAll(page.data);
}
```

## Rassembler les éléments dans un tableau

`all()` lit jusqu'à la dernière page et renvoie un seul tableau. `take(n)` s'arrête après `n` éléments, et équivaut à `all({ limit: n })`.

```ts
const banned = await twitch.moderation.bans().all();
const latestClips = await twitch.clips.get({ broadcaster_id: channelId }).take(10);
const someStreams = await twitch.streams.get({ language: "fr" }).all({ limit: 300 });
```

Fixez une limite sur toute liste dont vous ne maîtrisez pas la longueur. `twitch.streams.get().all()` lirait tous les streams en direct sur Twitch.

`first()` renvoie le premier élément, ou `undefined` quand la liste est vide :

```ts
const lastPoll = await twitch.polls.get().first();
if (lastPoll) console.log(lastPoll.title, lastPoll.status);
```

## Obtenir un total

Certains endpoints annoncent combien d'éléments contient la liste entière : followers, chaînes suivies, abonnés, spectateurs présents dans le chat. `total()` lit ce nombre avec la plus petite requête que l'endpoint autorise. La méthode renvoie `undefined` quand l'endpoint n'annonce aucun total.

```ts
const followers = await twitch.channels.followers({ broadcaster_id: channelId }).total();
const chatters = await twitch.chat.chatters({ broadcaster_id: channelId }).total();
```

Si vous avez déjà une page, `page.total` contient le même nombre et ne coûte aucune requête.

## Quelle taille de page est utilisée

Le paramètre `first` est la taille de page. Quand vous le fixez, chaque requête de ce paginateur l'utilise. Quand vous l'omettez, la bibliothèque en choisit une adaptée à ce que vous avez demandé :

| Utilisation | Taille de page quand `first` n'est pas fixé |
| --- | --- |
| `await paginator` | La valeur par défaut de Twitch, 20 sur la plupart des endpoints |
| `for await`, `pages()`, `all()` | La plus grande que l'endpoint accepte |
| `take(n)`, `all({ limit: n })` | `n`, ou la plus grande que l'endpoint accepte si `n` est supérieur |
| `first()` | 1 |
| `total()` | 1, quelle que soit la valeur de `first` |

La plus grande page compte 100 éléments sur la plupart des endpoints. Elle en compte 1000 pour `chat.chatters` et `entitlements.drops`, 50 pour `channelPoints.redemptions`, 25 pour `predictions.get` et `schedule.get`, 20 pour `polls.get`.

Ainsi `take(10)` envoie une requête pour 10 éléments, et `take(250)` envoie trois requêtes de 100.

## Paginer en arrière

Certains endpoints acceptent un curseur `before` (`streams.get`, `games.top`, `clips.get`, `subscriptions.get`, `moderation.bans`, entre autres). Quand vous en passez un, le paginateur avance en arrière : chaque requête suivante envoie le nouveau curseur dans `before` au lieu de `after`.

```ts
const page = await twitch.games.top({ first: 20 });
const second = await page.next();

// À partir du curseur de la deuxième page, revenir vers le début.
if (second?.cursor) {
  const previous = await twitch.games.top({ first: 20, before: second.cursor });
  console.log(previous.data.map((game) => game.name));
}
```

## Lire les champs supplémentaires de la réponse

Certains endpoints envoient des champs à côté de la liste. Ils se trouvent dans `page.raw`, qui est typé pour ces endpoints.

```ts
// Abonnés : le total et les points d'abonnement de la chaîne.
const subs = await twitch.subscriptions.get({ first: 1 });
console.log(subs.total, subs.raw.points);

// Abonnements EventSub : ce qu'ils coûtent par rapport à votre limite.
const subscriptions = await twitch.eventsub.subscriptions({ status: "enabled" });
console.log(subscriptions.raw.total, subscriptions.raw.total_cost, subscriptions.raw.max_total_cost);
```

Il en va de même pour `schedule.get` (le diffuseur et les vacances, sous `page.raw.data`) et `chat.userEmotes` (`page.raw.template`). Sur les autres endpoints, `raw` est typé `unknown`.

## Limites à connaître

- Trois endpoints n'ont pas de taille de page : `eventsub.subscriptions`, `conduits.shards` et `chat.userEmotes`. Twitch décide du nombre d'éléments que contient une page. `take(n)` s'arrête toujours à `n` éléments, mais `first()` et `total()` récupèrent une première page entière.
- Les listes en direct bougent pendant que vous les parcourez. `streams.get` est trié par nombre de spectateurs, qui change entre deux requêtes : un stream peut donc apparaître deux fois ou être sauté. Gardez un `Set` des identifiants déjà vus quand les doublons comptent.
- Twitch arrête tôt la pagination de certaines listes. `clips.get` se termine après environ 1000 résultats : resserrez `started_at` et `ended_at` pour en atteindre davantage.
- Si Twitch redonne un curseur qu'il a déjà fourni, l'itération s'arrête au lieu de boucler sans fin.
- Chaque page est une requête ordinaire : elle respecte la limite de débit, fait l'objet de nouvelles tentatives comme tout `GET`, et peut lever une erreur. Une erreur levée au milieu d'une boucle `for await` sort de la boucle. Les options de requête passées à la méthode s'appliquent à chaque page : un `AbortSignal` annule donc toute l'itération.
- Un paginateur peut être attendu avec `await` mais n'est pas une `Promise` : il a `then`, pas `catch` ni `finally`. Utilisez `try` et `catch` autour de l'`await`.

```ts
const seen = new Set<string>();

for await (const stream of twitch.streams.get({ language: "fr" })) {
  if (seen.has(stream.id)) continue;
  seen.add(stream.id);
}
```

## Voir aussi

- [Appeler l'API](/basics/calling-the-api/) : les autres formes qu'une méthode peut renvoyer.
- [Limites de débit et nouvelles tentatives](/basics/rate-limits-and-retries/) : ce qui se passe quand une longue itération atteint la limite.
- [Options de requête](/basics/request-options/) : `twitch.paginate()` pour un endpoint de liste que la bibliothèque n'a pas encore.
- [streams.get](/reference/api/streams/#get) : les paramètres et les champs de l'exemple utilisé sur cette page.
