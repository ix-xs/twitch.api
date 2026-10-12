---
title: "Limites de débit et nouvelles tentatives"
description: "Comment le client suit la limite de débit de Twitch, quels échecs il retente de lui-même, et les réglages qui contrôlent l'attente, les nouvelles tentatives, les délais d'attente et l'annulation."
sidebar:
  order: 5
---

Twitch limite le nombre de requêtes que chaque jeton peut faire par minute, et tout appel réseau peut échouer un instant. Le client gère les deux avant qu'une erreur vous parvienne : il attend quand une limite est atteinte et renvoie ce qui peut l'être sans risque. Cette page dit exactement ce qu'il fait, et comment le changer.

## Les réglages

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({
  clientId,
  clientSecret,
  rateLimit: "wait", // ou "throw". Par défaut : "wait"
  retries: 3, // nouvelles tentatives après la première. Par défaut : 3
  timeout: 15_000, // millisecondes par tentative. Par défaut : 15000
});
```

`retries` et `timeout` peuvent aussi être fixés pour un seul appel, dans les [options de requête](/basics/request-options/) :

```ts
const streams = await twitch.streams.get({ first: 20 }, { timeout: 3000, retries: 0 });
```

## Comment la limite de débit est suivie

Twitch compte les requêtes par jeton et indique l'état du compteur dans trois en-têtes de chaque réponse : `Ratelimit-Limit`, `Ratelimit-Remaining` et `Ratelimit-Reset`. La [documentation de Twitch](https://dev.twitch.tv/docs/api/guide/#twitch-rate-limits) décrit la règle. Le client tient un compartiment par jeton :

| Compartiment | Utilisé par |
| --- | --- |
| `app` | Tous les appels faits avec le jeton d'application. |
| `user:<id>` | Les appels faits avec le jeton de cet utilisateur. Chaque utilisateur a le sien. |
| `raw:<fingerprint>` | Les appels faits avec un jeton passé dans `{ token }`. Le nom contient une courte empreinte, jamais le jeton. |

Pour chaque compartiment, il procède ainsi :

- Après chaque réponse, il note la limite, les points restants et l'heure de réinitialisation lus dans les en-têtes. Les réponses peuvent arriver dans le désordre : au sein d'une même fenêtre, il se fie donc au compteur le plus bas.
- Avant chaque tentative, il retire un point de sa propre copie du compteur. Les requêtes envoyées en parallèle ne peuvent donc pas dépasser ce que Twitch a annoncé en dernier.
- Quand le compteur est à zéro, la requête est retenue jusqu'à l'heure de réinitialisation, puis envoyée. L'événement `rateLimit` est émis avec le compartiment et la durée de l'attente.
- Une fois l'heure de réinitialisation passée, il oublie le compartiment jusqu'à ce que Twitch en donne de nouveau l'état.

Un utilisateur très actif ne ralentit pas les autres, et les appels faits avec des jetons utilisateur n'entament pas le budget du jeton d'application.

## Échouer au lieu d'attendre

Attendre convient à un bot ou à une tâche de fond. Dans un gestionnaire de requêtes web, vous pouvez préférer répondre tout de suite. Avec `rateLimit: "throw"`, un appel qui devrait attendre lève une `TwitchRateLimitError` sans être envoyé, et un `429` de Twitch est levé au lieu d'être retenté.

```ts
import { Twitch, TwitchRateLimitError } from "@ix-xs/twitch.api";

const twitch = new Twitch({ clientId, clientSecret, rateLimit: "throw" });

