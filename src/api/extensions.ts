import type { Paginator } from "../http/pagination.js";
import type { RequestOptions } from "../http/rest.js";
import { ApiGroup } from "./base.js";

/** The three configuration segments an extension can store data in. */
export type ExtensionConfigurationSegmentName = "broadcaster" | "developer" | "global";

/** One configuration segment of an extension. */
export interface ExtensionConfigurationSegment {
  /** Which segment this is. */
  segment: ExtensionConfigurationSegmentName;
  /** ID of the broadcaster the segment belongs to. Absent on the global segment. */
  broadcaster_id?: string;
  /** What the segment holds: plain text, or JSON encoded as a string. */
  content: string;
  /** Version of the stored data, as chosen by the extension. */
  version: string;
}

/** Parameters of {@link ExtensionsApi.configuration}. */
export interface GetExtensionConfigurationParams {
  /** ID of the extension that owns the segments. */
  extension_id: string;
  /** Segments to read. Duplicates are ignored. */
  segment: ExtensionConfigurationSegmentName | readonly ExtensionConfigurationSegmentName[];
  /**
   * Broadcaster who installed the extension. Required for the broadcaster and
   * developer segments, leave it out when you only read the global one.
   */
  broadcaster_id?: string;
}

/** Parameters of {@link ExtensionsApi.setConfiguration}. */
export interface SetExtensionConfigurationParams {
  /** ID of the extension to update. */
  extension_id: string;
  /** Segment to write. */
  segment: ExtensionConfigurationSegmentName;
  /** Broadcaster who installed the extension. Only for the broadcaster and developer segments. */
  broadcaster_id?: string;
  /** New content, 5 KB at most: plain text, or JSON encoded as a string. */
  content?: string;
  /** Version of the data to write. Without it the latest one is replaced. */
  version?: string;
}

/** Parameters of {@link ExtensionsApi.setRequiredConfiguration}. */
export interface SetExtensionRequiredConfigurationParams {
  /** Broadcaster who installed the extension on their channel. */
  broadcaster_id: string;
  /** ID of the extension to update. */
  extension_id: string;
  /** Version of the extension to update. */
  extension_version: string;
  /** The string that marks the channel as configured for this version. */
  required_configuration: string;
}

/**
 * Who receives an extension PubSub message: every viewer of one channel, every
 * channel the extension is active on, or a single user.
 */
export type ExtensionPubSubTarget = "broadcast" | "global" | `whisper-${string}`;

/** Parameters of {@link ExtensionsApi.sendPubSub}. */
export interface SendExtensionPubSubMessageParams {
  /** Recipients. `"broadcast"` and `"global"` cannot be combined. */
  target: readonly ExtensionPubSubTarget[];
  /** Channel to send the message to. Leave it out when `is_global_broadcast` is `true`. */
  broadcaster_id?: string;
  /**
   * Sends the message to every channel the extension is active on. `target`
   * must then be `["global"]`. Twitch defaults to `false`.
   */
  is_global_broadcast?: boolean;
  /** The message, 5 KB at most: plain text, or JSON encoded as a string. */
  message: string;
}

/** A live channel that has an extension installed or activated. */
export interface ExtensionLiveChannel {
  /** ID of the broadcaster. */
  broadcaster_id: string;
  /** Display name of the broadcaster. */
  broadcaster_name: string;
  /** Name of the category being streamed. */
  game_name: string;
  /** ID of the category being streamed. */
  game_id: string;
  /** Title of the stream. An empty string when none is set. */
  title: string;
}

/** Parameters of {@link ExtensionsApi.liveChannels}. */
export interface GetExtensionLiveChannelsParams {
  /** ID of the extension to look for. */
  extension_id: string;
  /** Items per page, 1 to 100. Twitch defaults to 20. */
  first?: number;
  /** Cursor of the next page. */
  after?: string;
}

/** One shared secret of an extension. */
export interface ExtensionSecret {
  /** The secret itself, to sign and verify JWTs with. */
  content: string;
  /** From when the secret may be used to sign, as an RFC 3339 timestamp. */
  active_at: string;
  /** Until when the secret may be used to verify, as an RFC 3339 timestamp. */
  expires_at: string;
}

