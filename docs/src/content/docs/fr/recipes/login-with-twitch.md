---
title: "Se connecter avec Twitch"
description: "Un bouton de connexion pour un site web, avec node:http seulement : la redirection vers Twitch, le callback, un cookie de session et une déconnexion qui révoque le jeton."
sidebar:
  order: 7
---

Cette recette construit un serveur web avec un lien « Log in with Twitch ». Un visiteur qui le suit approuve votre application sur Twitch, revient connecté, et voit son nom et son adresse e-mail. La déconnexion met fin à la session et révoque le jeton. Le serveur utilise `node:http` et aucun framework : chaque étape du flux par code d'autorisation est donc visible.

## Ce qu'il vous faut

| | |
| --- | --- |
| Application | Un identifiant client et un secret client issus de la [console développeur de Twitch](https://dev.twitch.tv/console/apps). Voir [Obtenir vos identifiants](/credentials/). |
| URL de redirection | `http://localhost:3000/callback`, ajoutée aux URL de redirection OAuth de l'application. Elle doit correspondre à celle du code, au caractère près. |
| Jeton | Un jeton utilisateur pour chaque visiteur, obtenu par le serveur avec le flux par code d'autorisation. |
| Scopes | Aucun pour savoir qui est le visiteur : identifiant, nom de connexion, nom d'affichage et image de profil. `user:read:email` pour obtenir aussi son adresse e-mail vérifiée. |

## Préparer le client et les sessions

Le serveur a besoin de trois choses : le client, un endroit où retenir qui est connecté, et un moyen de lire un cookie. Les sessions vivent dans une `Map` qui associe un identifiant de session aléatoire à ce que le serveur sait du visiteur.

```ts
import type { IncomingMessage } from "node:http";
import { Twitch } from "@ix-xs/twitch.api";

const ORIGIN = "http://localhost:3000";
const REDIRECT_URI = `${ORIGIN}/callback`;

interface Session {
  userId: string;
  name: string;
  email: string | undefined;
}

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
});

// En mémoire : toutes les sessions sont perdues quand le serveur redémarre.
const sessions = new Map<string, Session>();

function cookie(req: IncomingMessage, name: string): string | undefined {
  return new RegExp(`(?:^|; )${name}=([^;]*)`).exec(req.headers.cookie ?? "")?.[1];
}
```

## Envoyer le visiteur vers Twitch

`/login` construit l'URL d'autorisation et redirige vers elle. Le `state` est une valeur aléatoire que Twitch renvoie intacte. En garder une copie dans un cookie permet au callback de vérifier que la réponse appartient à une connexion que ce navigateur a lancée, et c'est ce qui arrête un callback falsifié.

```ts
import { randomBytes } from "node:crypto";
import type { ServerResponse } from "node:http";

const REDIRECT_URI = "http://localhost:3000/callback";

function handleLogin(res: ServerResponse): void {
  const state = randomBytes(16).toString("hex");
  const location = twitch.auth.authorizeUrl({
    redirectUri: REDIRECT_URI,
    scopes: ["user:read:email"],
    state,
  });
  res
    .writeHead(302, {
      Location: location,
      "Set-Cookie": `oauth_state=${state}; HttpOnly; SameSite=Lax; Max-Age=600; Path=/`,
    })
    .end();
}
```

`authorizeUrl` ne fait aucune requête : il ne fait qu'assembler l'URL. Le cookie est en `SameSite=Lax` pour que le navigateur l'envoie encore quand Twitch redirige vers votre site.

## Traiter le callback

Twitch renvoie le visiteur vers `/callback` avec un `code` et le `state`. Quand le visiteur refuse, il n'y a pas de `code`. Vérifiez les deux, puis échangez le code contre un jeton avec `exchangeCode`, qui enregistre aussi l'utilisateur dans le client.

```ts
import { randomBytes } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";

const REDIRECT_URI = "http://localhost:3000/callback";
// Repris de la première étape.
declare const sessions: Map<string, { userId: string; name: string; email: string | undefined }>;
declare function cookie(req: IncomingMessage, name: string): string | undefined;

async function handleCallback(req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> {
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state || state !== cookie(req, "oauth_state")) {
    res.writeHead(400).end("This sign-in was canceled or did not start here.");
    return;
  }

  const user = await twitch.auth.exchangeCode(code, REDIRECT_URI);
  const me = await twitch.users.me({ as: user.userId });

  const id = randomBytes(32).toString("hex");
  sessions.set(id, { userId: user.userId, name: me.display_name, email: me.email });
  res
    .writeHead(302, {
      Location: "/",
      "Set-Cookie": [`session=${id}; HttpOnly; SameSite=Lax; Path=/`, "oauth_state=; Max-Age=0; Path=/"],
    })
    .end();
}
```

`exchangeCode` prend la même URL de redirection que `authorizeUrl`. Il se résout avec le jeton de l'utilisateur, qui vous donne déjà `user.userId`, `user.login` et `user.scopes`.

`users.me` renvoie le profil du propriétaire d'un jeton. Le `{ as: user.userId }` a son importance : dès qu'un deuxième visiteur se connecte, plusieurs utilisateurs sont enregistrés, et il faut dire au client quel jeton utiliser. Le champ `email` n'est présent que parce que le jeton a le scope `user:read:email`. Sans lui, le champ vaut `undefined`.

## Se déconnecter

`/logout` oublie les sessions de l'utilisateur, puis retire cet utilisateur du client. Avec `revoke: true`, le jeton d'accès est aussi invalidé du côté de Twitch : il ne sert donc plus à rien pour qui l'aurait copié.

```ts
import type { IncomingMessage, ServerResponse } from "node:http";

// Repris de la première étape.
declare const sessions: Map<string, { userId: string; name: string; email: string | undefined }>;
declare function cookie(req: IncomingMessage, name: string): string | undefined;

async function handleLogout(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const session = sessions.get(cookie(req, "session") ?? "");
  if (session) {
    // Le même utilisateur peut être connecté depuis plusieurs navigateurs.
    for (const [id, other] of sessions) if (other.userId === session.userId) sessions.delete(id);
    await twitch.auth.removeUser(session.userId, { revoke: true });
  }
  res.writeHead(302, { Location: "/", "Set-Cookie": "session=; Max-Age=0; Path=/" }).end();
}
```

## Le fichier complet

```ts title="src/server.ts"
import { randomBytes } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { Twitch } from "@ix-xs/twitch.api";

const ORIGIN = "http://localhost:3000";
const REDIRECT_URI = `${ORIGIN}/callback`;

interface Session {
  userId: string;
  name: string;
  email: string | undefined;
}

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
});

// En mémoire : toutes les sessions sont perdues quand le serveur redémarre.
const sessions = new Map<string, Session>();

function cookie(req: IncomingMessage, name: string): string | undefined {
  return new RegExp(`(?:^|; )${name}=([^;]*)`).exec(req.headers.cookie ?? "")?.[1];
}

const escapeHtml = (text: string) => text.replace(/[&<>"]/g, (char) => `&#${char.charCodeAt(0)};`);

function handleLogin(res: ServerResponse): void {
  const state = randomBytes(16).toString("hex");
  const location = twitch.auth.authorizeUrl({
    redirectUri: REDIRECT_URI,
    scopes: ["user:read:email"],
    state,
  });
  res
    .writeHead(302, {
      Location: location,
      "Set-Cookie": `oauth_state=${state}; HttpOnly; SameSite=Lax; Max-Age=600; Path=/`,
    })
    .end();
}

async function handleCallback(req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> {
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state || state !== cookie(req, "oauth_state")) {
    res.writeHead(400).end("This sign-in was canceled or did not start here.");
    return;
  }

  const user = await twitch.auth.exchangeCode(code, REDIRECT_URI);
  const me = await twitch.users.me({ as: user.userId });

  const id = randomBytes(32).toString("hex");
  sessions.set(id, { userId: user.userId, name: me.display_name, email: me.email });
  res
    .writeHead(302, {
      Location: "/",
      "Set-Cookie": [`session=${id}; HttpOnly; SameSite=Lax; Path=/`, "oauth_state=; Max-Age=0; Path=/"],
    })
    .end();
}

async function handleLogout(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const session = sessions.get(cookie(req, "session") ?? "");
  if (session) {
    // Le même utilisateur peut être connecté depuis plusieurs navigateurs.
    for (const [id, other] of sessions) if (other.userId === session.userId) sessions.delete(id);
    await twitch.auth.removeUser(session.userId, { revoke: true });
  }
  res.writeHead(302, { Location: "/", "Set-Cookie": "session=; Max-Age=0; Path=/" }).end();
}

function handleHome(req: IncomingMessage, res: ServerResponse): void {
  const session = sessions.get(cookie(req, "session") ?? "");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  if (!session) {
    res.end('<a href="/login">Log in with Twitch</a>');
    return;
  }
  const email = escapeHtml(session.email ?? "no email");
  res.end(`Hello ${escapeHtml(session.name)} (${email}). <a href="/logout">Log out</a>`);
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", ORIGIN);
  try {
    if (url.pathname === "/login") handleLogin(res);
    else if (url.pathname === "/callback") await handleCallback(req, res, url);
    else if (url.pathname === "/logout") await handleLogout(req, res);
    else if (url.pathname === "/") handleHome(req, res);
    else res.writeHead(404).end();
  } catch (error) {
    console.error(error);
    if (!res.headersSent) res.writeHead(500);
    res.end("Something went wrong.");
  }
}).listen(3000, () => console.log(`Open ${ORIGIN}`));
```

Placez les identifiants dans un fichier `.env` et lancez le serveur avec [tsx](https://tsx.is/) :

```ini
TWITCH_CLIENT_ID=your-client-id
TWITCH_CLIENT_SECRET=your-client-secret
```

```bash
node --env-file=.env --import tsx src/server.ts
```

## Ce qui peut mal tourner

| Symptôme | Cause |
| --- | --- |
| Twitch affiche une page d'erreur à propos de la redirection au lieu de l'écran de consentement. | L'URL de redirection du code n'est pas enregistrée pour l'application, ou en diffère d'un caractère. |
| `/callback` répond 400. | Le visiteur a refusé, le cookie `oauth_state` a expiré (il vit 10 minutes), ou le callback a été ouvert dans un autre navigateur. |
| `exchangeCode` lève une `TwitchAuthError` à propos d'un `clientSecret`. | Le client a été créé sans secret client. Le flux par code d'autorisation en exige un. |
| `exchangeCode` lève une `TwitchApiError` avec le statut 400. | Le code a déjà été utilisé ou est trop ancien. Un code ne fonctionne qu'une fois : ne rechargez pas la page de callback. |

## Aller plus loin

### Fermer la session quand l'utilisateur déconnecte votre application

Un utilisateur peut révoquer votre application à tout moment depuis ses paramètres Twitch. Le client valide chaque jeton enregistré toutes les heures, comme Twitch l'exige, et émet `tokenInvalid` quand un jeton est mort et ne peut pas être renouvelé. Fermez-y les sessions correspondantes.

```ts
declare const sessions: Map<string, { userId: string }>;

