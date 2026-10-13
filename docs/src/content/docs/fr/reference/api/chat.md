---
title: twitch.chat
description: "Chat : messages, annonces, spectateurs présents, emotes, badges, réglages, couleurs, épingles et shoutouts."
sidebar:
  label: chat
---

Toutes les méthodes de `twitch.chat`, avec leurs paramètres, ce qu'elles renvoient et le jeton nécessaire.

## chatters

```ts nocheck
twitch.chat.chatters(params, options?): Paginator<Chatter>
```

Liste les utilisateurs connectés au chat d'une chaîne. Twitch actualise la liste avec un temps de retard : les arrivées et les départs récents peuvent donc manquer.

**Jeton :** application ou utilisateur, scope `moderator:read:chatters`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur dont on lit le chat. |
| `moderator_id` | `string` | Le diffuseur ou l'un de ses modérateurs. Par défaut, l'utilisateur qui fait l'appel. |
| `first` | `number` | Éléments par page, de 1 à 1000. Twitch en renvoie 100 par défaut. |
| `after` | `string` | Curseur de la page suivante. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<Chatter>`

<details>
<summary>Champs de Chatter</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | Identifiant de l'utilisateur. |
| `user_login` | `string` | Nom de connexion de l'utilisateur. |
| `user_name` | `string` | Nom d'affichage de l'utilisateur. |

</details>

### Exemple

```ts
const count = await twitch.chat.chatters({ broadcaster_id: "141981764" }).total();
for await (const chatter of twitch.chat.chatters({ broadcaster_id: "141981764" })) {
  console.log(chatter.user_login);
}
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-chatters)

## channelEmotes

```ts nocheck
twitch.chat.channelEmotes(params, options?): Promise<ChatEmoteList<ChatChannelEmote>>
```

Renvoie les emotes personnalisées d'une chaîne : emotes d'abonné, de follower et de palier de Bits.

**Jeton :** application ou utilisateur.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur dont on récupère les emotes personnalisées. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ChatEmoteList<ChatChannelEmote>>`

<details>
<summary>Champs de ChatEmoteList</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `data` | `ChatChannelEmote[]` | Les emotes. |
| `template` | `string` | URL d'image à compléter, avec les variables `&#123;&#123;id}}`, `&#123;&#123;format}}`, `&#123;&#123;theme_mode}}` et `&#123;&#123;scale}}`. Remplacez-les par les valeurs d'une emote pour obtenir son URL sur le CDN. |

</details>

### Exemple

```ts
const { data, template } = await twitch.chat.channelEmotes({ broadcaster_id: "141981764" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-channel-emotes)

## globalEmotes

```ts nocheck
twitch.chat.globalEmotes(options?): Promise<ChatEmoteList<ChatEmote>>
```

Renvoie les emotes créées par Twitch, utilisables dans tous les chats.

**Jeton :** application ou utilisateur.

### Paramètres

Cette méthode ne prend aucun paramètre propre.

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ChatEmoteList<ChatEmote>>`

<details>
<summary>Champs de ChatEmoteList</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `data` | `ChatEmote[]` | Les emotes. |
| `template` | `string` | URL d'image à compléter, avec les variables `&#123;&#123;id}}`, `&#123;&#123;format}}`, `&#123;&#123;theme_mode}}` et `&#123;&#123;scale}}`. Remplacez-les par les valeurs d'une emote pour obtenir son URL sur le CDN. |

</details>

### Exemple

```ts
const { data, template } = await twitch.chat.globalEmotes();
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-global-emotes)

## emoteSets

```ts nocheck
twitch.chat.emoteSets(params, options?): Promise<ChatEmoteList<ChatSetEmote>>
```

Renvoie les emotes d'un ou de plusieurs ensembles d'emotes. Les ensembles qui n'existent pas sont absents du résultat.

**Jeton :** application ou utilisateur.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `emote_set_id` <small>requis</small> | `string \| readonly string[]` | Identifiants des ensembles d'emotes à récupérer. Autant que vous voulez : les longues listes sont découpées pour vous. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ChatEmoteList<ChatSetEmote>>`

<details>
<summary>Champs de ChatEmoteList</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `data` | `ChatSetEmote[]` | Les emotes. |
| `template` | `string` | URL d'image à compléter, avec les variables `&#123;&#123;id}}`, `&#123;&#123;format}}`, `&#123;&#123;theme_mode}}` et `&#123;&#123;scale}}`. Remplacez-les par les valeurs d'une emote pour obtenir son URL sur le CDN. |

