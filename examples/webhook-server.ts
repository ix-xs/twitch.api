// Stream notifications over webhooks, with only an app token.
// The callback must be a public HTTPS URL on port 443 that reaches this server.
// Run: TWITCH_CLIENT_ID=... TWITCH_CLIENT_SECRET=... EVENTSUB_SECRET=... CALLBACK_URL=https://... npx tsx examples/webhook-server.ts
import { createServer } from "node:http";
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
});

const hooks = twitch.eventsub.webhook({
  callback: process.env.CALLBACK_URL!,
  secret: process.env.EVENTSUB_SECRET!,
});
hooks.onError((error) => console.error(error.message));
hooks.onRevocation((subscription) => console.warn(`Revoked: ${subscription.type} (${subscription.status})`));

const channels = await twitch.users.get({ login: ["twitchdev", "twitch"] });
for (const channel of channels) {
  hooks.on("stream.online", { broadcaster_user_id: channel.id }, (event) => {
    console.log(`${event.broadcaster_user_name} went live at ${event.started_at}`);
  });
  hooks.on("stream.offline", { broadcaster_user_id: channel.id }, (event) => {
    console.log(`${event.broadcaster_user_name} went offline`);
  });
}

createServer(hooks.nodeHandler()).listen(3000, () => console.log("Waiting for Twitch on port 3000"));