async function liveStreams(): Promise<Response> {
  try {
    const streams = await twitch.streams.get().take(20);
    return Response.json(streams);
  } catch (error) {
    if (!(error instanceof TwitchRateLimitError)) throw error;
    const seconds = Math.ceil(error.retryAfter / 1000);
    return new Response("Try again shortly", { status: 429, headers: { "Retry-After": String(seconds) } });
  }
}
```

`TwitchRateLimitError` étend `TwitchApiError` (son `status` vaut `429`) et ajoute deux champs :

| Champ | Type | Contenu |
| --- | --- | --- |
| `resetAt` | `number \| undefined` | Instant, en millisecondes depuis l'époque Unix, à partir duquel vous pouvez réessayer. |
| `retryAfter` | `number` | Millisecondes entre maintenant et `resetAt`. `0` quand il est inconnu ou déjà passé. |

## Quand Twitch répond 429

Avec le réglage par défaut `rateLimit: "wait"`, un `429` est retenté, quelle que soit la méthode HTTP : Twitch n'a rien fait de la requête. Il y a deux cas.

- Le compartiment est vide (`Ratelimit-Remaining: 0` avec une heure de réinitialisation). Le compartiment est marqué vide jusqu'à cette heure : cette requête et toutes les autres requêtes du même jeton l'attendent donc.
- Le compartiment n'est pas vide. La limite appartient à l'endpoint : Twitch autorise une annonce dans le chat toutes les 2 secondes, un shoutout toutes les 2 minutes, etc. Les en-têtes ne disent rien de ces limites, le client attend donc selon son propre calendrier : entre 0,5 et 1 seconde la première fois, puis deux fois plus longtemps à chaque fois, jusqu'à 30 secondes. Il émet aussi `rateLimit` pour cette attente.

Chaque nouvelle tentative après un `429` compte dans `retries`. Quand elles sont épuisées, l'appel lève une `TwitchRateLimitError`. Pour une limite d'endpoint, son `resetAt` est une estimation du client, pas une heure donnée par Twitch.

## Ce qui est retenté

| Échec | `GET`, `PUT`, `DELETE` | `POST`, `PATCH` |
| --- | --- | --- |
| Échec réseau, connexion perdue pendant la lecture de la réponse | Retenté après un délai croissant | Non retenté |
| Tentative plus longue que `timeout` | Retenté après un délai croissant | Non retenté |
| Statut `500` et au-delà | Retenté après un délai croissant | Non retenté |
| Statut `429` | Retenté après l'attente | Retenté après l'attente |
| Statut `401` avec un jeton mort | Renvoyé une fois avec un jeton renouvelé | Idem |
| Tout autre `4xx` | Jamais | Jamais |

`POST` et `PATCH` ne sont pas renvoyés après un échec que Twitch a peut-être traité. Sinon, un message de chat dont la réponse s'est perdue pourrait être publié deux fois. Si vous voulez retenter ces appels vous-même, interceptez `TwitchNetworkError`, `TwitchTimeoutError` ou une `TwitchApiError` dont le statut vaut 500 ou plus, et décidez appel par appel.

Le délai croît à chaque nouvelle tentative et comporte une part d'aléa : 125 à 250 ms avant la première nouvelle tentative, 250 à 500 ms avant la deuxième, 500 à 1000 ms avant la troisième, et ainsi de suite jusqu'à 4 à 8 secondes.

`retries` est le nombre de tentatives après la première. La valeur par défaut de 3 signifie quatre tentatives au plus. `retries: 0` désactive les nouvelles tentatives, `429` compris. L'unique renvoi après un `401` est à part et ne compte pas, voir [Erreurs](/basics/errors/).

## Délais d'attente

`timeout` s'applique à une tentative : l'envoi de la requête et la lecture de la réponse entière. Il ne couvre pas le temps passé à attendre la limite de débit ni les pauses entre les tentatives. Une tentative qui dépasse le délai est retentée selon les règles ci-dessus, et se termine par une `TwitchTimeoutError` telle que `GET /streams timed out after 15000 ms.`

Un appel peut donc durer plus longtemps que `timeout` : jusqu'à quatre tentatives avec les valeurs par défaut, plus les attentes. Pour plafonner l'appel entier, utilisez un signal.

## Annuler un appel

Passez un `AbortSignal` dans les options de requête. L'annulation arrête tout ce que l'appel est en train de faire : la requête en cours, une attente de limite de débit, une pause entre deux tentatives. L'appel est rejeté avec la raison du signal.

```ts
// Un plafond de 10 secondes sur l'appel entier, attentes et nouvelles tentatives comprises.
const users = await twitch.users.get({ login: ["twitchdev"] }, { signal: AbortSignal.timeout(10_000) });

// Annuler à la main, ici quand on demande au processus de s'arrêter.
const controller = new AbortController();
process.once("SIGINT", () => controller.abort());

try {
  const streams = await twitch.streams.get({ language: "fr" }, { signal: controller.signal }).all({ limit: 5000 });
  console.log(streams.length);
} catch (error) {
  if (!controller.signal.aborted) throw error;
  console.log("Cancelled");
}
```

Le rejet porte la raison du signal, pas une `TwitchError` : une `TimeoutError` pour `AbortSignal.timeout()`, une `AbortError` pour `controller.abort()` sauf si vous passez votre propre raison. Sur un paginateur, le signal s'applique à chaque page.

## Consulter un compartiment

`twitch.rateLimitOf()` renvoie ce que le client sait du compartiment du jeton d'application, et `twitch.rateLimitOf(userId)` de celui d'un utilisateur.

```ts
const bucket = twitch.rateLimitOf(botId);

if (bucket) {
  const seconds = Math.max(0, Math.round((bucket.resetAt - Date.now()) / 1000));
  console.log(`${bucket.remaining} of ${bucket.limit} points left, reset in ${seconds} s`);
}
```

Le résultat est `{ limit, remaining, resetAt }`, avec `resetAt` en millisecondes depuis l'époque Unix. Il vaut `undefined` tant que Twitch n'a pas répondu à une requête faite avec ce jeton, et de nouveau une fois terminée la fenêtre qu'il décrit : `resetAt` est donc toujours dans le futur. Les compartiments des jetons passés avec `{ token }` ne peuvent pas être lus de cette façon.

Pour suivre les attentes au moment où elles se produisent, écoutez l'événement `rateLimit`, décrit dans [Observabilité](/basics/observability/).

## Limites à connaître

- Les requêtes au serveur OAuth suivent les réglages `timeout` et `retries` du client, pas ceux d'un appel, et ne sont comptées dans aucun compartiment. L'obtention du jeton d'application et la validation d'un jeton sont retentées après un échec réseau, un délai dépassé ou un statut de 500 et au-delà. Le rafraîchissement d'un jeton utilisateur n'est jamais envoyé deux fois, parce qu'un jeton de rafraîchissement peut être à usage unique : quand il échoue pour une raison temporaire, l'appel qui en avait besoin lève une erreur et l'utilisateur reste enregistré.
- Le client compte un point par requête. Si Twitch facture un endpoint autrement, les en-têtes de la réponse suivante corrigent le compteur.
- Les compartiments vivent en mémoire, par client. Deux processus qui partagent un jeton ne voient chacun que les en-têtes de leurs propres réponses : ils peuvent donc encore recevoir un `429`, qui est alors traité comme décrit plus haut.

## Voir aussi

- [Options de requête](/basics/request-options/) : `timeout`, `retries` et `signal` pour un seul appel.
- [Erreurs](/basics/errors/) : `TwitchRateLimitError`, `TwitchTimeoutError`, `TwitchNetworkError` et le traitement des `401`.
- [Observabilité](/basics/observability/) : les événements `rateLimit`, `request` et `response`.
- [Options du client](/reference/client-options/) : toutes les options du constructeur.
