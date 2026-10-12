---
title: "Statistiques d'une chaîne"
description: "Une fonction qui rassemble en parallèle les chiffres d'une chaîne : profil, état du direct, followers, abonnés, clips récents et streams à venir."
sidebar:
  order: 8
---

Cette recette construit une fonction `channelStats(login)` qui renvoie tout ce qu'un tableau de bord ou une carte de profil montre d'une chaîne : qui elle est, ce qu'elle diffuse, si elle est en direct, combien de personnes la suivent et y sont abonnées, ses derniers clips et ses prochains streams planifiés. Toutes ces parties sauf une ne demandent rien de plus que le jeton d'application.

## Ce qu'il vous faut

| | |
| --- | --- |
| Application | Un identifiant client et un secret client issus de la [console développeur de Twitch](https://dev.twitch.tv/console/apps). Voir [Obtenir vos identifiants](/credentials/). |
| Jeton | Le jeton d'application pour les parties publiques. Le jeton utilisateur du diffuseur pour les abonnés. |
| Scopes | `channel:read:subscriptions`, accordé par le diffuseur, pour le nombre d'abonnés et les points. Rien d'autre. |

Voici quel appel alimente chaque partie, et le jeton qu'il utilise :

| Partie | Appel | Jeton |
| --- | --- | --- |
| Profil | `users.getByLogin` | Application |
| Titre, catégorie, tags | `channels.get` | Application |
| État du direct et spectateurs | `streams.get` | Application |
| Nombre de followers | `channels.followers(...).total()` | Application |
| Derniers clips | `clips.get` | Application |
| Prochains streams | `schedule.get` | Application |
| Nombre d'abonnés et points | `subscriptions.get` | Diffuseur |

## Lire les parties publiques

Le client n'a besoin que de ses identifiants. Tout est adressé par identifiant d'utilisateur, le nom de connexion est donc résolu d'abord.

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
});

const user = await twitch.users.getByLogin("twitchdev");
if (!user) throw new Error("Unknown channel");
const broadcaster_id = user.id;

const [channel] = await twitch.channels.get({ broadcaster_id });
const stream = await twitch.streams.get({ user_id: broadcaster_id }).first();
const followers = await twitch.channels.followers({ broadcaster_id }).total();

console.log(channel?.title, stream?.viewer_count ?? "offline", followers);
```

Chaque appel renvoie la forme qui lui convient :

- `channels.get` se résout avec un tableau, parce qu'il accepte plusieurs identifiants. Le premier élément est la chaîne.
- `streams.get` est une liste de streams en direct. `first()` donne le stream de la chaîne, ou `undefined` quand elle est hors ligne.
- `channels.followers` est aussi une liste, mais `total()` lit le nombre que Twitch indique avec elle, par une requête d'un seul élément. La liste des followers elle-même n'est donnée qu'au diffuseur et à ses modérateurs. Le nombre est donné à n'importe quel jeton.

## Ajouter les clips et le planning

Ces deux-là demandent un peu plus de soin, chacun a donc sa propre fonction.

Les clips reviennent en commençant par les plus vus. Pour obtenir les plus récents, prenez les clips créés au cours des 7 derniers jours et triez-les par date. Le planning échoue avec un 404 quand la chaîne n'a pas de planning, ce qui n'est pas une erreur pour un tableau de bord.

```ts
import { TwitchApiError, type Clip, type ScheduleSegment } from "@ix-xs/twitch.api";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

async function latestClips(broadcaster_id: string): Promise<Clip[]> {
  const started_at = new Date(Date.now() - WEEK_MS);
  const clips = await twitch.clips.get({ broadcaster_id, started_at }).all({ limit: 100 });
  return clips.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, 5);
}

