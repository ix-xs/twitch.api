---
title: Types d'événements
description: "Tous les types d'abonnement EventSub connus de la bibliothèque, avec leur version, leur condition et le scope nécessaire."
---

Le nom s'autocomplète dans `on()` et `subscribe()`, et la condition comme l'événement sont typés à partir de lui. Un type qui existe en plusieurs versions figure sous son nom simple pour la plus récente et sous `nom@version` pour les anciennes.

## Tous les types

| Type | Version | Se déclenche quand |
| --- | --- | --- |
| [`automod.message.hold`](#automodmessagehold) | 2 | AutoMod a retenu un message pour examen. Seuls les termes bloqués publics le déclenchent, pas les termes privés. |
| [`automod.message.hold@1`](#automodmessagehold1) | 1 | AutoMod a retenu un message pour examen (ancien format, sans la raison). |
| [`automod.message.update`](#automodmessageupdate) | 2 | Un message en attente dans la file d'AutoMod a été approuvé ou refusé, ou a expiré. Seuls les termes bloqués publics le déclenchent, pas les termes privés. |
| [`automod.message.update@1`](#automodmessageupdate1) | 1 | Un message en attente dans la file d'AutoMod a été approuvé ou refusé, ou a expiré (ancien format, sans la raison). |
| [`automod.settings.update`](#automodsettingsupdate) | 1 | Les réglages AutoMod de la chaîne ont changé. |
| [`automod.terms.update`](#automodtermsupdate) | 1 | Les termes autorisés ou bloqués de la chaîne ont changé. Les changements de termes privés ne sont pas envoyés. |
| [`channel.ad_break.begin`](#channelad_breakbegin) | 1 | Une coupure publicitaire mid-roll a commencé, lancée à la main ou programmée par Ads Manager. |
| [`channel.ban`](#channelban) | 1 | Un spectateur a été banni ou mis sous timeout sur la chaîne. |
| [`channel.bits.use`](#channelbitsuse) | 1 | Des Bits ont été utilisés sur la chaîne, par un cheer ou un Power-up. Les Bits dépensés dans les extensions ne sont pas compris. |
| [`channel.channel_points_automatic_reward_redemption.add`](#channelchannel_points_automatic_reward_redemptionadd) | 2 | Un spectateur a utilisé une récompense automatique de points de chaîne (version 2, message découpé en fragments). |
| [`channel.channel_points_automatic_reward_redemption.add@1`](#channelchannel_points_automatic_reward_redemptionadd1) | 1 | Un spectateur a utilisé une récompense automatique de points de chaîne (version 1, message avec la position des emotes). |
| [`channel.channel_points_custom_reward_redemption.add`](#channelchannel_points_custom_reward_redemptionadd) | 1 | Un spectateur a utilisé une récompense personnalisée de points de chaîne. |
| [`channel.channel_points_custom_reward_redemption.update`](#channelchannel_points_custom_reward_redemptionupdate) | 1 | Une utilisation d'une récompense personnalisée de points de chaîne a été honorée ou annulée. |
| [`channel.channel_points_custom_reward.add`](#channelchannel_points_custom_rewardadd) | 1 | Le diffuseur a créé une récompense personnalisée de points de chaîne. |
| [`channel.channel_points_custom_reward.remove`](#channelchannel_points_custom_rewardremove) | 1 | Une récompense personnalisée de points de chaîne a été supprimée. |
| [`channel.channel_points_custom_reward.update`](#channelchannel_points_custom_rewardupdate) | 1 | Une récompense personnalisée de points de chaîne a été modifiée. |
| [`channel.charity_campaign.donate`](#channelcharity_campaigndonate) | 1 | Un spectateur a fait un don à la collecte caritative du diffuseur. |
| [`channel.charity_campaign.progress`](#channelcharity_campaignprogress) | 1 | Une collecte caritative a progressé vers son objectif, ou le diffuseur a modifié cet objectif. |
| [`channel.charity_campaign.start`](#channelcharity_campaignstart) | 1 | Le diffuseur a lancé une collecte caritative. Peut arriver après le premier événement de progression. |
| [`channel.charity_campaign.stop`](#channelcharity_campaignstop) | 1 | Le diffuseur a arrêté une collecte caritative. |
| [`channel.chat_settings.update`](#channelchat_settingsupdate) | 1 | Les réglages du chat de la chaîne ont changé (mode emotes seules, followers, lent, abonnés ou messages uniques). |
| [`channel.chat.clear`](#channelchatclear) | 1 | Un modérateur ou un bot a effacé tous les messages du chat. |
| [`channel.chat.clear_user_messages`](#channelchatclear_user_messages) | 1 | Un modérateur ou un bot a effacé tous les messages d'un utilisateur, après un bannissement ou un timeout. |
| [`channel.chat.message`](#channelchatmessage) | 1 | Un utilisateur a envoyé un message dans le chat. |
| [`channel.chat.message_delete`](#channelchatmessage_delete) | 1 | Un modérateur a supprimé un message du chat. |
| [`channel.chat.notification`](#channelchatnotification) | 1 | Il s'est produit quelque chose que le chat affiche comme une notification, par exemple un abonnement, un abonnement offert, un raid ou une annonce. |
| [`channel.chat.user_message_hold`](#channelchatuser_message_hold) | 1 | Un message de l'utilisateur indiqué dans `user_id` a été retenu par AutoMod. |
| [`channel.chat.user_message_update`](#channelchatuser_message_update) | 1 | Le statut AutoMod d'un message retenu de l'utilisateur indiqué dans `user_id` a changé. |
| [`channel.cheer`](#channelcheer) | 1 | Un utilisateur a envoyé un cheer en Bits sur la chaîne. |
| [`channel.custom_power_up_redemption.add`](#channelcustom_power_up_redemptionadd) | 1 | Un spectateur a utilisé un Power-up personnalisé. |
| [`channel.follow`](#channelfollow) | 2 | Quelqu'un s'est mis à suivre la chaîne. |
| [`channel.goal.begin`](#channelgoalbegin) | 1 | Le diffuseur a lancé un objectif de créateur. Peut arriver après les premiers événements de progression. |
| [`channel.goal.end`](#channelgoalend) | 1 | Le diffuseur a mis fin à un objectif de créateur. |
| [`channel.goal.progress`](#channelgoalprogress) | 1 | Un objectif de créateur a progressé ou reculé. |
| [`channel.guest_star_guest.update`](#channelguest_star_guestupdate) | beta | Un invité ou un emplacement a changé dans une session Guest Star en cours. |
| [`channel.guest_star_session.begin`](#channelguest_star_sessionbegin) | beta | L'hôte a lancé une session Guest Star. |
| [`channel.guest_star_session.end`](#channelguest_star_sessionend) | beta | Une session Guest Star s'est terminée, fermée par l'hôte ou par Twitch. |
| [`channel.guest_star_settings.update`](#channelguest_star_settingsupdate) | beta | L'hôte a changé les préférences Guest Star de la chaîne. |
| [`channel.hype_train.begin`](#channelhype_trainbegin) | 2 | Un Hype Train a démarré sur la chaîne. Les premiers événements de progression peuvent arriver avant celui-ci. |
| [`channel.hype_train.end`](#channelhype_trainend) | 2 | Un Hype Train s'est terminé sur la chaîne. |
| [`channel.hype_train.progress`](#channelhype_trainprogress) | 2 | Une contribution a fait avancer un Hype Train en cours. |
| [`channel.moderate`](#channelmoderate) | 2 | Un modérateur a effectué une action de modération sur la chaîne, avertissements compris. Affinez l'événement sur `action` pour lire les détails correspondants. |
| [`channel.moderate@1`](#channelmoderate1) | 1 | Un modérateur a effectué une action de modération sur la chaîne. La version 1 ne signale pas les avertissements. Affinez l'événement sur `action` pour lire les détails correspondants. |
| [`channel.moderator.add`](#channelmoderatoradd) | 1 | Un utilisateur est devenu modérateur de la chaîne. |
| [`channel.moderator.remove`](#channelmoderatorremove) | 1 | Un utilisateur a perdu le statut de modérateur sur la chaîne. |
| [`channel.poll.begin`](#channelpollbegin) | 1 | Un sondage a démarré sur la chaîne. |
| [`channel.poll.end`](#channelpollend) | 1 | Un sondage s'est terminé sur la chaîne. |
| [`channel.poll.progress`](#channelpollprogress) | 1 | Des spectateurs ont voté dans un sondage en cours. |
| [`channel.prediction.begin`](#channelpredictionbegin) | 1 | Une prédiction a démarré sur la chaîne. |
| [`channel.prediction.end`](#channelpredictionend) | 1 | Une prédiction s'est terminée, résolue ou annulée. |
| [`channel.prediction.lock`](#channelpredictionlock) | 1 | Les paris d'une prédiction ont été clos. |
| [`channel.prediction.progress`](#channelpredictionprogress) | 1 | Des spectateurs ont parié sur une prédiction en cours. |
| [`channel.raid`](#channelraid) | 1 | Un diffuseur a lancé un raid sur une autre chaîne. |
| [`channel.shared_chat.begin`](#channelshared_chatbegin) | 1 | La chaîne est devenue active dans une session de chat partagé. |
| [`channel.shared_chat.end`](#channelshared_chatend) | 1 | La chaîne a quitté une session de chat partagé, ou la session s'est terminée. |
| [`channel.shared_chat.update`](#channelshared_chatupdate) | 1 | La session de chat partagé à laquelle la chaîne participe a changé, par exemple ses participants. |
| [`channel.shield_mode.begin`](#channelshield_modebegin) | 1 | Le Shield Mode a été activé sur la chaîne. |
| [`channel.shield_mode.end`](#channelshield_modeend) | 1 | Le Shield Mode a été désactivé sur la chaîne. |
| [`channel.shoutout.create`](#channelshoutoutcreate) | 1 | Le diffuseur a envoyé un shoutout à une autre chaîne. |
| [`channel.shoutout.receive`](#channelshoutoutreceive) | 1 | Le diffuseur a reçu un shoutout d'une autre chaîne. Ne se déclenche que lorsque Twitch publie le shoutout dans le fil d'activité du diffuseur. |
| [`channel.subscribe`](#channelsubscribe) | 1 | Un utilisateur s'est abonné à la chaîne. Les réabonnements ne sont pas compris. |
| [`channel.subscription.end`](#channelsubscriptionend) | 1 | Un abonnement à la chaîne a pris fin. |
| [`channel.subscription.gift`](#channelsubscriptiongift) | 1 | Un spectateur a offert un ou plusieurs abonnements sur la chaîne. |
| [`channel.subscription.message`](#channelsubscriptionmessage) | 1 | Un abonné a partagé un message de réabonnement dans le chat. |
| [`channel.suspicious_user.message`](#channelsuspicious_usermessage) | 1 | Un utilisateur signalé comme suspect a envoyé un message dans le chat. |
| [`channel.suspicious_user.update`](#channelsuspicious_userupdate) | 1 | Un modérateur a changé le traitement appliqué à un utilisateur suspect. |
| [`channel.unban`](#channelunban) | 1 | Un spectateur a été débanni sur la chaîne. |
| [`channel.unban_request.create`](#channelunban_requestcreate) | 1 | Un utilisateur banni a déposé une demande de débannissement. |
| [`channel.unban_request.resolve`](#channelunban_requestresolve) | 1 | Une demande de débannissement a été approuvée, refusée ou annulée. |
| [`channel.update`](#channelupdate) | 2 | Le diffuseur a changé le titre, la catégorie, la langue ou les étiquettes de classification du contenu de la chaîne. |
| [`channel.vip.add`](#channelvipadd) | 1 | Un utilisateur est devenu VIP de la chaîne. |
| [`channel.vip.remove`](#channelvipremove) | 1 | Un utilisateur a perdu le statut VIP sur la chaîne. |
| [`channel.warning.acknowledge`](#channelwarningacknowledge) | 1 | Un utilisateur a pris acte d'un avertissement reçu sur la chaîne. |
| [`channel.warning.send`](#channelwarningsend) | 1 | Un avertissement a été envoyé à un utilisateur sur la chaîne. |
| [`conduit.shard.disabled`](#conduitsharddisabled) | 1 | EventSub a désactivé un shard de conduit parce que l'état de son transport a changé. |
| [`drop.entitlement.grant`](#dropentitlementgrant) | 1 | Des spectateurs ont reçu des droits liés aux Drops. Livré par lots : l'événement est un tableau de droits, et l'abonnement doit être créé avec la livraison par lots activée. Webhooks et conduits uniquement. |
| [`extension.bits_transaction.create`](#extensionbits_transactioncreate) | 1 | Une transaction en Bits a eu lieu dans une extension. Webhooks et conduits uniquement. |
| [`stream.offline`](#streamoffline) | 1 | Le diffuseur a arrêté de diffuser. |
| [`stream.online`](#streamonline) | 1 | Le diffuseur a lancé un stream. |
| [`user.authorization.grant`](#userauthorizationgrant) | 1 | Un utilisateur a autorisé l'application. Webhooks et conduits uniquement. |
| [`user.authorization.revoke`](#userauthorizationrevoke) | 1 | L'application a perdu l'autorisation d'un utilisateur. Webhooks et conduits uniquement. |
| [`user.update`](#userupdate) | 1 | Un utilisateur a modifié son compte (nom, description, e-mail...). |
| [`user.whisper.message`](#userwhispermessage) | 1 | L'utilisateur a reçu un chuchotement. |

## automod.message.hold

AutoMod a retenu un message pour examen. Seuls les termes bloqués publics le déclenchent, pas les termes privés.

**Scope :** `moderator:manage:automod`, accordé par le modérateur indiqué dans `moderator_user_id`, qui doit être le diffuseur ou l'un de ses modérateurs.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont la chaîne est surveillée. |
| `moderator_user_id` <small>requis</small> | `string` | Identifiant du modérateur qui s'abonne. Ce doit être l'utilisateur du jeton d'accès. |

**Événement :** `AutomodMessageHoldEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#automodmessagehold-v2)

## automod.message.hold@1

AutoMod a retenu un message pour examen (ancien format, sans la raison).

**Scope :** `moderator:manage:automod`, accordé par le modérateur indiqué dans `moderator_user_id`, qui doit être le diffuseur ou l'un de ses modérateurs.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont la chaîne est surveillée. |
| `moderator_user_id` <small>requis</small> | `string` | Identifiant du modérateur qui s'abonne. Ce doit être l'utilisateur du jeton d'accès. |

**Événement :** `AutomodMessageHoldV1Event`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#automodmessagehold)

## automod.message.update

Un message en attente dans la file d'AutoMod a été approuvé ou refusé, ou a expiré. Seuls les termes bloqués publics le déclenchent, pas les termes privés.

**Scope :** `moderator:manage:automod`, accordé par le modérateur indiqué dans `moderator_user_id`, qui doit être le diffuseur ou l'un de ses modérateurs.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont la chaîne est surveillée. |
| `moderator_user_id` <small>requis</small> | `string` | Identifiant du modérateur qui s'abonne. Ce doit être l'utilisateur du jeton d'accès. |

**Événement :** `AutomodMessageUpdateEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#automodmessageupdate-v2)

## automod.message.update@1

Un message en attente dans la file d'AutoMod a été approuvé ou refusé, ou a expiré (ancien format, sans la raison).

**Scope :** `moderator:manage:automod`, accordé par le modérateur indiqué dans `moderator_user_id`, qui doit être le diffuseur ou l'un de ses modérateurs.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont la chaîne est surveillée. |
| `moderator_user_id` <small>requis</small> | `string` | Identifiant du modérateur qui s'abonne. Ce doit être l'utilisateur du jeton d'accès. |

**Événement :** `AutomodMessageUpdateV1Event`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#automodmessageupdate)

## automod.settings.update

Les réglages AutoMod de la chaîne ont changé.

**Scope :** `moderator:read:automod_settings`, accordé par le modérateur indiqué dans `moderator_user_id`, qui doit être le diffuseur ou l'un de ses modérateurs.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont la chaîne est surveillée. |
| `moderator_user_id` <small>requis</small> | `string` | Identifiant du modérateur qui s'abonne. Ce doit être l'utilisateur du jeton d'accès. |

**Événement :** `AutomodSettingsUpdateEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#automodsettingsupdate)

## automod.terms.update

Les termes autorisés ou bloqués de la chaîne ont changé. Les changements de termes privés ne sont pas envoyés.

**Scope :** `moderator:manage:automod`, accordé par le modérateur indiqué dans `moderator_user_id`, qui doit être le diffuseur ou l'un de ses modérateurs.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont la chaîne est surveillée. |
| `moderator_user_id` <small>requis</small> | `string` | Identifiant du modérateur qui s'abonne. Ce doit être l'utilisateur du jeton d'accès. |

**Événement :** `AutomodTermsUpdateEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#automodtermsupdate)

## channel.ad_break.begin

Une coupure publicitaire mid-roll a commencé, lancée à la main ou programmée par Ads Manager.

**Scope :** `channel:read:ads`, accordé par le diffuseur.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont on surveille les coupures publicitaires. |

**Événement :** `ChannelAdBreakBeginEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelad_breakbegin)

## channel.ban

Un spectateur a été banni ou mis sous timeout sur la chaîne.

**Scope :** `channel:moderate`, accordé par le diffuseur.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont on surveille les bannissements et les timeouts. |

**Événement :** `ChannelBanEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelban)

## channel.bits.use

Des Bits ont été utilisés sur la chaîne, par un cheer ou un Power-up. Les Bits dépensés dans les extensions ne sont pas compris.

**Scope :** `bits:read`, avec un jeton utilisateur.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont la chaîne est surveillée. |

**Événement :** `ChannelBitsUseEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelbitsuse)

## channel.channel_points_automatic_reward_redemption.add

Un spectateur a utilisé une récompense automatique de points de chaîne (version 2, message découpé en fragments).

**Scope :** l'un de `channel:read:redemptions`, `channel:manage:redemptions`, accordé par le diffuseur.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant de la chaîne dont on veut les utilisations de récompenses automatiques. |

**Événement :** `ChannelChannelPointsAutomaticRewardRedemptionAddEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_automatic_reward_redemptionadd-v2)

## channel.channel_points_automatic_reward_redemption.add@1

Un spectateur a utilisé une récompense automatique de points de chaîne (version 1, message avec la position des emotes).

**Scope :** l'un de `channel:read:redemptions`, `channel:manage:redemptions`, accordé par le diffuseur.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant de la chaîne dont on veut les utilisations de récompenses automatiques. |

**Événement :** `ChannelChannelPointsAutomaticRewardRedemptionAddV1Event`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_automatic_reward_redemptionadd)

## channel.channel_points_custom_reward_redemption.add

Un spectateur a utilisé une récompense personnalisée de points de chaîne.

**Scope :** l'un de `channel:read:redemptions`, `channel:manage:redemptions`, accordé par le diffuseur.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant de la chaîne dont on veut les utilisations de récompenses. |
| `reward_id` | `string` | Limite les notifications à cette récompense. |

**Événement :** `ChannelChannelPointsCustomRewardRedemption`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_custom_reward_redemptionadd)

## channel.channel_points_custom_reward_redemption.update

Une utilisation d'une récompense personnalisée de points de chaîne a été honorée ou annulée.

**Scope :** l'un de `channel:read:redemptions`, `channel:manage:redemptions`, accordé par le diffuseur.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant de la chaîne dont on veut les utilisations de récompenses. |
| `reward_id` | `string` | Limite les notifications à cette récompense. |

**Événement :** `ChannelChannelPointsCustomRewardRedemption`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_custom_reward_redemptionupdate)

## channel.channel_points_custom_reward.add

Le diffuseur a créé une récompense personnalisée de points de chaîne.

**Scope :** l'un de `channel:read:redemptions`, `channel:manage:redemptions`, accordé par le diffuseur.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant de la chaîne dont on veut les nouvelles récompenses personnalisées. |

**Événement :** `ChannelChannelPointsCustomReward`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_custom_rewardadd)

## channel.channel_points_custom_reward.remove

Une récompense personnalisée de points de chaîne a été supprimée.

**Scope :** l'un de `channel:read:redemptions`, `channel:manage:redemptions`, accordé par le diffuseur.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant de la chaîne à qui appartiennent les récompenses. |
| `reward_id` | `string` | Limite les notifications à cette récompense. |

**Événement :** `ChannelChannelPointsCustomReward`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_custom_rewardremove)

## channel.channel_points_custom_reward.update

Une récompense personnalisée de points de chaîne a été modifiée.

**Scope :** l'un de `channel:read:redemptions`, `channel:manage:redemptions`, accordé par le diffuseur.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant de la chaîne à qui appartiennent les récompenses. |
| `reward_id` | `string` | Limite les notifications à cette récompense. |

**Événement :** `ChannelChannelPointsCustomReward`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_custom_rewardupdate)

## channel.charity_campaign.donate

Un spectateur a fait un don à la collecte caritative du diffuseur.

**Scope :** `channel:read:charity`, accordé par le diffuseur.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant de la chaîne qui mène la collecte caritative. |

**Événement :** `ChannelCharityCampaignDonateEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelcharity_campaigndonate)

## channel.charity_campaign.progress

Une collecte caritative a progressé vers son objectif, ou le diffuseur a modifié cet objectif.

**Scope :** `channel:read:charity`, accordé par le diffuseur.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant de la chaîne qui mène la collecte caritative. |

**Événement :** `ChannelCharityCampaignBase`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelcharity_campaignprogress)

## channel.charity_campaign.start

Le diffuseur a lancé une collecte caritative. Peut arriver après le premier événement de progression.

**Scope :** `channel:read:charity`, accordé par le diffuseur.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant de la chaîne qui mène la collecte caritative. |

**Événement :** `ChannelCharityCampaignStartEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelcharity_campaignstart)

## channel.charity_campaign.stop

Le diffuseur a arrêté une collecte caritative.

**Scope :** `channel:read:charity`, accordé par le diffuseur.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant de la chaîne qui mène la collecte caritative. |

**Événement :** `ChannelCharityCampaignStopEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelcharity_campaignstop)

## channel.chat_settings.update

Les réglages du chat de la chaîne ont changé (mode emotes seules, followers, lent, abonnés ou messages uniques).

**Scope :** `user:read:chat`, accordé par l'utilisateur indiqué dans `user_id`. Avec un jeton d'application, il faut aussi `user:bot` de la part de cet utilisateur, et soit `channel:bot` de la part du diffuseur, soit le statut de modérateur sur la chaîne.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont le chat est surveillé. |
| `user_id` <small>requis</small> | `string` | Identifiant de l'utilisateur au nom duquel le chat est lu. |

**Événement :** `ChannelChatSettingsUpdateEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchat_settingsupdate)

## channel.chat.clear

Un modérateur ou un bot a effacé tous les messages du chat.

**Scope :** `user:read:chat`, accordé par l'utilisateur indiqué dans `user_id`. Avec un jeton d'application, il faut aussi `user:bot` de la part de cet utilisateur, et soit `channel:bot` de la part du diffuseur, soit le statut de modérateur sur la chaîne.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont le chat est surveillé. |
| `user_id` <small>requis</small> | `string` | Identifiant de l'utilisateur au nom duquel le chat est lu. |

**Événement :** `ChannelChatClearEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatclear)

## channel.chat.clear_user_messages

Un modérateur ou un bot a effacé tous les messages d'un utilisateur, après un bannissement ou un timeout.

**Scope :** `user:read:chat`, accordé par l'utilisateur indiqué dans `user_id`. Avec un jeton d'application, il faut aussi `user:bot` de la part de cet utilisateur, et soit `channel:bot` de la part du diffuseur, soit le statut de modérateur sur la chaîne.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont le chat est surveillé. |
| `user_id` <small>requis</small> | `string` | Identifiant de l'utilisateur au nom duquel le chat est lu. |

**Événement :** `ChannelChatClearUserMessagesEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatclear_user_messages)

## channel.chat.message

Un utilisateur a envoyé un message dans le chat.

**Scope :** `user:read:chat`, accordé par l'utilisateur indiqué dans `user_id`. Avec un jeton d'application, il faut aussi `user:bot` de la part de cet utilisateur, et soit `channel:bot` de la part du diffuseur, soit le statut de modérateur sur la chaîne.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont le chat est surveillé. |
| `user_id` <small>requis</small> | `string` | Identifiant de l'utilisateur au nom duquel le chat est lu. |

**Événement :** `ChannelChatMessageEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatmessage)

## channel.chat.message_delete

Un modérateur a supprimé un message du chat.

**Scope :** `user:read:chat`, accordé par l'utilisateur indiqué dans `user_id`. Avec un jeton d'application, il faut aussi `user:bot` de la part de cet utilisateur, et soit `channel:bot` de la part du diffuseur, soit le statut de modérateur sur la chaîne.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont le chat est surveillé. |
| `user_id` <small>requis</small> | `string` | Identifiant de l'utilisateur au nom duquel le chat est lu. |

**Événement :** `ChannelChatMessageDeleteEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatmessage_delete)

## channel.chat.notification

Il s'est produit quelque chose que le chat affiche comme une notification, par exemple un abonnement, un abonnement offert, un raid ou une annonce.

**Scope :** `user:read:chat`, accordé par l'utilisateur indiqué dans `user_id`. Avec un jeton d'application, il faut aussi `user:bot` de la part de cet utilisateur, et soit `channel:bot` de la part du diffuseur, soit le statut de modérateur sur la chaîne.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont le chat est surveillé. |
| `user_id` <small>requis</small> | `string` | Identifiant de l'utilisateur au nom duquel le chat est lu. |

**Événement :** `ChannelChatNotificationEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatnotification)

## channel.chat.user_message_hold

Un message de l'utilisateur indiqué dans `user_id` a été retenu par AutoMod.

**Scope :** `user:read:chat`, accordé par l'utilisateur indiqué dans `user_id`. Avec un jeton d'application, il faut aussi `user:bot` de la part de cet utilisateur.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont le chat est surveillé. |
| `user_id` <small>requis</small> | `string` | Identifiant de l'utilisateur au nom duquel le chat est lu. |

**Événement :** `ChannelChatUserMessageHoldEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatuser_message_hold)

## channel.chat.user_message_update

Le statut AutoMod d'un message retenu de l'utilisateur indiqué dans `user_id` a changé.

**Scope :** `user:read:chat`, accordé par l'utilisateur indiqué dans `user_id`. Avec un jeton d'application, il faut aussi `user:bot` de la part de cet utilisateur.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont le chat est surveillé. |
| `user_id` <small>requis</small> | `string` | Identifiant de l'utilisateur au nom duquel le chat est lu. |

**Événement :** `ChannelChatUserMessageUpdateEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatuser_message_update)

## channel.cheer

Un utilisateur a envoyé un cheer en Bits sur la chaîne.

**Scope :** `bits:read`, accordé par le diffuseur.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont on surveille les cheers. |

**Événement :** `ChannelCheerEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelcheer)

## channel.custom_power_up_redemption.add

Un spectateur a utilisé un Power-up personnalisé.

**Scope :** `bits:read`, accordé par le diffuseur.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant de la chaîne dont on veut les utilisations de Power-ups personnalisés. |
| `reward_id` | `string` | Limite les notifications à ce Power-up personnalisé. |

**Événement :** `ChannelCustomPowerUpRedemptionAddEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelcustom_power_up_redemptionadd)

## channel.follow

Quelqu'un s'est mis à suivre la chaîne.

**Scope :** `moderator:read:followers`, accordé par l'utilisateur indiqué dans `moderator_user_id`.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont on surveille les nouveaux followers. |
| `moderator_user_id` <small>requis</small> | `string` | Identifiant d'un modérateur de la chaîne, ou du diffuseur quand l'autorisation vient de lui. |

**Événement :** `ChannelFollowEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelfollow)

## channel.goal.begin

Le diffuseur a lancé un objectif de créateur. Peut arriver après les premiers événements de progression.

**Scope :** `channel:read:goals`, accordé par le diffuseur.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur ; ce doit être l'utilisateur du jeton d'accès. |

**Événement :** `ChannelGoalBase`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelgoalbegin)

## channel.goal.end

Le diffuseur a mis fin à un objectif de créateur.

**Scope :** `channel:read:goals`, accordé par le diffuseur.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur ; ce doit être l'utilisateur du jeton d'accès. |

**Événement :** `ChannelGoalEndEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelgoalend)

## channel.goal.progress

Un objectif de créateur a progressé ou reculé.

**Scope :** `channel:read:goals`, accordé par le diffuseur.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur ; ce doit être l'utilisateur du jeton d'accès. |

**Événement :** `ChannelGoalBase`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelgoalprogress)

## channel.guest_star_guest.update

Un invité ou un emplacement a changé dans une session Guest Star en cours.

**Scope :** l'un de `channel:read:guest_star`, `channel:manage:guest_star`, `moderator:read:guest_star`, `moderator:manage:guest_star`, accordé par l'utilisateur indiqué dans `moderator_user_id`.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant de la chaîne qui accueille la session Guest Star. |
| `moderator_user_id` <small>requis</small> | `string` | Identifiant du diffuseur ou de l'un des modérateurs de la chaîne ; le jeton doit appartenir à cet utilisateur. |

**Événement :** `ChannelGuestStarGuestUpdateEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelguest_star_guestupdate)

## channel.guest_star_session.begin

L'hôte a lancé une session Guest Star.

**Scope :** l'un de `channel:read:guest_star`, `channel:manage:guest_star`, `moderator:read:guest_star`, `moderator:manage:guest_star`, accordé par l'utilisateur indiqué dans `moderator_user_id`.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant de la chaîne qui accueille la session Guest Star. |
| `moderator_user_id` <small>requis</small> | `string` | Identifiant du diffuseur ou de l'un des modérateurs de la chaîne ; le jeton doit appartenir à cet utilisateur. |

**Événement :** `ChannelGuestStarSessionBeginEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelguest_star_sessionbegin)

## channel.guest_star_session.end

Une session Guest Star s'est terminée, fermée par l'hôte ou par Twitch.

**Scope :** l'un de `channel:read:guest_star`, `channel:manage:guest_star`, `moderator:read:guest_star`, `moderator:manage:guest_star`, accordé par l'utilisateur indiqué dans `moderator_user_id`.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant de la chaîne qui accueille la session Guest Star. |
| `moderator_user_id` <small>requis</small> | `string` | Identifiant du diffuseur ou de l'un des modérateurs de la chaîne ; le jeton doit appartenir à cet utilisateur. |

**Événement :** `ChannelGuestStarSessionEndEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelguest_star_sessionend)

## channel.guest_star_settings.update

L'hôte a changé les préférences Guest Star de la chaîne.

**Scope :** l'un de `channel:read:guest_star`, `channel:manage:guest_star`, `moderator:read:guest_star`, `moderator:manage:guest_star`, accordé par l'utilisateur indiqué dans `moderator_user_id`.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant de la chaîne qui accueille la session Guest Star. |
| `moderator_user_id` <small>requis</small> | `string` | Identifiant du diffuseur ou de l'un des modérateurs de la chaîne ; le jeton doit appartenir à cet utilisateur. |

**Événement :** `ChannelGuestStarSettingsUpdateEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelguest_star_settingsupdate)

## channel.hype_train.begin

Un Hype Train a démarré sur la chaîne. Les premiers événements de progression peuvent arriver avant celui-ci.

**Scope :** `channel:read:hype_train`, accordé par le diffuseur.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant de la chaîne dont on veut les Hype Trains. |

**Événement :** `ChannelHypeTrainBeginEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelhype_trainbegin)

## channel.hype_train.end

Un Hype Train s'est terminé sur la chaîne.

**Scope :** `channel:read:hype_train`, accordé par le diffuseur.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant de la chaîne dont on veut les Hype Trains. |

**Événement :** `ChannelHypeTrainEndEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelhype_trainend)

## channel.hype_train.progress

Une contribution a fait avancer un Hype Train en cours.

**Scope :** `channel:read:hype_train`, accordé par le diffuseur.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant de la chaîne dont on veut les Hype Trains. |

**Événement :** `ChannelHypeTrainProgressEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelhype_trainprogress)

## channel.moderate

Un modérateur a effectué une action de modération sur la chaîne, avertissements compris. Affinez l'événement sur `action` pour lire les détails correspondants.

**Scope :** tous les suivants, accordés par l'utilisateur indiqué dans `moderator_user_id` : l'un de `moderator:read:blocked_terms`, `moderator:manage:blocked_terms` ; l'un de `moderator:read:chat_settings`, `moderator:manage:chat_settings` ; l'un de `moderator:read:unban_requests`, `moderator:manage:unban_requests` ; l'un de `moderator:read:banned_users`, `moderator:manage:banned_users` ; l'un de `moderator:read:chat_messages`, `moderator:manage:chat_messages` ; l'un de `moderator:read:warnings`, `moderator:manage:warnings` ; `moderator:read:moderators` ; `moderator:read:vips`.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont on surveille les actions de modération. |
| `moderator_user_id` <small>requis</small> | `string` | Identifiant du diffuseur ou d'un modérateur de la chaîne, celui qui a accordé les scopes. |

**Événement :** `ChannelModerateEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelmoderate-v2)

## channel.moderate@1

Un modérateur a effectué une action de modération sur la chaîne. La version 1 ne signale pas les avertissements. Affinez l'événement sur `action` pour lire les détails correspondants.

**Scope :** tous les suivants, accordés par l'utilisateur indiqué dans `moderator_user_id` : l'un de `moderator:read:blocked_terms`, `moderator:manage:blocked_terms` ; l'un de `moderator:read:chat_settings`, `moderator:manage:chat_settings` ; l'un de `moderator:read:unban_requests`, `moderator:manage:unban_requests` ; l'un de `moderator:read:banned_users`, `moderator:manage:banned_users` ; l'un de `moderator:read:chat_messages`, `moderator:manage:chat_messages` ; `moderator:read:moderators` ; `moderator:read:vips`.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont on surveille les actions de modération. |
| `moderator_user_id` <small>requis</small> | `string` | Identifiant du diffuseur ou d'un modérateur de la chaîne, celui qui a accordé les scopes. |

**Événement :** `ChannelModerateV1Event`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelmoderate)

## channel.moderator.add

Un utilisateur est devenu modérateur de la chaîne.

**Scope :** `moderation:read`, accordé par le diffuseur.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont on surveille les nouveaux modérateurs. |

**Événement :** `ChannelModeratorAddEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelmoderatoradd)

## channel.moderator.remove

Un utilisateur a perdu le statut de modérateur sur la chaîne.

**Scope :** `moderation:read`, accordé par le diffuseur.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont on surveille les retraits de modérateur. |

**Événement :** `ChannelModeratorRemoveEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelmoderatorremove)

## channel.poll.begin

Un sondage a démarré sur la chaîne.

**Scope :** l'un de `channel:read:polls`, `channel:manage:polls`, accordé par le diffuseur.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant de la chaîne dont on veut les sondages. |

**Événement :** `ChannelPollBeginEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpollbegin)

## channel.poll.end

Un sondage s'est terminé sur la chaîne.

**Scope :** l'un de `channel:read:polls`, `channel:manage:polls`, accordé par le diffuseur.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant de la chaîne dont on veut les sondages. |

**Événement :** `ChannelPollEndEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpollend)

## channel.poll.progress

Des spectateurs ont voté dans un sondage en cours.

**Scope :** l'un de `channel:read:polls`, `channel:manage:polls`, accordé par le diffuseur.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant de la chaîne dont on veut les sondages. |

**Événement :** `ChannelPollProgressEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpollprogress)

## channel.prediction.begin

Une prédiction a démarré sur la chaîne.

**Scope :** l'un de `channel:read:predictions`, `channel:manage:predictions`, accordé par le diffuseur.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant de la chaîne dont on veut les prédictions. |

**Événement :** `ChannelPredictionBeginEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpredictionbegin)

## channel.prediction.end

Une prédiction s'est terminée, résolue ou annulée.

**Scope :** l'un de `channel:read:predictions`, `channel:manage:predictions`, accordé par le diffuseur.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant de la chaîne dont on veut les prédictions. |

**Événement :** `ChannelPredictionEndEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpredictionend)

## channel.prediction.lock

Les paris d'une prédiction ont été clos.

**Scope :** l'un de `channel:read:predictions`, `channel:manage:predictions`, accordé par le diffuseur.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant de la chaîne dont on veut les prédictions. |

**Événement :** `ChannelPredictionLockEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpredictionlock)

## channel.prediction.progress

Des spectateurs ont parié sur une prédiction en cours.

**Scope :** l'un de `channel:read:predictions`, `channel:manage:predictions`, accordé par le diffuseur.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant de la chaîne dont on veut les prédictions. |

**Événement :** `ChannelPredictionProgressEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpredictionprogress)

## channel.raid

Un diffuseur a lancé un raid sur une autre chaîne.

**Scope :** aucun.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `from_broadcaster_user_id` | `string` | Identifiant du diffuseur dont on surveille les raids lancés. |
| `to_broadcaster_user_id` | `string` | Identifiant du diffuseur dont on surveille les raids reçus. |

**Événement :** `ChannelRaidEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelraid)

## channel.shared_chat.begin

La chaîne est devenue active dans une session de chat partagé.

**Scope :** aucun.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont la chaîne est surveillée. |

**Événement :** `ChannelSharedChatBeginEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshared_chatbegin)

## channel.shared_chat.end

La chaîne a quitté une session de chat partagé, ou la session s'est terminée.

**Scope :** aucun.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont la chaîne est surveillée. |

**Événement :** `ChannelSharedChatEndEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshared_chatend)

## channel.shared_chat.update

La session de chat partagé à laquelle la chaîne participe a changé, par exemple ses participants.

**Scope :** aucun.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont la chaîne est surveillée. |

**Événement :** `ChannelSharedChatUpdateEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshared_chatupdate)

## channel.shield_mode.begin

Le Shield Mode a été activé sur la chaîne.

**Scope :** l'un de `moderator:read:shield_mode`, `moderator:manage:shield_mode`, accordé par l'utilisateur indiqué dans `moderator_user_id`.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont on surveille le Shield Mode. |
| `moderator_user_id` <small>requis</small> | `string` | Identifiant du diffuseur ou d'un modérateur de la chaîne, celui qui a accordé le scope. |

**Événement :** `ChannelShieldModeBeginEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshield_modebegin)

## channel.shield_mode.end

Le Shield Mode a été désactivé sur la chaîne.

**Scope :** l'un de `moderator:read:shield_mode`, `moderator:manage:shield_mode`, accordé par l'utilisateur indiqué dans `moderator_user_id`.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont on surveille le Shield Mode. |
| `moderator_user_id` <small>requis</small> | `string` | Identifiant du diffuseur ou d'un modérateur de la chaîne, celui qui a accordé le scope. |

**Événement :** `ChannelShieldModeEndEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshield_modeend)

## channel.shoutout.create

Le diffuseur a envoyé un shoutout à une autre chaîne.

**Scope :** l'un de `moderator:read:shoutouts`, `moderator:manage:shoutouts`, accordé par l'utilisateur indiqué dans `moderator_user_id`.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont on surveille les shoutouts envoyés. |
| `moderator_user_id` <small>requis</small> | `string` | Identifiant du diffuseur ou d'un modérateur de la chaîne, celui qui a accordé le scope. |

**Événement :** `ChannelShoutoutCreateEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshoutoutcreate)

## channel.shoutout.receive

Le diffuseur a reçu un shoutout d'une autre chaîne. Ne se déclenche que lorsque Twitch publie le shoutout dans le fil d'activité du diffuseur.

**Scope :** l'un de `moderator:read:shoutouts`, `moderator:manage:shoutouts`, accordé par l'utilisateur indiqué dans `moderator_user_id`.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont on surveille les shoutouts reçus. |
| `moderator_user_id` <small>requis</small> | `string` | Identifiant du diffuseur ou d'un modérateur de la chaîne, celui qui a accordé le scope. |

**Événement :** `ChannelShoutoutReceiveEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshoutoutreceive)

## channel.subscribe

Un utilisateur s'est abonné à la chaîne. Les réabonnements ne sont pas compris.

**Scope :** `channel:read:subscriptions`, accordé par le diffuseur.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont on surveille les nouveaux abonnés. |

**Événement :** `ChannelSubscribeEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsubscribe)

## channel.subscription.end

Un abonnement à la chaîne a pris fin.

**Scope :** `channel:read:subscriptions`, accordé par le diffuseur.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont on surveille les fins d'abonnement. |

**Événement :** `ChannelSubscriptionEndEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsubscriptionend)

## channel.subscription.gift

Un spectateur a offert un ou plusieurs abonnements sur la chaîne.

**Scope :** `channel:read:subscriptions`, accordé par le diffuseur.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont on surveille les abonnements offerts. |

**Événement :** `ChannelSubscriptionGiftEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsubscriptiongift)

## channel.subscription.message

Un abonné a partagé un message de réabonnement dans le chat.

**Scope :** `channel:read:subscriptions`, accordé par le diffuseur.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont on surveille les messages de réabonnement. |

**Événement :** `ChannelSubscriptionMessageEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsubscriptionmessage)

## channel.suspicious_user.message

Un utilisateur signalé comme suspect a envoyé un message dans le chat.

**Scope :** `moderator:read:suspicious_users`, accordé par l'utilisateur indiqué dans `moderator_user_id`.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont on surveille le chat. |
| `moderator_user_id` <small>requis</small> | `string` | Identifiant du diffuseur ou d'un modérateur de la chaîne, celui qui a accordé le scope. |

**Événement :** `ChannelSuspiciousUserMessageEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsuspicious_usermessage)

## channel.suspicious_user.update

Un modérateur a changé le traitement appliqué à un utilisateur suspect.

**Scope :** `moderator:read:suspicious_users`, accordé par l'utilisateur indiqué dans `moderator_user_id`.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont on surveille les utilisateurs suspects. |
| `moderator_user_id` <small>requis</small> | `string` | Identifiant du diffuseur ou d'un modérateur de la chaîne, celui qui a accordé le scope. |

**Événement :** `ChannelSuspiciousUserUpdateEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsuspicious_userupdate)

## channel.unban

Un spectateur a été débanni sur la chaîne.

**Scope :** `channel:moderate`, accordé par le diffuseur.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont on surveille les débannissements. |

**Événement :** `ChannelUnbanEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelunban)

## channel.unban_request.create

Un utilisateur banni a déposé une demande de débannissement.

**Scope :** l'un de `moderator:read:unban_requests`, `moderator:manage:unban_requests`, accordé par l'utilisateur indiqué dans `moderator_user_id`.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont on surveille les demandes de débannissement. |
| `moderator_user_id` <small>requis</small> | `string` | Identifiant du diffuseur ou d'un modérateur de la chaîne, celui qui a accordé le scope. |

**Événement :** `ChannelUnbanRequestCreateEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelunban_requestcreate)

## channel.unban_request.resolve

Une demande de débannissement a été approuvée, refusée ou annulée.

**Scope :** l'un de `moderator:read:unban_requests`, `moderator:manage:unban_requests`, accordé par l'utilisateur indiqué dans `moderator_user_id`.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont on surveille les demandes de débannissement traitées. |
| `moderator_user_id` <small>requis</small> | `string` | Identifiant du diffuseur ou d'un modérateur de la chaîne, celui qui a accordé le scope. |

**Événement :** `ChannelUnbanRequestResolveEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelunban_requestresolve)

## channel.update

Le diffuseur a changé le titre, la catégorie, la langue ou les étiquettes de classification du contenu de la chaîne.

**Scope :** aucun.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont on surveille les réglages de chaîne. |

**Événement :** `ChannelUpdateEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelupdate)

## channel.vip.add

Un utilisateur est devenu VIP de la chaîne.

**Scope :** l'un de `channel:read:vips`, `channel:manage:vips`, accordé par le diffuseur.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont on surveille les nouveaux VIP. |

**Événement :** `ChannelVipAddEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelvipadd)

## channel.vip.remove

Un utilisateur a perdu le statut VIP sur la chaîne.

**Scope :** l'un de `channel:read:vips`, `channel:manage:vips`, accordé par le diffuseur.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont on surveille les retraits de VIP. |

**Événement :** `ChannelVipRemoveEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelvipremove)

## channel.warning.acknowledge

Un utilisateur a pris acte d'un avertissement reçu sur la chaîne.

**Scope :** l'un de `moderator:read:warnings`, `moderator:manage:warnings`, accordé par l'utilisateur indiqué dans `moderator_user_id`.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont on surveille les avertissements. |
| `moderator_user_id` <small>requis</small> | `string` | Identifiant du diffuseur ou d'un modérateur de la chaîne, celui qui a accordé le scope. |

**Événement :** `ChannelWarningAcknowledgeEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelwarningacknowledge)

## channel.warning.send

Un avertissement a été envoyé à un utilisateur sur la chaîne.

**Scope :** l'un de `moderator:read:warnings`, `moderator:manage:warnings`, accordé par l'utilisateur indiqué dans `moderator_user_id`.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont on surveille les avertissements. |
| `moderator_user_id` <small>requis</small> | `string` | Identifiant du diffuseur ou d'un modérateur de la chaîne, celui qui a accordé le scope. |

**Événement :** `ChannelWarningSendEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelwarningsend)

## conduit.shard.disabled

EventSub a désactivé un shard de conduit parce que l'état de son transport a changé.

**Scope :** aucun. Demande un jeton d'application dont l'identifiant client est égal à `client_id` ; avec `conduit_id`, le conduit doit appartenir à ce client.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `client_id` <small>requis</small> | `string` | Identifiant client de l'application ; ce doit être celui du jeton d'application. |
| `conduit_id` | `string` | Limite les notifications à ce conduit ; tous les conduits du client quand il est omis. |

**Événement :** `ConduitShardDisabledEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#conduitsharddisabled)

## drop.entitlement.grant

Des spectateurs ont reçu des droits liés aux Drops. Livré par lots : l'événement est un tableau de droits, et l'abonnement doit être créé avec la livraison par lots activée. Webhooks et conduits uniquement.

**Scope :** aucun. Demande un jeton d'application d'un client appartenant à un membre de l'organisation.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `organization_id` <small>requis</small> | `string` | Identifiant de l'organisation à qui appartient le jeu dans la console développeur. |
| `category_id` | `string` | Limite les notifications à cette catégorie (jeu). |
| `campaign_id` | `string` | Limite les notifications à cette campagne de Drops. |

**Événement :** `DropEntitlementGrantEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#dropentitlementgrant)

## extension.bits_transaction.create

Une transaction en Bits a eu lieu dans une extension. Webhooks et conduits uniquement.

**Scope :** aucun. L'identifiant client du jeton doit être celui de l'extension.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `extension_client_id` <small>requis</small> | `string` | Identifiant client de l'extension. |

**Événement :** `ExtensionBitsTransactionCreateEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#extensionbits_transactioncreate)

## stream.offline

Le diffuseur a arrêté de diffuser.

**Scope :** aucun.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont on surveille les fins de stream. |

**Événement :** `StreamOfflineEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#streamoffline)

## stream.online

Le diffuseur a lancé un stream.

**Scope :** aucun.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | Identifiant du diffuseur dont on surveille les débuts de stream. |

**Événement :** `StreamOnlineEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#streamonline)

## user.authorization.grant

Un utilisateur a autorisé l'application. Webhooks et conduits uniquement.

**Scope :** aucun. Demande un jeton d'application dont l'identifiant client est égal à `client_id`.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `client_id` <small>requis</small> | `string` | Identifiant client de l'application ; ce doit être celui du jeton d'application. |

**Événement :** `UserAuthorizationGrantEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#userauthorizationgrant)

## user.authorization.revoke

L'application a perdu l'autorisation d'un utilisateur. Webhooks et conduits uniquement.

**Scope :** aucun. Demande un jeton d'application dont l'identifiant client est égal à `client_id`.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `client_id` <small>requis</small> | `string` | Identifiant client de l'application ; ce doit être celui du jeton d'application. |

**Événement :** `UserAuthorizationRevokeEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#userauthorizationrevoke)

## user.update

Un utilisateur a modifié son compte (nom, description, e-mail...).

**Scope :** aucun. `user:read:email`, accordé par cet utilisateur, ajoute son adresse e-mail à l'événement.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` <small>requis</small> | `string` | Identifiant de l'utilisateur à surveiller. |

**Événement :** `UserUpdateEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#userupdate)

## user.whisper.message

L'utilisateur a reçu un chuchotement.

**Scope :** l'un de `user:read:whispers`, `user:manage:whispers`, accordé par l'utilisateur indiqué dans `user_id`.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` <small>requis</small> | `string` | Identifiant de l'utilisateur qui reçoit les chuchotements. |

**Événement :** `UserWhisperMessageEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#userwhispermessage)
