---
title: Scopes
description: "Every OAuth scope, and the methods of the library it unlocks."
---

Ask for the scopes your application needs when you send a user to Twitch. A method lists several scopes when any one of them is enough. Event subscriptions have their own requirements: see the event types.

| Scope | Unlocks |
| --- | --- |
| `analytics:read:extensions` | [`analytics.extensions`](/reference/api/analytics/#extensions) |
| `analytics:read:games` | [`analytics.games`](/reference/api/analytics/#games) |
| `bits:read` | [`bits.leaderboard`](/reference/api/bits/#leaderboard), [`bits.customPowerUps`](/reference/api/bits/#custompowerups) |
| `channel:bot` | Used by event subscriptions only. |
| `channel:edit:commercial` | [`ads.startCommercial`](/reference/api/ads/#startcommercial) |
| `channel:manage:ads` | [`ads.snooze`](/reference/api/ads/#snooze) |
| `channel:manage:broadcast` | [`channels.update`](/reference/api/channels/#update), [`streams.createMarker`](/reference/api/streams/#createmarker), [`streams.markers`](/reference/api/streams/#markers) |
| `channel:manage:clips` | [`clips.createFromVod`](/reference/api/clips/#createfromvod), [`clips.downloads`](/reference/api/clips/#downloads) |
| `channel:manage:extensions` | Used by event subscriptions only. |
| `channel:manage:guest_star` | [`guestStar.settings`](/reference/api/guest-star/#settings), [`guestStar.updateSettings`](/reference/api/guest-star/#updatesettings), [`guestStar.session`](/reference/api/guest-star/#session), [`guestStar.createSession`](/reference/api/guest-star/#createsession), [`guestStar.endSession`](/reference/api/guest-star/#endsession), [`guestStar.invites`](/reference/api/guest-star/#invites), [`guestStar.invite`](/reference/api/guest-star/#invite), [`guestStar.deleteInvite`](/reference/api/guest-star/#deleteinvite), [`guestStar.assignSlot`](/reference/api/guest-star/#assignslot), [`guestStar.updateSlot`](/reference/api/guest-star/#updateslot), [`guestStar.deleteSlot`](/reference/api/guest-star/#deleteslot), [`guestStar.updateSlotSettings`](/reference/api/guest-star/#updateslotsettings) |
| `channel:manage:moderators` | [`moderation.moderators`](/reference/api/moderation/#moderators), [`moderation.addModerator`](/reference/api/moderation/#addmoderator), [`moderation.removeModerator`](/reference/api/moderation/#removemoderator) |
| `channel:manage:polls` | [`polls.get`](/reference/api/polls/#get), [`polls.create`](/reference/api/polls/#create), [`polls.end`](/reference/api/polls/#end) |
| `channel:manage:predictions` | [`predictions.get`](/reference/api/predictions/#get), [`predictions.create`](/reference/api/predictions/#create), [`predictions.end`](/reference/api/predictions/#end) |
| `channel:manage:raids` | [`raids.start`](/reference/api/raids/#start), [`raids.cancel`](/reference/api/raids/#cancel) |
| `channel:manage:redemptions` | [`channelPoints.createReward`](/reference/api/channel-points/#createreward), [`channelPoints.deleteReward`](/reference/api/channel-points/#deletereward), [`channelPoints.rewards`](/reference/api/channel-points/#rewards), [`channelPoints.redemptions`](/reference/api/channel-points/#redemptions), [`channelPoints.updateReward`](/reference/api/channel-points/#updatereward), [`channelPoints.updateRedemptions`](/reference/api/channel-points/#updateredemptions) |
| `channel:manage:schedule` | [`schedule.updateSettings`](/reference/api/schedule/#updatesettings), [`schedule.createSegment`](/reference/api/schedule/#createsegment), [`schedule.updateSegment`](/reference/api/schedule/#updatesegment), [`schedule.deleteSegment`](/reference/api/schedule/#deletesegment) |
| `channel:manage:videos` | [`videos.delete`](/reference/api/videos/#delete) |
| `channel:manage:vips` | [`moderation.vips`](/reference/api/moderation/#vips), [`moderation.addVip`](/reference/api/moderation/#addvip), [`moderation.removeVip`](/reference/api/moderation/#removevip) |
| `channel:moderate` | Used by event subscriptions only. |
| `channel:read:ads` | [`ads.schedule`](/reference/api/ads/#schedule) |
| `channel:read:charity` | [`charity.campaign`](/reference/api/charity/#campaign), [`charity.donations`](/reference/api/charity/#donations) |
| `channel:read:editors` | [`channels.editors`](/reference/api/channels/#editors) |
| `channel:read:goals` | [`goals.get`](/reference/api/goals/#get) |
| `channel:read:guest_star` | [`guestStar.settings`](/reference/api/guest-star/#settings), [`guestStar.session`](/reference/api/guest-star/#session), [`guestStar.invites`](/reference/api/guest-star/#invites) |
| `channel:read:hype_train` | [`hypeTrain.status`](/reference/api/hype-train/#status) |
| `channel:read:polls` | [`polls.get`](/reference/api/polls/#get) |
| `channel:read:predictions` | [`predictions.get`](/reference/api/predictions/#get) |
| `channel:read:redemptions` | [`channelPoints.rewards`](/reference/api/channel-points/#rewards), [`channelPoints.redemptions`](/reference/api/channel-points/#redemptions) |
| `channel:read:stream_key` | [`streams.key`](/reference/api/streams/#key) |
| `channel:read:subscriptions` | [`subscriptions.get`](/reference/api/subscriptions/#get) |
| `channel:read:vips` | [`moderation.vips`](/reference/api/moderation/#vips) |
| `chat:edit` | Used by event subscriptions only. |
| `chat:read` | Used by event subscriptions only. |
| `clips:edit` | [`clips.create`](/reference/api/clips/#create) |
| `editor:manage:clips` | [`clips.createFromVod`](/reference/api/clips/#createfromvod), [`clips.downloads`](/reference/api/clips/#downloads) |
| `moderation:read` | [`moderation.checkAutoMod`](/reference/api/moderation/#checkautomod), [`moderation.bans`](/reference/api/moderation/#bans), [`moderation.moderators`](/reference/api/moderation/#moderators) |
| `moderator:manage:announcements` | [`chat.announce`](/reference/api/chat/#announce) |
| `moderator:manage:automod` | [`moderation.manageAutoModMessage`](/reference/api/moderation/#manageautomodmessage) |
| `moderator:manage:automod_settings` | [`moderation.autoModSettings`](/reference/api/moderation/#automodsettings), [`moderation.updateAutoModSettings`](/reference/api/moderation/#updateautomodsettings) |
| `moderator:manage:banned_users` | [`moderation.bans`](/reference/api/moderation/#bans), [`moderation.ban`](/reference/api/moderation/#ban), [`moderation.unban`](/reference/api/moderation/#unban) |
| `moderator:manage:blocked_terms` | [`moderation.blockedTerms`](/reference/api/moderation/#blockedterms), [`moderation.addBlockedTerm`](/reference/api/moderation/#addblockedterm), [`moderation.removeBlockedTerm`](/reference/api/moderation/#removeblockedterm) |
| `moderator:manage:chat_messages` | [`chat.pinnedMessage`](/reference/api/chat/#pinnedmessage), [`chat.pin`](/reference/api/chat/#pin), [`chat.updatePin`](/reference/api/chat/#updatepin), [`chat.unpin`](/reference/api/chat/#unpin), [`moderation.deleteMessages`](/reference/api/moderation/#deletemessages) |
| `moderator:manage:chat_settings` | [`chat.updateSettings`](/reference/api/chat/#updatesettings) |
| `moderator:manage:guest_star` | [`guestStar.settings`](/reference/api/guest-star/#settings), [`guestStar.session`](/reference/api/guest-star/#session), [`guestStar.invites`](/reference/api/guest-star/#invites), [`guestStar.invite`](/reference/api/guest-star/#invite), [`guestStar.deleteInvite`](/reference/api/guest-star/#deleteinvite), [`guestStar.assignSlot`](/reference/api/guest-star/#assignslot), [`guestStar.updateSlot`](/reference/api/guest-star/#updateslot), [`guestStar.deleteSlot`](/reference/api/guest-star/#deleteslot), [`guestStar.updateSlotSettings`](/reference/api/guest-star/#updateslotsettings) |
| `moderator:manage:shield_mode` | [`moderation.updateShieldMode`](/reference/api/moderation/#updateshieldmode), [`moderation.shieldMode`](/reference/api/moderation/#shieldmode) |
| `moderator:manage:shoutouts` | [`chat.shoutout`](/reference/api/chat/#shoutout) |
| `moderator:manage:suspicious_users` | [`moderation.addSuspiciousStatus`](/reference/api/moderation/#addsuspiciousstatus), [`moderation.removeSuspiciousStatus`](/reference/api/moderation/#removesuspiciousstatus) |
| `moderator:manage:unban_requests` | [`moderation.unbanRequests`](/reference/api/moderation/#unbanrequests), [`moderation.resolveUnbanRequest`](/reference/api/moderation/#resolveunbanrequest) |
| `moderator:manage:warnings` | [`moderation.warn`](/reference/api/moderation/#warn) |
| `moderator:read:automod_settings` | [`moderation.autoModSettings`](/reference/api/moderation/#automodsettings) |
| `moderator:read:banned_users` | Used by event subscriptions only. |
| `moderator:read:blocked_terms` | [`moderation.blockedTerms`](/reference/api/moderation/#blockedterms) |
| `moderator:read:chat_messages` | [`chat.pinnedMessage`](/reference/api/chat/#pinnedmessage) |
| `moderator:read:chat_settings` | Used by event subscriptions only. |
| `moderator:read:chatters` | [`chat.chatters`](/reference/api/chat/#chatters) |
| `moderator:read:followers` | [`channels.followers`](/reference/api/channels/#followers) |
| `moderator:read:guest_star` | [`guestStar.settings`](/reference/api/guest-star/#settings), [`guestStar.session`](/reference/api/guest-star/#session), [`guestStar.invites`](/reference/api/guest-star/#invites) |
| `moderator:read:moderators` | Used by event subscriptions only. |
| `moderator:read:shield_mode` | [`moderation.shieldMode`](/reference/api/moderation/#shieldmode) |
| `moderator:read:shoutouts` | Used by event subscriptions only. |
| `moderator:read:suspicious_users` | Used by event subscriptions only. |
| `moderator:read:unban_requests` | [`moderation.unbanRequests`](/reference/api/moderation/#unbanrequests) |
| `moderator:read:vips` | Used by event subscriptions only. |
| `moderator:read:warnings` | Used by event subscriptions only. |
| `user:bot` | Used by event subscriptions only. |
| `user:edit` | [`users.update`](/reference/api/users/#update) |
| `user:edit:broadcast` | [`users.extensions`](/reference/api/users/#extensions), [`users.updateExtensions`](/reference/api/users/#updateextensions) |
| `user:manage:blocked_users` | [`users.block`](/reference/api/users/#block), [`users.unblock`](/reference/api/users/#unblock) |
| `user:manage:chat_color` | [`chat.setColor`](/reference/api/chat/#setcolor) |
| `user:manage:whispers` | [`whispers.send`](/reference/api/whispers/#send) |
| `user:read:blocked_users` | [`users.blocks`](/reference/api/users/#blocks) |
| `user:read:broadcast` | [`streams.markers`](/reference/api/streams/#markers), [`users.extensions`](/reference/api/users/#extensions) |
| `user:read:chat` | Used by event subscriptions only. |
| `user:read:email` | Used by event subscriptions only. |
| `user:read:emotes` | [`chat.userEmotes`](/reference/api/chat/#useremotes) |
| `user:read:follows` | [`channels.followed`](/reference/api/channels/#followed), [`streams.followed`](/reference/api/streams/#followed) |
| `user:read:moderated_channels` | [`moderation.moderatedChannels`](/reference/api/moderation/#moderatedchannels) |
| `user:read:subscriptions` | [`subscriptions.check`](/reference/api/subscriptions/#check) |
| `user:read:whispers` | Used by event subscriptions only. |
| `user:write:chat` | [`chat.send`](/reference/api/chat/#send) |
| `whispers:read` | Used by event subscriptions only. |
