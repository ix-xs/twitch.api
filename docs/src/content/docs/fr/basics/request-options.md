---
title: "Options de requête"
description: "Les options que chaque méthode accepte en dernier argument, et les deux échappatoires pour les endpoints que la bibliothèque n'a pas encore : twitch.request() et twitch.paginate()."
sidebar:
  order: 6
---

Chaque méthode de chaque groupe prend un dernier argument facultatif qui change la façon dont cet appel précis est fait : au nom de quel utilisateur, avec quel délai d'attente, avec quel signal. Le même circuit vous est ouvert à travers `twitch.request()` et `twitch.paginate()`, pour le jour où Twitch publie un endpoint avant la bibliothèque.

## Un premier exemple

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({ clientId, clientSecret });

// Après les paramètres.
const streams = await twitch.streams.get({ language: "fr" }, { timeout: 5000 }).take(20);

// Seules, sur une méthode sans paramètres.
const me = await twitch.users.me({ as: userId });

// Après un objet vide, quand les paramètres sont facultatifs et que vous n'en avez aucun.
const top = await twitch.games.top({}, { retries: 0 }).take(10);
```

## Les cinq options

| Option | Type | Effet |
| --- | --- | --- |
| `as` | `string` | Fait l'appel avec le jeton de cet utilisateur enregistré, ou avec le jeton d'application quand la valeur est `"app"`. |
| `token` | `string` | Envoie ce jeton d'accès tel quel, en dehors de toute gestion des jetons. |
| `signal` | `AbortSignal` | Annule l'appel, y compris ses nouvelles tentatives et ses attentes de limite de débit. |
| `timeout` | `number` | Millisecondes avant l'abandon d'une tentative. Remplace le `timeout` du client. |
| `retries` | `number` | Nombre de nouvelles tentatives après la première. Remplace le `retries` du client. |

Sur une méthode qui renvoie un paginateur, les options s'appliquent à chaque page qu'il récupère.

`users.getById` et `users.getByLogin` fusionnent normalement en une seule requête les appels faits dans le même tick. Un appel qui passe des options est envoyé seul.

### Agir au nom d'un utilisateur pour un appel

`as` prend l'identifiant d'un utilisateur enregistré avec `twitch.auth.addUser()` et remplace le choix automatique du jeton, y compris l'utilisateur d'une vue `twitch.as()`. [Agir au nom d'un utilisateur](/basics/acting-as-a-user/) donne les règles complètes.

```ts
await twitch.chat.send({ broadcaster_id: channelId, message: "Back in 5 minutes" }, { as: botId });
```

La valeur `"app"` demande à la place le jeton d'application, sur un endpoint qui accepte les deux sortes et qui choisirait sinon un utilisateur enregistré. Le jeton d'application n'appartient à aucun utilisateur : écrivez donc vous-même le paramètre de l'utilisateur qui agit. Un endpoint réservé aux utilisateurs le refuse avec une `TwitchAuthError`.

```ts
await twitch.chat.send(
  { broadcaster_id: channelId, sender_id: botId, message: "Sent with the app token" },
  { as: "app" },
);
```

### Envoyer un jeton que vous gérez vous-même

`token` sert pour un jeton dont le client ne sait rien : un JWT signé pour les endpoints d'extension, ou un jeton utilisateur que vous détenez pour un appel et que vous ne voulez pas enregistrer.

```ts
declare const extensionJwt: string;
declare const extensionId: string;

const extension = await twitch.extensions.get({ extension_id: extensionId }, { token: extensionJwt });
```

Le jeton est envoyé sans modification, et tout ce que le client fait pour les jetons enregistrés est désactivé :

- Ses scopes ne sont pas vérifiés avant la requête.
- Il n'est pas renouvelé après un `401`. L'erreur est levée telle que Twitch l'a envoyée.
- Un paramètre de l'utilisateur qui agit que vous omettez (`sender_id`, `moderator_id`, `broadcaster_id`) n'est pas rempli. Écrivez-le, sinon l'appel échoue avant d'être envoyé.
- Il reçoit son propre compartiment de limite de débit, et `as` vaut `"raw"` dans les événements `request` et `response`.

`token` l'emporte sur `as` quand les deux sont donnés.

### Borner ou annuler un appel

`timeout` et `retries` remplacent les réglages du client pour cet appel seulement, et `signal` l'annule à tout moment. [Limites de débit et nouvelles tentatives](/basics/rate-limits-and-retries/) explique ce que chacun couvre.

```ts
const controller = new AbortController();

