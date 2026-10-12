---
title: "Modération"
description: "Agissez en tant que modérateur : timeout, bannissement, avertissement, suppression de messages, examen de ce qu'AutoMod retient et bascule du Shield Mode, avec l'identifiant du modérateur rempli pour vous."
sidebar:
  order: 3
---

Cette recette construit un assistant de modération qui tourne sous le compte d'un modérateur. Il examine les messages qu'AutoMod retient, supprime les liens publiés par les spectateurs et donne aux modérateurs de la chaîne trois commandes de chat : `!timeout`, `!ban` et `!unban`, plus `!shield` pour basculer le Shield Mode. Au passage, elle montre chaque appel de modération isolément.

## Ce qu'il vous faut

| | |
| --- | --- |
| Application | Un identifiant client issu de la [console développeur de Twitch](https://dev.twitch.tv/console/apps). Le programme se connecte avec le flux par code d'appareil, qui ne demande pas de secret client. |
| Compte | Le diffuseur, ou un compte que le diffuseur a nommé modérateur de la chaîne. |
| Jeton | Un jeton utilisateur de ce compte. |
| Scopes | `moderator:manage:banned_users`, `moderator:manage:warnings`, `moderator:manage:chat_messages`, `moderator:manage:automod`, `moderator:manage:shield_mode`, et `user:read:chat` pour lire le chat. |

Ne demandez que les scopes des parties que vous gardez. [Scopes](/reference/scopes/) liste ce que chacun débloque.

## Se connecter en tant que modérateur

La connexion est la même que dans la [recette du bot de chat](/recipes/chat-bot/) : un `FileTokenStore`, et le flux par code d'appareil quand le fichier est vide. La chaîne est le premier argument du programme, ou la propre chaîne du modérateur. Donnez à ce programme son propre fichier de jetons : un jeton enregistré par un autre programme peut appartenir à un autre compte ou ne pas avoir ces scopes.

```ts
import { Twitch } from "@ix-xs/twitch.api";
import { FileTokenStore } from "@ix-xs/twitch.api/node";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  tokens: new FileTokenStore("./tokens.json"),
});

let [moderator] = await twitch.auth.restore();
if (!moderator) {
  const flow = await twitch.auth.deviceFlow({
    scopes: [
      "user:read:chat",
      "moderator:manage:banned_users",
      "moderator:manage:warnings",
      "moderator:manage:chat_messages",
      "moderator:manage:automod",
      "moderator:manage:shield_mode",
    ],
  });
  console.log(`Open ${flow.verificationUri} and confirm the code ${flow.userCode}`);
  moderator = await flow.wait();
}
const moderator_id = moderator.userId;

const channel = await twitch.users.getByLogin(process.argv[2] ?? moderator.login!);
if (!channel) throw new Error("Unknown channel");
const broadcaster_id = channel.id;
```

## Appliquer un timeout, bannir, avertir et supprimer

Un timeout est un bannissement avec une `duration` en secondes. Sans elle, le bannissement est permanent. La `reason` est montrée à l'utilisateur et aux autres modérateurs.

```ts
// Dix minutes hors du chat.
const timeout = await twitch.moderation.ban({ broadcaster_id, user_id, duration: 600, reason: "Spam" });
console.log(`Back at ${timeout.end_time}`);

// Pour de bon.
await twitch.moderation.ban({ broadcaster_id, user_id, reason: "Harassment" });

// Lève un bannissement ou un timeout.
await twitch.moderation.unban({ broadcaster_id, user_id });

// L'utilisateur ne peut plus écrire dans le chat tant qu'il n'a pas pris acte de l'avertissement.
await twitch.moderation.warn({ broadcaster_id, user_id, reason: "Keep it friendly." });

// Supprime un message. Sans `message_id`, tout le chat est effacé.
await twitch.moderation.deleteMessages({ broadcaster_id, message_id: "abc-123-def" });
```

Aucun de ces appels ne dit qui est le modérateur. Chacun de ces endpoints a un paramètre `moderator_id`, et le client le remplit avec l'identifiant de l'utilisateur dont il utilise le jeton. Avec un seul utilisateur enregistré, cet utilisateur est le modérateur. Vous pouvez toujours écrire `moderator_id` vous-même, et [Agir au nom d'un utilisateur](/basics/acting-as-a-user/) explique comment le jeton est choisi quand plusieurs utilisateurs sont enregistrés.

Twitch fixe quelques règles de son côté. Un utilisateur banni doit être débanni avant de pouvoir recevoir un timeout. Un message peut être supprimé pendant 6 heures après son envoi, et les messages du diffuseur et des modérateurs ne peuvent pas être supprimés.

## Examiner ce qu'AutoMod retient

`automod.message.hold` se déclenche chaque fois qu'AutoMod garde un message hors du chat jusqu'à ce qu'un modérateur décide. L'événement a deux formes, distinguées par `reason` : un message intercepté par AutoMod lui-même porte une catégorie et un niveau de 1 à 4, un message intercepté par un terme bloqué ou un lien bloqué porte les termes trouvés.

```ts
events.on(
  "automod.message.hold",
  { broadcaster_user_id: broadcaster_id, moderator_user_id: moderator_id },
  async (event) => {
    let action: "ALLOW" | "DENY" | undefined;
    if (event.reason === "automod") {
      // Les cas les plus bénins passent, les autres attendent un humain.
      if (event.automod.level === 1) action = "ALLOW";
    } else {
      // Un terme bloqué ou un lien bloqué.
      action = "DENY";
    }

    console.log(`Held "${event.message.text}" from ${event.user_login}: ${action ?? "left in the queue"}`);
    if (action) await twitch.moderation.manageAutoModMessage({ msg_id: event.message_id, action });
  },
);
```

`ALLOW` libère le message dans le chat et `DENY` l'écarte. Le modérateur qui prend la décision s'appelle `user_id` sur cet endpoint. Il est omis ici aussi.

La condition d'un abonnement est le seul endroit où l'identifiant du modérateur doit être écrit : Twitch en a besoin pour savoir qui écoute, et rien ne le remplit pour vous.

La politique ci-dessus n'est qu'un exemple. Décidez pour votre chaîne quels cas un programme peut trancher et lesquels une personne doit lire.

## Basculer le Shield Mode et lister les bannissements

Le Shield Mode applique les règles de chat plus strictes que le diffuseur a préparées pour lui. `updateShieldMode` renvoie le nouvel état, et `shieldMode` le lit.

```ts
const status = await twitch.moderation.updateShieldMode({ broadcaster_id, is_active: true });
console.log(`Shield Mode is ${status.is_active ? "on" : "off"}`);

const current = await twitch.moderation.shieldMode({ broadcaster_id });
console.log(`Last turned on by ${current.moderator_login || "nobody"}`);
```

`bans` liste les utilisateurs bannis ou sous timeout. Il renvoie un paginateur : `for await` parcourt toutes les pages.

```ts
for await (const ban of twitch.moderation.bans()) {
  const until = ban.expires_at ? `until ${ban.expires_at}` : "for good";
  console.log(`${ban.user_login} is out ${until}, by ${ban.moderator_login}: ${ban.reason || "no reason"}`);
}
```

:::note
Avec un jeton utilisateur, Twitch exige que le `broadcaster_id` de cette requête corresponde à l'identifiant d'utilisateur du jeton. `bans()` sans `broadcaster_id` lit la liste de l'utilisateur qui fait l'appel, ce qui convient à un programme connecté en tant que diffuseur. Connecté en tant que modérateur, enregistrez aussi le jeton du diffuseur : `bans({ broadcaster_id })` l'utilise alors, parce que `broadcaster_id` désigne un utilisateur enregistré. Avec un secret client et le seul modérateur enregistré, le même appel part avec le jeton d'application.
:::

## Le fichier complet

Le programme place les appels ci-dessus derrière deux abonnements. Le premier tranche les messages retenus par AutoMod. Le second lit le chat : un message d'un spectateur qui contient un lien est supprimé et son auteur averti, et un message du diffuseur ou d'un modérateur est lu comme une commande. Les badges de l'événement disent qui est qui.

```ts title="src/mod.ts"
import { Twitch } from "@ix-xs/twitch.api";
import { FileTokenStore } from "@ix-xs/twitch.api/node";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  tokens: new FileTokenStore("./tokens.json"),
});

let [moderator] = await twitch.auth.restore();
if (!moderator) {
  const flow = await twitch.auth.deviceFlow({
    scopes: [
      "user:read:chat",
      "moderator:manage:banned_users",
      "moderator:manage:warnings",
      "moderator:manage:chat_messages",
      "moderator:manage:automod",
      "moderator:manage:shield_mode",
    ],
  });
  console.log(`Open ${flow.verificationUri} and confirm the code ${flow.userCode}`);
  moderator = await flow.wait();
}
const moderator_id = moderator.userId;

const channel = await twitch.users.getByLogin(process.argv[2] ?? moderator.login!);
if (!channel) throw new Error("Unknown channel");
const broadcaster_id = channel.id;

// La liste des bannissements se lit avec le jeton du propriétaire de la chaîne.
if (moderator_id === broadcaster_id) {
  for await (const ban of twitch.moderation.bans()) {
    const until = ban.expires_at ? `until ${ban.expires_at}` : "for good";
    console.log(`${ban.user_login} is out ${until}, by ${ban.moderator_login}: ${ban.reason || "no reason"}`);
  }
}

const events = twitch.eventsub.websocket();
events.onError((error) => console.error(error.message));

events.on(
  "automod.message.hold",
  { broadcaster_user_id: broadcaster_id, moderator_user_id: moderator_id },
  async (event) => {
    let action: "ALLOW" | "DENY" | undefined;
    if (event.reason === "automod") {
      if (event.automod.level === 1) action = "ALLOW";
    } else {
      action = "DENY";
    }

    console.log(`Held "${event.message.text}" from ${event.user_login}: ${action ?? "left in the queue"}`);
    if (action) await twitch.moderation.manageAutoModMessage({ msg_id: event.message_id, action });
  },
);

events.on("channel.chat.message", { broadcaster_user_id: broadcaster_id, user_id: moderator_id }, async (event) => {
  const text = event.message.text.trim();
  const trusted = event.badges.some((badge) => badge.set_id === "moderator" || badge.set_id === "broadcaster");

  if (!trusted) {
    if (!/https?:\/\//i.test(text)) return;
    await twitch.moderation.deleteMessages({ broadcaster_id, message_id: event.message_id });
    await twitch.moderation.warn({
      broadcaster_id,
      user_id: event.chatter_user_id,
      reason: "Links are not allowed in this chat.",
    });
    return;
  }

  const [name, arg = "", ...rest] = text.split(/\s+/);

  if (name === "!shield") {
    const status = await twitch.moderation.updateShieldMode({ broadcaster_id, is_active: arg === "on" });
    console.log(`Shield Mode is ${status.is_active ? "on" : "off"}`);
    return;
  }
  if ((name !== "!timeout" && name !== "!ban" && name !== "!unban") || !arg) return;

  const target = await twitch.users.getByLogin(arg.replace(/^@/, ""));
  if (!target) return;
  const user_id = target.id;

  if (name === "!unban") {
    await twitch.moderation.unban({ broadcaster_id, user_id });
  } else if (name === "!ban") {
    await twitch.moderation.ban({ broadcaster_id, user_id, reason: rest.join(" ") || "No reason given" });
  } else {
    // !timeout <login> <secondes> <raison>
    const duration = Number(rest[0]) || 600;
    const reason = rest.slice(1).join(" ") || "No reason given";
    const timeout = await twitch.moderation.ban({ broadcaster_id, user_id, duration, reason });
    console.log(`${target.login} is timed out until ${timeout.end_time}`);
  }
});
```

Lancez-le avec [tsx](https://tsx.is/), dans un projet qui est un module ES (`"type": "module"` dans `package.json`), avec `TWITCH_CLIENT_ID` dans un fichier `.env` :

```bash
node --env-file=.env --import tsx src/mod.ts some_channel
```

Dans le chat, un modérateur peut maintenant taper `!timeout some_viewer 300 Calm down`, `!ban some_viewer Spam bot`, `!unban some_viewer`, `!shield on` et `!shield off`.

## Aller plus loin

### Distinguer une action refusée d'une action défaillante

Twitch refuse certaines actions pour de bonnes raisons : la cible est un modérateur, l'utilisateur est déjà banni. Ces refus reviennent sous la forme d'une `TwitchApiError`, et un jeton auquel il manque un scope échoue plus tôt avec une `TwitchScopeError`. Levées dans un gestionnaire sans être interceptées, les deux aboutissent dans `onError`.

```ts
import { TwitchApiError, TwitchScopeError } from "@ix-xs/twitch.api";

try {
  await twitch.moderation.ban({ broadcaster_id, user_id, duration: 600, reason: "Spam" });
} catch (error) {
  if (error instanceof TwitchScopeError) console.error(`Sign in again with one of: ${error.required.join(", ")}`);
  else if (error instanceof TwitchApiError) console.error(`Refused (${error.status}): ${error.message}`);
  else throw error;
}
```

### Fonctionner avec plusieurs comptes

Quand plus d'un utilisateur est enregistré, le client ne peut plus deviner qui est le modérateur. Un appel qui omet `moderator_id` échoue alors avec une `TwitchAuthError` avant l'envoi de toute requête, et son message vous dit de choisir un utilisateur avec `{ as: userId }` ou `twitch.as(userId)`. Désignez le modérateur une fois pour toutes avec `twitch.as()`, ou écrivez `moderator_id` dans l'appel.

```ts
const asModerator = twitch.as(moderator_id);
await asModerator.moderation.ban({ broadcaster_id, user_id, duration: 600, reason: "Spam" });

// Le diffuseur est enregistré lui aussi : la liste des bannissements se lit avec son jeton.
const banned = await twitch.moderation.bans({ broadcaster_id }).all();
```

Le second appel n'a pas besoin de `as` : `broadcaster_id` désigne un utilisateur enregistré, et c'est ce jeton que le client choisit.

### Bloquer un terme

`addBlockedTerm` ajoute un mot ou une expression aux termes bloqués de la chaîne. Il demande le scope `moderator:manage:blocked_terms`. Un `*` au début ou à la fin d'un mot est un caractère générique.

```ts
const term = await twitch.moderation.addBlockedTerm({ broadcaster_id, text: "spoil*" });
console.log(`Blocked "${term.text}"`);
```

## Voir aussi

- [twitch.moderation](/reference/api/moderation/) : chaque méthode de modération, avec ses paramètres et ses scopes.
- [Agir au nom d'un utilisateur](/basics/acting-as-a-user/) : quel jeton un appel utilise, et les champs remplis pour vous.
- [Erreurs](/basics/errors/) : les classes d'erreur et leurs champs.
- [automod.message.hold](/reference/event-types/#automodmessagehold) : la condition et le scope de l'événement.
- [Événements typés](/events/typed-events/) : l'affinage d'un événement sur son discriminant.
