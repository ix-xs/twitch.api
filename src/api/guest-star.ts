import type { RequestOptions } from "../http/rest.js";
import { ApiGroup } from "./base.js";

/** How the guests of a session are arranged in the browser source. */
export type GuestStarGroupLayout = "TILED_LAYOUT" | "SCREENSHARE_LAYOUT" | "HORIZONTAL_LAYOUT" | "VERTICAL_LAYOUT";

/** The Guest Star settings of a channel. */
export interface GuestStarSettings {
  /** Whether Guest Star moderators may decide if a guest in a slot is live. */
  is_moderator_send_live_enabled: boolean;
  /** Number of slots the host can fill in a call, 1 to 6. */
  slot_count: number;
  /** Whether browser sources of this channel play the audio of the session. */
  is_browser_source_audio_enabled: boolean;
  /** How guests are arranged in the browser source. */
  group_layout: GuestStarGroupLayout;
  /** View only token used to build browser source URLs. */
  browser_source_token: string;
}

/** Parameters of {@link GuestStarApi.settings}. */
export interface GetGuestStarSettingsParams {
  /** Broadcaster whose settings to read. */
  broadcaster_id: string;
  /** The broadcaster or one of their moderators. Defaults to the user making the call. */
  moderator_id?: string;
}

/** Parameters of {@link GuestStarApi.updateSettings}. */
export interface UpdateGuestStarSettingsParams {
  /** Broadcaster whose settings to change. Defaults to the user making the call. */
  broadcaster_id?: string;
  /** Lets Guest Star moderators decide if a guest in a slot is live. */
  is_moderator_send_live_enabled?: boolean;
  /** Number of slots the host can fill in a call, 1 to 6. */
  slot_count?: number;
  /** Makes browser sources of this channel play the audio of the session. */
  is_browser_source_audio_enabled?: boolean;
  /** How guests are arranged in the browser source. */
  group_layout?: GuestStarGroupLayout;
  /**
   * Issues a new browser source token. Every browser source already set up in
   * the streaming software stops working at once.
   */
  regenerate_browser_sources?: boolean;
}

/** The state of a guest's microphone or camera. */
export interface GuestStarMediaSettings {
  /** Whether the host lets this guest be heard or seen in the session. */
  is_host_enabled: boolean;
  /** Whether the guest chose to share this media. */
  is_guest_enabled: boolean;
  /** Whether the guest has a working device for this media. */
  is_available: boolean;
}

/** Someone who holds a slot in a Guest Star session. */
export interface GuestStarGuest {
  /**
   * ID of the slot, the same one browser source links use. The host is always
   * `"0"`, guests follow as `"1"`, `"2"` and so on, and a screen share takes
   * the special slot `"SCREENSHARE"`.
   */
  slot_id: string;
  /** Whether the guest is visible in the host's browser source. */
  is_live: boolean;
  /** ID of the guest. */
  user_id: string;
  /** Display name of the guest. */
  user_display_name: string;
  /** Login name of the guest. */
  user_login: string;
  /** Volume the host set for this guest, 0 to 100. */
  volume: number;
  /** When the guest got the slot, as an RFC 3339 timestamp. */
  assigned_at: string;
  /** State of the guest's microphone. */
  audio_settings: GuestStarMediaSettings;
  /** State of the guest's camera. */
  video_settings: GuestStarMediaSettings;
}

/** A Guest Star session and the people in it. */
export interface GuestStarSession {
  /** ID of the session. */
  id: string;
  /** Everyone who holds a slot, the host included. */
  guests: GuestStarGuest[];
}

/** Parameters of {@link GuestStarApi.session}. */
export interface GetGuestStarSessionParams {
  /** Broadcaster who hosts the session. */
  broadcaster_id: string;
  /** The broadcaster or one of their moderators. Defaults to the user making the call. */
  moderator_id?: string;
}

/** Parameters of {@link GuestStarApi.createSession}. */
export interface CreateGuestStarSessionParams {
  /** Broadcaster who will host the session. Defaults to the user making the call. */
  broadcaster_id?: string;
}