async function nextStreams(broadcaster_id: string): Promise<ScheduleSegment[]> {
  try {
    const segments = await twitch.schedule.get({ broadcaster_id }).take(5);
    // Une occurrence annulée d'un stream récurrent reste listée.
    return segments.filter((segment) => segment.canceled_until === null).slice(0, 3);
  } catch (error) {
    if (error instanceof TwitchApiError && error.status === 404) return [];
    throw error;
  }
}
```

`started_at` est ici une `Date`. Les paramètres qui prennent un horodatage acceptent une `Date` ou une chaîne RFC 3339.

## Ajouter les abonnés

La liste des abonnés appartient au diffuseur. `subscriptions.get` demande son jeton utilisateur avec le scope `channel:read:subscriptions`. Une page de cette liste porte deux nombres à côté des éléments : `total`, le nombre d'abonnés, et `raw.points`, les points d'abonnés qui déterminent le nombre d'emplacements d'emotes de la chaîne.

```ts
async function subscribers(broadcaster_id: string): Promise<{ count: number; points: number } | null> {
  // Seul le jeton du diffuseur lui-même peut lire ceci.
  const token = twitch.auth.getUser(broadcaster_id);
  if (!token?.scopes.includes("channel:read:subscriptions")) return null;

  const page = await twitch.subscriptions.get({ broadcaster_id, first: 1 });
  return { count: page.total ?? 0, points: page.raw.points ?? 0 };
}
```

La fonction regarde les utilisateurs enregistrés avant d'appeler. Quand le diffuseur ne s'est jamais connecté à votre application, elle renvoie `null` et le reste des statistiques est tout de même complet. Quand il l'a fait, le client choisit son jeton de lui-même, parce que le `broadcaster_id` de la requête est un utilisateur enregistré.

Enregistrez un diffuseur avec l'un des flux présentés dans [Authentification](/auth/overview/), ou directement quand vous détenez déjà ses jetons :

```ts
await twitch.auth.addUser({ accessToken, refreshToken });
```

Avec un magasin de jetons, appelez `await twitch.auth.restore()` une fois au démarrage. `getUser` ne voit que les jetons chargés.

## Tout rassembler en parallèle

Le profil vient en premier, puisque les autres appels ont besoin de l'identifiant et qu'il n'y a rien à rassembler pour un nom de connexion qui n'existe pas. Les six autres appels partent ensuite ensemble et `Promise.all` attend le plus lent.

```ts
import type { Clip, ScheduleSegment } from "@ix-xs/twitch.api";

// Les trois fonctions des étapes précédentes.
declare function latestClips(broadcaster_id: string): Promise<Clip[]>;
declare function nextStreams(broadcaster_id: string): Promise<ScheduleSegment[]>;
declare function subscribers(broadcaster_id: string): Promise<{ count: number; points: number } | null>;

async function channelStats(login: string) {
  const user = await twitch.users.getByLogin(login);
  if (!user) return null;
  const broadcaster_id = user.id;

  const [channels, stream, followers, subs, clips, upcoming] = await Promise.all([
    twitch.channels.get({ broadcaster_id }),
    twitch.streams.get({ user_id: broadcaster_id }).first(),
    twitch.channels.followers({ broadcaster_id }).total(),
    subscribers(broadcaster_id),
    latestClips(broadcaster_id),
    nextStreams(broadcaster_id),
  ]);

  return { user, channel: channels[0], stream, followers, subs, clips, upcoming };
}
```

Jusqu'à sept requêtes partent pour une chaîne, toutes sauf la première au même moment. Le client les répartit de lui-même sur la limite de débit : quand le seau est vide, une requête attend qu'il se remplisse.

## Le fichier complet

Le fichier complet transforme aussi les morceaux en un seul objet plat et typé, prêt à être envoyé en JSON.

```ts title="src/channel-stats.ts"
import { Twitch, TwitchApiError, type Clip, type ScheduleSegment } from "@ix-xs/twitch.api";

export interface ChannelStats {
  id: string;
  login: string;
  name: string;
  avatar: string;
  title: string;
  category: string;
  /** `null` quand la chaîne est hors ligne. */
  live: { viewers: number; since: string } | null;
  followers: number;
  /** `null` quand le jeton du diffuseur n'est pas enregistré. */
  subscribers: { count: number; points: number } | null;
  clips: Clip[];
  upcoming: ScheduleSegment[];
}

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
});

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

async function latestClips(broadcaster_id: string): Promise<Clip[]> {
  const started_at = new Date(Date.now() - WEEK_MS);
  const clips = await twitch.clips.get({ broadcaster_id, started_at }).all({ limit: 100 });
  return clips.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, 5);
}

async function nextStreams(broadcaster_id: string): Promise<ScheduleSegment[]> {
  try {
    const segments = await twitch.schedule.get({ broadcaster_id }).take(5);
    // Une occurrence annulée d'un stream récurrent reste listée.
    return segments.filter((segment) => segment.canceled_until === null).slice(0, 3);
  } catch (error) {
    if (error instanceof TwitchApiError && error.status === 404) return [];
    throw error;
  }
}

async function subscribers(broadcaster_id: string): Promise<{ count: number; points: number } | null> {
  // Seul le jeton du diffuseur lui-même peut lire ceci.
  const token = twitch.auth.getUser(broadcaster_id);
  if (!token?.scopes.includes("channel:read:subscriptions")) return null;

  const page = await twitch.subscriptions.get({ broadcaster_id, first: 1 });
  return { count: page.total ?? 0, points: page.raw.points ?? 0 };
}

