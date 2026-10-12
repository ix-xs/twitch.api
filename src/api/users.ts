import { Batcher } from "../http/batcher.js";
import type { Paginator } from "../http/pagination.js";
import type { RequestOptions, Rest } from "../http/rest.js";
import { ApiGroup } from "./base.js";

/** A Twitch user account. */
export interface User {
  /** ID of the user. */
  id: string;
  /** Login name: lowercase, the one that appears in URLs. */
  login: string;
  /** Display name, with the capitalisation the user chose. */
  display_name: string;
  /** Staff role on Twitch. An empty string for a regular user. */
  type: "admin" | "global_mod" | "staff" | "";
  /** Monetisation status. An empty string for a regular broadcaster. */
  broadcaster_type: "affiliate" | "partner" | "";
  /** Channel description written by the user. */
  description: string;
  /** URL of the profile picture. */
  profile_image_url: string;
  /** URL of the image shown when the channel is offline. */
  offline_image_url: string;
  /** @deprecated Twitch no longer fills this field. */
  view_count: number;
  /**
   * Verified email address. Only present when the call is made with a token of
   * this user that has the `user:read:email` scope.
   */
  email?: string;
  /** When the account was created, as an RFC 3339 timestamp. */
  created_at: string;
}

/** Parameters of {@link UsersApi.get}. */
export interface GetUsersParams {
  /** IDs of the users to get. Any number: long lists are split for you. */
  id?: string | readonly string[];
  /** Login names of the users to get. Any number: long lists are split for you. */
  login?: string | readonly string[];
}

/** Parameters of {@link UsersApi.update}. */
export interface UpdateUserParams {
  /** New channel description, 300 characters at most. An empty string removes it. */
  description?: string;
}

/** Whether a user has authorized your application, and with which scopes. */
export interface UserAuthorization {
  /** ID of the user. */
  user_id: string;
  /** Display name of the user. */
  user_name: string;
  /** Login name of the user. */
  user_login: string;
  /** Every scope the user granted to your client ID. */
  scopes: string[];
  /** Whether the user authorized your application at all. */
  has_authorized: boolean;
}

/** Parameters of {@link UsersApi.authorization}. */
export interface GetUserAuthorizationParams {
  /** IDs of the users to check. Any number: long lists are split for you. */
  user_id: string | readonly string[];
}

/** A user blocked by a broadcaster. */
export interface BlockedUser {
  /** ID of the blocked user. */
  user_id: string;
  /** Login name of the blocked user. */
  user_login: string;
  /** Display name of the blocked user. */
  display_name: string;
}

/** Parameters of {@link UsersApi.blocks}. */
export interface GetUserBlockListParams {
  /** Broadcaster whose block list to read. Defaults to the user making the call. */
  broadcaster_id?: string;
  /** Items per page, 1 to 100. Twitch defaults to 20. */
  first?: number;
  /** Cursor of the page to fetch. */
  after?: string;
}

/** Parameters of {@link UsersApi.block}. */
export interface BlockUserParams {
  /** ID of the user to block. */
  target_user_id: string;
  /** Where the behaviour that motivates the block took place. */
  source_context?: "chat" | "whisper";
  /** Why the user is being blocked. */
  reason?: "harassment" | "spam" | "other";
}

/** Parameters of {@link UsersApi.unblock}. */
export interface UnblockUserParams {
  /** ID of the user to unblock. */
  target_user_id: string;
}

/** The slots an extension can be activated in. */
export type ExtensionType = "component" | "mobile" | "overlay" | "panel";

/** An extension installed by a user, active or not. */
export interface UserExtension {
  /** ID of the extension. */
  id: string;
  /** Installed version. */
  version: string;
  /** Name of the extension. */
  name: string;
  /** Whether the extension is configured and ready to be activated. */
  can_activate: boolean;
  /** Slots this extension can be activated in. */
  type: ExtensionType[];
}

/** One extension slot. When `active` is `false` the other fields are absent. */
export interface ExtensionSlot {
  /** Whether an extension is active in this slot. */
  active: boolean;
  /** ID of the extension. */
  id?: string;
  /** Version of the extension. */
  version?: string;
  /** Name of the extension. */
  name?: string;
}

/** A video component slot, which also has a position. */
export interface ComponentExtensionSlot extends ExtensionSlot {
  /** Horizontal position of the component. */
  x?: number;
  /** Vertical position of the component. */
  y?: number;
}

