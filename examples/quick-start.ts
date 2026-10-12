// Public data with nothing but a client ID and a client secret.
// Run: TWITCH_CLIENT_ID=... TWITCH_CLIENT_SECRET=... npx tsx examples/quick-start.ts twitchdev
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
});

const login = process.argv[2] ?? "twitchdev";
const user = await twitch.users.getByLogin(login);
if (!user) throw new Error(`No user named ${login}`);

const [[channel], followers, [stream]] = await Promise.all([
  twitch.channels.get({ broadcaster_id: user.id }),
  twitch.channels.followers({ broadcaster_id: user.id }).total(),
  twitch.streams.get({ user_id: user.id }).take(1),
]);

console.log(`${user.display_name} (${user.broadcaster_type || "regular"}), ${followers} followers`);
console.log(`Title: ${channel?.title}`);
console.log(stream ? `Live with ${stream.viewer_count} viewers on ${stream.game_name}` : "Offline");

console.log("\nMost watched categories right now:");
for (const game of await twitch.games.top().take(5)) console.log(` - ${game.name}`);

twitch.close();
