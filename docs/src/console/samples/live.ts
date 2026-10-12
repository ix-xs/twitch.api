import type { Twitch } from "@ix-xs/twitch.api";

declare const twitch: Twitch;
declare const callback: string;
declare const secret: string;
declare function notify(text: string): void;
// ---
const hooks = twitch.eventsub.webhook({ callback, secret });

hooks.on(
  "stream.online",
  { broadcaster_user_id: "141981764" },
  (event) => {
    notify(`${event.broadcaster_user_name} is live`);
  },
);

// Signatures are verified before your handler runs.
export default {
  fetch: (request: Request) => hooks.handle(request),
};