</details>

### Exemple

```ts
const { data, template } = await twitch.chat.emoteSets({ emote_set_id: ["301590448", "318939165"] });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-emote-sets)

## channelBadges

```ts nocheck
twitch.chat.channelBadges(params, options?): Promise<ChatBadgeSet[]>
```

Renvoie les badges de chat personnalisés d'une chaîne, comme ses badges d'abonné et de Bits. La liste est vide quand la chaîne n'en a aucun.

**Jeton :** application ou utilisateur.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur dont on récupère les badges personnalisés. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ChatBadgeSet[]>`

<details>
<summary>Champs de ChatBadgeSet</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `set_id` | `string` | Identifiant de l'ensemble. |
| `versions` | `ChatBadgeVersion[]` | Badges de l'ensemble, triés par identifiant. |

</details>

### Exemple

```ts
const sets = await twitch.chat.channelBadges({ broadcaster_id: "141981764" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-channel-chat-badges)

## globalBadges

```ts nocheck
twitch.chat.globalBadges(options?): Promise<ChatBadgeSet[]>
```

Renvoie les badges de chat créés par Twitch, qui peuvent apparaître dans tous les chats.

**Jeton :** application ou utilisateur.

### Paramètres

Cette méthode ne prend aucun paramètre propre.

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ChatBadgeSet[]>`

<details>
<summary>Champs de ChatBadgeSet</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `set_id` | `string` | Identifiant de l'ensemble. |
| `versions` | `ChatBadgeVersion[]` | Badges de l'ensemble, triés par identifiant. |

</details>

### Exemple

```ts
const sets = await twitch.chat.globalBadges();
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-global-chat-badges)

## settings

```ts nocheck
twitch.chat.settings(params, options?): Promise<ChatSettings>
```

Renvoie les réglages du chat d'une chaîne. Les réglages du délai du chat ne sont inclus que si `moderator_id` est fourni et que l'appel est fait au nom de cet utilisateur avec le scope `moderator:read:chat_settings`.

**Jeton :** application ou utilisateur.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur dont on récupère les réglages du chat. |
| `moderator_id` | `string` | Le diffuseur ou l'un de ses modérateurs. Nécessaire uniquement pour lire les réglages du délai du chat, et l'appel doit alors être fait avec le jeton de cet utilisateur. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ChatSettings>`

<details>
<summary>Champs de ChatSettings</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Identifiant du diffuseur. |
| `emote_mode` | `boolean` | Indique si les messages ne peuvent contenir que des emotes. |
| `follower_mode` | `boolean` | Indique si seuls les followers peuvent écrire dans le chat. |
| `follower_mode_duration` | `number \| null` | Nombre de minutes pendant lesquelles un utilisateur doit avoir suivi la chaîne avant de pouvoir écrire dans le chat. `null` quand `follower_mode` est désactivé. |
| `moderator_id` | `string` | Identifiant du modérateur pour lequel l'appel a été fait. Présent uniquement avec un jeton utilisateur qui a le scope `moderator:read:chat_settings`. |
| `non_moderator_chat_delay` | `boolean` | Indique si les messages sont retenus un instant pour que les modérateurs puissent les retirer avant leur affichage. Présent uniquement quand l'appel désigne un modérateur et utilise son jeton avec le scope `moderator:read:chat_settings`. |
| `non_moderator_chat_delay_duration` | `number` | Durée de ce délai, en secondes. `null` quand le délai est désactivé. Présent dans les mêmes conditions. |
| `slow_mode` | `boolean` | Indique si les utilisateurs doivent attendre entre deux messages. |
| `slow_mode_wait_time` | `number \| null` | Nombre de secondes qu'un utilisateur doit attendre entre deux messages. `null` quand `slow_mode` est désactivé. |
| `subscriber_mode` | `boolean` | Indique si seuls les abonnés peuvent écrire dans le chat. |
| `unique_chat_mode` | `boolean` | Indique s'il est interdit à un utilisateur d'envoyer deux fois le même message. |

</details>

### Exemple