/** Parameters of {@link GuestStarApi.endSession}. */
export interface EndGuestStarSessionParams {
  /** Broadcaster who hosts the session. Defaults to the user making the call. */
  broadcaster_id?: string;
  /** ID of the session to end. */
  session_id: string;
}

/** A pending invitation to a Guest Star session. */
export interface GuestStarInvite {
  /** ID of the invited user. */
  user_id: string;
  /** When the invitation was sent, as an RFC 3339 timestamp. */
  invited_at: string;
  /**
   * How far the user is in joining: `"INVITED"` when they have not reacted
   * yet, `"ACCEPTED"` once they are in the waiting room, `"READY"` when they
   * said they can join the call.
   */
  status: "INVITED" | "ACCEPTED" | "READY";
  /** Whether the user has their camera turned on. */
  is_video_enabled: boolean;
  /** Whether the user has their microphone turned on. */
  is_audio_enabled: boolean;
  /** Whether the user has a camera to share. */
  is_video_available: boolean;
  /** Whether the user has a microphone to share. */
  is_audio_available: boolean;
}

/** Parameters of {@link GuestStarApi.invites}. */
export interface GetGuestStarInvitesParams {
  /** Broadcaster who hosts the session. */
  broadcaster_id: string;
  /** The broadcaster or one of their moderators. Defaults to the user making the call. */
  moderator_id?: string;
  /** ID of the session whose invitations to list. */
  session_id: string;
}

/** Parameters of {@link GuestStarApi.invite}. */
export interface SendGuestStarInviteParams {
  /** Broadcaster who hosts the session. */
  broadcaster_id: string;
  /** The broadcaster or one of their moderators. Defaults to the user making the call. */
  moderator_id?: string;
  /** ID of the session to invite the user to. */
  session_id: string;
  /** ID of the user to invite. */
  guest_id: string;
}

/** Parameters of {@link GuestStarApi.deleteInvite}. */
export interface DeleteGuestStarInviteParams {
  /** Broadcaster who hosts the session. */
  broadcaster_id: string;
  /** The broadcaster or one of their moderators. Defaults to the user making the call. */
  moderator_id?: string;
  /** ID of the session the invitation was sent for. */
  session_id: string;
  /** ID of the user whose invitation to take back. */
  guest_id: string;
}

/** Parameters of {@link GuestStarApi.assignSlot}. */
export interface AssignGuestStarSlotParams {
  /** Broadcaster who hosts the session. */
  broadcaster_id: string;
  /** The broadcaster or one of their moderators. Defaults to the user making the call. */
  moderator_id?: string;
  /** ID of the session. */
  session_id: string;
  /** ID of the user to seat. They must be invited and ready to join. */
  guest_id: string;
  /** Slot to give them: a number from `"1"` up to the slot count of the channel. */
  slot_id: string;
}

/** Parameters of {@link GuestStarApi.updateSlot}. */
export interface UpdateGuestStarSlotParams {
  /** Broadcaster who hosts the session. */
  broadcaster_id: string;
  /** The broadcaster or one of their moderators. Defaults to the user making the call. */
  moderator_id?: string;
  /** ID of the session. */
  session_id: string;
  /** Slot the guest is in now. */
  source_slot_id: string;
  /** Slot to move the guest to. When someone is already there, the two swap places. */
  destination_slot_id?: string;
}

/** Parameters of {@link GuestStarApi.deleteSlot}. */
export interface DeleteGuestStarSlotParams {
  /** Broadcaster who hosts the session. */
  broadcaster_id: string;
  /** The broadcaster or one of their moderators. Defaults to the user making the call. */
  moderator_id?: string;
  /** ID of the session. */
  session_id: string;
  /** ID of the guest to remove. */
  guest_id: string;
  /** Slot the guest is in. */
  slot_id: string;
  /** Sends the guest back to the invitation queue instead of out of the session. */
  should_reinvite_guest?: boolean;
}