/** The extensions a broadcaster has active, by kind. Keys are slot numbers starting at `"1"`. */
export interface ActiveExtensions {
  /** Panel extensions, shown under the video. */
  panel: Record<string, ExtensionSlot>;
  /** Overlay extensions, shown on top of the whole video. */
  overlay: Record<string, ExtensionSlot>;
  /** Component extensions, shown on top of a part of the video. */
  component: Record<string, ComponentExtensionSlot>;
}

/** Parameters of {@link UsersApi.activeExtensions}. */
export interface GetUserActiveExtensionsParams {
  /** Broadcaster to read. Optional with a user token, required with an app token. */
  user_id?: string;
}

/** Parameters of {@link UsersApi.updateExtensions}. */
export interface UpdateUserExtensionsParams {
  /** Slots to change, by kind then by slot number. Slots you leave out are untouched. */
  data: {
    /** Panel slots to change, by slot number. */
    panel?: Record<string, ExtensionSlot>;
    /** Overlay slots to change, by slot number. */
    overlay?: Record<string, ExtensionSlot>;
    /** Component slots to change, by slot number. */
    component?: Record<string, ComponentExtensionSlot>;
  };
}

/** Users: profiles, block list and installed extensions. */
export class UsersApi extends ApiGroup {
  readonly #byId: Batcher<User>;
  readonly #byLogin: Batcher<User>;