```ts
const settings = await twitch.chat.settings({ broadcaster_id: "141981764" });
if (settings.slow_mode) console.log(settings.slow_mode_wait_time);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-chat-settings)

## sharedSession

```ts nocheck
twitch.chat.sharedSession(params, options?): Promise<SharedChatSession | null>
```

Renvoie la session de chat partagé à laquelle une chaîne participe, ou `null` quand elle ne participe à aucune.

**Jeton :** application ou utilisateur.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur dont on récupère la session de chat partagé. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<SharedChatSession \| null>`

<details>
<summary>Champs de SharedChatSession</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `session_id` | `string` | Identifiant de la session. |
| `host_broadcaster_id` | `string` | Identifiant du diffuseur qui héberge la session. |
| `participants` | `SharedChatParticipant[]` | Chaînes qui participent à la session, hôte compris. |
| `created_at` | `string` | Moment où la session a commencé, sous forme d'horodatage RFC 3339. |
| `updated_at` | `string` | Moment de la dernière modification de la session, sous forme d'horodatage RFC 3339. |

</details>

### Exemple

```ts
const session = await twitch.chat.sharedSession({ broadcaster_id: "141981764" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-shared-chat-session)

## userEmotes

```ts nocheck
twitch.chat.userEmotes(params?, options?): Paginator<ChatUserEmote, ChatUserEmotePage>
```

Liste toutes les emotes qu'un utilisateur peut envoyer, toutes chaînes confondues. Le modèle d'URL accompagne chaque page, dans `page.raw.template`.

**Jeton :** utilisateur, scope `user:read:emotes`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | Utilisateur dont on liste les emotes. Par défaut, l'utilisateur qui fait l'appel. |
| `broadcaster_id` | `string` | Garantit que les emotes de follower de ce diffuseur figurent dans le résultat. |
| `after` | `string` | Curseur de la page suivante. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Paginator<ChatUserEmote, ChatUserEmotePage>`

<details>
<summary>Champs de ChatUserEmote</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifiant de l'emote. |
| `name` | `string` | Nom de l'emote, c'est-à-dire ce que l'utilisateur saisit dans le chat pour l'envoyer. Sensible à la casse. |
| `emote_type` | `ChatUserEmoteType` | Façon dont l'utilisateur a obtenu l'emote. |
| `emote_set_id` | `string` | Identifiant de l'ensemble d'emotes auquel l'emote appartient. Une chaîne vide quand elle n'appartient à aucun. |
| `owner_id` | `string` | Identifiant du diffuseur à qui appartient l'emote. Une chaîne vide quand elle n'a pas de propriétaire. |
| `format` | `ChatEmoteFormat[]` | Formats dans lesquels l'emote existe. |
| `scale` | `ChatEmoteScale[]` | Tailles dans lesquelles l'emote existe. |
| `theme_mode` | `ChatEmoteThemeMode[]` | Fonds pour lesquels l'emote existe. |

</details>

### Exemple

```ts
const page = await twitch.chat.userEmotes();
console.log(page.data.length, page.raw.template);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-user-emotes)

## updateSettings

```ts nocheck
twitch.chat.updateSettings(params, options?): Promise<ChatSettings>
```

Modifie les réglages du chat d'une chaîne et renvoie les nouveaux. Pour régler une durée, envoyez son mode à `true` dans le même appel, même si ce mode est déjà actif.

**Jeton :** application ou utilisateur, scope `moderator:manage:chat_settings`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur dont on modifie les réglages du chat. |
| `moderator_id` | `string` | Le diffuseur ou l'un de ses modérateurs. Par défaut, l'utilisateur qui fait l'appel. |
| `emote_mode` | `boolean` | Indique si les messages ne peuvent contenir que des emotes. |
| `follower_mode` | `boolean` | Indique si seuls les followers peuvent écrire dans le chat. |
| `follower_mode_duration` | `number` | Nombre de minutes pendant lesquelles un utilisateur doit avoir suivi la chaîne avant de pouvoir écrire dans le chat, de 0 à 129600. À envoyer avec `follower_mode: true`. |
| `non_moderator_chat_delay` | `boolean` | Indique si les messages sont retenus un instant pour que les modérateurs puissent les retirer avant leur affichage. |
| `non_moderator_chat_delay_duration` | `2 \| 4 \| 6` | Durée de ce délai, en secondes. À envoyer avec `non_moderator_chat_delay: true`. |
| `slow_mode` | `boolean` | Indique si les utilisateurs doivent attendre entre deux messages. |
| `slow_mode_wait_time` | `number` | Nombre de secondes qu'un utilisateur doit attendre entre deux messages, de 3 à 120. À envoyer avec `slow_mode: true`. |
| `subscriber_mode` | `boolean` | Indique si seuls les abonnés peuvent écrire dans le chat. |
| `unique_chat_mode` | `boolean` | Indique s'il est interdit à un utilisateur d'envoyer deux fois le même message. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<ChatSettings>`