/** Parameters of {@link GuestStarApi.updateSlotSettings}. */
export interface UpdateGuestStarSlotSettingsParams {
  /** Broadcaster who hosts the session. */
  broadcaster_id: string;
  /** The broadcaster or one of their moderators. Defaults to the user making the call. */
  moderator_id?: string;
  /** ID of the session. */
  session_id: string;
  /** Slot to change. */
  slot_id: string;
  /** Whether the slot may share audio. `false` mutes it for everyone. */
  is_audio_enabled?: boolean;
  /** Whether the slot may share video. `false` hides it for everyone. */
  is_video_enabled?: boolean;
  /** Whether the slot is shown and heard on stream, through the browser source. */
  is_live?: boolean;
  /** Volume of the slot on stream, 0 to 100. */
  volume?: number;
}

/** Guest Star (beta): sessions, invites and slots. */
export class GuestStarApi extends ApiGroup {
  /**
   * Gets the Guest Star settings of a channel.
   *
   * Beta: Twitch may change this endpoint.
   *
   * Token: user, scope `channel:read:guest_star`, `channel:manage:guest_star`,
   * `moderator:read:guest_star` or `moderator:manage:guest_star`.
   *
   * @example
   * const settings = await twitch.guestStar.settings({ broadcaster_id: "141981764" });
   * console.log(settings.slot_count, settings.group_layout);
   * @see https://dev.twitch.tv/docs/api/reference/#get-channel-guest-star-settings
   */
  settings(params: GetGuestStarSettingsParams, options?: RequestOptions): Promise<GuestStarSettings> {
    return this.rest.one<GuestStarSettings>({
      path: "guest_star/channel_settings",
      query: params,
      auth: "user",
      scopes: [
        "channel:read:guest_star",
        "channel:manage:guest_star",
        "moderator:read:guest_star",
        "moderator:manage:guest_star",
      ],
      context: "moderator_id",
      options,
    });
  }

  /**
   * Changes the Guest Star settings of a channel. Only the fields you pass
   * are touched.
   *
   * Beta: Twitch may change this endpoint.
   *
   * Token: user, scope `channel:manage:guest_star`.
   *
   * @example
   * await twitch.guestStar.updateSettings({ slot_count: 4, group_layout: "TILED_LAYOUT" });
   * @see https://dev.twitch.tv/docs/api/reference/#update-channel-guest-star-settings
   */
  updateSettings(params: UpdateGuestStarSettingsParams = {}, options?: RequestOptions): Promise<void> {
    const { broadcaster_id, ...body } = params;
    return this.rest.send({
      method: "PUT",
      path: "guest_star/channel_settings",
      query: { broadcaster_id },
      body,
      auth: "user",
      scopes: ["channel:manage:guest_star"],
      context: "broadcaster_id",
      options,
    });
  }

  /**
   * Gets the Guest Star session a channel is running, or `null` when there is
   * none. A guest can read it too, once invited or seated.
   *
   * Beta: Twitch may change this endpoint.
   *
   * Token: user, scope `channel:read:guest_star`, `channel:manage:guest_star`,
   * `moderator:read:guest_star` or `moderator:manage:guest_star`.
   *
   * @example
   * const session = await twitch.guestStar.session({ broadcaster_id: "141981764" });
   * if (session) console.log(session.guests.map((guest) => guest.user_login));
   * @see https://dev.twitch.tv/docs/api/reference/#get-guest-star-session
   */
  session(params: GetGuestStarSessionParams, options?: RequestOptions): Promise<GuestStarSession | null> {
    return this.rest.first<GuestStarSession>({
      path: "guest_star/session",
      query: params,
      auth: "user",
      scopes: [
        "channel:read:guest_star",
        "channel:manage:guest_star",
        "moderator:read:guest_star",
        "moderator:manage:guest_star",
      ],
      context: "moderator_id",
      options,
    });
  }