const page = await twitch.search.channels(
  { query: "speedrun", live_only: true },
  { signal: controller.signal, timeout: 3000, retries: 1 },
);
```

## Appeler un endpoint que la bibliothèque n'a pas

`twitch.request()` envoie n'importe quelle requête Helix par le même circuit que les méthodes intégrées : choix du jeton, vérification des scopes, limite de débit, nouvelles tentatives, erreurs typées. Vous décrivez l'endpoint et donnez le type du corps de la réponse.

```ts
interface ChatSettingsBody {
  data: { broadcaster_id: string; slow_mode: boolean; slow_mode_wait_time: number | null }[];
}

const body = await twitch.request<ChatSettingsBody>({
  path: "chat/settings",
  query: { broadcaster_id: channelId },
});

console.log(body.data[0]?.slow_mode);
```

La méthode renvoie le corps JSON analysé, ou `undefined` quand la réponse est vide, comme avec un `204`. Le type que vous donnez n'est pas vérifié par rapport à ce que Twitch envoie.

Un appel qui agit pour un utilisateur déclare le reste. Voici comment la méthode intégrée `chat.announce` est écrite :

```ts
await twitch.request({
  method: "POST",
  path: "chat/announcements",
  query: { broadcaster_id: channelId },
  body: { message: "Giveaway in 5 minutes", color: "purple" },
  scopes: ["moderator:manage:announcements"],
  context: "moderator_id",
});
```

Grâce à `context`, `moderator_id` est ajouté à la chaîne de requête avec l'identifiant de l'utilisateur dont le jeton est choisi. Grâce à `scopes`, un jeton sans ce scope échoue avec une `TwitchScopeError` avant tout envoi.

### Tous les champs d'un endpoint

| Champ | Type | Par défaut | Signification |
| --- | --- | --- | --- |
| `path` | `string` | Obligatoire | Chemin sous l'URL de base de Helix, sans barre oblique initiale : `"chat/settings"`. |
| `method` | `"GET" \| "POST" \| "PUT" \| "PATCH" \| "DELETE"` | `"GET"` | Méthode HTTP. Elle décide aussi de ce qui est retenté. |
| `query` | `object` | Aucun | Paramètres de la chaîne de requête. Un tableau répète la clé, `undefined` et `null` sont ignorés, une `Date` est envoyée au format ISO 8601. |
| `body` | `object` | Aucun | Envoyé en JSON. |
| `auth` | `"any" \| "app" \| "user"` | `"any"` | Sorte de jeton que l'endpoint accepte. |
| `prefer` | `"user"` | Aucun | Pour un endpoint qui accepte les deux sortes mais répond davantage à un utilisateur : utilise l'utilisateur enregistré quand il y en a exactement un, le jeton d'application sinon. |
| `scopes` | `readonly ScopeInput[]` | Aucun | Scopes qui satisfont l'endpoint quand un jeton utilisateur est utilisé. Un seul suffit. Les noms de scope connus sont proposés par l'autocomplétion, et toute autre chaîne est acceptée. |
| `context` | `string \| { body: string }` | Aucun | Nom du paramètre qui contient l'utilisateur qui agit. Une chaîne pointe dans la chaîne de requête, `{ body: "sender_id" }` dans le corps. Il détermine quel jeton est utilisé et il est rempli quand il est omis. |
| `options` | `RequestOptions` | Aucun | Les options par appel décrites plus haut. |
| `response` | `"json" \| "text"` | `"json"` | Comment lire la réponse. `"text"` renvoie le corps sous forme de chaîne. |

Un endpoint plus récent que la bibliothèque peut demander un scope plus récent lui aussi. `scopes` prend son nom comme une simple chaîne, et la vérification avant la requête fonctionne de la même façon.

Appelée sur une vue `twitch.as(userId)`, `request()` agit au nom de cet utilisateur, comme n'importe quelle autre méthode.

### L'envelopper dans une fonction

Pour donner à votre propre endpoint la même forme que les endpoints intégrés, acceptez des options de requête et transmettez-les dans `options` :

```ts
import type { RequestOptions } from "@ix-xs/twitch.api";