<details>
<summary>Champs de ChatSettings</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` | `string` | Identifiant du diffuseur. |
| `emote_mode` | `boolean` | Indique si les messages ne peuvent contenir que des emotes. |
| `follower_mode` | `boolean` | Indique si seuls les followers peuvent écrire dans le chat. |
| `follower_mode_duration` | `number \| null` | Nombre de minutes pendant lesquelles un utilisateur doit avoir suivi la chaîne avant de pouvoir écrire dans le chat. `null` quand `follower_mode` est désactivé. |
| `moderator_id` | `string` | Identifiant du modérateur pour lequel l'appel a été fait. Présent uniquement avec un jeton utilisateur qui a le scope `moderator:read:chat_settings`. |
| `non_moderator_chat_delay` | `boolean` | Indique si les messages sont retenus un instant pour que les modérateurs puissent les retirer avant leur affichage. Présent uniquement quand l'appel désigne un modérateur et utilise son jeton avec le scope `moderator:read:chat_settings`. |
| `non_moderator_chat_delay_duration` | `number` | Durée de ce délai, en secondes. `null` quand le délai est désactivé. Présent dans les mêmes conditions. |
| `slow_mode` | `boolean` | Indique si les utilisateurs doivent attendre entre deux messages. |
| `slow_mode_wait_time` | `number \| null` | Nombre de secondes qu'un utilisateur doit attendre entre deux messages. `null` quand `slow_mode` est désactivé. |
| `subscriber_mode` | `boolean` | Indique si seuls les abonnés peuvent écrire dans le chat. |
| `unique_chat_mode` | `boolean` | Indique s'il est interdit à un utilisateur d'envoyer deux fois le même message. |

</details>

### Exemple

```ts
await twitch.chat.updateSettings({ broadcaster_id: "141981764", slow_mode: true, slow_mode_wait_time: 10 });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#update-chat-settings)

## announce

```ts nocheck
twitch.chat.announce(params, options?): Promise<void>
```

Publie une annonce mise en avant dans le chat d'une chaîne. Limité à une annonce toutes les 2 secondes.

