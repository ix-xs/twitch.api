import type { Twitch } from "@ix-xs/twitch.api";

declare const twitch: Twitch;
declare const channel: string;
declare const bot: string;
// ---
const events = twitch.eventsub.websocket();

events.on(
  "channel.chat.message",
  { broadcaster_user_id: channel, user_id: bot },
  async (event) => {
    if (event.message.text !== "!ping") return;
    await twitch.chat.send({
      broadcaster_id: channel,
      message: "pong",
      reply_parent_message_id: event.message_id,
    });
  },
);
