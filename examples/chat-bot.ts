// A chat bot over EventSub WebSocket. The first run asks you to authorize the
// bot account in your browser, then tokens are kept in tokens.json.
// Run: TWITCH_CLIENT_ID=... npx tsx examples/chat-bot.ts <channel login>
import { Twitch } from "@ix-xs/twitch.api";
import { FileTokenStore } from "@ix-xs/twitch.api/node";

const twitch = new Twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  tokens: new FileTokenStore("./tokens.json"),
});

let [bot] = await twitch.auth.restore();
if (!bot) {
  const flow = await twitch.auth.deviceFlow({ scopes: ["user:read:chat", "user:write:chat", "user:bot"] });
  console.log(`Open ${flow.verificationUri} and confirm the code ${flow.userCode}`);
  bot = await flow.wait();
}
const me = bot;
console.log(`Signed in as ${me.login}`);

const channel = await twitch.users.getByLogin(process.argv[2] ?? me.login!);
if (!channel) throw new Error("Unknown channel");

const events = twitch.eventsub.websocket();
events.onError((error) => console.error(error.message));
events.onConnect(() => console.log(`Listening to #${channel.login}`));

events.on("channel.chat.message", { broadcaster_user_id: channel.id, user_id: me.userId }, async (event) => {
  console.log(`${event.chatter_user_name}: ${event.message.text}`);
  if (event.chatter_user_id === me.userId) return;

  if (event.message.text.trim() === "!ping") {
    await twitch.chat.send({
      broadcaster_id: event.broadcaster_user_id,
      message: "pong",
      reply_parent_message_id: event.message_id,
    });
  }
});

events.on("channel.chat.notification", { broadcaster_user_id: channel.id, user_id: me.userId }, (event) => {
  if (event.notice_type === "resub") console.log(`${event.chatter_user_name}: ${event.resub.cumulative_months} months`);
  else if (event.notice_type === "raid") console.log(`Raid of ${event.raid.viewer_count} from ${event.raid.user_name}`);
});