/** The shared secrets of an extension. */
export interface ExtensionSecrets {
  /** Version of the layout of this object. */
  format_version: number;
  /** The secrets. Several overlap while a new one is being rolled out. */
  secrets: ExtensionSecret[];
}

/** Parameters of {@link ExtensionsApi.secrets}. */
export interface GetExtensionSecretsParams {
  /** ID of the extension whose secrets to read. */
  extension_id: string;
}

/** Parameters of {@link ExtensionsApi.createSecret}. */
export interface CreateExtensionSecretParams {
  /** ID of the extension that gets the new secret. */
  extension_id: string;
  /**
   * Seconds to wait before the new secret becomes active, so that running
   * copies of the extension have time to switch. 300 at least, which is also
   * the default.
   */
  delay?: number;
}

/** Parameters of {@link ExtensionsApi.sendChatMessage}. */
export interface SendExtensionChatMessageParams {
  /** Broadcaster who has the extension active, and whose chat receives the message. */
  broadcaster_id: string;
  /** The message, 280 characters at most. */
  text: string;
  /** ID of the extension that sends the message. */
  extension_id: string;
  /** Version of the extension. */
  extension_version: string;
}

/** Where an extension is in its review and release cycle. */
export type ExtensionState =
  | "Approved"
  | "AssetsUploaded"
  | "Deleted"
  | "Deprecated"
  | "InReview"
  | "InTest"
  | "PendingAction"
  | "Rejected"
  | "Released";

/** How an extension shows up in the mobile app. */
export interface ExtensionMobileView {
  /** URL of the HTML page shown to viewers on mobile. */
  viewer_url: string;
}

/** How an extension shows up in a panel slot, under the video. */
export interface ExtensionPanelView {
  /** URL of the HTML page shown to viewers. */
  viewer_url: string;
  /** Height of the panel, in pixels. */
  height: number;
  /** Whether the page may link to domains outside Twitch. */
  can_link_external_content: boolean;
}

/** How an extension shows up as an overlay on the whole video. */
export interface ExtensionVideoOverlayView {
  /** URL of the HTML page shown to viewers. */
  viewer_url: string;
  /** Whether the page may link to domains outside Twitch. */
  can_link_external_content: boolean;
}

/** How an extension shows up as a component on a part of the video. */
export interface ExtensionComponentView {
  /** URL of the HTML page shown to viewers. */
  viewer_url: string;
  /** Width part of the width to height ratio of the component. */
  aspect_ratio_x: number;
  /** Height part of the width to height ratio of the component. */
  aspect_ratio_y: number;
  /**
   * Whether Twitch zooms the component so that its inner size stays fixed.
   * When `false` the page has to be responsive.
   */
  autoscale: boolean;
  /** Base width, in pixels, used when `autoscale` is `true`. */
  scale_pixels: number;
  /** Height of the component, as a share of the tallest a component can be. */
  target_height: number;
  /** Whether the page may link to domains outside Twitch. */
  can_link_external_content: boolean;
}

/** The page broadcasters see while they configure an extension. */
export interface ExtensionConfigView {
  /** URL of the HTML page shown to the broadcaster. */
  viewer_url: string;
  /** Whether the page may link to domains outside Twitch. */
  can_link_external_content: boolean;
}

/** The views of an extension, one per place it can be shown in. A view the extension does not have is absent. */
export interface ExtensionViews {
  /** View used in the mobile app. */
  mobile?: ExtensionMobileView;
  /** View used in a panel slot. */
  panel?: ExtensionPanelView;
  /** View used in the overlay slot. */
  video_overlay?: ExtensionVideoOverlayView;
  /** View used in a component slot. */
  component?: ExtensionComponentView;
  /** View used in the Extension Manager. */
  config?: ExtensionConfigView;
}

