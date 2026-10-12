// Every snippet of the README, kept here so the compiler checks them.
// This file is not meant to be run.
import { Twitch, TwitchApiError, TwitchScopeError, type TokenStore, type UserToken } from "@ix-xs/twitch.api";

declare const clientId: string;
declare const clientSecret: string;
declare const channelId: string;
declare const spammerId: string;
declare const broadcaster_id: string;
declare const user_id: string;
declare const fiveHundredIds: string[];
declare const accessToken: string;
declare const refreshToken: string;
declare const code: string;
declare const state: string;
declare const db: {
  tokens: {
    find(id: string): UserToken | undefined;
    upsert(id: string, token: UserToken): void;
    remove(id: string): void;
    ids(): string[];
  };
};
interface Thing {
  id: string;
}

const twitch = new Twitch({ clientId, clientSecret, timeout: 15_000, retries: 3, rateLimit: "wait" });

export async function calling() {
  const user = (await twitch.users.getByLogin("twitchdev"))!;
  for await (const stream of twitch.streams.get({ language: "fr" })) console.log(stream.user_name, stream.viewer_count);
  const [channel] = await twitch.channels.get({ broadcaster_id: user.id });
  const games = await twitch.games.get({ name: ["Fortnite", "Minecraft"] });
  const clips = await twitch.clips.get({ broadcaster_id: user.id, first: 5 });
  const results = await twitch.search.channels({ query: "speedrun", live_only: true }).take(20);
  const followers = await twitch.channels.followers({ broadcaster_id: user.id }).total();
  const users = await twitch.users.get({ id: fiveHundredIds });
  const [a, b, c] = await Promise.all([
    twitch.users.getById("141981764"),
    twitch.users.getById("12826"),
    twitch.users.getById("57781936"),
  ]);
  return { channel, games, clips, results, followers, users, a, b, c };
}

export async function acting() {
  const bot = await twitch.auth.addUser({ accessToken, refreshToken });
  await twitch.chat.send({ broadcaster_id: channelId, message: "Hello chat" });
  await twitch.moderation.ban({ broadcaster_id: channelId, user_id: spammerId, duration: 600, reason: "Spam" });
  await twitch.polls.create({ title: "Next game?", choices: ["Hades", "Celeste"], duration: 120 });
  const asBot = twitch.as(bot.userId);
  await asBot.chat.send({ broadcaster_id: channelId, message: "Hello" });
  await twitch.chat.announce({ broadcaster_id: channelId, message: "Stream starts in 5" }, { as: bot.userId });
}

export async function tokens() {
  const url = twitch.auth.authorizeUrl({
    redirectUri: "https://example.com/auth/callback",
    scopes: ["user:read:chat", "user:write:chat", "moderator:manage:banned_users"],
    state,
  });
  const user = await twitch.auth.exchangeCode(code, "https://example.com/auth/callback");
  console.log(url, user.userId, user.login, user.scopes);
  const flow = await twitch.auth.deviceFlow({ scopes: ["user:read:chat", "user:write:chat"] });
  console.log(`Open ${flow.verificationUri} and confirm the code ${flow.userCode}`);
  await flow.wait();
  await twitch.auth.validate(accessToken);
  await twitch.auth.refresh(user.userId);
  await twitch.auth.revoke(accessToken);
  await twitch.auth.removeUser(user.userId, { revoke: true });
  const store: TokenStore = {
    get: (userId) => db.tokens.find(userId),
    set: (userId, token) => db.tokens.upsert(userId, token),
    delete: (userId) => db.tokens.remove(userId),
    list: () => db.tokens.ids(),
  };
  twitch.on("tokenRefresh", (token) => console.log(token.userId));
  twitch.on("tokenInvalid", (userId) => console.log(userId));
  return store;
}

export async function pagination() {
  const page = await twitch.streams.get({ game_id: "509658", first: 20 });
  console.log(page.data, page.cursor);
  await page.next();
  for await (const follower of twitch.channels.followers({ broadcaster_id })) console.log(follower.user_name);
  const all = await twitch.moderation.bans().all();
  const top = await twitch.streams.get().take(250);
  const first = await twitch.clips.get({ broadcaster_id }).first();
  const subscribers = await twitch.subscriptions.get().total();
  return { all, top, first, subscribers };
}

