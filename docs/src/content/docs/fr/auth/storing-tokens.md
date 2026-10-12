---
title: "Stocker les jetons"
description: "Conservez les jetons utilisateur d'un redémarrage à l'autre avec un magasin de jetons : le magasin fichier pour Node.js, votre propre magasin pour une base de données ou un espace de noms KV, ou deux événements si vous préférez le faire à la main."
sidebar:
  order: 4
---

Par défaut, le client garde les jetons utilisateur en mémoire, et ils disparaissent quand le processus s'arrête. Donnez-lui un magasin de jetons : il restaure vos utilisateurs à la première utilisation, y réécrit chaque jeton rafraîchi et supprime les jetons morts. Personne n'a besoin de se reconnecter après un redémarrage.

## Un premier exemple

Avec Node.js, le magasin fichier tient en une ligne.

```ts
import { Twitch } from "@ix-xs/twitch.api";
import { FileTokenStore } from "@ix-xs/twitch.api/node";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
  tokens: new FileTokenStore("./tokens.json"),
});

// Première exécution : enregistrer l'utilisateur. Le jeton est écrit dans tokens.json.
// Exécutions suivantes : l'utilisateur est restauré depuis le fichier, cette ligne est inutile.
await twitch.auth.addUser({ accessToken, refreshToken });
```

## Ce qu'est un magasin

Un magasin est un objet doté de quatre méthodes, typé par `TokenStore`. Chacune peut renvoyer son résultat directement ou sous forme de promesse.

