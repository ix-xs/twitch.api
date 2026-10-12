---
title: "Flux par code d'autorisation"
description: "Connectez des utilisateurs depuis un serveur web : envoyez-les vers Twitch, vérifiez le state au retour, et échangez le code contre un jeton que le client garde à jour."
sidebar:
  order: 2
---

Le flux par code d'autorisation est celui des serveurs web. Vous redirigez l'utilisateur vers Twitch, Twitch le renvoie vers votre serveur avec un code de courte durée, et votre serveur échange ce code contre un jeton d'accès et un jeton de rafraîchissement. L'échange utilise le secret client : ce flux ne tourne donc que sur un serveur.

## Tout le flux dans un seul serveur

Ce serveur a deux routes. `/login` envoie le visiteur vers Twitch, `/callback` le reçoit ensuite. Il utilise `node:http` pour que rien ne soit caché.

```ts title="src/server.ts"
import { randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
});

// Doit être l'une des URL de redirection enregistrées pour l'application.
const redirectUri = "http://localhost:3000/callback";

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost:3000");

  if (url.pathname === "/login") {
    // 1. Mémoriser une valeur aléatoire dans le navigateur, puis envoyer l'utilisateur vers Twitch.
    const state = randomBytes(16).toString("hex");
    res.writeHead(302, {
      "Set-Cookie": `oauth_state=${state}; HttpOnly; SameSite=Lax; Path=/; Max-Age=600`,
      Location: twitch.auth.authorizeUrl({
        redirectUri,
        scopes: ["user:read:email", "user:read:follows"],
        state,
      }),
    });
    res.end();
    return;
  }

  if (url.pathname === "/callback") {
    // 2. Twitch a renvoyé l'utilisateur : le state doit être celui que nous avons posé.
    const expected = /(?:^|;\s*)oauth_state=([0-9a-f]+)/.exec(req.headers.cookie ?? "")?.[1];
    const state = url.searchParams.get("state");
    if (!expected || state !== expected) {
      res.writeHead(400).end("This sign-in did not start here.");
      return;
    }

    const code = url.searchParams.get("code");
    if (!code) {
      // L'utilisateur a refusé : ?error=access_denied&error_description=...
      res.writeHead(403).end(url.searchParams.get("error_description") ?? "Authorization refused.");
      return;
    }

    try {
      // 3. Échanger le code contre des jetons. L'utilisateur est maintenant enregistré.
      const user = await twitch.auth.exchangeCode(code, redirectUri);
      res.writeHead(200, { "Set-Cookie": "oauth_state=; Path=/; Max-Age=0" });
      res.end(`Signed in as ${user.login} (${user.userId}).`);
    } catch (error) {
      res.writeHead(502).end(`Twitch refused the code: ${(error as Error).message}`);
    }
    return;
  }

  res.writeHead(404).end();
}).listen(3000, () => console.log("Open http://localhost:3000/login"));
```

Lancez-le avec les deux variables d'environnement définies, ouvrez `/login`, approuvez la demande sur Twitch, et la page affiche qui s'est connecté. Les sections ci-dessous reprennent les trois étapes une par une.

## Envoyer l'utilisateur vers Twitch

`twitch.auth.authorizeUrl()` construit l'adresse de la page de consentement. Elle ne fait aucune requête : elle renvoie une chaîne vers laquelle rediriger.

```ts
const url = twitch.auth.authorizeUrl({
  redirectUri: "https://example.com/auth/callback",
  scopes: ["user:read:chat", "user:write:chat", "moderator:manage:banned_users"],
  state,
  forceVerify: true,
});
```

| Option | Type | Effet |
| --- | --- | --- |
| `redirectUri` | `string` | L'adresse vers laquelle Twitch renvoie l'utilisateur. Obligatoire. |
| `scopes` | `string[]` | Ce que vous demandez à l'utilisateur d'autoriser. Aucun par défaut. Les noms de scopes connus sont proposés par l'autocomplétion, et toute autre chaîne est acceptée pour les scopes que Twitch ajoutera plus tard. |
| `state` | `string` | Une valeur opaque que Twitch rend inchangée lors de la redirection. |
| `forceVerify` | `boolean` | Affiche la page de consentement même quand l'utilisateur a déjà autorisé votre application. Sans cette option, Twitch renvoie directement un tel utilisateur. Utilisez-la pour permettre à quelqu'un de changer de compte. |
| `responseType` | `"code"` ou `"token"` | `"code"`, la valeur par défaut, correspond à ce flux. `"token"` correspond au flux implicite, décrit dans [Les jetons en un coup d'œil](/auth/overview/). |

Demandez les scopes dont vos fonctionnalités ont besoin et pas davantage : la page de consentement les énumère, et une longue liste fait hésiter. [Scopes](/reference/scopes/) associe chaque scope aux méthodes qu'il débloque, et [Types d'événements](/reference/event-types/) donne le scope de chaque événement.

Un jeton ne peut pas gagner de scopes après coup. Pour en ajouter un, faites repasser l'utilisateur par le flux avec la liste complète.

## Vérifier le state

La valeur `state` protège le callback contre les requêtes forgées. Sans elle, n'importe qui pourrait envoyer le navigateur d'une victime vers votre `/callback` avec un code à lui, et connecter la victime au mauvais compte.

Générez une valeur aléatoire pour chaque connexion, liez-la au navigateur (un cookie, comme ci-dessus, ou la session côté serveur), passez-la à `authorizeUrl`, et refusez tout callback dont le `state` n'est pas celui qui a été donné à ce navigateur. Une valeur gardée dans une seule variable partagée par tous les visiteurs ne protège rien.

## Échanger le code

