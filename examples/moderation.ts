// Acting as a moderator: the acting user never has to be repeated.
// Run after examples/chat-bot.ts has created tokens.json, with a token that has the moderation scopes.
import { Twitch, TwitchApiError, TwitchScopeError } from "@ix-xs/twitch.api";
import { FileTokenStore } from "@ix-xs/twitch.api/node";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  tokens: new FileTokenStore("./tokens.json"),
});
const [moderator] = await twitch.auth.restore();
if (!moderator) throw new Error("Run examples/chat-bot.ts first to sign in.");

const broadcaster_id = process.argv[2] ?? moderator.userId;

try {
  const chatters = await twitch.chat.chatters({ broadcaster_id }).all();
  console.log(`${chatters.length} people in chat`);

  for await (const ban of twitch.moderation.bans({ broadcaster_id })) {
    console.log(`${ban.user_name} banned by ${ban.moderator_name}: ${ban.reason || "no reason"}`);
  }

  const settings = await twitch.chat.updateSettings({ broadcaster_id, slow_mode: true, slow_mode_wait_time: 10 });
  console.log(`Slow mode: ${settings.slow_mode_wait_time}s`);

  const poll = await twitch.polls.create({ title: "Next game?", choices: ["Hades", "Celeste"], duration: 60 });
  console.log(`Poll ${poll.id} is ${poll.status}`);
} catch (error) {
  if (error instanceof TwitchScopeError) console.error(`Missing scope, one of: ${error.required.join(", ")}`);
  else if (error instanceof TwitchApiError) console.error(`${error.status}: ${error.message}`);
  else throw error;
} finally {
  twitch.close();
}