interface Thing {
  id: string;
  title: string;
}

async function createThing(params: { broadcaster_id?: string; title: string }, options?: RequestOptions): Promise<Thing | undefined> {
  const body = await twitch.request<{ data: Thing[] }>({
    method: "POST",
    path: "some/new/endpoint",
    body: params,
    auth: "user",
    scopes: ["channel:manage:broadcast"],
    context: { body: "broadcaster_id" },
    options,
  });
  return body.data[0];
}

await createThing({ title: "Hello" }, { as: userId });
```

## Paginer une liste que la bibliothèque n'a pas

`twitch.paginate()` fait la même chose pour un endpoint qui renvoie des pages. La méthode vous donne un [paginateur](/basics/pagination/) ordinaire : `await`, `for await`, `all()`, `take()`, `first()`, `total()`.

```ts
interface Thing {
  id: string;
  title: string;
}

const things = await twitch.paginate<Thing>({ path: "some/new/list", query: { broadcaster_id: channelId } }).take(50);
```

Sans second argument, elle attend la disposition habituelle des listes de Twitch : les éléments dans `data`, le curseur dans `pagination.cursor`, un `total` facultatif, un paramètre de taille de page nommé `first` qui va jusqu'à 100, et `after` pour demander la page suivante. Si la chaîne de requête contient un curseur `before`, elle pagine en arrière avec `before`. Quand un endpoint diffère, décrivez-le :

| Champ | Type | Par défaut | Signification |
| --- | --- | --- | --- |
| `max` | `number` | `100` | Plus grande taille de page que l'endpoint accepte. C'est la taille utilisée pour itérer quand la chaîne de requête ne fixe aucune taille de page. |
| `sizeParam` | `string \| null` | `"first"` | Nom du paramètre de taille de page. `null` quand l'endpoint n'en a pas. |
| `extract` | `(body: R) => { data, cursor?, total? }` | Lit `data`, `pagination.cursor` et `total` | Extrait du corps d'une réponse les éléments, le curseur suivant et le total. |

Le second paramètre de type est le type du corps de la réponse. Il type `extract` et `page.raw`.

```ts
interface Thing {
  id: string;
  title: string;
}

interface ThingsBody {
  data: { owner_id: string; things: Thing[] };
  pagination?: { cursor?: string };
}

const paginator = twitch.paginate<Thing, ThingsBody>(
  { path: "some/new/list", query: { broadcaster_id: channelId } },
  { max: 25, extract: (body) => ({ data: body.data.things, cursor: body.pagination?.cursor }) },
);

const page = await paginator;
console.log(page.raw.data.owner_id, page.data.length);
```

## Limites à connaître

- Les corps sont uniquement en JSON, et les chemins sont résolus sous l'URL de base de Helix. `request()` ne peut pas atteindre un autre hôte.
- Les types `Endpoint`, `PageConfig`, `RequestOptions` et `HttpMethod` sont exportés si vous avez besoin de les nommer.
- Pour un type EventSub plus récent que la bibliothèque, vous n'avez pas besoin de `request()` : les écouteurs acceptent n'importe quel nom `"type@version"`, voir [Événements typés](/events/typed-events/).

## Voir aussi

- [Agir au nom d'un utilisateur](/basics/acting-as-a-user/) : comment `as`, `auth` et `context` déterminent le jeton.
- [Limites de débit et nouvelles tentatives](/basics/rate-limits-and-retries/) : ce que couvrent `timeout`, `retries` et `signal`.
- [Pagination](/basics/pagination/) : ce que sait faire le paginateur renvoyé par `paginate()`.
- [Options du client](/reference/client-options/) : les mêmes réglages pour tout le client.
