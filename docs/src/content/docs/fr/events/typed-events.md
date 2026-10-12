---
title: "Événements typés"
description: "Comment le nom d'un type d'abonnement vous donne une condition typée et un événement typé, et comment affiner les événements qui prennent plusieurs formes."
sidebar:
  order: 5
---

Chaque type d'abonnement connu de la bibliothèque a une entrée dans une même table de correspondance TypeScript. Le nom que vous passez à `on()` sélectionne cette entrée, et à partir de là, la condition que vous devez fournir et l'événement que reçoit votre gestionnaire sont entièrement typés. Cette page montre comment utiliser ces types, sur n'importe lequel des trois écouteurs.

## Un premier exemple

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({ clientId, clientSecret });
const events = twitch.eventsub.websocket();

events.on("channel.follow", { broadcaster_user_id: channelId, moderator_user_id: botId }, (event) => {
  console.log(event.user_name, event.followed_at); // deux chaînes de caractères
});

// @ts-expect-error la condition de channel.follow exige aussi moderator_user_id
events.on("channel.follow", { broadcaster_user_id: channelId }, () => {});
```

Le nom est proposé en autocomplétion, la condition est vérifiée champ par champ, et `event` n'a besoin d'aucune annotation.

## Comment le nom détermine les types

Cette table est l'interface `EventSubTypes`. Chacune de ses clés est un nom de type, et chaque entrée contient une `version`, une `condition` et un `event`. Quelques types utilitaires la lisent pour vous :

| Type | Donne |
| --- | --- |
| `EventSubType` | L'union de tous les noms connus, par exemple `"channel.follow"`. |
| `EventSubCondition<T>` | La condition à fournir pour s'abonner à `T`. |
| `EventSubEvent<T>` | L'événement livré par un abonnement à `T`. |
| `EventSubHandler<T>` | Le type de fonction d'un gestionnaire pour `T` : `(event, meta) => unknown`. |
| `EventSubMeta` | Le second argument de tout gestionnaire. |

Servez-vous-en pour typer vos propres fonctions et valeurs :

```ts
import type { EventSubCondition, EventSubEvent } from "@ix-xs/twitch.api";

const chat: EventSubCondition<"channel.chat.message"> = { broadcaster_user_id: channelId, user_id: botId };

function isCommand(event: EventSubEvent<"channel.chat.message">): boolean {
  return event.message.text.startsWith("!");
}