  /**
   * Starts a Guest Star session with the broadcaster as its only member. The
   * broadcaster has to be in the call interface, otherwise Twitch ends the
   * call by itself.
   *
   * Beta: Twitch may change this endpoint.
   *
   * Token: user, scope `channel:manage:guest_star`.
   *
   * @example
   * const session = await twitch.guestStar.createSession();
   * @see https://dev.twitch.tv/docs/api/reference/#create-guest-star-session
   */
  createSession(params: CreateGuestStarSessionParams = {}, options?: RequestOptions): Promise<GuestStarSession> {
    return this.rest.one<GuestStarSession>({
      method: "POST",
      path: "guest_star/session",
      query: params,
      auth: "user",
      scopes: ["channel:manage:guest_star"],
      context: "broadcaster_id",
      options,
    });
  }

  /**
   * Ends a Guest Star session, like the host pressing "End Call". Resolves
   * with the session as it was at that moment, or `null` when Twitch sends
   * nothing back.
   *
   * Beta: Twitch may change this endpoint.
   *
   * Token: user, scope `channel:manage:guest_star`.
   *
   * @example
   * await twitch.guestStar.endSession({ session_id: session.id });
   * @see https://dev.twitch.tv/docs/api/reference/#end-guest-star-session
   */
  endSession(params: EndGuestStarSessionParams, options?: RequestOptions): Promise<GuestStarSession | null> {
    return this.rest.first<GuestStarSession>({
      method: "DELETE",
      path: "guest_star/session",
      query: params,
      auth: "user",
      scopes: ["channel:manage:guest_star"],
      context: "broadcaster_id",
      options,
    });
  }

  /**
   * Lists the pending invitations of a session, with how far each invited
   * user is in the waiting room.
   *
   * Beta: Twitch may change this endpoint.
   *
   * Token: user, scope `channel:read:guest_star`, `channel:manage:guest_star`,
   * `moderator:read:guest_star` or `moderator:manage:guest_star`.
   *
   * @example
   * const invites = await twitch.guestStar.invites({ broadcaster_id: "141981764", session_id: session.id });
   * const ready = invites.filter((invite) => invite.status === "READY");
   * @see https://dev.twitch.tv/docs/api/reference/#get-guest-star-invites
   */
  invites(params: GetGuestStarInvitesParams, options?: RequestOptions): Promise<GuestStarInvite[]> {
    return this.rest.data<GuestStarInvite>({
      path: "guest_star/invites",
      query: params,
      auth: "user",
      scopes: [
        "channel:read:guest_star",
        "channel:manage:guest_star",
        "moderator:read:guest_star",
        "moderator:manage:guest_star",
      ],
      context: "moderator_id",
      options,
    });
  }

  /**
   * Invites a user to a session in progress.
   *
   * Beta: Twitch may change this endpoint.
   *
   * Token: user, scope `channel:manage:guest_star` or `moderator:manage:guest_star`.
   *
   * @example
   * await twitch.guestStar.invite({ broadcaster_id: "141981764", session_id: session.id, guest_id: "144601104" });
   * @see https://dev.twitch.tv/docs/api/reference/#send-guest-star-invite
   */
  invite(params: SendGuestStarInviteParams, options?: RequestOptions): Promise<void> {
    return this.rest.send({
      method: "POST",
      path: "guest_star/invites",
      query: params,
      auth: "user",
      scopes: ["channel:manage:guest_star", "moderator:manage:guest_star"],
      context: "moderator_id",
      options,
    });
  }

  /**
   * Takes back an invitation to a session.
   *
   * Beta: Twitch may change this endpoint.
   *
   * Token: user, scope `channel:manage:guest_star` or `moderator:manage:guest_star`.
   *
   * @example
   * await twitch.guestStar.deleteInvite({ broadcaster_id: "141981764", session_id: session.id, guest_id: "144601104" });
   * @see https://dev.twitch.tv/docs/api/reference/#delete-guest-star-invite
   */
  deleteInvite(params: DeleteGuestStarInviteParams, options?: RequestOptions): Promise<void> {
    return this.rest.send({
      method: "DELETE",
      path: "guest_star/invites",
      query: params,
      auth: "user",
      scopes: ["channel:manage:guest_star", "moderator:manage:guest_star"],
      context: "moderator_id",
      options,
    });
  }

