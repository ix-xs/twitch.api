---
title: "Flux par code d'appareil"
description: "Connectez un utilisateur depuis une CLI, une application de bureau ou tout programme qui ne peut pas recevoir de redirection : affichez un code, attendez l'approbation, et obtenez un jeton sans secret client."
sidebar:
  order: 3
---

Le flux par code d'appareil s'adresse aux programmes qui n'ont pas de serveur web vers lequel rediriger : outils en ligne de commande, applications de bureau, bots que vous lancez sur votre propre machine, applications sur un téléviseur ou une console. Votre programme affiche un lien et un code court, l'utilisateur approuve la demande dans n'importe quel navigateur, et votre programme reçoit le jeton. Il fonctionne sans secret client.

## Un premier exemple

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({ clientId: process.env.TWITCH_CLIENT_ID! });

const flow = await twitch.auth.deviceFlow({
  scopes: ["user:read:chat", "user:write:chat"],
});
console.log(`Open ${flow.verificationUri} and confirm the code ${flow.userCode}`);

const user = await flow.wait();
console.log(`Signed in as ${user.login}, with ${user.scopes.join(", ")}`);
```

`deviceFlow()` demande un code à Twitch. `flow.wait()` est résolue une fois que l'utilisateur a approuvé, et celui-ci est alors déjà enregistré dans le client.

## Afficher le lien et le code

`twitch.auth.deviceFlow({ scopes })` prend la liste des scopes à demander (les noms de scopes sont proposés par l'autocomplétion) et renvoie un `DeviceFlow` :

| Champ | Type | Contenu |
| --- | --- | --- |
| `verificationUri` | `string` | La page que l'utilisateur doit ouvrir. Le code fait déjà partie de l'adresse. |
| `userCode` | `string` | Le code, à afficher pour que l'utilisateur puisse le comparer à celui de la page. |
| `expiresAt` | `number` | Le moment où le code cesse de fonctionner, en millisecondes depuis l'époque Unix. |
| `interval` | `number` | Nombre de secondes entre deux vérifications, tel que Twitch le demande. Il augmente quand Twitch demande de ralentir. |
| `deviceCode` | `string` | Le code d'appareil brut. Vous en avez rarement besoin. |
| `wait(signal?)` | fonction | Attend l'approbation et renvoie le `UserToken`. |

Affichez à la fois le lien et le code. L'utilisateur peut ouvrir le lien sur un autre appareil, un téléphone par exemple : c'est tout l'intérêt de ce flux sur une machine sans navigateur ou sans clavier. Une application de bureau peut ouvrir le lien dans le navigateur par défaut tout en affichant le code dans sa propre fenêtre.

Dites à l'utilisateur de combien de temps il dispose :

```ts
const flow = await twitch.auth.deviceFlow({ scopes: ["user:read:follows"] });

const minutes = Math.round((flow.expiresAt - Date.now()) / 60_000);
console.log(`Open ${flow.verificationUri}`);
console.log(`Code: ${flow.userCode} (valid for ${minutes} minutes)`);
```

## Attendre l'approbation

`flow.wait()` demande à Twitch toutes les `interval` secondes si l'utilisateur a approuvé.

- Tant que l'utilisateur n'a pas répondu, elle continue d'attendre.
- Quand Twitch demande des vérifications plus espacées, elle ajoute 5 secondes à l'intervalle et poursuit. Vous n'avez rien à gérer, et `flow.interval` donne la nouvelle valeur.
- Quand l'utilisateur approuve, elle demande à Twitch à qui appartient le jeton, enregistre l'utilisateur, sauvegarde le jeton dans votre magasin et renvoie le `UserToken`.
- Quand le code expire avant, elle est rejetée avec une `TwitchAuthError` : `The device code expired before the user approved the request.`
- Toute autre réponse de Twitch est levée sous la forme d'une `TwitchApiError` avec le message de Twitch.
- Une vérification qui ne peut pas joindre Twitch est ignorée : la suivante repose la question, jusqu'à l'expiration du code.

Appelez `wait()` une seule fois par flux. Pour réessayer après un échec, démarrez un nouveau flux avec `deviceFlow()` : un code ne peut pas être réutilisé.

```ts
import { TwitchAuthError } from "@ix-xs/twitch.api";