events.on("channel.chat.message", chat, (event) => {
  if (isCommand(event)) console.log(`Command from ${event.chatter_user_login}`);
});
```

Chaque événement et chaque condition sont aussi exportés sous leur propre nom : `EventSubEvent<"channel.chat.message">` est `ChannelChatMessageEvent`. La [référence des types d'événements](/reference/event-types/) donne le nom d'interface de chaque type.

Les valeurs arrivent telles que Twitch les envoie : les identifiants sont des chaînes de caractères et les horodatages sont des chaînes RFC 3339. Les champs que Twitch peut omettre ou mettre à `null` sont typés en conséquence : le compilateur vous indique donc où une vérification est nécessaire.

## Affiner les événements qui prennent plusieurs formes

Certains types livrent des contenus différents selon ce qui s'est passé. Ils sont typés comme des unions, avec un champ qui distingue les variantes. Testez ce champ et TypeScript sait quels détails sont présents.

| Type | Affiner sur |
| --- | --- |
| `channel.chat.notification` | `notice_type` |
| `channel.moderate` | `action` |
| `channel.bits.use` | `type` |
| `channel.hype_train.begin`, `.progress`, `.end` | `is_shared_train` |
| `automod.message.hold`, `automod.message.update` | `reason` |
| Fragments de message, dans les événements de chat et de Bits | le `type` de chaque fragment |

### Notifications de chat

`channel.chat.notification` couvre les abonnements, les abonnements offerts, les raids, les annonces et d'autres cas encore. Chaque notification a un objet de détails qui porte le nom de son `notice_type`. Il est rempli pour cette notification et vaut `null` pour les autres.

```ts
events.on("channel.chat.notification", { broadcaster_user_id: channelId, user_id: botId }, (event) => {
  switch (event.notice_type) {
    case "sub":
      console.log(`${event.chatter_user_name} subscribed at tier ${event.sub.sub_tier}`);
      break;
    case "resub":
      console.log(`${event.chatter_user_name} has been here for ${event.resub.cumulative_months} months`);
      break;
    case "community_sub_gift":
      console.log(`${event.chatter_user_name} gifted ${event.community_sub_gift.total} subscriptions`);
      break;
    case "raid":
      console.log(`${event.raid.user_name} raids with ${event.raid.viewer_count} viewers`);
      break;
    default:
      console.log(event.system_message);
  }
});
```

Conservez une branche `default`. `system_message` est le texte que Twitch affiche dans le chat. Il existe sur toutes les notifications, y compris celles que Twitch ajoute après la publication de votre version de la bibliothèque.

### Actions de modération

`channel.moderate` rapporte ce que font les modérateurs. `action` nomme l'action, et l'objet du même nom en porte les détails.

```ts
events.on("channel.moderate", { broadcaster_user_id: channelId, moderator_user_id: botId }, (event) => {
  if (event.action === "timeout") {
    console.log(`${event.timeout.user_name} is timed out until ${event.timeout.expires_at}`);
  } else if (event.action === "ban") {
    console.log(`${event.ban.user_name} was banned: ${event.ban.reason ?? "no reason given"}`);
  } else if (event.action === "delete") {
    console.log(`Message of ${event.delete.user_name} deleted: ${event.delete.message_body}`);
  } else if (event.action === "add_blocked_term" || event.action === "remove_blocked_term") {
    console.log(`Blocked terms changed: ${event.automod_terms.terms.join(", ")}`);
  } else {
    console.log(`${event.moderator_user_name} did ${event.action}`);
  }
});
```

Deux groupes d'actions partagent un objet : les quatre actions sur les termes remplissent `automod_terms`, et `approve_unban_request` et `deny_unban_request` remplissent `unban_request`. Des actions telles que `clear`, `emoteonly` ou `slowoff` n'ont aucun détail. Le type `ChannelModerateAction` est l'union de toutes les valeurs que peut prendre `action`.

### Bits

`channel.bits.use` se déclenche pour les cheers et pour les Power-ups. Son `type` vaut `"cheer"`, `"power_up"` ou `"custom_power_up"`.

```ts
events.on("channel.bits.use", { broadcaster_user_id: channelId }, (event) => {
  if (event.type === "power_up") {
    console.log(`${event.user_name} used ${event.power_up.type} for ${event.bits} Bits`);
  } else if (event.type === "custom_power_up") {
    console.log(`${event.user_name} redeemed ${event.custom_power_up.title}`);
  } else {
    console.log(`${event.user_name} cheered ${event.bits} Bits`);
  }
});
```

### Fragments de message

Un message de chat arrive sous forme de `text` brut et sous forme d'une liste de `fragments` : texte, emotes, Cheermotes, mentions. Chaque fragment a un `type`, et les détails correspondants sont présents une fois que vous l'avez testé.

```ts
events.on("channel.chat.message", { broadcaster_user_id: channelId, user_id: botId }, (event) => {
  const emotes: string[] = [];
  const mentions: string[] = [];
  let bits = 0;

  for (const fragment of event.message.fragments) {
    if (fragment.type === "emote") emotes.push(fragment.emote.id);
    else if (fragment.type === "mention") mentions.push(fragment.mention.user_login);
    else if (fragment.type === "cheermote") bits += fragment.cheermote.bits;
  }

  console.log({ text: event.message.text, emotes, mentions, bits });
});
```

### Hype Trains

Les trois types Hype Train distinguent un train partagé entre plusieurs chaînes d'un train sur une seule chaîne grâce au booléen `is_shared_train`.

```ts
events.on("channel.hype_train.begin", { broadcaster_user_id: channelId }, (event) => {
  if (event.is_shared_train) {
    const names = event.shared_train_participants.map((channel) => channel.broadcaster_user_name);
    console.log(`Shared Hype Train with ${names.join(", ")}`);
  } else {
    console.log(`Hype Train level ${event.level}, goal ${event.goal}`);
  }
});
```

## Versions

Twitch publie certains types en plusieurs versions. Le nom seul désigne la version la plus récente que connaît la bibliothèque, et une version plus ancienne s'écrit `name@version`. Quatre types ont une version plus ancienne :

- `automod.message.hold@1`
- `automod.message.update@1`
- `channel.channel_points_automatic_reward_redemption.add@1`
- `channel.moderate@1`

Chaque version a son propre type d'événement. La version 1 de `channel.moderate` ne rapporte pas les avertissements, si bien que `"warn"` ne fait pas partie de ses actions :

```ts
const handle = events.on("channel.moderate@1", { broadcaster_user_id: channelId, moderator_user_id: botId }, (event) => {
  if (event.action === "ban") console.log(event.ban.user_name);
});