  /** @internal */
  constructor(rest: Rest) {
    super(rest);
    this.#byId = new Batcher(async (ids) => new Map((await this.get({ id: ids })).map((user) => [user.id, user])));
    this.#byLogin = new Batcher(
      async (logins) => new Map((await this.get({ login: logins })).map((user) => [user.login, user])),
    );
  }

  /**
   * Gets users by ID, by login name, or both. Users that do not exist are
   * left out of the result.
   *
   * Token: app or user.
   *
   * @example
   * const users = await twitch.users.get({ login: ["twitchdev", "twitch"] });
   * @see https://dev.twitch.tv/docs/api/reference/#get-users
   */
  get(params: GetUsersParams, options?: RequestOptions): Promise<User[]> {
    return this.rest.chunked<User>({ path: "users", query: params, options }, ["id", "login"]);
  }

  /**
   * Gets one user by ID, or `null` when there is no such user. Calls made in
   * the same tick are merged into a single request.
   *
   * Token: app or user.
   *
   * @example
   * const user = await twitch.users.getById("141981764");
   * @see https://dev.twitch.tv/docs/api/reference/#get-users
   */
  async getById(id: string, options?: RequestOptions): Promise<User | null> {
    if (!options) return this.#byId.get(id);
    return (await this.get({ id }, options))[0] ?? null;
  }

  /**
   * Gets one user by login name, or `null` when there is no such user. Calls
   * made in the same tick are merged into a single request.
   *
   * Token: app or user.
   *
   * @example
   * const user = await twitch.users.getByLogin("twitchdev");
   * @see https://dev.twitch.tv/docs/api/reference/#get-users
   */
  async getByLogin(login: string, options?: RequestOptions): Promise<User | null> {
    const key = login.toLowerCase();
    if (!options) return this.#byLogin.get(key);
    return (await this.get({ login: key }, options))[0] ?? null;
  }

  /**
   * Gets the user who owns the token the call is made with. Includes `email`
   * when the token has the `user:read:email` scope.
   *
   * Token: user.
   *
   * @example
   * const me = await twitch.users.me();
   * @see https://dev.twitch.tv/docs/api/reference/#get-users
   */
  me(options?: RequestOptions): Promise<User> {
    return this.rest.one<User>({ path: "users", auth: "user", options });
  }

  /**
   * Updates the description of the user making the call.
   *
   * Token: user, scope `user:edit`.
   *
   * @example
   * await twitch.users.update({ description: "Live every evening." });
   * @see https://dev.twitch.tv/docs/api/reference/#update-user
   */
  update(params: UpdateUserParams, options?: RequestOptions): Promise<User> {
    return this.rest.one<User>({
      method: "PUT",
      path: "users",
      query: params,
      auth: "user",
      scopes: ["user:edit"],
      options,
    });
  }

  /**
   * Tells which scopes the given users granted to your application.
   *
   * Token: app.
   *
   * @example
   * const [auth] = await twitch.users.authorization({ user_id: "141981764" });
   * @see https://dev.twitch.tv/docs/api/reference/#get-authorization-by-user
   */
  authorization(params: GetUserAuthorizationParams, options?: RequestOptions): Promise<UserAuthorization[]> {
    return this.rest.chunked<UserAuthorization>(
      { path: "authorization/users", query: params, auth: "app", options },
      ["user_id"],
      10,
    );
  }

  /**
   * Lists the users a broadcaster has blocked, most recent first.
   *
   * Token: user, scope `user:read:blocked_users`.
   *
   * @example
   * for await (const blocked of twitch.users.blocks()) console.log(blocked.user_login);
   * @see https://dev.twitch.tv/docs/api/reference/#get-user-block-list
   */
  blocks(params: GetUserBlockListParams = {}, options?: RequestOptions): Paginator<BlockedUser> {
    return this.rest.paginate<BlockedUser>({
      path: "users/blocks",
      query: params,
      auth: "user",
      scopes: ["user:read:blocked_users"],
      context: "broadcaster_id",
      options,
    });
  }

  /**
   * Blocks a user on behalf of the user making the call.
   *
   * Token: user, scope `user:manage:blocked_users`.
   *
   * @example
   * await twitch.users.block({ target_user_id: "198704263", reason: "spam" });
   * @see https://dev.twitch.tv/docs/api/reference/#block-user
   */
  block(params: BlockUserParams, options?: RequestOptions): Promise<void> {
    return this.rest.send({
      method: "PUT",
      path: "users/blocks",
      query: params,
      auth: "user",
      scopes: ["user:manage:blocked_users"],
      options,
    });
  }

  /**
   * Removes a block set by the user making the call.
   *
   * Token: user, scope `user:manage:blocked_users`.
   *
   * @example
   * await twitch.users.unblock({ target_user_id: "198704263" });
   * @see https://dev.twitch.tv/docs/api/reference/#unblock-user
   */
  unblock(params: UnblockUserParams, options?: RequestOptions): Promise<void> {
    return this.rest.send({
      method: "DELETE",
      path: "users/blocks",
      query: params,
      auth: "user",
      scopes: ["user:manage:blocked_users"],
      options,
    });
  }

  /**
   * Lists the extensions installed by the user making the call. Inactive ones
   * are only included with the `user:edit:broadcast` scope.
   *
   * Token: user, scope `user:read:broadcast` or `user:edit:broadcast`.
   *
   * @example
   * const extensions = await twitch.users.extensions();
   * @see https://dev.twitch.tv/docs/api/reference/#get-user-extensions
   */
  extensions(options?: RequestOptions): Promise<UserExtension[]> {
    return this.rest.data<UserExtension>({
      path: "users/extensions/list",
      auth: "user",
      scopes: ["user:read:broadcast", "user:edit:broadcast"],
      options,
    });
  }

  /**
   * Gets the extensions a broadcaster has active in each slot.
   *
   * Token: app or user.
   *
   * @example
   * const active = await twitch.users.activeExtensions({ user_id: "141981764" });
   * console.log(active.panel["1"]);
   * @see https://dev.twitch.tv/docs/api/reference/#get-user-active-extensions
   */
  async activeExtensions(params: GetUserActiveExtensionsParams = {}, options?: RequestOptions): Promise<ActiveExtensions> {
    const body = await this.rest.request<{ data: ActiveExtensions }>({
      path: "users/extensions",
      query: params,
      options,
    });
    return body.data;
  }

  /**
   * Activates, deactivates or moves the extensions of the user making the call.
   *
   * Token: user, scope `user:edit:broadcast`.
   *
   * @example
   * await twitch.users.updateExtensions({
   *   data: { panel: { "1": { active: true, id: "rh6jq1q334hqc2rr1qlzqbvwlfl3x0", version: "1.1.0" } } },
   * });
   * @see https://dev.twitch.tv/docs/api/reference/#update-user-extensions
   */
  async updateExtensions(params: UpdateUserExtensionsParams, options?: RequestOptions): Promise<ActiveExtensions> {
    const body = await this.rest.request<{ data: ActiveExtensions }>({
      method: "PUT",
      path: "users/extensions",
      body: { data: params.data },
      auth: "user",
      scopes: ["user:edit:broadcast"],
      options,
    });
    return body.data;
  }
}