/** The public description of one version of an extension. */
export interface ExtensionDetails {
  /** Name of the user or organisation that owns the extension. */
  author_name: string;
  /** Whether the extension has features that use Bits. */
  bits_enabled: boolean;
  /** Whether a user can install it. Usually `false` while it is tested with an allowlist. */
  can_install: boolean;
  /**
   * Where the configuration lives: `"hosted"` by Twitch, `"custom"` on the
   * extension's own backend, or `"none"` when there is nothing to configure.
   */
  configuration_location: "hosted" | "custom" | "none";
  /** Long description, shown on the details page. */
  description: string;
  /** URL of the terms of service. */
  eula_tos_url: string;
  /** Whether the extension can talk in the chat of the channels it is installed on. */
  has_chat_support: boolean;
  /** URL of the default icon. */
  icon_url: string;
  /** URLs of the icon in several sizes, keyed by size such as `"24x24"`. */
  icon_urls: Record<string, string>;
  /** ID of the extension. */
  id: string;
  /** Name of the extension. */
  name: string;
  /** URL of the privacy policy. */
  privacy_policy_url: string;
  /** Whether the extension asks viewers to share their Twitch identity. */
  request_identity_link: boolean;
  /** URLs of the screenshots shown in the marketplace. */
  screenshot_urls: string[];
  /** Where the extension is in its review and release cycle. */
  state: ExtensionState;
  /** Whether the extension can see the viewer's subscription level on the channel. */
  subscriptions_support_level: "none" | "optional";
  /** Short description shown to streamers in the Extension Manager. */
  summary: string;
  /** Email address users can write to for support. */
  support_email: string;
  /** Version number of the extension. */
  version: string;
  /** Short description shown to viewers on the channel. */
  viewer_summary: string;
  /** How the extension is displayed in each place it supports. */
  views: ExtensionViews;
  /** URLs allowed to display the configuration page. */
  allowlisted_config_urls: string[];
  /** URLs allowed to display the panel. */
  allowlisted_panel_urls: string[];
}

/** Parameters of {@link ExtensionsApi.get}. */
export interface GetExtensionParams {
  /** ID of the extension to get. */
  extension_id: string;
  /**
   * Version to get. Defaults to the latest released one, so it is needed for
   * an extension that was never released.
   */
  extension_version?: string;
}

/** Parameters of {@link ExtensionsApi.released}. */
export interface GetReleasedExtensionParams {
  /** ID of the extension to get. */
  extension_id: string;
  /** Version to get. Defaults to the latest one. */
  extension_version?: string;
}

/** The price of a Bits product. */
export interface ExtensionBitsProductCost {
  /** Price, in units of `type`. Between 1 and 10000 Bits. */
  amount: number;
  /** Currency of the price. */
  type: "bits";
}

/** Something viewers can buy with Bits inside an extension. */
export interface ExtensionBitsProduct {
  /** SKU of the product, unique within the extension. */
  sku: string;
  /** Price of the product. */
  cost: ExtensionBitsProductCost;
  /** Whether the product is still in development, and so hidden from the public. */
  in_development: boolean;
  /** Name of the product as the extension displays it. */
  display_name: string;
  /** When the product stops being sold, as an RFC 3339 timestamp. */
  expiration: string;
  /** Whether a purchase is announced to every instance of the extension on the channel. */
  is_broadcast: boolean;
}

/** Parameters of {@link ExtensionsApi.bitsProducts}. */
export interface GetExtensionBitsProductsParams {
  /** Also lists disabled and expired products. Twitch defaults to `false`. */
  should_include_all?: boolean;
}

/** Parameters of {@link ExtensionsApi.updateBitsProduct}. */
export interface UpdateExtensionBitsProductParams {
  /**
   * SKU of the product to create or update, 255 characters at most: letters,
   * digits, dashes, underscores and full stops. It can never be changed.
   */
  sku: string;
  /** Price of the product. */
  cost: ExtensionBitsProductCost;
  /** Name of the product as the extension displays it, 255 characters at most. */
  display_name: string;
  /** Keeps the product hidden from the public. Twitch defaults to `false`. */
  in_development?: boolean;
  /** When the product expires. Never, when left out. A date in the past disables it. */
  expiration?: string | Date;
  /** Announces purchases to every instance of the extension on the channel. Twitch defaults to `false`. */
  is_broadcast?: boolean;
}