  /**
   * Seats an invited user in a slot of the session, once they are ready to
   * join.
   *
   * Beta: Twitch may change this endpoint.
   *
   * Token: user, scope `channel:manage:guest_star` or `moderator:manage:guest_star`.
   *
   * @example
   * await twitch.guestStar.assignSlot({
   *   broadcaster_id: "141981764",
   *   session_id: session.id,
   *   guest_id: "144601104",
   *   slot_id: "1",
   * });
   * @see https://dev.twitch.tv/docs/api/reference/#assign-guest-star-slot
   */
  assignSlot(params: AssignGuestStarSlotParams, options?: RequestOptions): Promise<void> {
    return this.rest.send({
      method: "POST",
      path: "guest_star/slot",
      query: params,
      auth: "user",
      scopes: ["channel:manage:guest_star", "moderator:manage:guest_star"],
      context: "moderator_id",
      options,
    });
  }

  /**
   * Moves a guest to another slot. When the destination is taken, the two
   * guests swap places.
   *
   * Beta: Twitch may change this endpoint.
   *
   * Token: user, scope `channel:manage:guest_star` or `moderator:manage:guest_star`.
   *
   * @example
   * await twitch.guestStar.updateSlot({
   *   broadcaster_id: "141981764",
   *   session_id: session.id,
   *   source_slot_id: "1",
   *   destination_slot_id: "2",
   * });
   * @see https://dev.twitch.tv/docs/api/reference/#update-guest-star-slot
   */
  updateSlot(params: UpdateGuestStarSlotParams, options?: RequestOptions): Promise<void> {
    return this.rest.send({
      method: "PATCH",
      path: "guest_star/slot",
      query: params,
      auth: "user",
      scopes: ["channel:manage:guest_star", "moderator:manage:guest_star"],
      context: "moderator_id",
      options,
    });
  }

  /**
   * Removes a guest from their slot. They lose access to the session at once
   * and can no longer send or receive its audio and video.
   *
   * Beta: Twitch may change this endpoint.
   *
   * Token: user, scope `channel:manage:guest_star` or `moderator:manage:guest_star`.
   *
   * @example
   * await twitch.guestStar.deleteSlot({
   *   broadcaster_id: "141981764",
   *   session_id: session.id,
   *   guest_id: "144601104",
   *   slot_id: "1",
   * });
   * @see https://dev.twitch.tv/docs/api/reference/#delete-guest-star-slot
   */
  deleteSlot(params: DeleteGuestStarSlotParams, options?: RequestOptions): Promise<void> {
    return this.rest.send({
      method: "DELETE",
      path: "guest_star/slot",
      query: params,
      auth: "user",
      scopes: ["channel:manage:guest_star", "moderator:manage:guest_star"],
      context: "moderator_id",
      options,
    });
  }

  /**
   * Changes what a slot may share and how it comes out on stream: audio,
   * video, live state and volume. Allowing audio or video again does not turn
   * it on, the guest is told they can do so.
   *
   * Beta: Twitch may change this endpoint.
   *
   * Token: user, scope `channel:manage:guest_star` or `moderator:manage:guest_star`.
   *
   * @example
   * await twitch.guestStar.updateSlotSettings({
   *   broadcaster_id: "141981764",
   *   session_id: session.id,
   *   slot_id: "1",
   *   is_audio_enabled: false,
   * });
   * @see https://dev.twitch.tv/docs/api/reference/#update-guest-star-slot-settings
   */
  updateSlotSettings(params: UpdateGuestStarSlotSettingsParams, options?: RequestOptions): Promise<void> {
    return this.rest.send({
      method: "PATCH",
      path: "guest_star/slot_settings",
      query: params,
      auth: "user",
      scopes: ["channel:manage:guest_star", "moderator:manage:guest_star"],
      context: "moderator_id",
      options,
    });
  }
}
