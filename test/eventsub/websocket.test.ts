import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import type { EventSubWebSocket, WebSocketLike } from "../../src/index.js";
import { createTestClient, type TestClient } from "../helpers.js";

/** A WebSocket the test drives by hand. */
class FakeSocket implements WebSocketLike {
  static all: FakeSocket[] = [];
  onopen: WebSocketLike["onopen"] = null;
  onmessage: WebSocketLike["onmessage"] = null;
  onclose: WebSocketLike["onclose"] = null;
  onerror: WebSocketLike["onerror"] = null;
  closed = false;

  constructor(readonly url: string) {
    FakeSocket.all.push(this);
  }

  close(): void {
    this.closed = true;
  }

  /** Simulates a frame sent by Twitch. */
  receive(type: string, payload: object, id = `msg-${Math.random()}`): void {
    this.onmessage?.({
      data: JSON.stringify({
        metadata: { message_id: id, message_type: type, message_timestamp: "2026-01-01T00:00:00Z" },
        payload,
      }),
    });
  }

  welcome(sessionId: string, keepalive = 10): void {
    this.receive("session_welcome", {
      session: { id: sessionId, status: "connected", keepalive_timeout_seconds: keepalive, reconnect_url: null },
    });
  }

  /** Simulates the connection dropping. */
  drop(code = 1006): void {
    this.onclose?.({ code, reason: "" });
  }
}

const follow = { broadcaster_user_id: "1", moderator_user_id: "100" };
const subscriptionOf = (id: string, type = "channel.follow", condition: object = follow, version = "2") => ({
  id,
  status: "enabled",
  type,
  version,
  condition,
  created_at: "2026-01-01T00:00:00Z",
  transport: { method: "websocket", session_id: "s1" },
  cost: 0,
});

let t: TestClient;
let events: EventSubWebSocket;
const flush = () => vi.advanceTimersByTimeAsync(0);

beforeEach(async () => {
  vi.useFakeTimers();
  FakeSocket.all = [];
  t = createTestClient();
  await t.addUser("100");
  events = t.twitch.eventsub.websocket({ webSocket: FakeSocket });
});

afterEach(() => {
  events.close();
  vi.useRealTimers();
});

