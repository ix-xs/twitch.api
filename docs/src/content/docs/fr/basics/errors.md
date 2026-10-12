---
title: "Erreurs"
description: "Les classes d'erreur que lève la bibliothèque, comment les distinguer, ce que porte une requête en échec, et ce qui se passe quand Twitch répond 401."
sidebar:
  order: 4
---

Un appel qui échoue lève une erreur. La bibliothèque transforme chaque échec qu'elle connaît en l'une de quelques classes d'erreur, qui étendent toutes `TwitchError` : vous pouvez ainsi décider quoi faire d'après la classe et d'après une poignée de champs typés.

## Un premier exemple

```ts
import { Twitch, TwitchApiError, TwitchScopeError } from "@ix-xs/twitch.api";

const twitch = new Twitch({ clientId, clientSecret });

try {
  await twitch.moderation.ban({ broadcaster_id: channelId, user_id: "9876", duration: 600 });
} catch (error) {
  if (error instanceof TwitchScopeError) {
    console.log("Ask the user for", error.required);
  } else if (error instanceof TwitchApiError && error.status === 400) {
    console.log("Twitch refused:", error.message);
  } else {
    throw error;
  }
}
```

## Les classes d'erreur

| Classe | Étend | Levée quand |
| --- | --- | --- |
| `TwitchError` | `Error` | Classe de base. Elle est aussi levée telle quelle dans quelques cas : pas de `clientId`, pas de `fetch` dans le runtime, une réponse qui n'est pas du JSON. |
| `TwitchApiError` | `TwitchError` | Twitch a répondu par un statut d'erreur, et une nouvelle tentative n'était pas possible ou n'a rien changé. |
| `TwitchRateLimitError` | `TwitchApiError` | Un `429` qui n'a pas fait l'objet d'une nouvelle tentative, ou la limite de débit atteinte avec `rateLimit: "throw"`. |
| `TwitchAuthError` | `TwitchError` | Aucun jeton utilisable : aucun utilisateur enregistré, plusieurs utilisateurs et aucun choisi, un utilisateur qui agit impossible à deviner, pas de secret client, un jeton mort qui ne peut pas être renouvelé. |
| `TwitchScopeError` | `TwitchAuthError` | Le jeton utilisateur choisi n'a pas le scope dont l'endpoint a besoin. Levée avant l'envoi de la requête. |
| `TwitchTimeoutError` | `TwitchError` | Une tentative a duré plus longtemps que `timeout`, et ne pouvait pas être retentée ou était la dernière. |
| `TwitchNetworkError` | `TwitchError` | La requête n'a jamais atteint Twitch, ou la connexion s'est rompue avant l'arrivée de la réponse entière, avec la même condition sur les nouvelles tentatives. |
| `TwitchEventSubError` | `TwitchError` | Un écouteur EventSub a échoué : voir [Vue d'ensemble des événements](/events/overview/). |

Les requêtes au serveur OAuth (obtenir le jeton d'application, rafraîchir, valider ou révoquer un jeton, les flux de connexion) lèvent les mêmes classes : `TwitchApiError` pour un statut d'erreur, `TwitchTimeoutError` et `TwitchNetworkError` quand le serveur est injoignable.

La [référence des erreurs](/reference/errors/) liste les champs de chaque classe.

## Distinguer les erreurs

Utilisez `instanceof`. Deux classes ont une sous-classe : testez donc la sous-classe en premier quand vous traitez les deux, `TwitchRateLimitError` avant `TwitchApiError`, `TwitchScopeError` avant `TwitchAuthError`.

```ts
import {
  TwitchApiError,
  TwitchAuthError,
  TwitchError,
  TwitchNetworkError,
  TwitchRateLimitError,
  TwitchScopeError,
  TwitchTimeoutError,
} from "@ix-xs/twitch.api";

function describe(error: unknown): string {
  if (error instanceof TwitchScopeError) return `missing scope: ${error.required.join(" or ")}`;
  if (error instanceof TwitchAuthError) return `no usable token: ${error.message}`;
  if (error instanceof TwitchRateLimitError) return `rate limited for ${error.retryAfter} ms`;
  if (error instanceof TwitchApiError) return `Twitch answered ${error.status}: ${error.message}`;
  if (error instanceof TwitchTimeoutError || error instanceof TwitchNetworkError) return "Twitch is unreachable";
  if (error instanceof TwitchError) return error.message;
  throw error; // ne vient pas de la bibliothèque
}
```

Chaque classe donne aussi son propre nom à `error.name` (`"TwitchApiError"`, `"TwitchScopeError"`), ce qui est pratique dans les journaux. `TwitchNetworkError` et `TwitchTimeoutError` conservent l'échec d'origine dans `error.cause`.

## Lire une requête en échec

Une `TwitchApiError` porte toute la réponse.

| Champ | Type | Contenu |
| --- | --- | --- |
| `status` | `number` | Code de statut HTTP. |
| `error` | `string \| undefined` | Libellé court envoyé par Twitch, comme `Bad Request` ou `Unauthorized`. |
| `message` | `string` | Le message envoyé par Twitch, suivi du statut, de la méthode et du chemin : `Missing required parameter (400 on GET /helix/users)`. |
| `method` | `string` | Méthode HTTP de la requête. |
| `url` | `string` | URL complète de la requête, avec sa chaîne de requête. |
| `body` | `unknown` | Le corps de la réponse, analysé. Le texte brut quand ce n'est pas du JSON, `undefined` quand il n'y en a pas. |
| `headers` | `Headers \| undefined` | En-têtes de la réponse. |

```ts
import { TwitchApiError } from "@ix-xs/twitch.api";

try {
  await twitch.polls.create({ title: "Next game?", choices: ["Hades", "Celeste"], duration: 120 });
} catch (error) {
  if (!(error instanceof TwitchApiError)) throw error;
  console.error(error.status, error.error, error.message);
  console.error(error.method, error.url, error.body);
}
```

Les statuts que vous rencontrez le plus souvent :

| Statut | Sens habituel |
| --- | --- |
| `400` | Un paramètre est manquant ou invalide, ou l'action n'est pas possible pour le moment (un sondage est déjà en cours, la chaîne est hors ligne). |
| `401` | Le jeton n'est pas autorisé à faire cet appel, par exemple un `broadcaster_id` qui n'est pas le propriétaire du jeton. |
| `403` | Il manque à l'utilisateur une permission côté Twitch, par exemple il n'est pas modérateur de la chaîne. |
| `404` | Ce que vous avez désigné n'existe pas. |
| `409` | Un conflit, comme un abonnement EventSub qui existe déjà. |
| `429` | Limite de débit, sous la forme d'une `TwitchRateLimitError`. Voir [Limites de débit et nouvelles tentatives](/basics/rate-limits-and-retries/). |
| `5xx` | Une panne côté Twitch, levée une fois les nouvelles tentatives épuisées. |

## Les recherches qui ne trouvent rien

Ne rien trouver n'est pas une erreur. Les recherches qui peuvent revenir vides renvoient `null` : le type vous oblige ainsi à traiter ce cas.

```ts
const user = await twitch.users.getByLogin("some_login");
if (!user) console.log("No such user");

const sub = await twitch.subscriptions.check({ broadcaster_id: channelId });
console.log(sub ? `Subscribed at tier ${sub.tier}` : "Not subscribed");
```

Les méthodes qui se comportent ainsi sont `users.getById`, `users.getByLogin`, `teams.get`, `subscriptions.check`, `charity.campaign`, `chat.sharedSession`, `chat.pinnedMessage`, `guestStar.session` et `extensions.get`. Pour `teams.get` et `subscriptions.check`, Twitch répond `404`, et la bibliothèque le transforme en `null`.

Les listes se comportent de la même façon : `users.get` avec des identifiants qui n'existent pas renvoie un tableau plus court ou vide, et `paginator.first()` renvoie `undefined` sur une liste vide.

Un appel signale un refus dans son résultat au lieu de lever une erreur : `chat.send` renvoie `is_sent: false` et un `drop_reason` quand Twitch ne remet pas le message.

## Ce qui se passe sur un 401

Twitch répond `401` dans deux situations différentes : le jeton est mort (expiré ou révoqué), ou le jeton est valide mais n'est pas autorisé à faire cela. Le client les distingue en demandant à Twitch de valider le jeton, puis agit selon le résultat :

| Le jeton est | Ce que fait le client |
| --- | --- |
| Valide | Lève la `TwitchApiError` telle que Twitch l'a envoyée. Rien n'est rafraîchi. |
| Un jeton d'application mort | Demande un nouveau jeton d'application et renvoie l'appel. |
| Un jeton utilisateur mort avec un jeton de rafraîchissement | Le rafraîchit, l'enregistre, émet `tokenRefresh` et renvoie l'appel. |
| Un jeton utilisateur mort sans jeton de rafraîchissement | Oublie l'utilisateur, émet `tokenInvalid` et lève une `TwitchAuthError`. |
| Un jeton utilisateur mort dont Twitch rejette le jeton de rafraîchissement | Oublie l'utilisateur, émet `tokenInvalid` et lève une `TwitchAuthError` indiquant que l'utilisateur doit autoriser de nouveau l'application. |
| Passé avec `{ token }` | Lève la `TwitchApiError`. La bibliothèque ne gère pas ce jeton. |

L'appel est renvoyé une seule fois. Un second `401` est levé sous la forme d'une `TwitchApiError`. Cette seconde tentative ne compte pas dans `retries`, et elle s'applique à toutes les méthodes HTTP, puisque Twitch n'a rien fait de la requête qu'il a rejetée.

Un jeton valide qui reçoit un `401` signifie en général que ce n'est pas le bon utilisateur qui agit. Le message le dit :

```
TwitchApiError: The ID in broadcaster_id must match the user ID in the token (401 on GET /helix/users/blocks)
```

[Agir au nom d'un utilisateur](/basics/acting-as-a-user/) explique comment le jeton est choisi, et [Gérer les utilisateurs](/auth/managing-users/) ce qu'il faut faire quand `tokenInvalid` est émis.

## Un gestionnaire pratique

Cette fonction couvre ce dont une commande de bot a généralement besoin : prévenir l'utilisateur quand l'action est refusée, rester silencieuse et réessayer plus tard sur un échec temporaire, et laisser remonter tout le reste.

```ts
import {
  TwitchApiError,
  TwitchAuthError,
  TwitchNetworkError,
  TwitchRateLimitError,
  TwitchTimeoutError,
} from "@ix-xs/twitch.api";

type Outcome = { ok: true } | { ok: false; reason: string; retryInMs?: number };

async function timeoutUser(target: string, seconds: number): Promise<Outcome> {
  try {
    await twitch.moderation.ban({ broadcaster_id: channelId, user_id: target, duration: seconds });
    return { ok: true };
  } catch (error) {
    if (error instanceof TwitchRateLimitError) {
      return { ok: false, reason: "rate limited", retryInMs: error.retryAfter };
    }
    if (error instanceof TwitchApiError && error.status < 500) {
      return { ok: false, reason: error.message }; // refusé : mauvaise cible, pas modérateur...
    }
    if (error instanceof TwitchAuthError) {
      return { ok: false, reason: "the bot has to sign in again or lacks a scope" };
    }
    if (error instanceof TwitchApiError || error instanceof TwitchTimeoutError || error instanceof TwitchNetworkError) {
      return { ok: false, reason: "Twitch is having trouble", retryInMs: 5000 };
    }
    throw error;
  }
}
```

## Les erreurs qui ne sont pas des TwitchError

Deux sortes d'échec passent sans être modifiées :

- Quand vous annulez un appel avec un `AbortSignal`, l'appel est rejeté avec la raison du signal, qui est une `AbortError` sauf si vous en avez donné une autre.
- Une erreur levée par votre propre magasin de jetons atteint l'appel qui l'a déclenchée.

:::note
Une erreur levée dans un écouteur `twitch.on(...)` n'atteint pas l'appel qui a émis l'événement. Elle est levée de nouveau, à part, comme une exception non interceptée.
:::

## Voir aussi

- [Référence des erreurs](/reference/errors/) : chaque classe avec ses champs, et ce que fait le client pour chaque statut HTTP.
- [Limites de débit et nouvelles tentatives](/basics/rate-limits-and-retries/) : ce qui est retenté avant qu'une erreur vous parvienne.
- [Agir au nom d'un utilisateur](/basics/acting-as-a-user/) : les messages de `TwitchAuthError` et de `TwitchScopeError`.
- [Dépannage](/help/troubleshooting/) : les erreurs courantes, par symptôme.