`twitch.auth.exchangeCode(code, redirectUri)` termine le flux. La méthode envoie le code et le secret client à Twitch (dans le corps de la requête, jamais dans l'URL), demande à Twitch à qui appartient le nouveau jeton, enregistre cet utilisateur et sauvegarde le jeton dans votre magasin.

```ts
const user = await twitch.auth.exchangeCode(code, "https://example.com/auth/callback");

console.log(user.userId, user.login, user.scopes);
```

Le second argument doit être la même chaîne que celle donnée à `authorizeUrl`. Twitch compare les deux.

Elle renvoie un `UserToken` :

| Champ | Type | Contenu |
| --- | --- | --- |
| `userId` | `string` | Identifiant de l'utilisateur qui s'est connecté. |
| `login` | `string`, facultatif | Son nom de connexion. |
| `accessToken` | `string` | Le jeton d'accès. |
| `refreshToken` | `string`, facultatif | Le jeton de rafraîchissement. Ce flux en renvoie toujours un. |
| `scopes` | `string[]` | Les scopes accordés par l'utilisateur. |
| `expiresAt` | `number`, facultatif | Le moment où le jeton d'accès expire, en millisecondes depuis l'époque Unix. |

Un `UserToken` est du JSON ordinaire. Vous avez rarement besoin de lire les jetons eux-mêmes : à partir d'ici, désignez l'utilisateur par son identifiant et le client trouve le jeton.

```ts
const user = await twitch.auth.exchangeCode(code, "https://example.com/auth/callback");

const profile = await twitch.users.me({ as: user.userId });
const live = await twitch.streams.followed({}, { as: user.userId }).all();
```

Sur un serveur où beaucoup de personnes se connectent, dites toujours qui agit avec `{ as }` ou `twitch.as(userId)`. [Agir au nom d'un utilisateur](/basics/acting-as-a-user/) explique ce qui se passe quand vous ne le faites pas.

:::caution
Un code ne fonctionne qu'une fois et sa durée de vie est courte. Échangez-le dès qu'il arrive, et ne retentez pas l'échange avec le même code.
:::

## Enregistrer l'URL de redirection

Twitch ne redirige que vers les adresses que vous avez déclarées. Dans la [console développeur de Twitch](https://dev.twitch.tv/console/apps), ajoutez l'URL de redirection aux URL de redirection OAuth de votre application, au caractère près : le schéma, l'hôte, le port, le chemin et la barre oblique finale comptent tous.

- En développement, une adresse `http://localhost` est acceptée.
- Partout ailleurs, l'URL doit utiliser HTTPS.
- Vous pouvez en enregistrer plusieurs, par exemple une pour le développement et une pour la production. Passez comme `redirectUri` celle qui correspond à l'environnement courant.

[Obtenir vos identifiants](/credentials/) vous guide dans la console.

## Échecs courants

| Ce que vous voyez | Cause | Correction |
| --- | --- | --- |
| Twitch affiche une page d'erreur au lieu de la page de consentement | Le `redirectUri` n'est pas enregistré pour l'application, ou diffère d'un caractère de celui qui est enregistré | Copiez l'URL de votre code dans la console, ou l'inverse |
| Le callback contient `error=access_denied` et pas de `code` | L'utilisateur a refusé la demande | Affichez un message et proposez de réessayer |
| `TwitchAuthError: A clientSecret is required to exchange an authorization code.` | Le client a été construit sans `clientSecret`, souvent à cause d'une variable d'environnement qui n'est pas définie | Passez le secret, sur un serveur |
| `TwitchApiError` de statut `400` venant de `exchangeCode` | Le code a déjà été utilisé ou a expiré, ou le `redirectUri` diffère de celui donné à `authorizeUrl` | Recommencez le flux, et échangez chaque code une seule fois |
| `TwitchApiError` de statut `403` venant de `exchangeCode` | Le secret client est faux ou a été régénéré | Copiez le secret actuel depuis la console |
| `TwitchNetworkError` ou `TwitchTimeoutError` venant de `exchangeCode` | Twitch était injoignable. L'échange est envoyé une fois et jamais répété | Recommencez le flux : le code a peut-être été consommé par la tentative |
| Une `TwitchScopeError` lors d'un appel ultérieur | Le scope dont cet appel a besoin n'a pas été demandé à l'utilisateur | Ajoutez le scope à `scopes` et faites repasser l'utilisateur par le flux |

Les erreurs de l'endpoint des jetons portent le message de Twitch dans `error.message` et la réponse complète dans `error.body`.

## Après la connexion

L'utilisateur reste enregistré pendant toute la vie du processus. Son jeton d'accès est rafraîchi avant d'expirer et après un `401`, aussi longtemps que le jeton de rafraîchissement fonctionne. Pour conserver les utilisateurs d'un redémarrage à l'autre, donnez au client un magasin de jetons.

```ts
import { Twitch } from "@ix-xs/twitch.api";
import { FileTokenStore } from "@ix-xs/twitch.api/node";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
  tokens: new FileTokenStore("./tokens.json"),
});
```

Un utilisateur peut retirer l'autorisation à tout moment depuis ses paramètres Twitch. Le rafraîchissement suivant échoue alors, l'utilisateur est retiré et l'événement `tokenInvalid` vous en informe. Voir [Gérer les utilisateurs](/auth/managing-users/).

## Voir aussi

- [Se connecter avec Twitch](/recipes/login-with-twitch/) : ce flux transformé en connexion complète, avec une session et une déconnexion.
- [Stocker les jetons](/auth/storing-tokens/) : fichiers, bases de données et espaces de noms KV.
- [Gérer les utilisateurs](/auth/managing-users/) : lister, rafraîchir, révoquer et retirer des utilisateurs.
- [Scopes](/reference/scopes/) : le scope dont chaque méthode a besoin.