async function signIn() {
  for (;;) {
    const flow = await twitch.auth.deviceFlow({ scopes: ["user:read:chat"] });
    console.log(`Open ${flow.verificationUri} and confirm the code ${flow.userCode}`);
    try {
      return await flow.wait();
    } catch (error) {
      if (!(error instanceof TwitchAuthError)) throw error;
      console.log("That code expired. Here is a new one.");
    }
  }
}

const user = await signIn();
```

## Annuler l'attente

`wait()` accepte un `AbortSignal`. Quand le signal déclenche l'annulation, l'attente s'arrête et la promesse est rejetée avec la raison du signal. Un `wait()` en attente maintient le processus en vie : donnez donc une porte de sortie à l'utilisateur.

```ts
const flow = await twitch.auth.deviceFlow({ scopes: ["user:read:chat"] });
console.log(`Open ${flow.verificationUri} and confirm the code ${flow.userCode}`);

const controller = new AbortController();
process.once("SIGINT", () => controller.abort(new Error("Sign-in cancelled.")));

const user = await flow.wait(controller.signal);
```

Pour abandonner après une durée fixe, plus courte que la vie du code, passez `AbortSignal.timeout(120_000)`.

## Se connecter une fois et garder le jeton

Personne ne veut saisir un code à chaque démarrage. Donnez au client un magasin de jetons, restaurez d'abord l'utilisateur sauvegardé, et ne lancez le flux que s'il n'y en a aucun.

```ts title="src/sign-in.ts"
import { Twitch } from "@ix-xs/twitch.api";
import { FileTokenStore } from "@ix-xs/twitch.api/node";

const scopes = ["user:read:chat", "user:write:chat"] as const;

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  tokens: new FileTokenStore("./tokens.json"),
});

let [user] = await twitch.auth.restore();

// Lancer aussi le flux quand une version plus récente du programme a besoin de plus de scopes.
if (!user || scopes.some((scope) => !user?.scopes.includes(scope))) {
  const flow = await twitch.auth.deviceFlow({ scopes });
  console.log(`Open ${flow.verificationUri} and confirm the code ${flow.userCode}`);
  user = await flow.wait();
}