describe("EventSub over WebSocket", () => {
  it("connects on the first handler, subscribes after the welcome and delivers typed events", async () => {
    const received: string[] = [];
    expect(FakeSocket.all).toHaveLength(0);
    const handle = events.on("channel.follow", follow, (event, meta) => {
      expectTypeOf(event.user_name).toEqualTypeOf<string>();
      received.push(`${event.user_name}:${meta.type}:${meta.messageId}`);
    });
    expect(FakeSocket.all).toHaveLength(1);
    expect(FakeSocket.all[0]?.url).toBe("wss://eventsub.wss.twitch.tv/ws");
    expect(t.calls).toHaveLength(0);

    t.reply({ data: [subscriptionOf("sub-1")] });
    FakeSocket.all[0]!.welcome("s1");
    await handle.ready;
    expect(t.last()).toMatchObject({
      method: "POST",
      path: "eventsub/subscriptions",
      token: "token-of-100",
      body: { type: "channel.follow", version: "2", condition: follow, transport: { method: "websocket", session_id: "s1" } },
    });
    expect(events.connected).toBe(true);
    expect(events.sessionIds).toEqual(["s1"]);

    FakeSocket.all[0]!.receive("notification", { subscription: subscriptionOf("sub-1"), event: { user_name: "Ana" } }, "m1");
    expect(received).toEqual(["Ana:channel.follow:m1"]);
  });

  it("ignores a notification delivered twice", async () => {
    const handler = vi.fn();
    const handle = events.on("channel.follow", follow, handler);
    t.reply({ data: [subscriptionOf("sub-1")] });
    FakeSocket.all[0]!.welcome("s1");
    await handle.ready;
    const payload = { subscription: subscriptionOf("sub-1"), event: {} };
    FakeSocket.all[0]!.receive("notification", payload, "dup");
    FakeSocket.all[0]!.receive("notification", payload, "dup");
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("shares one subscription between handlers of the same type and condition", async () => {
    const a = vi.fn();
    const b = vi.fn();
    const first = events.on("channel.follow", follow, a);
    const second = events.on("channel.follow", { moderator_user_id: "100", broadcaster_user_id: "1" }, b);
    t.reply({ data: [subscriptionOf("sub-1")] });
    FakeSocket.all[0]!.welcome("s1");
    await Promise.all([first.ready, second.ready]);
    expect(t.calls).toHaveLength(1);
    FakeSocket.all[0]!.receive("notification", { subscription: subscriptionOf("sub-1"), event: {} });
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);

    await first.stop();
    expect(t.calls).toHaveLength(1);
    t.reply(undefined);
    await second.stop();
    expect(t.last()).toMatchObject({ method: "DELETE", path: "eventsub/subscriptions", query: { id: "sub-1" }, token: "token-of-100" });
    expect(FakeSocket.all[0]!.closed).toBe(true);
    expect(events.size).toBe(0);
  });

  it("subscribes right away when the session already exists", async () => {
    const first = events.on("channel.follow", follow, () => {});
    t.reply({ data: [subscriptionOf("sub-1")] });
    FakeSocket.all[0]!.welcome("s1");
    await first.ready;
    t.reply({ data: [subscriptionOf("sub-2", "stream.online", { broadcaster_user_id: "1" }, "1")] });
    const second = events.on("stream.online", { broadcaster_user_id: "1" }, () => {});
    await second.ready;
    expect(FakeSocket.all).toHaveLength(1);
    expect(t.last().body).toMatchObject({ type: "stream.online", version: "1" });
  });

  it("uses the older version when the type is written with @version", async () => {
    const handle = events.on("channel.moderate@1", { broadcaster_user_id: "1", moderator_user_id: "100" }, () => {});
    t.reply({ data: [subscriptionOf("sub-1", "channel.moderate", { broadcaster_user_id: "1", moderator_user_id: "100" }, "1")] });
    FakeSocket.all[0]!.welcome("s1");
    await handle.ready;
    expect(t.last().body).toMatchObject({ type: "channel.moderate", version: "1" });
  });

  it("reports a refused subscription on ready and on onError, and drops it", async () => {
    const errors: Error[] = [];
    events.onError((error) => errors.push(error));
    const handle = events.on("channel.follow", follow, () => {});
    t.reply({ error: "Forbidden", status: 403, message: "subscription missing proper authorization" }, { status: 403 });
    FakeSocket.all[0]!.welcome("s1");
    await expect(handle.ready).rejects.toThrow(/missing proper authorization/);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toContain("channel.follow");
    expect(events.size).toBe(0);
  });

  it("follows a reconnect request without subscribing again", async () => {
    const handler = vi.fn();
    const sessions: string[] = [];
    events.onConnect((id) => sessions.push(id));
    const handle = events.on("channel.follow", follow, handler);
    t.reply({ data: [subscriptionOf("sub-1")] });
    const old = FakeSocket.all[0]!;
    old.welcome("s1");
    await handle.ready;

    old.receive("session_reconnect", { session: { id: "s1", reconnect_url: "wss://eventsub.wss.twitch.tv/ws?again=1" } });
    expect(FakeSocket.all).toHaveLength(2);
    const next = FakeSocket.all[1]!;
    expect(next.url).toBe("wss://eventsub.wss.twitch.tv/ws?again=1");
    expect(old.closed).toBe(false);
    old.receive("notification", { subscription: subscriptionOf("sub-1"), event: {} });
    expect(handler).toHaveBeenCalledTimes(1);

    next.welcome("s2");
    await flush();
    expect(old.closed).toBe(true);
    expect(events.sessionIds).toEqual(["s2"]);
    expect(sessions).toEqual(["s1", "s2"]);
    expect(t.calls).toHaveLength(1);
    next.receive("notification", { subscription: subscriptionOf("sub-1"), event: {} });
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("reconnects and subscribes again after the connection drops", async () => {
    const drops: boolean[] = [];
    events.onDisconnect((info) => drops.push(info.willReconnect));
    const handler = vi.fn();
    const handle = events.on("channel.follow", follow, handler);
    t.reply({ data: [subscriptionOf("sub-1")] });
    FakeSocket.all[0]!.welcome("s1");
    await handle.ready;

    FakeSocket.all[0]!.drop();
    expect(drops).toEqual([true]);
    expect(events.connected).toBe(false);
    await vi.advanceTimersByTimeAsync(600);
    expect(FakeSocket.all).toHaveLength(2);

    t.reply({ data: [subscriptionOf("sub-2")] });
    FakeSocket.all[1]!.welcome("s2");
    await flush();
    expect(t.calls).toHaveLength(2);
    expect(t.last().body).toMatchObject({ transport: { session_id: "s2" } });
    FakeSocket.all[1]!.receive("notification", { subscription: subscriptionOf("sub-2"), event: {} });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("treats a silent connection as lost once the keepalive window has passed", async () => {
    const handle = events.on("channel.follow", follow, () => {});
    t.reply({ data: [subscriptionOf("sub-1")] });
    FakeSocket.all[0]!.welcome("s1", 10);
    await handle.ready;
    await vi.advanceTimersByTimeAsync(9000);
    FakeSocket.all[0]!.receive("session_keepalive", {});
    await vi.advanceTimersByTimeAsync(14_000);
    expect(FakeSocket.all).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1500);
    expect(FakeSocket.all[0]!.closed).toBe(true);
    await vi.advanceTimersByTimeAsync(600);
    expect(FakeSocket.all).toHaveLength(2);
  });

  it("drops a revoked subscription and tells the listeners", async () => {
    const revoked: string[] = [];
    events.onRevocation((subscription) => revoked.push(subscription.status));
    const handler = vi.fn();
    const handle = events.on("channel.follow", follow, handler);
    t.reply({ data: [subscriptionOf("sub-1")] });
    FakeSocket.all[0]!.welcome("s1");
    await handle.ready;
    FakeSocket.all[0]!.receive("revocation", { subscription: { ...subscriptionOf("sub-1"), status: "authorization_revoked" } });
    expect(revoked).toEqual(["authorization_revoked"]);
    expect(events.size).toBe(0);
  });

  it("reports handler failures without breaking delivery", async () => {
    const errors: Error[] = [];
    events.onError((error) => errors.push(error));
    const handle = events.on("channel.follow", follow, async () => {
      throw new Error("handler broke");
    });
    t.reply({ data: [subscriptionOf("sub-1")] });
    FakeSocket.all[0]!.welcome("s1");
    await handle.ready;
    FakeSocket.all[0]!.receive("notification", { subscription: subscriptionOf("sub-1"), event: {} });
    await flush();
    expect(errors.map((error) => error.message)).toEqual(["handler broke"]);
  });

  it("passes the keepalive option in the URL", () => {
    const custom = t.twitch.eventsub.websocket({ webSocket: FakeSocket, keepalive: 30 });
    custom.on("channel.follow", follow, () => {});
    expect(FakeSocket.all.at(-1)?.url).toBe("wss://eventsub.wss.twitch.tv/ws?keepalive_timeout_seconds=30");
    custom.close();
  });
});

describe("EventSub over a conduit shard", () => {
  it("binds the session to the shard, subscribes with the app token and keeps subscriptions across reconnects", async () => {
    const conduit = t.twitch.eventsub.conduit({ webSocket: FakeSocket, conduitId: "c1", shardId: "2" });
    const handler = vi.fn();
    const handle = conduit.on("stream.online", { broadcaster_user_id: "1" }, handler);
    t.reply({ data: [{ id: "2", status: "enabled", transport: { method: "websocket", session_id: "s1" } }] });
    t.reply({ data: [subscriptionOf("sub-1", "stream.online", { broadcaster_user_id: "1" }, "1")] });
    FakeSocket.all[0]!.welcome("s1");
    await handle.ready;

    expect(t.calls[0]).toMatchObject({
      method: "PATCH",
      path: "eventsub/conduits/shards",
      token: "app-token",
      body: { conduit_id: "c1", shards: [{ id: "2", transport: { method: "websocket", session_id: "s1" } }] },
    });
    expect(t.calls[1]).toMatchObject({
      method: "POST",
      path: "eventsub/subscriptions",
      token: "app-token",
      body: { type: "stream.online", transport: { method: "conduit", conduit_id: "c1" } },
    });

    FakeSocket.all[0]!.drop();
    await vi.advanceTimersByTimeAsync(600);
    t.reply({ data: [] });
    FakeSocket.all[1]!.welcome("s2");
    await flush();
    expect(t.calls).toHaveLength(3);
    expect(t.calls[2]).toMatchObject({ path: "eventsub/conduits/shards", body: { shards: [{ transport: { session_id: "s2" } }] } });
    FakeSocket.all[1]!.receive("notification", {
      subscription: subscriptionOf("sub-1", "stream.online", { broadcaster_user_id: "1" }, "1"),
      event: {},
    });
    expect(handler).toHaveBeenCalledTimes(1);
    conduit.close();
  });

  it("finds or creates a conduit when none is given, and accepts an existing subscription", async () => {
    const conduit = t.twitch.eventsub.conduit({ webSocket: FakeSocket });
    const handle = conduit.on("stream.online", { broadcaster_user_id: "1" }, () => {});
    t.reply({ data: [] });
    t.reply({ data: [{ id: "new-conduit", shard_count: 1 }] });
    t.reply({ data: [] });
    t.reply({ error: "Conflict", status: 409, message: "subscription already exists" }, { status: 409 });
    FakeSocket.all[0]!.welcome("s1");
    await handle.ready;
    expect(t.calls.map((call) => `${call.method} ${call.path}`)).toEqual([
      "GET eventsub/conduits",
      "POST eventsub/conduits",
      "PATCH eventsub/conduits/shards",
      "POST eventsub/subscriptions",
    ]);
    expect(t.calls[1]?.body).toEqual({ shard_count: 1 });
    conduit.close();
  });
});