console.log(handle.type, handle.version); // "channel.moderate" "1"
```

La version d'une notification figure aussi dans `meta.version`. La constante `EVENTSUB_VERSIONS` associe chaque nom connu à la version envoyée à Twitch :

```ts
import { EVENTSUB_VERSIONS } from "@ix-xs/twitch.api";

console.log(EVENTSUB_VERSIONS["channel.follow"]); // "2"
```

## Types plus récents que la bibliothèque

Twitch ajoute régulièrement des types d'abonnement. Pour en utiliser un que cette version ne connaît pas, écrivez sa version après un `@`. La condition est alors un simple dictionnaire de chaînes de caractères et l'événement est `unknown` : décrivez vous-même la partie que vous lisez.

```ts
// Un nom de type inventé, pour montrer la forme.
events.on("channel.new_feature.begin@1", { broadcaster_user_id: channelId }, (event, meta) => {
  const data = event as { broadcaster_user_name: string };
  console.log(meta.type, meta.version, data.broadcaster_user_name);
});
```

Un nom que la bibliothèque ne connaît pas et qui n'a pas de `@version` est une erreur de compilation. En JavaScript pur, `on()` lève une `TypeError` : `Unknown EventSub type "channel.new_feature.begin". For a type newer than this library, write "channel.new_feature.begin@<version>".`

La même forme fonctionne pour une version d'un type connu que la bibliothèque ne liste pas, ainsi que dans [eventsub.subscribe](/reference/api/eventsub/#subscribe).

## Événements livrés par lots

`drop.entitlement.grant` est le seul type que Twitch livre par lots. Son événement est un tableau, avec une entrée par droit accordé. La bibliothèque demande la livraison par lots quand elle crée l'abonnement, comme Twitch l'exige pour ce type. Il n'est livré que par webhooks et par conduits.

```ts
declare function grantReward(userId: string, benefitId: string, entitlementId: string): Promise<void>;

hooks.on("drop.entitlement.grant", { organization_id: "9001" }, async (entitlements) => {
  for (const { data } of entitlements) {
    await grantReward(data.user_id, data.benefit_id, data.entitlement_id);
  }
});
```

`meta.messageId` identifie le lot entier. Pour reconnaître un droit que vous avez déjà traité, utilisez `data.entitlement_id`.

## Typer un gestionnaire déclaré ailleurs

À l'intérieur de `on()`, les paramètres du gestionnaire sont inférés. Un gestionnaire écrit à part, dans un autre fichier par exemple, a besoin que son type soit explicité, et `EventSubHandler<T>` s'en charge :

```ts
import type { EventSubHandler } from "@ix-xs/twitch.api";

const onFollow: EventSubHandler<"channel.follow"> = async (event, meta) => {
  console.log(`${event.user_name} followed at ${event.followed_at} (${meta.messageId})`);
};

events.on("channel.follow", { broadcaster_user_id: channelId, moderator_user_id: botId }, onFollow);
```

Donnez-lui une union de noms pour écrire un seul gestionnaire pour plusieurs types. Seuls les champs que les événements ont en commun y sont disponibles :

```ts
import type { EventSubHandler } from "@ix-xs/twitch.api";

const logStream: EventSubHandler<"stream.online" | "stream.offline"> = (event, meta) => {
  console.log(`${event.broadcaster_user_name}: ${meta.type}`);
};

events.on("stream.online", { broadcaster_user_id: channelId }, logStream);
events.on("stream.offline", { broadcaster_user_id: channelId }, logStream);
```

## Voir aussi

- [Types d'événements](/reference/event-types/) : chaque type avec sa version, sa condition, son scope et son interface d'événement.
- [Recevoir des événements](/events/overview/) : `on()`, `meta` et le handle.
- [Gérer les abonnements](/events/managing-subscriptions/) : créer des abonnements à la main avec les mêmes noms de type.