/** Extensions: configuration, secrets, PubSub and chat messages, Bits products. */
export class ExtensionsApi extends ApiGroup {
  /**
   * Reads one or more configuration segments of an extension, in the order
   * you asked for them. Limited to 20 reads per minute for each segment.
   *
   * Token: signed extension JWT, passed with the `token` request option.
   *
   * @example
   * const [global] = await twitch.extensions.configuration(
   *   { extension_id, segment: "global" },
   *   { token: jwt },
   * );
   * @see https://dev.twitch.tv/docs/api/reference/#get-extension-configuration-segment
   */
  configuration(
    params: GetExtensionConfigurationParams,
    options?: RequestOptions,
  ): Promise<ExtensionConfigurationSegment[]> {
    return this.rest.data<ExtensionConfigurationSegment>({
      path: "extensions/configurations",
      query: params,
      options,
    });
  }

  /**
   * Writes a configuration segment. Copies of the extension that are already
   * running on a channel do not get the new content. Limited to 20 writes per
   * minute.
   *
   * Token: signed extension JWT, passed with the `token` request option.
   *
   * @example
   * await twitch.extensions.setConfiguration(
   *   { extension_id, segment: "global", version: "0.0.1", content: JSON.stringify({ theme: "dark" }) },
   *   { token: jwt },
   * );
   * @see https://dev.twitch.tv/docs/api/reference/#set-extension-configuration-segment
   */
  setConfiguration(params: SetExtensionConfigurationParams, options?: RequestOptions): Promise<void> {
    return this.rest.send({
      method: "PUT",
      path: "extensions/configurations",
      body: params,
      options,
    });
  }

  /**
   * Sets the required configuration string of a channel, for extensions that
   * must be configured by the broadcaster before they can be activated.
   *
   * Token: signed extension JWT, passed with the `token` request option.
   *
   * @example
   * await twitch.extensions.setRequiredConfiguration(
   *   { broadcaster_id: "141981764", extension_id, extension_version: "0.0.1", required_configuration: "v1" },
   *   { token: jwt },
   * );
   * @see https://dev.twitch.tv/docs/api/reference/#set-extension-required-configuration
   */
  setRequiredConfiguration(params: SetExtensionRequiredConfigurationParams, options?: RequestOptions): Promise<void> {
    const { broadcaster_id, ...body } = params;
    return this.rest.send({
      method: "PUT",
      path: "extensions/required_configuration",
      query: { broadcaster_id },
      body,
      options,
    });
  }

  /**
   * Pushes a message to the running copies of an extension: on one channel,
   * on every channel, or for a single viewer. Limited to 100 messages per
   * minute for each channel.
   *
   * Token: signed extension JWT, passed with the `token` request option. Its
   * `channel_id` and `pubsub_perms` claims must allow the targets.
   *
   * @example
   * await twitch.extensions.sendPubSub(
   *   { broadcaster_id: "141981764", target: ["broadcast"], message: JSON.stringify({ round: 2 }) },
   *   { token: jwt },
   * );
   * @see https://dev.twitch.tv/docs/api/reference/#send-extension-pubsub-message
   */
  sendPubSub(params: SendExtensionPubSubMessageParams, options?: RequestOptions): Promise<void> {
    return this.rest.send({
      method: "POST",
      path: "extensions/pubsub",
      body: params,
      options,
    });
  }

  /**
   * Lists the channels that are live with an extension installed or
   * activated. A channel can take a few minutes to appear or disappear.
   *
   * Token: app or user.
   *
   * @example
   * for await (const channel of twitch.extensions.liveChannels({ extension_id })) {
   *   console.log(channel.broadcaster_name, channel.title);
   * }
   * @see https://dev.twitch.tv/docs/api/reference/#get-extension-live-channels
   */
  liveChannels(params: GetExtensionLiveChannelsParams, options?: RequestOptions): Paginator<ExtensionLiveChannel> {
    return this.rest.paginate<ExtensionLiveChannel>({
      path: "extensions/live",
      query: params,
      options,
    });
  }

  /**
   * Gets the shared secrets of an extension.
   *
   * Token: signed extension JWT, passed with the `token` request option.
   *
   * @example
   * const { secrets } = await twitch.extensions.secrets({ extension_id }, { token: jwt });
   * @see https://dev.twitch.tv/docs/api/reference/#get-extension-secrets
   */
  secrets(params: GetExtensionSecretsParams, options?: RequestOptions): Promise<ExtensionSecrets> {
    return this.rest.one<ExtensionSecrets>({
      path: "extensions/jwt/secrets",
      query: params,
      options,
    });
  }