| Méthode | Appelée quand | Doit |
| --- | --- | --- |
| `get(userId)` | Un utilisateur est restauré, un appel désigne un utilisateur qui n'est pas encore chargé, et avant chaque rafraîchissement | Renvoyer le `UserToken` sauvegardé, ou `undefined` |
| `set(userId, token)` | Un utilisateur est enregistré (`addUser`, `exchangeCode`, le flux par code d'appareil) et après chaque rafraîchissement | Sauvegarder le jeton, en remplaçant le précédent |
| `delete(userId)` | Vous appelez `removeUser`, ou un jeton s'est révélé mort | Oublier le jeton |
| `list()` | Les utilisateurs sont restaurés | Renvoyer tous les identifiants d'utilisateur sauvegardés. Facultative. |

Un `UserToken` est du JSON ordinaire (`userId`, `login`, `accessToken`, `refreshToken`, `scopes`, `expiresAt`) : `JSON.stringify` et `JSON.parse` suffisent donc pour la sérialisation.

Deux magasins sont fournis avec la bibliothèque :

- `MemoryTokenStore`, dans l'entrée principale, est le magasin par défaut. C'est une `Map`. En passer un vous-même est pratique dans les tests, quand vous voulez regarder ce qui a été sauvegardé.
- `FileTokenStore`, dans `@ix-xs/twitch.api/node`, écrit un fichier JSON.

## Le magasin fichier

`new FileTokenStore(path)` garde tous les utilisateurs dans un seul fichier JSON, indexé par identifiant d'utilisateur. Le chemin vaut `./tokens.json` par défaut et il est résolu une seule fois, à la construction du magasin : `store.path` est le chemin absolu.

```json
{
  "141981764": {
    "userId": "141981764",
    "accessToken": "...",
    "scopes": ["user:read:chat", "user:write:chat"],
    "login": "twitchdev",
    "refreshToken": "...",
    "expiresAt": 1791798000000
  }
}
```

Il est écrit avec quelques précautions :

- **Écritures atomiques.** Le magasin écrit un fichier temporaire à côté de la cible, puis le renomme à sa place. Un plantage au milieu d'une écriture laisse le fichier précédent, jamais un demi-fichier.
- **Une écriture à la fois.** Deux rafraîchissements qui se terminent ensemble sont écrits l'un après l'autre.
- **Permissions réservées au propriétaire.** Le fichier est créé avec le mode `0600` sur les plateformes qui ont des modes de fichier.
- **Ce qui manque est créé.** Un fichier qui n'existe pas encore est un magasin vide, et les dossiers parents manquants sont créés à la première écriture.

Le fichier est lu une fois puis gardé en mémoire : le magasin suppose donc qu'il est le seul à écrire. Utilisez un fichier par processus, et ne modifiez pas le fichier pendant que le programme tourne. Pour partager des utilisateurs entre processus, utilisez une base de données ou un espace de noms KV, comme décrit plus bas sous « Plusieurs processus ».

:::caution
Le fichier contient des jetons d'accès et des jetons de rafraîchissement. Ajoutez-le à `.gitignore` et tenez-le à l'écart de tout ce que vous publiez, images de conteneur comprises.
:::

`FileTokenStore` vit dans un point d'entrée séparé parce qu'il importe `node:fs`. L'entrée principale reste exempte de modules intégrés à Node.js, ce qui lui permet de tourner sur d'autres runtimes. Voir [Runtimes](/basics/runtimes/).

## Comment les utilisateurs sont restaurés

Quand vous passez un magasin, le client appelle lui-même `twitch.auth.restore()` avant sa première requête. Il demande au magasin sa liste d'identifiants et charge chaque jeton. Vous n'avez rien à appeler.

Les jetons sont chargés tels qu'ils ont été sauvegardés, sans requête à Twitch. Un jeton d'accès qui a expiré pendant l'arrêt du programme est rafraîchi à sa première utilisation.

Appeler `restore()` vous-même est utile au démarrage, quand vous avez besoin de savoir si quelqu'un est déjà connecté :

```ts
const [saved] = await twitch.auth.restore();

if (saved) console.log(`Welcome back, ${saved.login}`);
else console.log("Nobody is signed in yet.");
```

Quelques détails qui comptent :

- `restore()` renvoie les jetons qu'elle a chargés. Elle ne s'exécute qu'une fois : les appels suivants renvoient la même liste et ne relisent pas le magasin.
- `twitch.auth.users`, `getUser()` et `hasUser()` sont synchrones et ne connaissent que les utilisateurs chargés jusque-là. Avant la première requête ou le premier `restore()`, ils sont vides.
- Un utilisateur enregistré avec `addUser` avant la restauration est conservé tel quel. La copie stockée ne le remplace pas.
- Si le magasin lève une erreur, l'appel qui a déclenché la restauration échoue avec cette erreur, et l'appel suivant réessaie.

## Écrire votre propre magasin

Tout ce qui peut sauvegarder une valeur JSON sous une clé peut servir de magasin. En voici un pour une base de données SQL, avec une ligne par utilisateur. La fonction `sql` représente votre client de base de données.

```ts title="src/token-store.ts"
import type { TokenStore, UserToken } from "@ix-xs/twitch.api";

// Votre client de base de données : un gabarit étiqueté qui renvoie des lignes.
declare function sql<Row = unknown>(query: TemplateStringsArray, ...values: unknown[]): Promise<Row[]>;

export const store: TokenStore = {
  async get(userId) {
    const [row] = await sql<{ token: string }>`SELECT token FROM twitch_tokens WHERE user_id = ${userId}`;
    return row ? (JSON.parse(row.token) as UserToken) : undefined;
  },
  async set(userId, token) {
    await sql`
      INSERT INTO twitch_tokens (user_id, token) VALUES (${userId}, ${JSON.stringify(token)})
      ON CONFLICT (user_id) DO UPDATE SET token = EXCLUDED.token`;
  },
  async delete(userId) {
    await sql`DELETE FROM twitch_tokens WHERE user_id = ${userId}`;
  },
  async list() {
    const rows = await sql<{ user_id: string }>`SELECT user_id FROM twitch_tokens`;
    return rows.map((row) => row.user_id);
  },
};
```

Et un autre pour un espace de noms clé-valeur, comme Cloudflare Workers KV. Le `kv` déclaré a la forme d'une liaison KV.

```ts
import { Twitch, type TokenStore, type UserToken } from "@ix-xs/twitch.api";

declare const kv: {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
};

const store: TokenStore = {
  async get(userId) {
    const saved = await kv.get(`twitch:${userId}`);
    return saved ? (JSON.parse(saved) as UserToken) : undefined;
  },
  set: (userId, token) => kv.put(`twitch:${userId}`, JSON.stringify(token)),
  delete: (userId) => kv.delete(`twitch:${userId}`),
};

const twitch = new Twitch({ clientId, clientSecret, tokens: store });
```

### Se passer de la liste

Le second magasin n'a pas de `list()`, volontairement. Sans elle, rien n'est restauré d'avance. Un jeton est lu dans le magasin la première fois qu'un appel désigne son utilisateur, avec `{ as: userId }`, avec `twitch.as(userId)`, ou avec le champ qui contient l'utilisateur qui agit (un `broadcaster_id`, un `moderator_id`).

```ts
// Lit le jeton de cet utilisateur dans le magasin, puis envoie la requête.
const me = await twitch.users.me({ as: userId });
```

C'est la bonne forme pour un serveur qui a beaucoup d'utilisateurs, et pour les runtimes de courte durée comme les Workers : avec un magasin qui liste dix mille identifiants, la première requête charge dix mille jetons, un `get` après l'autre. Ce choix a des conséquences qu'il faut connaître :

- `twitch.auth.users` ne contient que les utilisateurs chargés jusque-là.
- Un appel qui ne désigne personne ne peut pas deviner un utilisateur à partir du magasin. Dites toujours qui agit.
- La validation horaire ne couvre que les utilisateurs chargés.

### Plusieurs processus

Plusieurs processus peuvent partager un même magasin, par exemple les instances d'un serveur derrière un répartiteur de charge. Chaque processus garde en mémoire sa propre copie des jetons, et c'est par le magasin qu'ils restent synchronisés :

- Avant de rafraîchir un jeton, un processus lit le magasin. Si le jeton qui y est sauvegardé n'est pas celui qu'il détient, un autre processus l'a déjà renouvelé : le processus adopte ce jeton et n'envoie rien à Twitch. Aucun événement `tokenRefresh` n'est émis pour un jeton adopté.
- Si Twitch refuse le jeton de rafraîchissement, le processus lit le magasin une fois de plus. Un jeton de rafraîchissement différent à cet endroit signifie qu'un autre processus a consommé l'ancien un instant plus tôt : le jeton plus récent est adopté et l'utilisateur est conservé.

Le partage est ainsi sûr avec un client public aussi, où un jeton de rafraîchissement ne fonctionne qu'une fois (voir [Flux par code d'appareil](/auth/device-code/)). Deux limites demeurent. Le magasin doit renvoyer ce qui est sauvegardé à l'instant même, ce que fait une base de données ou un espace de noms KV, et ce que `FileTokenStore`, avec sa copie en mémoire, ne fait pas. Et deux processus qui rafraîchissent le même jeton exactement au même instant peuvent encore entrer en concurrence : avec un jeton de rafraîchissement à usage unique, celui qui perd peut ne trouver encore rien de plus récent dans le magasin et retirer l'utilisateur.

