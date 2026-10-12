---
title: Types d'événements
description: "Tous les types d'abonnement EventSub connus de la bibliothèque, avec leur version, leur condition et le scope nécessaire."
---

Le nom s'autocomplète dans `on()` et `subscribe()`, et la condition comme l'événement sont typés à partir de lui. Un type qui existe en plusieurs versions figure sous son nom simple pour la plus récente et sous `nom@version` pour les anciennes.

:::note
Les descriptions de cette page sont tirées des commentaires du code source et restent en anglais.
:::

## Tous les types

| Type | Version | Se déclenche quand |
| --- | --- | --- |
| [`automod.message.hold`](#automodmessagehold) | 2 | AutoMod held a message for review. Only public blocked terms trigger it, not private ones. |
| [`automod.message.hold@1`](#automodmessagehold1) | 1 | AutoMod held a message for review (older payload, without the reason). |
| [`automod.message.update`](#automodmessageupdate) | 2 | A message waiting in the AutoMod queue was approved, denied or expired. Only public blocked terms trigger it, not private ones. |
| [`automod.message.update@1`](#automodmessageupdate1) | 1 | A message waiting in the AutoMod queue was approved, denied or expired (older payload, without the reason). |
| [`automod.settings.update`](#automodsettingsupdate) | 1 | The AutoMod settings of the channel changed. |
| [`automod.terms.update`](#automodtermsupdate) | 1 | Permitted or blocked terms of the channel changed. Changes to private terms are not sent. |
| [`channel.ad_break.begin`](#channelad_breakbegin) | 1 | A midroll ad break started, run by hand or scheduled by Ads Manager. |
| [`channel.ban`](#channelban) | 1 | A viewer was banned or timed out in the channel. |
| [`channel.bits.use`](#channelbitsuse) | 1 | Bits were used in the channel, through a cheer or a Power-up. Bits spent in Extensions are not included. |
| [`channel.channel_points_automatic_reward_redemption.add`](#channelchannel_points_automatic_reward_redemptionadd) | 2 | A viewer redeemed an automatic channel points reward (version 2, message split into fragments). |
| [`channel.channel_points_automatic_reward_redemption.add@1`](#channelchannel_points_automatic_reward_redemptionadd1) | 1 | A viewer redeemed an automatic channel points reward (version 1, message with emote positions). |
| [`channel.channel_points_custom_reward_redemption.add`](#channelchannel_points_custom_reward_redemptionadd) | 1 | A viewer redeemed a custom channel points reward. |
| [`channel.channel_points_custom_reward_redemption.update`](#channelchannel_points_custom_reward_redemptionupdate) | 1 | A redemption of a custom channel points reward was fulfilled or canceled. |
| [`channel.channel_points_custom_reward.add`](#channelchannel_points_custom_rewardadd) | 1 | The broadcaster created a custom channel points reward. |
| [`channel.channel_points_custom_reward.remove`](#channelchannel_points_custom_rewardremove) | 1 | A custom channel points reward was deleted. |
| [`channel.channel_points_custom_reward.update`](#channelchannel_points_custom_rewardupdate) | 1 | A custom channel points reward was edited. |
| [`channel.charity_campaign.donate`](#channelcharity_campaigndonate) | 1 | A viewer donated to the broadcaster's charity campaign. |
| [`channel.charity_campaign.progress`](#channelcharity_campaignprogress) | 1 | A charity campaign moved toward its goal, or the broadcaster changed the goal. |
| [`channel.charity_campaign.start`](#channelcharity_campaignstart) | 1 | The broadcaster started a charity campaign. May arrive after the first progress event. |
| [`channel.charity_campaign.stop`](#channelcharity_campaignstop) | 1 | The broadcaster stopped a charity campaign. |
| [`channel.chat_settings.update`](#channelchat_settingsupdate) | 1 | The chat settings of the channel changed (emote, follower, slow, subscriber or unique chat mode). |
| [`channel.chat.clear`](#channelchatclear) | 1 | A moderator or a bot cleared every message of the chat room. |
| [`channel.chat.clear_user_messages`](#channelchatclear_user_messages) | 1 | A moderator or a bot cleared every message of one user, after a ban or a timeout. |
| [`channel.chat.message`](#channelchatmessage) | 1 | A user sent a message in the chat room. |
| [`channel.chat.message_delete`](#channelchatmessage_delete) | 1 | A moderator removed one message from the chat room. |
| [`channel.chat.notification`](#channelchatnotification) | 1 | Something shown as a notice in chat happened, such as a subscription, a gift, a raid or an announcement. |
| [`channel.chat.user_message_hold`](#channelchatuser_message_hold) | 1 | A message of the user in `user_id` was held by AutoMod. |
| [`channel.chat.user_message_update`](#channelchatuser_message_update) | 1 | The AutoMod status of a held message of the user in `user_id` changed. |
| [`channel.cheer`](#channelcheer) | 1 | A user cheered Bits in the channel. |
| [`channel.custom_power_up_redemption.add`](#channelcustom_power_up_redemptionadd) | 1 | A viewer redeemed a custom Power-up. |
| [`channel.follow`](#channelfollow) | 2 | Someone followed the channel. |
| [`channel.goal.begin`](#channelgoalbegin) | 1 | The broadcaster started a creator goal. May arrive after the first progress events. |
| [`channel.goal.end`](#channelgoalend) | 1 | The broadcaster ended a creator goal. |
| [`channel.goal.progress`](#channelgoalprogress) | 1 | A creator goal moved forward or backward. |
| [`channel.guest_star_guest.update`](#channelguest_star_guestupdate) | beta | A guest or a slot changed in a running Guest Star session. |
| [`channel.guest_star_session.begin`](#channelguest_star_sessionbegin) | beta | The host started a Guest Star session. |
| [`channel.guest_star_session.end`](#channelguest_star_sessionend) | beta | A Guest Star session ended, closed by the host or by Twitch. |
| [`channel.guest_star_settings.update`](#channelguest_star_settingsupdate) | beta | The host changed the Guest Star preferences of the channel. |
| [`channel.hype_train.begin`](#channelhype_trainbegin) | 2 | A Hype Train started on the channel. The first progress events may arrive before this one. |
| [`channel.hype_train.end`](#channelhype_trainend) | 2 | A Hype Train ended on the channel. |
| [`channel.hype_train.progress`](#channelhype_trainprogress) | 2 | A contribution moved a running Hype Train forward. |
| [`channel.moderate`](#channelmoderate) | 2 | A moderator took a moderation action in the channel, warnings included. Narrow the event on `action` to read the matching details. |
| [`channel.moderate@1`](#channelmoderate1) | 1 | A moderator took a moderation action in the channel. Version 1 does not report warnings. Narrow the event on `action` to read the matching details. |
| [`channel.moderator.add`](#channelmoderatoradd) | 1 | A user was made moderator of the channel. |
| [`channel.moderator.remove`](#channelmoderatorremove) | 1 | A user lost moderator status in the channel. |
| [`channel.poll.begin`](#channelpollbegin) | 1 | A poll started on the channel. |
| [`channel.poll.end`](#channelpollend) | 1 | A poll ended on the channel. |
| [`channel.poll.progress`](#channelpollprogress) | 1 | Viewers voted in a running poll. |
| [`channel.prediction.begin`](#channelpredictionbegin) | 1 | A Prediction started on the channel. |
| [`channel.prediction.end`](#channelpredictionend) | 1 | A Prediction ended, resolved or canceled. |
| [`channel.prediction.lock`](#channelpredictionlock) | 1 | Betting closed on a Prediction. |
| [`channel.prediction.progress`](#channelpredictionprogress) | 1 | Viewers bet on a running Prediction. |
| [`channel.raid`](#channelraid) | 1 | A broadcaster raided another channel. |
| [`channel.shared_chat.begin`](#channelshared_chatbegin) | 1 | The channel became active in a shared chat session. |
| [`channel.shared_chat.end`](#channelshared_chatend) | 1 | The channel left a shared chat session, or the session ended. |
| [`channel.shared_chat.update`](#channelshared_chatupdate) | 1 | The shared chat session the channel is in changed, for example its participants. |
| [`channel.shield_mode.begin`](#channelshield_modebegin) | 1 | Shield Mode was turned on in the channel. |
| [`channel.shield_mode.end`](#channelshield_modeend) | 1 | Shield Mode was turned off in the channel. |
| [`channel.shoutout.create`](#channelshoutoutcreate) | 1 | The broadcaster sent a Shoutout to another channel. |
| [`channel.shoutout.receive`](#channelshoutoutreceive) | 1 | The broadcaster received a Shoutout from another channel. Fires only when Twitch posts the Shoutout to the activity feed of the broadcaster. |
| [`channel.subscribe`](#channelsubscribe) | 1 | A user subscribed to the channel. Resubscriptions are not included. |
| [`channel.subscription.end`](#channelsubscriptionend) | 1 | A subscription to the channel ended. |
| [`channel.subscription.gift`](#channelsubscriptiongift) | 1 | A viewer gifted one or more subscriptions in the channel. |
| [`channel.subscription.message`](#channelsubscriptionmessage) | 1 | A subscriber shared a resubscription message in chat. |
| [`channel.suspicious_user.message`](#channelsuspicious_usermessage) | 1 | A user flagged as suspicious sent a chat message. |
| [`channel.suspicious_user.update`](#channelsuspicious_userupdate) | 1 | A moderator changed the treatment applied to a suspicious user. |
| [`channel.unban`](#channelunban) | 1 | A viewer was unbanned in the channel. |
| [`channel.unban_request.create`](#channelunban_requestcreate) | 1 | A banned user created an unban request. |
| [`channel.unban_request.resolve`](#channelunban_requestresolve) | 1 | An unban request was approved, denied or canceled. |
| [`channel.update`](#channelupdate) | 2 | The broadcaster changed the title, category, language or content classification labels of the channel. |
| [`channel.vip.add`](#channelvipadd) | 1 | A user was made VIP of the channel. |
| [`channel.vip.remove`](#channelvipremove) | 1 | A user lost VIP status in the channel. |
| [`channel.warning.acknowledge`](#channelwarningacknowledge) | 1 | A user acknowledged a warning they received in the channel. |
| [`channel.warning.send`](#channelwarningsend) | 1 | A warning was sent to a user in the channel. |
| [`conduit.shard.disabled`](#conduitsharddisabled) | 1 | EventSub disabled a conduit shard because the state of its transport changed. |
| [`drop.entitlement.grant`](#dropentitlementgrant) | 1 | Viewers were granted Drop entitlements. Delivered in batches: the event is an array of entitlements, and the subscription must be created with batching enabled. Webhooks and conduits only. |
| [`extension.bits_transaction.create`](#extensionbits_transactioncreate) | 1 | A Bits transaction was made in an extension. Webhooks and conduits only. |
| [`stream.offline`](#streamoffline) | 1 | The broadcaster stopped streaming. |
| [`stream.online`](#streamonline) | 1 | The broadcaster started a stream. |
| [`user.authorization.grant`](#userauthorizationgrant) | 1 | A user authorized the application. Webhooks and conduits only. |
| [`user.authorization.revoke`](#userauthorizationrevoke) | 1 | The application lost a user's authorization. Webhooks and conduits only. |
| [`user.update`](#userupdate) | 1 | A user changed their account (name, description, email...). |
| [`user.whisper.message`](#userwhispermessage) | 1 | The user received a whisper. |

## automod.message.hold

AutoMod held a message for review. Only public blocked terms trigger it, not private ones.

**Scope:** `moderator:manage:automod`, granted by the moderator in `moderator_user_id`, who must be the broadcaster or one of their moderators.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose channel is watched. |
| `moderator_user_id` <small>requis</small> | `string` | ID of the moderator who subscribes. Must be the user of the access token. |

**Événement:** `AutomodMessageHoldEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#automodmessagehold-v2)

## automod.message.hold@1

AutoMod held a message for review (older payload, without the reason).

**Scope:** `moderator:manage:automod`, granted by the moderator in `moderator_user_id`, who must be the broadcaster or one of their moderators.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose channel is watched. |
| `moderator_user_id` <small>requis</small> | `string` | ID of the moderator who subscribes. Must be the user of the access token. |

**Événement:** `AutomodMessageHoldV1Event`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#automodmessagehold)

## automod.message.update

A message waiting in the AutoMod queue was approved, denied or expired. Only public blocked terms trigger it, not private ones.

**Scope:** `moderator:manage:automod`, granted by the moderator in `moderator_user_id`, who must be the broadcaster or one of their moderators.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose channel is watched. |
| `moderator_user_id` <small>requis</small> | `string` | ID of the moderator who subscribes. Must be the user of the access token. |

**Événement:** `AutomodMessageUpdateEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#automodmessageupdate-v2)

## automod.message.update@1

A message waiting in the AutoMod queue was approved, denied or expired (older payload, without the reason).

**Scope:** `moderator:manage:automod`, granted by the moderator in `moderator_user_id`, who must be the broadcaster or one of their moderators.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose channel is watched. |
| `moderator_user_id` <small>requis</small> | `string` | ID of the moderator who subscribes. Must be the user of the access token. |

**Événement:** `AutomodMessageUpdateV1Event`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#automodmessageupdate)

## automod.settings.update

The AutoMod settings of the channel changed.

**Scope:** `moderator:read:automod_settings`, granted by the moderator in `moderator_user_id`, who must be the broadcaster or one of their moderators.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose channel is watched. |
| `moderator_user_id` <small>requis</small> | `string` | ID of the moderator who subscribes. Must be the user of the access token. |

**Événement:** `AutomodSettingsUpdateEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#automodsettingsupdate)

## automod.terms.update

Permitted or blocked terms of the channel changed. Changes to private terms are not sent.

**Scope:** `moderator:manage:automod`, granted by the moderator in `moderator_user_id`, who must be the broadcaster or one of their moderators.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose channel is watched. |
| `moderator_user_id` <small>requis</small> | `string` | ID of the moderator who subscribes. Must be the user of the access token. |

**Événement:** `AutomodTermsUpdateEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#automodtermsupdate)

## channel.ad_break.begin

A midroll ad break started, run by hand or scheduled by Ads Manager.

**Scope:** `channel:read:ads`, granted by the broadcaster.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose ad breaks to watch. |

**Événement:** `ChannelAdBreakBeginEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelad_breakbegin)

## channel.ban

A viewer was banned or timed out in the channel.

**Scope:** `channel:moderate`, granted by the broadcaster.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose bans and timeouts to watch. |

**Événement:** `ChannelBanEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelban)

## channel.bits.use

Bits were used in the channel, through a cheer or a Power-up. Bits spent in Extensions are not included.

**Scope:** `bits:read`, with a user access token.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose channel is watched. |

**Événement:** `ChannelBitsUseEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelbitsuse)

## channel.channel_points_automatic_reward_redemption.add

A viewer redeemed an automatic channel points reward (version 2, message split into fragments).

**Scope:** one of `channel:read:redemptions`, `channel:manage:redemptions`, from the broadcaster.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the channel whose automatic reward redemptions are wanted. |

**Événement:** `ChannelChannelPointsAutomaticRewardRedemptionAddEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_automatic_reward_redemptionadd-v2)

## channel.channel_points_automatic_reward_redemption.add@1

A viewer redeemed an automatic channel points reward (version 1, message with emote positions).

**Scope:** one of `channel:read:redemptions`, `channel:manage:redemptions`, from the broadcaster.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the channel whose automatic reward redemptions are wanted. |

**Événement:** `ChannelChannelPointsAutomaticRewardRedemptionAddV1Event`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_automatic_reward_redemptionadd)

## channel.channel_points_custom_reward_redemption.add

A viewer redeemed a custom channel points reward.

**Scope:** one of `channel:read:redemptions`, `channel:manage:redemptions`, from the broadcaster.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the channel whose redemptions are wanted. |
| `reward_id` | `string` | Limits the notifications to this reward. |

**Événement:** `ChannelChannelPointsCustomRewardRedemption`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_custom_reward_redemptionadd)

## channel.channel_points_custom_reward_redemption.update

A redemption of a custom channel points reward was fulfilled or canceled.

**Scope:** one of `channel:read:redemptions`, `channel:manage:redemptions`, from the broadcaster.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the channel whose redemptions are wanted. |
| `reward_id` | `string` | Limits the notifications to this reward. |

**Événement:** `ChannelChannelPointsCustomRewardRedemption`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_custom_reward_redemptionupdate)

## channel.channel_points_custom_reward.add

The broadcaster created a custom channel points reward.

**Scope:** one of `channel:read:redemptions`, `channel:manage:redemptions`, from the broadcaster.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the channel whose new custom rewards are wanted. |

**Événement:** `ChannelChannelPointsCustomReward`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_custom_rewardadd)

## channel.channel_points_custom_reward.remove

A custom channel points reward was deleted.

**Scope:** one of `channel:read:redemptions`, `channel:manage:redemptions`, from the broadcaster.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the channel that owns the rewards. |
| `reward_id` | `string` | Limits the notifications to this reward. |

**Événement:** `ChannelChannelPointsCustomReward`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_custom_rewardremove)

## channel.channel_points_custom_reward.update

A custom channel points reward was edited.

**Scope:** one of `channel:read:redemptions`, `channel:manage:redemptions`, from the broadcaster.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the channel that owns the rewards. |
| `reward_id` | `string` | Limits the notifications to this reward. |

**Événement:** `ChannelChannelPointsCustomReward`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_custom_rewardupdate)

## channel.charity_campaign.donate

A viewer donated to the broadcaster's charity campaign.

**Scope:** `channel:read:charity`, from the broadcaster.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the channel running the charity campaign. |

**Événement:** `ChannelCharityCampaignDonateEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelcharity_campaigndonate)

## channel.charity_campaign.progress

A charity campaign moved toward its goal, or the broadcaster changed the goal.

**Scope:** `channel:read:charity`, from the broadcaster.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the channel running the charity campaign. |

**Événement:** `ChannelCharityCampaignBase`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelcharity_campaignprogress)

## channel.charity_campaign.start

The broadcaster started a charity campaign. May arrive after the first progress event.

**Scope:** `channel:read:charity`, from the broadcaster.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the channel running the charity campaign. |

**Événement:** `ChannelCharityCampaignStartEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelcharity_campaignstart)

## channel.charity_campaign.stop

The broadcaster stopped a charity campaign.

**Scope:** `channel:read:charity`, from the broadcaster.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the channel running the charity campaign. |

**Événement:** `ChannelCharityCampaignStopEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelcharity_campaignstop)

## channel.chat_settings.update

The chat settings of the channel changed (emote, follower, slow, subscriber or unique chat mode).

**Scope:** `user:read:chat` from the user in `user_id`. With an app access token, also `user:bot` from that user, plus either `channel:bot` from the broadcaster or moderator status in the channel.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose chat room is watched. |
| `user_id` <small>requis</small> | `string` | ID of the user to read chat as. |

**Événement:** `ChannelChatSettingsUpdateEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchat_settingsupdate)

## channel.chat.clear

A moderator or a bot cleared every message of the chat room.

**Scope:** `user:read:chat` from the user in `user_id`. With an app access token, also `user:bot` from that user, plus either `channel:bot` from the broadcaster or moderator status in the channel.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose chat room is watched. |
| `user_id` <small>requis</small> | `string` | ID of the user to read chat as. |

**Événement:** `ChannelChatClearEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatclear)

## channel.chat.clear_user_messages

A moderator or a bot cleared every message of one user, after a ban or a timeout.

**Scope:** `user:read:chat` from the user in `user_id`. With an app access token, also `user:bot` from that user, plus either `channel:bot` from the broadcaster or moderator status in the channel.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose chat room is watched. |
| `user_id` <small>requis</small> | `string` | ID of the user to read chat as. |

**Événement:** `ChannelChatClearUserMessagesEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatclear_user_messages)

## channel.chat.message

A user sent a message in the chat room.

**Scope:** `user:read:chat` from the user in `user_id`. With an app access token, also `user:bot` from that user, plus either `channel:bot` from the broadcaster or moderator status in the channel.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose chat room is watched. |
| `user_id` <small>requis</small> | `string` | ID of the user to read chat as. |

**Événement:** `ChannelChatMessageEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatmessage)

## channel.chat.message_delete

A moderator removed one message from the chat room.

**Scope:** `user:read:chat` from the user in `user_id`. With an app access token, also `user:bot` from that user, plus either `channel:bot` from the broadcaster or moderator status in the channel.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose chat room is watched. |
| `user_id` <small>requis</small> | `string` | ID of the user to read chat as. |

**Événement:** `ChannelChatMessageDeleteEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatmessage_delete)

## channel.chat.notification

Something shown as a notice in chat happened, such as a subscription, a gift, a raid or an announcement.

**Scope:** `user:read:chat` from the user in `user_id`. With an app access token, also `user:bot` from that user, plus either `channel:bot` from the broadcaster or moderator status in the channel.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose chat room is watched. |
| `user_id` <small>requis</small> | `string` | ID of the user to read chat as. |

**Événement:** `ChannelChatNotificationEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatnotification)

## channel.chat.user_message_hold

A message of the user in `user_id` was held by AutoMod.

**Scope:** `user:read:chat` from the user in `user_id`. With an app access token, also `user:bot` from that user.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose chat room is watched. |
| `user_id` <small>requis</small> | `string` | ID of the user to read chat as. |

**Événement:** `ChannelChatUserMessageHoldEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatuser_message_hold)

## channel.chat.user_message_update

The AutoMod status of a held message of the user in `user_id` changed.

**Scope:** `user:read:chat` from the user in `user_id`. With an app access token, also `user:bot` from that user.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose chat room is watched. |
| `user_id` <small>requis</small> | `string` | ID of the user to read chat as. |

**Événement:** `ChannelChatUserMessageUpdateEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatuser_message_update)

## channel.cheer

A user cheered Bits in the channel.

**Scope:** `bits:read`, granted by the broadcaster.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose cheers to watch. |

**Événement:** `ChannelCheerEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelcheer)

## channel.custom_power_up_redemption.add

A viewer redeemed a custom Power-up.

**Scope:** `bits:read`, from the broadcaster.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the channel whose custom Power-up redemptions are wanted. |
| `reward_id` | `string` | Limits the notifications to this custom Power-up. |

**Événement:** `ChannelCustomPowerUpRedemptionAddEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelcustom_power_up_redemptionadd)

## channel.follow

Someone followed the channel.

**Scope:** `moderator:read:followers`, granted by the user set as `moderator_user_id`.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose new followers to watch. |
| `moderator_user_id` <small>requis</small> | `string` | ID of a moderator of the channel, or of the broadcaster when the authorization comes from the broadcaster. |

**Événement:** `ChannelFollowEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelfollow)

## channel.goal.begin

The broadcaster started a creator goal. May arrive after the first progress events.

**Scope:** `channel:read:goals`, from the broadcaster.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster; it must be the user of the access token. |

**Événement:** `ChannelGoalBase`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelgoalbegin)

## channel.goal.end

The broadcaster ended a creator goal.

**Scope:** `channel:read:goals`, from the broadcaster.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster; it must be the user of the access token. |

**Événement:** `ChannelGoalEndEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelgoalend)

## channel.goal.progress

A creator goal moved forward or backward.

**Scope:** `channel:read:goals`, from the broadcaster.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster; it must be the user of the access token. |

**Événement:** `ChannelGoalBase`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelgoalprogress)

## channel.guest_star_guest.update

A guest or a slot changed in a running Guest Star session.

**Scope:** one of `channel:read:guest_star`, `channel:manage:guest_star`, `moderator:read:guest_star`, `moderator:manage:guest_star`, from the user given as `moderator_user_id`.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the channel that hosts the Guest Star session. |
| `moderator_user_id` <small>requis</small> | `string` | ID of the broadcaster or of one of the channel's moderators; the token must belong to this user. |

**Événement:** `ChannelGuestStarGuestUpdateEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelguest_star_guestupdate)

## channel.guest_star_session.begin

The host started a Guest Star session.

**Scope:** one of `channel:read:guest_star`, `channel:manage:guest_star`, `moderator:read:guest_star`, `moderator:manage:guest_star`, from the user given as `moderator_user_id`.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the channel that hosts the Guest Star session. |
| `moderator_user_id` <small>requis</small> | `string` | ID of the broadcaster or of one of the channel's moderators; the token must belong to this user. |

**Événement:** `ChannelGuestStarSessionBeginEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelguest_star_sessionbegin)

## channel.guest_star_session.end

A Guest Star session ended, closed by the host or by Twitch.

**Scope:** one of `channel:read:guest_star`, `channel:manage:guest_star`, `moderator:read:guest_star`, `moderator:manage:guest_star`, from the user given as `moderator_user_id`.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the channel that hosts the Guest Star session. |
| `moderator_user_id` <small>requis</small> | `string` | ID of the broadcaster or of one of the channel's moderators; the token must belong to this user. |

**Événement:** `ChannelGuestStarSessionEndEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelguest_star_sessionend)

## channel.guest_star_settings.update

The host changed the Guest Star preferences of the channel.

**Scope:** one of `channel:read:guest_star`, `channel:manage:guest_star`, `moderator:read:guest_star`, `moderator:manage:guest_star`, from the user given as `moderator_user_id`.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the channel that hosts the Guest Star session. |
| `moderator_user_id` <small>requis</small> | `string` | ID of the broadcaster or of one of the channel's moderators; the token must belong to this user. |

**Événement:** `ChannelGuestStarSettingsUpdateEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelguest_star_settingsupdate)

## channel.hype_train.begin

A Hype Train started on the channel. The first progress events may arrive before this one.

**Scope:** `channel:read:hype_train`, from the broadcaster.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the channel whose Hype Trains are wanted. |

**Événement:** `ChannelHypeTrainBeginEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelhype_trainbegin)

## channel.hype_train.end

A Hype Train ended on the channel.

**Scope:** `channel:read:hype_train`, from the broadcaster.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the channel whose Hype Trains are wanted. |

**Événement:** `ChannelHypeTrainEndEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelhype_trainend)

## channel.hype_train.progress

A contribution moved a running Hype Train forward.

**Scope:** `channel:read:hype_train`, from the broadcaster.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the channel whose Hype Trains are wanted. |

**Événement:** `ChannelHypeTrainProgressEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelhype_trainprogress)

## channel.moderate

A moderator took a moderation action in the channel, warnings included. Narrow the event on `action` to read the matching details.

**Scope:** all of the following, granted by the user set as `moderator_user_id`: one of `moderator:read:blocked_terms`, `moderator:manage:blocked_terms`; one of `moderator:read:chat_settings`, `moderator:manage:chat_settings`; one of `moderator:read:unban_requests`, `moderator:manage:unban_requests`; one of `moderator:read:banned_users`, `moderator:manage:banned_users`; one of `moderator:read:chat_messages`, `moderator:manage:chat_messages`; one of `moderator:read:warnings`, `moderator:manage:warnings`; `moderator:read:moderators`; `moderator:read:vips`.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose moderation actions to watch. |
| `moderator_user_id` <small>requis</small> | `string` | ID of the broadcaster or of a moderator of the channel, who granted the scopes. |

**Événement:** `ChannelModerateEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelmoderate-v2)

## channel.moderate@1

A moderator took a moderation action in the channel. Version 1 does not report warnings. Narrow the event on `action` to read the matching details.

**Scope:** all of the following, granted by the user set as `moderator_user_id`: one of `moderator:read:blocked_terms`, `moderator:manage:blocked_terms`; one of `moderator:read:chat_settings`, `moderator:manage:chat_settings`; one of `moderator:read:unban_requests`, `moderator:manage:unban_requests`; one of `moderator:read:banned_users`, `moderator:manage:banned_users`; one of `moderator:read:chat_messages`, `moderator:manage:chat_messages`; `moderator:read:moderators`; `moderator:read:vips`.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose moderation actions to watch. |
| `moderator_user_id` <small>requis</small> | `string` | ID of the broadcaster or of a moderator of the channel, who granted the scopes. |

**Événement:** `ChannelModerateV1Event`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelmoderate)

## channel.moderator.add

A user was made moderator of the channel.

**Scope:** `moderation:read`, granted by the broadcaster.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose new moderators to watch. |

**Événement:** `ChannelModeratorAddEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelmoderatoradd)

## channel.moderator.remove

A user lost moderator status in the channel.

**Scope:** `moderation:read`, granted by the broadcaster.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose removed moderators to watch. |

**Événement:** `ChannelModeratorRemoveEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelmoderatorremove)

## channel.poll.begin

A poll started on the channel.

**Scope:** one of `channel:read:polls`, `channel:manage:polls`, from the broadcaster.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the channel whose polls are wanted. |

**Événement:** `ChannelPollBeginEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpollbegin)

## channel.poll.end

A poll ended on the channel.

**Scope:** one of `channel:read:polls`, `channel:manage:polls`, from the broadcaster.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the channel whose polls are wanted. |

**Événement:** `ChannelPollEndEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpollend)

## channel.poll.progress

Viewers voted in a running poll.

**Scope:** one of `channel:read:polls`, `channel:manage:polls`, from the broadcaster.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the channel whose polls are wanted. |

**Événement:** `ChannelPollProgressEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpollprogress)

## channel.prediction.begin

A Prediction started on the channel.

**Scope:** one of `channel:read:predictions`, `channel:manage:predictions`, from the broadcaster.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the channel whose Predictions are wanted. |

**Événement:** `ChannelPredictionBeginEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpredictionbegin)

## channel.prediction.end

A Prediction ended, resolved or canceled.

**Scope:** one of `channel:read:predictions`, `channel:manage:predictions`, from the broadcaster.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the channel whose Predictions are wanted. |

**Événement:** `ChannelPredictionEndEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpredictionend)

## channel.prediction.lock

Betting closed on a Prediction.

**Scope:** one of `channel:read:predictions`, `channel:manage:predictions`, from the broadcaster.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the channel whose Predictions are wanted. |

**Événement:** `ChannelPredictionLockEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpredictionlock)

## channel.prediction.progress

Viewers bet on a running Prediction.

**Scope:** one of `channel:read:predictions`, `channel:manage:predictions`, from the broadcaster.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the channel whose Predictions are wanted. |

**Événement:** `ChannelPredictionProgressEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpredictionprogress)

## channel.raid

A broadcaster raided another channel.

**Scope:** none.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `from_broadcaster_user_id` | `string` | ID of the broadcaster whose outgoing raids to watch. |
| `to_broadcaster_user_id` | `string` | ID of the broadcaster whose incoming raids to watch. |

**Événement:** `ChannelRaidEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelraid)

## channel.shared_chat.begin

The channel became active in a shared chat session.

**Scope:** none.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose channel is watched. |

**Événement:** `ChannelSharedChatBeginEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshared_chatbegin)

## channel.shared_chat.end

The channel left a shared chat session, or the session ended.

**Scope:** none.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose channel is watched. |

**Événement:** `ChannelSharedChatEndEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshared_chatend)

## channel.shared_chat.update

The shared chat session the channel is in changed, for example its participants.

**Scope:** none.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose channel is watched. |

**Événement:** `ChannelSharedChatUpdateEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshared_chatupdate)

## channel.shield_mode.begin

Shield Mode was turned on in the channel.

**Scope:** one of `moderator:read:shield_mode`, `moderator:manage:shield_mode`, granted by the user set as `moderator_user_id`.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose Shield Mode to watch. |
| `moderator_user_id` <small>requis</small> | `string` | ID of the broadcaster or of a moderator of the channel, who granted the scope. |

**Événement:** `ChannelShieldModeBeginEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshield_modebegin)

## channel.shield_mode.end

Shield Mode was turned off in the channel.

**Scope:** one of `moderator:read:shield_mode`, `moderator:manage:shield_mode`, granted by the user set as `moderator_user_id`.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose Shield Mode to watch. |
| `moderator_user_id` <small>requis</small> | `string` | ID of the broadcaster or of a moderator of the channel, who granted the scope. |

**Événement:** `ChannelShieldModeEndEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshield_modeend)

## channel.shoutout.create

The broadcaster sent a Shoutout to another channel.

**Scope:** one of `moderator:read:shoutouts`, `moderator:manage:shoutouts`, granted by the user set as `moderator_user_id`.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose sent Shoutouts to watch. |
| `moderator_user_id` <small>requis</small> | `string` | ID of the broadcaster or of a moderator of the channel, who granted the scope. |

**Événement:** `ChannelShoutoutCreateEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshoutoutcreate)

## channel.shoutout.receive

The broadcaster received a Shoutout from another channel. Fires only when Twitch posts the Shoutout to the activity feed of the broadcaster.

**Scope:** one of `moderator:read:shoutouts`, `moderator:manage:shoutouts`, granted by the user set as `moderator_user_id`.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose received Shoutouts to watch. |
| `moderator_user_id` <small>requis</small> | `string` | ID of the broadcaster or of a moderator of the channel, who granted the scope. |

**Événement:** `ChannelShoutoutReceiveEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshoutoutreceive)

## channel.subscribe

A user subscribed to the channel. Resubscriptions are not included.

**Scope:** `channel:read:subscriptions`, granted by the broadcaster.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose new subscribers to watch. |

**Événement:** `ChannelSubscribeEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsubscribe)

## channel.subscription.end

A subscription to the channel ended.

**Scope:** `channel:read:subscriptions`, granted by the broadcaster.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose ending subscriptions to watch. |

**Événement:** `ChannelSubscriptionEndEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsubscriptionend)

## channel.subscription.gift

A viewer gifted one or more subscriptions in the channel.

**Scope:** `channel:read:subscriptions`, granted by the broadcaster.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose gifted subscriptions to watch. |

**Événement:** `ChannelSubscriptionGiftEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsubscriptiongift)

## channel.subscription.message

A subscriber shared a resubscription message in chat.

**Scope:** `channel:read:subscriptions`, granted by the broadcaster.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose resubscription messages to watch. |

**Événement:** `ChannelSubscriptionMessageEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsubscriptionmessage)

## channel.suspicious_user.message

A user flagged as suspicious sent a chat message.

**Scope:** `moderator:read:suspicious_users`, granted by the user set as `moderator_user_id`.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose chat to watch. |
| `moderator_user_id` <small>requis</small> | `string` | ID of the broadcaster or of a moderator of the channel, who granted the scope. |

**Événement:** `ChannelSuspiciousUserMessageEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsuspicious_usermessage)

## channel.suspicious_user.update

A moderator changed the treatment applied to a suspicious user.

**Scope:** `moderator:read:suspicious_users`, granted by the user set as `moderator_user_id`.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose suspicious users to watch. |
| `moderator_user_id` <small>requis</small> | `string` | ID of the broadcaster or of a moderator of the channel, who granted the scope. |

**Événement:** `ChannelSuspiciousUserUpdateEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsuspicious_userupdate)

## channel.unban

A viewer was unbanned in the channel.

**Scope:** `channel:moderate`, granted by the broadcaster.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose unbans to watch. |

**Événement:** `ChannelUnbanEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelunban)

## channel.unban_request.create

A banned user created an unban request.

**Scope:** one of `moderator:read:unban_requests`, `moderator:manage:unban_requests`, granted by the user set as `moderator_user_id`.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose unban requests to watch. |
| `moderator_user_id` <small>requis</small> | `string` | ID of the broadcaster or of a moderator of the channel, who granted the scope. |

**Événement:** `ChannelUnbanRequestCreateEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelunban_requestcreate)

## channel.unban_request.resolve

An unban request was approved, denied or canceled.

**Scope:** one of `moderator:read:unban_requests`, `moderator:manage:unban_requests`, granted by the user set as `moderator_user_id`.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose resolved unban requests to watch. |
| `moderator_user_id` <small>requis</small> | `string` | ID of the broadcaster or of a moderator of the channel, who granted the scope. |

**Événement:** `ChannelUnbanRequestResolveEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelunban_requestresolve)

## channel.update

The broadcaster changed the title, category, language or content classification labels of the channel.

**Scope:** none.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose channel settings to watch. |

**Événement:** `ChannelUpdateEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelupdate)

## channel.vip.add

A user was made VIP of the channel.

**Scope:** one of `channel:read:vips`, `channel:manage:vips`, granted by the broadcaster.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose new VIPs to watch. |

**Événement:** `ChannelVipAddEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelvipadd)

## channel.vip.remove

A user lost VIP status in the channel.

**Scope:** one of `channel:read:vips`, `channel:manage:vips`, granted by the broadcaster.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose removed VIPs to watch. |

**Événement:** `ChannelVipRemoveEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelvipremove)

## channel.warning.acknowledge

A user acknowledged a warning they received in the channel.

**Scope:** one of `moderator:read:warnings`, `moderator:manage:warnings`, granted by the user set as `moderator_user_id`.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose warnings to watch. |
| `moderator_user_id` <small>requis</small> | `string` | ID of the broadcaster or of a moderator of the channel, who granted the scope. |

**Événement:** `ChannelWarningAcknowledgeEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelwarningacknowledge)

## channel.warning.send

A warning was sent to a user in the channel.

**Scope:** one of `moderator:read:warnings`, `moderator:manage:warnings`, granted by the user set as `moderator_user_id`.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose warnings to watch. |
| `moderator_user_id` <small>requis</small> | `string` | ID of the broadcaster or of a moderator of the channel, who granted the scope. |

**Événement:** `ChannelWarningSendEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelwarningsend)

## conduit.shard.disabled

EventSub disabled a conduit shard because the state of its transport changed.

**Scope:** none. Needs an app access token whose client ID equals `client_id`; with `conduit_id`, that client must own the conduit.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `client_id` <small>requis</small> | `string` | Client ID of the application; it must be the one of the app access token. |
| `conduit_id` | `string` | Limits the notifications to this conduit; every conduit of the client when left out. |

**Événement:** `ConduitShardDisabledEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#conduitsharddisabled)

## drop.entitlement.grant

Viewers were granted Drop entitlements. Delivered in batches: the event is an array of entitlements, and the subscription must be created with batching enabled. Webhooks and conduits only.

**Scope:** none. Needs an app access token from a client owned by a member of the organization.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `organization_id` <small>requis</small> | `string` | ID of the organization that owns the game in the developer console. |
| `category_id` | `string` | Limits the notifications to this category (game). |
| `campaign_id` | `string` | Limits the notifications to this Drops campaign. |

**Événement:** `DropEntitlementGrantEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#dropentitlementgrant)

## extension.bits_transaction.create

A Bits transaction was made in an extension. Webhooks and conduits only.

**Scope:** none. The client ID of the token must be the extension's client ID.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `extension_client_id` <small>requis</small> | `string` | Client ID of the extension. |

**Événement:** `ExtensionBitsTransactionCreateEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#extensionbits_transactioncreate)

## stream.offline

The broadcaster stopped streaming.

**Scope:** none.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose stream ends to watch. |

**Événement:** `StreamOfflineEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#streamoffline)

## stream.online

The broadcaster started a stream.

**Scope:** none.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `broadcaster_user_id` <small>requis</small> | `string` | ID of the broadcaster whose stream starts to watch. |

**Événement:** `StreamOnlineEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#streamonline)

## user.authorization.grant

A user authorized the application. Webhooks and conduits only.

**Scope:** none. Needs an app access token whose client ID equals `client_id`.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `client_id` <small>requis</small> | `string` | Client ID of the application; it must be the one of the app access token. |

**Événement:** `UserAuthorizationGrantEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#userauthorizationgrant)

## user.authorization.revoke

The application lost a user's authorization. Webhooks and conduits only.

**Scope:** none. Needs an app access token whose client ID equals `client_id`.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `client_id` <small>requis</small> | `string` | Client ID of the application; it must be the one of the app access token. |

**Événement:** `UserAuthorizationRevokeEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#userauthorizationrevoke)

## user.update

A user changed their account (name, description, email...).

**Scope:** none. `user:read:email` from that user adds their email address to the event.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` <small>requis</small> | `string` | ID of the user to watch. |

**Événement:** `UserUpdateEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#userupdate)

## user.whisper.message

The user received a whisper.

**Scope:** one of `user:read:whispers`, `user:manage:whispers`, from the user given as `user_id`.

**Condition**

| Nom | Type | Description |
| --- | --- | --- |
| `user_id` <small>requis</small> | `string` | ID of the user who receives the whispers. |

**Événement:** `UserWhisperMessageEvent`

[Référence Twitch](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#userwhispermessage)