  /**
   * Creates a new shared secret. The current ones are retired once the new
   * one becomes active, so call this only when you are ready to switch.
   *
   * Token: signed extension JWT, passed with the `token` request option.
   *
   * @example
   * const { secrets } = await twitch.extensions.createSecret({ extension_id, delay: 600 }, { token: jwt });
   * @see https://dev.twitch.tv/docs/api/reference/#create-extension-secret
   */
  createSecret(params: CreateExtensionSecretParams, options?: RequestOptions): Promise<ExtensionSecrets> {
    return this.rest.one<ExtensionSecrets>({
      method: "POST",
      path: "extensions/jwt/secrets",
      query: params,
      options,
    });
  }

  /**
   * Posts a message in a channel's chat under the name of the extension. The
   * extension needs the chat capability. Limited to 12 messages per minute
   * for each channel.
   *
   * Token: signed extension JWT, passed with the `token` request option.
   *
   * @example
   * await twitch.extensions.sendChatMessage(
   *   { broadcaster_id: "141981764", text: "The poll is open.", extension_id, extension_version: "0.0.9" },
   *   { token: jwt },
   * );
   * @see https://dev.twitch.tv/docs/api/reference/#send-extension-chat-message
   */
  sendChatMessage(params: SendExtensionChatMessageParams, options?: RequestOptions): Promise<void> {
    const { broadcaster_id, ...body } = params;
    return this.rest.send({
      method: "POST",
      path: "extensions/chat",
      query: { broadcaster_id },
      body,
      options,
    });
  }

  /**
   * Gets the description of an extension, released or not. Resolves with
   * `null` when no version is given and the extension was never released.
   *
   * Token: signed extension JWT, passed with the `token` request option.
   *
   * @example
   * const extension = await twitch.extensions.get({ extension_id, extension_version: "0.0.9" }, { token: jwt });
   * @see https://dev.twitch.tv/docs/api/reference/#get-extensions
   */
  get(params: GetExtensionParams, options?: RequestOptions): Promise<ExtensionDetails | null> {
    return this.rest.first<ExtensionDetails>({
      path: "extensions",
      query: params,
      options,
    });
  }

  /**
   * Gets the description of a released extension. Fails with a 404 when the
   * extension does not exist or is not released.
   *
   * Token: app or user.
   *
   * @example
   * const extension = await twitch.extensions.released({ extension_id: "pgn0bjv51epi7eaekt53tovjnc82qo" });
   * console.log(extension.name, extension.version);
   * @see https://dev.twitch.tv/docs/api/reference/#get-released-extensions
   */
  released(params: GetReleasedExtensionParams, options?: RequestOptions): Promise<ExtensionDetails> {
    return this.rest.one<ExtensionDetails>({
      path: "extensions/released",
      query: params,
      options,
    });
  }

  /**
   * Lists the Bits products of the extension your client ID belongs to,
   * sorted by SKU.
   *
   * Token: app, issued for the client ID of the extension.
   *
   * @example
   * const products = await twitch.extensions.bitsProducts({ should_include_all: true });
   * @see https://dev.twitch.tv/docs/api/reference/#get-extension-bits-products
   */
  bitsProducts(params: GetExtensionBitsProductsParams = {}, options?: RequestOptions): Promise<ExtensionBitsProduct[]> {
    return this.rest.data<ExtensionBitsProduct>({
      path: "bits/extensions",
      query: params,
      auth: "app",
      options,
    });
  }

  /**
   * Creates a Bits product, or updates the one that already has this SKU.
   *
   * Token: app, issued for the client ID of the extension.
   *
   * @example
   * const product = await twitch.extensions.updateBitsProduct({
   *   sku: "rusty-crate",
   *   cost: { amount: 990, type: "bits" },
   *   display_name: "Rusty Crate",
   * });
   * @see https://dev.twitch.tv/docs/api/reference/#update-extension-bits-product
   */
  updateBitsProduct(params: UpdateExtensionBitsProductParams, options?: RequestOptions): Promise<ExtensionBitsProduct> {
    return this.rest.one<ExtensionBitsProduct>({
      method: "PUT",
      path: "bits/extensions",
      body: params,
      auth: "app",
      options,
    });
  }
}