## Sauvegarder les jetons avec des événements

Si vous préférez ne pas confier de magasin au client, écoutez deux événements et enregistrez vous-même les jetons sauvegardés au démarrage.

```ts
import type { UserToken } from "@ix-xs/twitch.api";

declare function loadTokens(): Promise<UserToken[]>;
declare function saveToken(token: UserToken): Promise<void>;
declare function forgetToken(userId: string): Promise<void>;

// Un jeton sauvegardé a son propriétaire et ses scopes : aucune requête n'est faite ici.
for (const saved of await loadTokens()) await twitch.auth.addUser(saved);

twitch.on("tokenRefresh", (token) => {
  saveToken(token).catch(console.error);
});
twitch.on("tokenInvalid", (userId) => {
  forgetToken(userId).catch(console.error);
});
```

`tokenRefresh` est émis après chaque rafraîchissement, pas au premier enregistrement d'un utilisateur. Sauvegardez vous-même le `UserToken` renvoyé par `addUser`, `exchangeCode` ou `flow.wait()`. [Observabilité](/basics/observability/) décrit les événements.

## Ce qu'il faut protéger

Un jeton d'accès permet à celui qui le détient de faire tout ce que l'utilisateur a autorisé votre application à faire. Un jeton de rafraîchissement permet à celui qui le détient de fabriquer de nouveaux jetons d'accès aussi longtemps que dure l'autorisation. Traitez un `UserToken` sauvegardé comme un mot de passe.

- Gardez les jetons sur le serveur. Un navigateur reçoit un cookie de session, jamais le jeton.
- Ne journalisez pas les objets `UserToken`, et ne mettez pas de jetons dans les URL.
- Restreignez l'accès en lecture au magasin : permissions de fichier, rôles de base de données, chiffrement au repos quand votre plateforme le propose. Un magasin se réduisant à quatre méthodes, en envelopper un pour chiffrer les valeurs à l'entrée et les déchiffrer à la sortie prend quelques lignes.
- Quand un utilisateur se déconnecte, ou quand vous soupçonnez une fuite, appelez `twitch.auth.removeUser(userId, { revoke: true })`. La méthode supprime le jeton du magasin et invalide le jeton d'accès auprès de Twitch.

## Voir aussi

- [Gérer les utilisateurs](/auth/managing-users/) : enregistrer, lister, rafraîchir et retirer des utilisateurs.
- [Flux par code d'appareil](/auth/device-code/) : se connecter une fois, puis restaurer depuis le magasin.
- [Observabilité](/basics/observability/) : les événements `tokenRefresh` et `tokenInvalid`.
- [Runtimes](/basics/runtimes/) : pourquoi le magasin fichier a son propre point d'entrée.