export function events(bot: UserToken) {
  const events = twitch.eventsub.websocket();
  events.on("channel.chat.message", { broadcaster_user_id: channelId, user_id: bot.userId }, async (event) => {
    if (event.message.text === "!ping") {
      await twitch.chat.send({
        broadcaster_id: event.broadcaster_user_id,
        message: "pong",
        reply_parent_message_id: event.message_id,
      });
    }
  });
  events.on("channel.follow", { broadcaster_user_id: channelId, moderator_user_id: bot.userId }, (event) => {
    console.log(`${event.user_name} followed`);
  });
  events.onError(console.error);
  events.on("channel.chat.notification", { broadcaster_user_id: channelId, user_id: bot.userId }, (event) => {
    if (event.notice_type === "resub") console.log(event.resub.cumulative_months);
    else if (event.notice_type === "raid") console.log(event.raid.viewer_count);
  });
  events.on("channel.moderate", { broadcaster_user_id: channelId, moderator_user_id: bot.userId }, (event) => {
    if (event.action === "timeout") console.log(event.timeout.user_name, event.timeout.expires_at);
  });
  events.on("channel.moderate@1", { broadcaster_user_id: channelId, moderator_user_id: bot.userId }, () => {});
  events.on("some.new.type@1", { broadcaster_user_id: channelId }, (event) => console.log(event));

  const hooks = twitch.eventsub.webhook({ callback: "https://example.com/twitch/eventsub", secret: "0123456789abcdef" });
  hooks.on("stream.online", { broadcaster_user_id: "141981764" }, (event) => {
    console.log(`${event.broadcaster_user_name} is live`);
  });
  const worker = { fetch: (request: Request) => hooks.handle(request) };
  const passive = twitch.eventsub.webhook({ callback: "https://example.com/twitch/eventsub", secret: "0123456789abcdef", subscribe: false });
  const cloudflare = {
    fetch: (request: Request, _env: unknown, ctx: { waitUntil(work: Promise<unknown>): void }) =>
      passive.handle(request, { waitUntil: (work) => ctx.waitUntil(work) }),
  };
  const node = hooks.nodeHandler();

  const conduit = twitch.eventsub.conduit();
  conduit.on("channel.chat.message", { broadcaster_user_id: channelId, user_id: bot.userId }, (event) => {
    console.log(event.chatter_user_name, event.message.text);
  });
  return { worker, node, cloudflare };
}

export async function managing() {
  const events = twitch.eventsub.websocket();
  const handle = events.on("stream.online", { broadcaster_user_id: channelId }, () => {});
  await handle.ready;
  await handle.stop();
  events.onRevocation((subscription) => console.log(subscription.type, subscription.status));
  const page = await twitch.eventsub.subscriptions({ status: "enabled" });
  console.log(page.raw.total_cost, "/", page.raw.max_total_cost);
}

export async function errors() {
  try {
    await twitch.moderation.ban({ broadcaster_id, user_id });
  } catch (error) {
    if (error instanceof TwitchScopeError) console.log("Ask the user for", error.required);
    else if (error instanceof TwitchApiError && error.status === 400) console.log(error.message);
    else throw error;
  }
  const controller = new AbortController();
  await twitch.streams.get({}, { signal: controller.signal, timeout: 5000 });
  twitch.on("request", ({ method, url, attempt, as }) => console.log(method, url, attempt, as));
  twitch.on("response", ({ method, url, status, duration, remaining }) => console.log(method, url, status, duration, remaining));
  twitch.on("rateLimit", ({ bucket, waitMs }) => console.log(bucket, waitMs));
  twitch.rateLimitOf();
  twitch.rateLimitOf(user_id);
}

export async function raw() {
  const body = await twitch.request<{ data: Thing[] }>({
    method: "POST",
    path: "some/new/endpoint",
    query: { broadcaster_id },
    body: { enabled: true },
    auth: "user",
    scopes: ["channel:manage:broadcast"],
    context: "broadcaster_id",
  });
  const things = await twitch.paginate<Thing>({ path: "some/new/list" }).all();
  return { body, things };
}

export async function migration(logins: string[]) {
  await twitch.users.get({ login: ["twitchdev"] });
  await twitch.streams.get({ user_login: logins });
  await twitch.bits.cheermotes();
  await twitch.chat.globalEmotes();
  await twitch.chat.channelEmotes({ broadcaster_id });
  await twitch.chat.globalBadges();
  await twitch.chat.channelBadges({ broadcaster_id });
  await twitch.chat.settings({ broadcaster_id });
  await twitch.chat.colors({ user_id });
  await twitch.clips.get({ broadcaster_id });
  await twitch.games.top();
  await twitch.games.get({ name: logins });
  await twitch.videos.get({ user_id });
}
