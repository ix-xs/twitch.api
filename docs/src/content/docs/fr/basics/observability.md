---
title: "Observabilité"
description: "Le client émet un événement pour chaque tentative HTTP, chaque attente de limite de débit et chaque renouvellement de jeton. Utilisez-les pour journaliser, mesurer et garder les jetons dans votre propre stockage."
sidebar:
  order: 7
---

Le client vous dit ce qu'il fait à travers cinq événements. Ils ne coûtent presque rien quand personne n'écoute, et c'est là que se branchent un journal, un compteur de métriques ou votre propre stockage de jetons.

## Un journal des requêtes

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({ clientId, clientSecret });

twitch.on("response", ({ method, url, status, duration, attempt, as, remaining }) => {
  const { pathname } = new URL(url);
  console.log(`${method} ${pathname} ${status} in ${duration} ms (as ${as}, attempt ${attempt}, ${remaining ?? "?"} points left)`);
});

await twitch.users.getByLogin("twitchdev");
// GET /helix/users 200 in 87 ms (as app, attempt 1, 799 points left)
```

## Écouter et cesser d'écouter

`twitch.on(event, listener)` ajoute un écouteur et renvoie une fonction qui le retire. `twitch.once` fait de même pour un écouteur qui ne s'exécute qu'une fois. `twitch.off(event, listener)` retire un écouteur par référence.

```ts
const stop = twitch.on("request", ({ method, url }) => console.log("->", method, url));
// plus tard
stop();

twitch.once("tokenRefresh", (token) => console.log("First renewal:", token.userId));

const onWait = ({ waitMs }: { waitMs: number }) => console.log(`Waiting ${waitMs} ms`);
twitch.on("rateLimit", onWait);
twitch.off("rateLimit", onWait);
```

Les noms d'événement et les contenus sont typés : l'éditeur complète les noms et connaît les champs de chaque contenu.

Une vue créée avec `twitch.as(userId)` partage les écouteurs de son client. Écouter sur l'un ou sur l'autre rapporte les appels des deux.

Les écouteurs s'exécutent de façon synchrone, dans l'ordre où ils ont été ajoutés. Ce que renvoie un écouteur est ignoré : un écouteur `async` doit donc intercepter ses propres erreurs. Un écouteur qui lève une erreur ne casse pas l'appel qui a émis l'événement : l'erreur est levée de nouveau, à part, comme une exception non interceptée.

## Les cinq événements

| Événement | Arguments | Émis |
| --- | --- | --- |
| `request` | `RequestEvent` | Juste avant chaque tentative HTTP vers l'API Twitch, nouvelles tentatives et pages suivantes comprises. |
| `response` | `ResponseEvent` | Quand une réponse revient, quel que soit son statut. |
| `rateLimit` | `RateLimitEvent` | Quand une requête est retenue parce qu'un compartiment est vide, ou attend après un `429`. |
| `tokenRefresh` | `UserToken` | Après le renouvellement et l'enregistrement d'un jeton utilisateur. |
| `tokenInvalid` | `userId: string`, `error: Error` | Après l'abandon d'un jeton utilisateur mort. |

Champs de `RequestEvent` :

| Champ | Type | Contenu |
| --- | --- | --- |
| `method` | `string` | Méthode HTTP. |
| `url` | `string` | URL complète, avec la chaîne de requête. Les jetons voyagent dans les en-têtes, jamais dans l'URL. |
| `attempt` | `number` | `1` pour le premier essai, puis `2`, `3`, etc. |
| `as` | `string` | À qui appartient le jeton utilisé : `"app"`, un identifiant d'utilisateur, ou `"raw"` pour un jeton passé avec `{ token }`. |

`ResponseEvent` a les quatre mêmes champs, plus :

| Champ | Type | Contenu |
| --- | --- | --- |
| `status` | `number` | Statut HTTP de la réponse. |
| `duration` | `number` | Millisecondes passées sur cette tentative. |
| `remaining` | `number \| undefined` | Points restants dans le compartiment de limite de débit, quand Twitch l'a indiqué. |

Champs de `RateLimitEvent` :

| Champ | Type | Contenu |
| --- | --- | --- |
| `bucket` | `string` | `"app"`, `"user:<id>"`, ou `"raw:<fingerprint>"` pour un jeton passé avec `{ token }`. |
| `waitMs` | `number` | Durée d'attente de la requête, en millisecondes. |
| `resetAt` | `number` | Instant, en millisecondes depuis l'époque Unix, où l'attente prend fin. |

Deux choses à garder en tête quand vous lisez ces événements :

- `request` et `response` ne couvrent que les appels à l'API Twitch. Les requêtes au serveur OAuth (obtenir le jeton d'application, rafraîchir ou valider un jeton utilisateur) ne les émettent pas.
- Une tentative qui échoue sans réponse, sur un échec réseau ou un délai dépassé, émet `request` et aucun `response`. Un `request` suivant avec un `attempt` plus élevé est la nouvelle tentative.

## Repérer les nouvelles tentatives et les appels lents

```ts
twitch.on("request", ({ method, url, attempt }) => {
  if (attempt > 1) console.warn(`Retry ${attempt - 1} of ${method} ${new URL(url).pathname}`);
});

twitch.on("response", ({ method, url, status, duration }) => {
  if (status >= 500) console.error(`Twitch answered ${status} to ${method} ${new URL(url).pathname}`);
  if (duration > 2000) console.warn(`${method} ${new URL(url).pathname} took ${duration} ms`);
});
```

## Compter les attentes de limite de débit

Un événement `rateLimit` de temps en temps est normal. Beaucoup d'entre eux sur le même compartiment signifient qu'un jeton en fait trop, et que le travail devrait être réparti dans le temps ou entre plusieurs utilisateurs.

```ts
const waits = new Map<string, { count: number; totalMs: number }>();