twitch.on("tokenInvalid", (userId) => {
  for (const [id, session] of sessions) if (session.userId === userId) sessions.delete(id);
});
```

### Appeler l'API pour l'utilisateur connecté

Demandez davantage de scopes dans `authorizeUrl`, puis passez `{ as: userId }` à tout appel qui agit pour un visiteur. Le jeton est rafraîchi pour vous tant que l'utilisateur reste enregistré.

```ts
// Avec le scope "user:read:follows".
const follows = await twitch.channels.followed({}, { as: userId }).total();
console.log(`This visitor follows ${follows} channels`);
```

Mettez `forceVerify: true` dans `authorizeUrl` pour afficher l'écran de consentement même à un visiteur qui a déjà approuvé l'application, par exemple pour le laisser choisir un autre compte Twitch.

### Préparer la mise en production

- Servez le site en HTTPS, enregistrez l'URL de redirection en HTTPS, et ajoutez `Secure` aux deux cookies.
- Gardez les sessions et les jetons dans un endroit qui survit à un redémarrage. [Stocker les jetons](/auth/storing-tokens/) montre le côté jetons.
- Faites de `/logout` un `POST` envoyé par un formulaire, pour qu'un lien sur un autre site ne puisse pas déconnecter vos visiteurs.

## Voir aussi

- [Flux par code d'autorisation](/auth/authorization-code/) : chaque étape du flux et ses options.
- [Gérer les utilisateurs](/auth/managing-users/) : `removeUser`, `revoke` et ce qui se passe quand un jeton meurt.
- [Agir au nom d'un utilisateur](/basics/acting-as-a-user/) : `{ as }` et `twitch.as()`.
- [users.me](/reference/api/users/#me) : les champs du profil.
