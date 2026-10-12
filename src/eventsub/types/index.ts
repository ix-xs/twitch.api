import { TwitchEventSubError } from "../../errors.js";
import { type ActivityEventSubTypes, activityVersions } from "./activity.js";
import { type ChannelEventSubTypes, channelVersions } from "./channel.js";
import { type ChatEventSubTypes, chatVersions } from "./chat.js";

export * from "./activity.js";
export * from "./channel.js";
export * from "./chat.js";
export * from "./common.js";

/**
 * Every EventSub subscription type, with its condition and its event.
 *
 * A type that exists in several versions is listed under its plain name for
 * the newest version and under `"<type>@<version>"` for the older ones.
 */
export interface EventSubTypes extends ActivityEventSubTypes, ChannelEventSubTypes, ChatEventSubTypes {}

/** Name of a subscription type known to the library. */
export type EventSubType = keyof EventSubTypes;

/** Condition to provide when subscribing to `T`. */
export type EventSubCondition<T extends EventSubType> = EventSubTypes[T]["condition"];

/** Event delivered by a subscription to `T`. */
export type EventSubEvent<T extends EventSubType> = EventSubTypes[T]["event"];

/** Version sent to Twitch for each known subscription type. */
export const EVENTSUB_VERSIONS: { readonly [T in EventSubType]: EventSubTypes[T]["version"] } = {
  ...activityVersions,
  ...channelVersions,
  ...chatVersions,
};

/**
 * Splits a map key into the name and version Twitch expects:
 * `"channel.moderate@1"` gives `channel.moderate` version `1`. A type the
 * library does not know yet must carry its version the same way.
 */
export function resolveEventSubType(key: string): { type: string; version: string } {
  const at = key.lastIndexOf("@");
  if (at > 0) return { type: key.slice(0, at), version: key.slice(at + 1) };
  const version = (EVENTSUB_VERSIONS as Record<string, string | undefined>)[key];
  if (version === undefined) {
    throw new TwitchEventSubError(`Unknown EventSub type "${key}". For a type newer than this library, write "${key}@<version>".`);
  }
  return { type: key, version };
}