twitch.on("rateLimit", ({ bucket, waitMs }) => {
  const entry = waits.get(bucket) ?? { count: 0, totalMs: 0 };
  entry.count += 1;
  entry.totalMs += waitMs;
  waits.set(bucket, entry);
});

setInterval(() => {
  for (const [bucket, { count, totalMs }] of waits) {
    console.log(`${bucket}: ${count} waits, ${totalMs} ms in the last minute`);
  }
  waits.clear();
}, 60_000);
```

Avec `rateLimit: "throw"`, le client n'attend jamais : cet événement n'est donc pas émis. Pour l'état actuel d'un compartiment, utilisez `twitch.rateLimitOf()`, décrit dans [Limites de débit et nouvelles tentatives](/basics/rate-limits-and-retries/).

## Enregistrer vous-même les jetons renouvelés

Si vous avez donné un magasin de jetons au client, les jetons renouvelés y sont déjà enregistrés et vous pouvez sauter cette section. Si vous gardez les jetons dans votre propre stockage, `tokenRefresh` est le moment de le mettre à jour : un jeton renouvelé remplace le jeton d'accès précédent, et en général le jeton de rafraîchissement aussi.

```ts
import type { UserToken } from "@ix-xs/twitch.api";

declare const db: {
  saveToken(userId: string, token: UserToken): Promise<void>;
  loadTokens(): Promise<UserToken[]>;
};

twitch.on("tokenRefresh", (token) => {
  db.saveToken(token.userId, token).catch((error) => console.error("Could not save the token", error));
});

// Au démarrage, enregistrer ce qui a été sauvegardé.
for (const token of await db.loadTokens()) {
  await twitch.auth.addUser(token);
}
```

Un `UserToken` est du JSON ordinaire : `userId`, `login`, `accessToken`, `refreshToken`, `scopes`, `expiresAt`. L'événement est émis à chaque renouvellement : avant l'expiration du jeton, après un `401`, lors de la validation horaire et quand vous appelez `twitch.auth.refresh()`. Il n'est pas émis au premier enregistrement d'un utilisateur : sauvegardez donc aussi le jeton renvoyé par `addUser`, par `exchangeCode` ou par le flux par code d'appareil.

Un magasin de jetons fait la même chose avec moins de code et couvre aussi cette première sauvegarde. Voir [Stocker les jetons](/auth/storing-tokens/).

:::caution
Les jetons sont des informations d'identification. Ne les affichez pas dans les journaux, et protégez l'endroit où vous les enregistrez.
:::

## Réagir à un jeton mort

`tokenInvalid` est émis quand un jeton utilisateur ne peut plus être utilisé : Twitch a rejeté son jeton de rafraîchissement, ou le jeton d'accès est mort et il n'y avait pas de jeton de rafraîchissement. Cela arrive quand l'utilisateur déconnecte votre application dans ses paramètres Twitch ou change son mot de passe. L'utilisateur a déjà été retiré du client et du magasin de jetons quand l'événement est émis.

```ts
declare function markSignedOut(userId: string): Promise<void>;

twitch.on("tokenInvalid", (userId, error) => {
  console.warn(`User ${userId} has to sign in again: ${error.message}`);
  markSignedOut(userId).catch(console.error);
});
```

À partir de là, les appels faits au nom de cet utilisateur échouent avec une `TwitchAuthError` jusqu'à ce qu'il autorise de nouveau votre application. [Gérer les utilisateurs](/auth/managing-users/) présente la vie d'un utilisateur enregistré.

## Fermer le client

`twitch.close()` arrête ce que le client fait tourner en arrière-plan :

- Les écouteurs EventSub WebSocket et conduit créés à partir du client. Chacun est fermé comme si vous aviez appelé son propre `close()` : ses connexions se terminent et ses abonnements sont oubliés.
- Le minuteur qui valide les jetons utilisateur toutes les heures. Il n'existe que tant qu'au moins un jeton utilisateur est chargé, et pas du tout avec `validateTokens: false`.

```ts
twitch.close();
```

Appelez cette méthode quand votre programme a terminé. Une connexion WebSocket ouverte maintient un processus en vie : un script qui a écouté des événements ne se termine donc pas sans elle. Le minuteur seul ne retient jamais un processus sur Node.js, Bun et Deno : un script qui n'a fait que des appels à l'API se termine donc de lui-même.

Le client reste utilisable ensuite. Le minuteur redémarre la prochaine fois qu'un jeton utilisateur est enregistré ou renouvelé, et vous pouvez créer de nouveaux écouteurs. Les écouteurs webhook ne détiennent aucune connexion, il n'y a donc rien à fermer pour eux. Une vue créée avec `twitch.as()` partage tout cela avec son client : fermer l'un ferme les deux.

## Voir aussi

- [Limites de débit et nouvelles tentatives](/basics/rate-limits-and-retries/) : ce que rapporte l'événement `rateLimit`.
- [Erreurs](/basics/errors/) : ce qui se passe sur un `401`, moment où les jetons sont renouvelés ou abandonnés.
- [Stocker les jetons](/auth/storing-tokens/) : l'alternative intégrée à `tokenRefresh`.
- [Options du client](/reference/client-options/) : `on`, `once`, `off`, `close` et les autres membres du client.