**Jeton :** application ou utilisateur, scope `moderator:manage:announcements`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur dont le chat reçoit l'annonce. |
| `moderator_id` | `string` | Le diffuseur ou l'un de ses modérateurs. Par défaut, l'utilisateur qui fait l'appel. |
| `message` <small>requis</small> | `string` | Texte de l'annonce. Tout ce qui dépasse 500 caractères est coupé. |
| `color` | `ChatAnnouncementColor` | Couleur de mise en avant. Twitch prend `"primary"` par défaut. |
| `for_source_only` | `boolean` | Pendant une session de chat partagé, indique si seule cette chaîne reçoit l'annonce. Réservé aux jetons d'application, où la valeur par défaut est `true`. Twitch le refuse avec un jeton utilisateur. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.chat.announce({ broadcaster_id: "141981764", message: "Giveaway in 5 minutes", color: "purple" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#send-chat-announcement)

## shoutout

```ts nocheck
twitch.chat.shoutout(params, options?): Promise<void>
```

Fait un shoutout à un autre diffuseur, ce qui affiche sa chaîne dans le chat avec un bouton pour la suivre. La chaîne qui fait le shoutout doit être en direct. Limité à un shoutout toutes les 2 minutes, et à un par heure pour un même diffuseur.

**Jeton :** application ou utilisateur, scope `moderator:manage:shoutouts`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `from_broadcaster_id` <small>requis</small> | `string` | Diffuseur qui fait le shoutout. |
| `to_broadcaster_id` <small>requis</small> | `string` | Diffuseur qui reçoit le shoutout. |
| `moderator_id` | `string` | Le diffuseur qui fait le shoutout ou l'un de ses modérateurs. Par défaut, l'utilisateur qui fait l'appel. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.chat.shoutout({ from_broadcaster_id: "141981764", to_broadcaster_id: "12826" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#send-a-shoutout)

## send

```ts nocheck
twitch.chat.send(params, options?): Promise<SentChatMessage>
```

Envoie un message dans le chat d'une chaîne. Vérifiez `is_sent` dans le résultat : un message que Twitch refuse revient avec un `drop_reason` au lieu d'une erreur.

**Jeton :** application ou utilisateur, scope `user:write:chat`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur dont le chat reçoit le message. |
| `sender_id` | `string` | Utilisateur qui envoie le message. Par défaut, l'utilisateur qui fait l'appel. |
| `message` <small>requis</small> | `string` | Texte du message, 500 caractères au plus. Les noms d'emotes sont convertis en emotes. |
| `reply_parent_message_id` | `string` | Identifiant du message auquel celui-ci répond. |
| `for_source_only` | `boolean` | Pendant une session de chat partagé, indique si seule cette chaîne reçoit le message. Réservé aux jetons d'application. Twitch le refuse avec un jeton utilisateur. |
| `pin` | `boolean` | Épingle le message pendant 20 minutes dès son envoi. L'expéditeur doit être le diffuseur ou un modérateur, et il lui faut aussi le scope `moderator:manage:chat_messages`. Incompatible avec `reply_parent_message_id` et `for_source_only`. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<SentChatMessage>`

<details>
<summary>Champs de SentChatMessage</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `message_id` | `string` | Identifiant du message. |
| `is_sent` | `boolean` | Indique si le message a passé tous les contrôles et atteint le chat. |
| `drop_reason` | `ChatMessageDropReason` | Raison pour laquelle le message n'a pas été remis. Absent ou `null` quand il l'a été. |

</details>

### Exemple

```ts
const sent = await twitch.chat.send({ broadcaster_id: "141981764", message: "Hello chat" });
if (!sent.is_sent) console.log(sent.drop_reason?.message);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#send-chat-message)

## pinnedMessage

```ts nocheck
twitch.chat.pinnedMessage(params, options?): Promise<PinnedChatMessage | null>
```

Renvoie le message épinglé dans le chat d'une chaîne, ou `null` quand rien n'est épinglé.

**Jeton :** application ou utilisateur, scope `moderator:manage:chat_messages` ou `moderator:read:chat_messages`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur à qui appartient le chat. |
| `moderator_id` | `string` | Le diffuseur ou l'un de ses modérateurs. Par défaut, l'utilisateur qui fait l'appel. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<PinnedChatMessage \| null>`

<details>
<summary>Champs de PinnedChatMessage</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `message_id` | `string` | Identifiant du message épinglé. |
| `broadcaster_id` | `string` | Identifiant du diffuseur à qui appartient le chat. |
| `sender_user_id` | `string` | Identifiant de l'utilisateur qui a écrit le message. |
| `sender_user_login` | `string` | Nom de connexion de l'utilisateur qui a écrit le message. |
| `sender_user_name` | `string` | Nom d'affichage de l'utilisateur qui a écrit le message. |
| `pinned_by_user_id` | `string` | Identifiant de l'utilisateur qui a épinglé le message. |
| `pinned_by_user_login` | `string` | Nom de connexion de l'utilisateur qui a épinglé le message. |
| `pinned_by_user_name` | `string` | Nom d'affichage de l'utilisateur qui a épinglé le message. |
| `message` | `{ text: string; fragments: PinnedChatMessageFragment[]; }` | Contenu du message. |
| `starts_at` | `string` | Moment où le message a été épinglé, sous forme d'horodatage RFC 3339. |
| `ends_at` | `string \| null` | Moment où l'épingle expire, sous forme d'horodatage RFC 3339. `null` quand elle dure jusqu'à la fin du stream. |
| `updated_at` | `string` | Moment de la dernière modification de l'épingle, sous forme d'horodatage RFC 3339. |

</details>

### Exemple

```ts
const pinned = await twitch.chat.pinnedMessage({ broadcaster_id: "141981764" });
if (pinned) console.log(pinned.message.text);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-pinned-chat-message)

## pin

```ts nocheck
twitch.chat.pin(params, options?): Promise<void>
```

Épingle un message en haut du chat d'une chaîne. Un chat n'a qu'un seul message épinglé : le nouveau remplace donc celui qui était en place.

**Jeton :** application ou utilisateur, scope `moderator:manage:chat_messages`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur à qui appartient le chat. |
| `moderator_id` | `string` | Le diffuseur ou l'un de ses modérateurs. Par défaut, l'utilisateur qui fait l'appel. |
| `message_id` <small>requis</small> | `string` | Identifiant du message à épingler. |
| `duration_seconds` | `number` | Nombre de secondes pendant lesquelles le message reste épinglé, de 30 à 1800. Sans cette valeur, l'épingle dure jusqu'à la fin du stream. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.chat.pin({ broadcaster_id: "141981764", message_id: sent.message_id, duration_seconds: 300 });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#pin-chat-message)

## updatePin

```ts nocheck
twitch.chat.updatePin(params, options?): Promise<void>
```

Modifie la durée pendant laquelle un message épinglé le reste. La nouvelle durée court à partir du moment de l'appel.

**Jeton :** application ou utilisateur, scope `moderator:manage:chat_messages`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur à qui appartient le chat. |
| `moderator_id` | `string` | Le diffuseur ou l'un de ses modérateurs. Par défaut, l'utilisateur qui fait l'appel. |
| `message_id` <small>requis</small> | `string` | Identifiant du message épinglé. |
| `duration_seconds` | `number` | Nombre de secondes pendant lesquelles le message reste épinglé à compter de maintenant, de 30 à 1800. Sans cette valeur, l'épingle dure jusqu'à la fin du stream. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.chat.updatePin({ broadcaster_id: "141981764", message_id: pinned.message_id, duration_seconds: 600 });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#update-pinned-chat-message)

## unpin

```ts nocheck
twitch.chat.unpin(params, options?): Promise<void>
```

Retire un message épinglé du haut du chat d'une chaîne.

**Jeton :** application ou utilisateur, scope `moderator:manage:chat_messages`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_id` <small>requis</small> | `string` | Diffuseur à qui appartient le chat. |
| `moderator_id` | `string` | Le diffuseur ou l'un de ses modérateurs. Par défaut, l'utilisateur qui fait l'appel. |
| `message_id` <small>requis</small> | `string` | Identifiant du message à désépingler. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.chat.unpin({ broadcaster_id: "141981764", message_id: pinned.message_id });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#unpin-chat-message)

## colors

```ts nocheck
twitch.chat.colors(params, options?): Promise<UserChatColor[]>
```

Renvoie la couleur du nom des utilisateurs dans le chat. Les utilisateurs qui n'existent pas sont absents du résultat.

**Jeton :** application ou utilisateur.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` <small>requis</small> | `string \| readonly string[]` | Identifiants des utilisateurs à rechercher. Autant que vous voulez : les longues listes sont découpées pour vous. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<UserChatColor[]>`

<details>
<summary>Champs de UserChatColor</summary>

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | Identifiant de l'utilisateur. |
| `user_login` | `string` | Nom de connexion de l'utilisateur. |
| `user_name` | `string` | Nom d'affichage de l'utilisateur. |
| `color` | `string` | Code hexadécimal de la couleur, par exemple `"#9146FF"`. Une chaîne vide quand l'utilisateur n'en a jamais choisi. |

</details>

### Exemple

```ts
const [entry] = await twitch.chat.colors({ user_id: "141981764" });
console.log(entry?.color);
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#get-user-chat-color)

## setColor

```ts nocheck
twitch.chat.setColor(params, options?): Promise<void>
```

Modifie la couleur du nom d'un utilisateur dans le chat. Les codes hexadécimaux sont réservés aux utilisateurs Turbo et Prime, les autres choisissent une couleur nommée.

**Jeton :** utilisateur, scope `user:manage:chat_color`.

### Paramètres

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` | `string` | Utilisateur dont on modifie la couleur. Par défaut, l'utilisateur qui fait l'appel. |
| `color` <small>requis</small> | `ChatColorName \| (string & {})` | Une couleur nommée, ou un code hexadécimal tel que `"#9146FF"` pour les utilisateurs Turbo et Prime. |

`options` : Options de requête pour cet appel : `as`, `token`, `signal`, `timeout`, `retries`.

### Renvoie

`Promise<void>`

### Exemple

```ts
await twitch.chat.setColor({ color: "blue_violet" });
await twitch.chat.setColor({ color: "#9146FF" });
```

[Référence Twitch](https://dev.twitch.tv/docs/api/reference/#update-user-chat-color)