export async function channelStats(login: string): Promise<ChannelStats | null> {
  const user = await twitch.users.getByLogin(login);
  if (!user) return null;
  const broadcaster_id = user.id;

  const [channels, stream, followers, subs, clips, upcoming] = await Promise.all([
    twitch.channels.get({ broadcaster_id }),
    twitch.streams.get({ user_id: broadcaster_id }).first(),
    twitch.channels.followers({ broadcaster_id }).total(),
    subscribers(broadcaster_id),
    latestClips(broadcaster_id),
    nextStreams(broadcaster_id),
  ]);
  const channel = channels[0];

  return {
    id: user.id,
    login: user.login,
    name: user.display_name,
    avatar: user.profile_image_url,
    title: channel?.title ?? "",
    category: channel?.game_name ?? "",
    live: stream ? { viewers: stream.viewer_count, since: stream.started_at } : null,
    followers: followers ?? 0,
    subscribers: subs,
    clips,
    upcoming,
  };
}

const stats = await channelStats(process.argv[2] ?? "twitchdev");
console.log(JSON.stringify(stats, null, 2));
```

Placez les identifiants dans un fichier `.env` et lancez-le avec [tsx](https://tsx.is/), dans un projet qui est un module ES (`"type": "module"` dans `package.json`) :

```ini
TWITCH_CLIENT_ID=your-client-id
TWITCH_CLIENT_SECRET=your-client-secret
```

```bash
node --env-file=.env --import tsx src/channel-stats.ts some_channel
```

## Aller plus loin

### Regarder beaucoup de chaînes à la fois

Appeler la fonction dans une boucle coûte jusqu'à sept requêtes par chaîne. Pour une liste, les recherches qui acceptent plusieurs valeurs font l'essentiel du travail en une requête chacune. Les listes de plus de 100 éléments sont découpées pour vous par `users.get` et `channels.get`.

```ts
const logins = ["twitchdev", "twitch", "twitchgaming"];

const users = await twitch.users.get({ login: logins });
const ids = users.map((user) => user.id);

const [channels, live] = await Promise.all([
  twitch.channels.get({ broadcaster_id: ids }),
  twitch.streams.get({ user_id: ids }).all(),
]);

const liveIds = new Set(live.map((stream) => stream.user_id));
for (const channel of channels) {
  console.log(channel.broadcaster_name, liveIds.has(channel.broadcaster_id) ? "live" : "offline", channel.title);
}
```

`streams.get` prend jusqu'à 100 identifiants par appel. Les nombres de followers, les clips et les plannings n'ont pas de forme groupée : ils restent à une requête par chaîne.

### Garder le résultat une minute

Une page qui montre ces chiffres à chaque visiteur ne devrait pas les demander à Twitch à chaque affichage. Un petit cache devant la fonction suffit.

```ts
declare function channelStats(login: string): Promise<object | null>;

const TTL_MS = 60_000;
const cache = new Map<string, { at: number; stats: Promise<object | null> }>();

function cachedStats(login: string): Promise<object | null> {
  const key = login.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.stats;

  const stats = channelStats(key);
  cache.set(key, { at: Date.now(), stats });
  // Ne pas garder un échec pendant une minute.
  stats.catch(() => cache.delete(key));
  return stats;
}
```

Stocker la promesse, et non son résultat, signifie aussi que deux visiteurs qui arrivent ensemble partagent une seule série de requêtes.

### Partir d'un identifiant

Quand vous avez déjà l'identifiant de la chaîne, il n'y a pas de nom de connexion à résoudre. Mettez `twitch.users.getById(id)` dans le `Promise.all` avec les six autres appels, et les sept partent en même temps.

## Voir aussi

- [Appeler l'API](/basics/calling-the-api/) : les formes de retour, et les recherches fusionnées ou découpées pour vous.
- [Pagination](/basics/pagination/) : `first()`, `total()`, `take()` et `page.raw`.
- [Agir au nom d'un utilisateur](/basics/acting-as-a-user/) : comment le jeton du diffuseur est choisi pour un appel.
- [Limites de débit et nouvelles tentatives](/basics/rate-limits-and-retries/) : ce qui se passe quand beaucoup de requêtes partent ensemble.
- [subscriptions.get](/reference/api/subscriptions/#get) : la liste des abonnés et ses totaux.