console.log(`Signed in as ${user.login}`);
```

La première exécution demande l'approbation et écrit `tokens.json`. Les suivantes lisent le fichier et démarrent aussitôt. Ajoutez le fichier à `.gitignore` : il contient des identifiants. [Stocker les jetons](/auth/storing-tokens/) présente les autres sortes de magasins.

## Clients publics et jetons de rafraîchissement

Une application utilisée sans son secret client est un client public. Twitch traite différemment les jetons de rafraîchissement des clients publics, et deux de ses règles comptent ici.

- **Un jeton de rafraîchissement ne fonctionne qu'une fois.** Chaque rafraîchissement renvoie un nouveau jeton de rafraîchissement et le précédent cesse de fonctionner. Le client garde le nouveau et l'écrit dans votre magasin après chaque rafraîchissement : un magasin (ou un écouteur `tokenRefresh` qui sauvegarde le jeton) n'est donc pas facultatif. Un jeton de rafraîchissement copié à la main lors de la première connexion ne sert plus à rien après le premier renouvellement.
- **Un jeton de rafraîchissement expire après 30 jours sans utilisation.** Un programme qui tourne tous les jours ne s'en aperçoit jamais. Un programme qui dort plus d'un mois doit demander à l'utilisateur de se reconnecter.

Quand un jeton de rafraîchissement est refusé pour de bon, l'utilisateur est retiré du client et du magasin, et l'événement `tokenInvalid` est émis. Relancez le flux quand cela se produit.

Plusieurs processus peuvent partager un même utilisateur connecté, à condition de partager un même magasin de jetons. Avant de rafraîchir, un processus lit le magasin et adopte le jeton qu'un autre processus a déjà renouvelé. Si Twitch refuse malgré tout son jeton de rafraîchissement, il lit le magasin une fois de plus et prend le jeton plus récent qu'il y trouve, sans retirer l'utilisateur.

:::caution
Le partage exige un magasin qui renvoie ce qui est sauvegardé à l'instant même, comme une base de données ou un espace de noms KV. `FileTokenStore` lit son fichier une seule fois : donnez donc à chaque processus son propre fichier. Et deux processus qui rafraîchissent exactement au même instant peuvent encore entrer en concurrence : celui qui perd peut retirer l'utilisateur.
:::

Quand le client possède un `clientSecret`, celui-ci est envoyé avec les vérifications et les rafraîchissements, et le flux fonctionne de la même façon.

## Ce que peut faire un client sans secret

Le jeton utilisateur obtenu ici est un jeton utilisateur normal : tous les endpoints qui acceptent un jeton utilisateur fonctionnent, de même que les abonnements aux événements par WebSocket. Ce qui manque, c'est le jeton d'application, qu'exigent les webhooks, les conduits et quelques endpoints réservés aux applications. Le tableau se trouve dans [Les jetons en un coup d'œil](/auth/overview/).

Les endpoints qui acceptent les deux sortes de jeton utilisent celui de l'utilisateur connecté :

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({ clientId: process.env.TWITCH_CLIENT_ID! });
const flow = await twitch.auth.deviceFlow({ scopes: ["user:read:follows"] });
console.log(`Open ${flow.verificationUri} and confirm the code ${flow.userCode}`);
await flow.wait();

// Pas de secret client : les données publiques sont lues avec le jeton de l'utilisateur.
const top = await twitch.games.top().take(5);
const live = await twitch.streams.followed().take(20);
```

## Limites et erreurs

| Ce que vous voyez | Cause | Correction |
| --- | --- | --- |
| `deviceFlow()` lève une `TwitchApiError` | Twitch a refusé de démarrer le flux. Le message dit pourquoi, par exemple un identifiant client qu'il ne connaît pas. | Vérifiez le `clientId` |
| `TwitchAuthError: The device code expired before the user approved the request.` | Personne n'a approuvé avant `flow.expiresAt` | Démarrez un nouveau flux |
| `wait()` est rejetée avec une `AbortError` ou votre propre erreur | Le signal que vous avez passé a déclenché l'annulation | Rien, c'est l'annulation que vous avez demandée |
| `TwitchNetworkError` ou `TwitchTimeoutError` venant de `deviceFlow()` | Twitch était injoignable au démarrage du flux | Vérifiez le réseau, puis démarrez un nouveau flux |
| Une `TwitchAuthError` qui mentionne le jeton de rafraîchissement, des jours plus tard | Le jeton de rafraîchissement est resté inutilisé pendant 30 jours, l'utilisateur a déconnecté votre application, ou le jeton a été consommé par un processus qui ne partage pas votre magasin | Relancez le flux |
| Une `TwitchAuthError` indiquant qu'un appel « needs an app access token, which requires a clientSecret » | L'endpoint n'accepte qu'un jeton d'application | Appelez-le depuis un serveur qui possède le secret |

## Voir aussi

- [Les jetons en un coup d'œil](/auth/overview/) : les autres flux et les cas où chacun convient.
- [Stocker les jetons](/auth/storing-tokens/) : où va le jeton entre deux exécutions.
- [Un bot de chat](/recipes/chat-bot/) : un bot complet qui se connecte avec ce flux.
- [Gérer les utilisateurs](/auth/managing-users/) : ce qui se passe quand un jeton meurt.
