import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EventSubWebSocket, WebSocketLike } from "../../src/index.js";
import { createTestClient, type TestClient } from "../helpers.js";

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

  receive(type: string, payload: object, id = `msg-${Math.random()}`): void {
    this.onmessage?.({
      data: JSON.stringify({ metadata: { message_id: id, message_type: type, message_timestamp: "2026-01-01T00:00:00Z" }, payload }),
    });
  }

  welcome(sessionId: string): void {
    this.receive("session_welcome", { session: { id: sessionId, keepalive_timeout_seconds: 10, reconnect_url: null } });
  }

  drop(): void {
    this.onclose?.({ code: 1006, reason: "" });
  }
}

const follow = { broadcaster_user_id: "1", moderator_user_id: "100" };
const online = { broadcaster_user_id: "1" };
const sub = (id: string, type = "channel.follow", condition: object = follow, version = "2") => ({
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
const posts = () => t.calls.filter((call) => call.method === "POST" && call.path === "eventsub/subscriptions");

beforeEach(async () => {
  vi.useFakeTimers();
  FakeSocket.all = [];
  t = createTestClient();
  await t.addUser("100");
  events = t.twitch.eventsub.websocket({ webSocket: FakeSocket });
  events.onError(() => {});
});

afterEach(() => {
  events.close();
  vi.useRealTimers();
});

describe("WebSocket listener, hard cases", () => {
  it("keeps the process alive while it waits to reconnect", async () => {
    const handle = events.on("channel.follow", follow, () => {});
    t.reply({ data: [sub("sub-1")] });
    FakeSocket.all[0]!.welcome("s1");
    await handle.ready;
    const spy = vi.spyOn(globalThis, "setTimeout");
    FakeSocket.all[0]!.drop();
    const timer = spy.mock.results.at(-1)?.value as { hasRef?: () => boolean } | undefined;
    spy.mockRestore();
    expect(timer?.hasRef?.()).toBe(true);
  });

  it("deletes a subscription whose handler stopped while it was being created", async () => {
    const first = events.on("channel.follow", follow, () => {});
    t.reply({ data: [sub("sub-1")] });
    FakeSocket.all[0]!.welcome("s1");
    await first.ready;

    t.reply({ data: [sub("sub-2", "stream.online", online, "1")] });
    const second = events.on("stream.online", online, () => {});
    const stopped = second.stop();
    await expect(second.ready).rejects.toThrow(/removed before Twitch confirmed/);
    await stopped;
    await flush();
    const deletes = t.calls.filter((call) => call.method === "DELETE");
    expect(deletes).toHaveLength(1);
    expect(deletes[0]?.query).toEqual({ id: "sub-2" });

    // Subscribing again later works: nothing was left behind.
    t.reply({ data: [sub("sub-3", "stream.online", online, "1")] });
    await events.on("stream.online", online, () => {}).ready;
  });

  it("retries a subscription after a temporary failure instead of dropping the handler", async () => {
    const handler = vi.fn();
    const handle = events.on("channel.follow", follow, handler);
    t.reply({ message: "Service Unavailable" }, { status: 503 });
    t.reply({ data: [sub("sub-1")] });
    FakeSocket.all[0]!.welcome("s1");
    await flush();
    expect(posts()).toHaveLength(1);
    expect(events.size).toBe(1);
    await vi.advanceTimersByTimeAsync(600);
    await handle.ready;
    expect(posts()).toHaveLength(2);
    FakeSocket.all[0]!.receive("notification", { subscription: sub("sub-1"), event: {} });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("gives up on a subscription Twitch keeps answering 429 to", async () => {
    const handle = events.on("channel.follow", follow, () => {});
    const outcome = handle.ready.then(
      () => "ready",
      (error: Error) => error.message,
    );
    // Each attempt is retried by the request pipeline first, then by the listener.
    for (let i = 0; i < 40; i++) t.reply({ error: "Too Many Requests", status: 429, message: "subscription limit reached" }, { status: 429 });
    FakeSocket.all[0]!.welcome("s1");
    for (let i = 0; i < 60; i++) {
      await vi.advanceTimersByTimeAsync(5000);
      FakeSocket.all.at(-1)!.receive("session_keepalive", {});
    }
    expect(await outcome).toMatch(/subscription limit reached/);
    expect(events.size).toBe(0);
  });

  it("leaves the entry for the next session when Twitch says the session is gone", async () => {
    const handle = events.on("channel.follow", follow, () => {});
    t.reply({ error: "Bad Request", status: 400, message: "websocket transport session does not exist or has already disconnected" }, { status: 400 });
    FakeSocket.all[0]!.welcome("s1");
    await flush();
    expect(events.size).toBe(1);
    FakeSocket.all[0]!.drop();
    await vi.advanceTimersByTimeAsync(600);
    t.reply({ data: [sub("sub-1")] });
    FakeSocket.all[1]!.welcome("s2");
    await handle.ready;
    expect(posts()).toHaveLength(2);
  });

  it("subscribes once when on() is called from an onConnect listener", async () => {
    let inner: ReturnType<EventSubWebSocket["on"]> | undefined;
    events.onConnect(() => {
      inner ??= events.on("stream.online", online, () => {});
    });
    const outer = events.on("channel.follow", follow, () => {});
    t.reply({ data: [sub("sub-1")] });
    t.reply({ data: [sub("sub-2", "stream.online", online, "1")] });
    FakeSocket.all[0]!.welcome("s1");
    await outer.ready;
    await inner!.ready;
    expect(posts()).toHaveLength(2);
    expect(events.size).toBe(2);
  });

  it("rejects ready when the listener is closed before Twitch confirmed", async () => {
    const handle = events.on("channel.follow", follow, () => {});
    events.close();
    await expect(handle.ready).rejects.toThrow(/removed before Twitch confirmed/);
  });
});

describe("conduit listener, hard cases", () => {
  it("accepts on() while the shard is still being bound", async () => {
    const conduit = t.twitch.eventsub.conduit({ webSocket: FakeSocket, conduitId: "c1" });
    conduit.onError(() => {});
    const first = conduit.on("stream.online", online, () => {});
    FakeSocket.all[0]!.welcome("s1");
    // The shard update has not answered yet when the second handler arrives.
    const second = conduit.on("stream.offline", online, () => {});
    t.reply({ data: [] });
    t.reply({ data: [sub("sub-1", "stream.online", online, "1")] });
    t.reply({ data: [sub("sub-2", "stream.offline", online, "1")] });
    await Promise.all([first.ready, second.ready]);
    expect(posts()).toHaveLength(2);
    conduit.close();
  });

  it("keeps trying to bind the shard after a temporary failure, on the same session", async () => {
    const conduit = t.twitch.eventsub.conduit({ webSocket: FakeSocket });
    const errors: Error[] = [];
    conduit.onError((error) => errors.push(error));
    const handle = conduit.on("stream.online", online, () => {});
    for (let i = 0; i < 4; i++) t.reply({ message: "boom" }, { status: 500 });
    t.reply({ data: [{ id: "c9", shard_count: 1 }] });
    t.reply({ data: [] });
    t.reply({ data: [sub("sub-1", "stream.online", online, "1")] });
    FakeSocket.all[0]!.welcome("s1");
    await vi.advanceTimersByTimeAsync(9000);
    await handle.ready;
    expect(FakeSocket.all).toHaveLength(1);
    expect(t.calls.filter((call) => call.method === "GET" && call.path === "eventsub/conduits")).toHaveLength(5);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toMatch(/Could not bind/);
    conduit.close();
  });

  it("fails the pending subscriptions when the shard can never be bound", async () => {
    const conduit = t.twitch.eventsub.conduit({ webSocket: FakeSocket, conduitId: "c1", shardId: "9" });
    conduit.onError(() => {});
    const handle = conduit.on("stream.online", online, () => {});
    t.reply({ data: [], errors: [{ id: "9", message: "shard id is out of range", code: "invalid_parameter" }] });
    FakeSocket.all[0]!.welcome("s1");
    await expect(handle.ready).rejects.toThrow(/out of range/);
    expect(conduit.size).toBe(0);
    expect(FakeSocket.all[0]!.closed).toBe(true);
  });

  it("learns the ID of an existing subscription from its first event, so stop() can delete it", async () => {
    const conduit = t.twitch.eventsub.conduit({ webSocket: FakeSocket, conduitId: "c1" });
    const handle = conduit.on("stream.online", online, () => {});
    t.reply({ data: [] });
    t.reply({ error: "Conflict", status: 409, message: "subscription already exists" }, { status: 409 });
    FakeSocket.all[0]!.welcome("s1");
    await handle.ready;
    FakeSocket.all[0]!.receive("notification", { subscription: sub("existing", "stream.online", online, "1"), event: {} });
    t.reply(undefined);
    await handle.stop();
    expect(t.last()).toMatchObject({ method: "DELETE", query: { id: "existing" }, token: "app-token" });
  });
});

describe("listeners and the client", () => {
  it("closes its WebSocket listeners with twitch.close()", async () => {
    const handle = events.on("channel.follow", follow, () => {});
    t.reply({ data: [sub("sub-1")] });
    FakeSocket.all[0]!.welcome("s1");
    await handle.ready;
    t.twitch.close();
    expect(FakeSocket.all[0]!.closed).toBe(true);
    expect(events.connected).toBe(false);
  });

  it("reports a rejected onConnect listener instead of leaving it unhandled", async () => {
    const custom = t.twitch.eventsub.websocket({ webSocket: FakeSocket });
    const errors: Error[] = [];
    custom.onError((error) => errors.push(error));
    custom.onConnect(async () => {
      throw new Error("listener broke");
    });
    const handle = custom.on("channel.follow", follow, () => {});
    t.reply({ data: [sub("sub-1")] });
    FakeSocket.all.at(-1)!.welcome("s9");
    await handle.ready;
    await flush();
    expect(errors.map((error) => error.message)).toEqual(["listener broke"]);
    custom.close();
  });

  it("closes a connection whose only subscription was refused", async () => {
    const handle = events.on("channel.follow", follow, () => {});
    t.reply({ error: "Forbidden", status: 403, message: "subscription missing proper authorization" }, { status: 403 });
    FakeSocket.all[0]!.welcome("s1");
    await expect(handle.ready).rejects.toThrow(/authorization/);
    await flush();
    expect(FakeSocket.all[0]!.closed).toBe(true);
    expect(events.connected).toBe(false);
  });
});

describe("webhook listener, hard cases", () => {
  it("answers 400 to a signed body that is not an EventSub message", async () => {
    vi.useRealTimers();
    const hooks = t.twitch.eventsub.webhook({ callback: "https://example.com/twitch", secret: "a-very-secret-value", subscribe: false });
    const id = "odd";
    const timestamp = new Date().toISOString();
    const body = JSON.stringify({ hello: "world" });
    const signature = `sha256=${createHmac("sha256", "a-very-secret-value").update(id + timestamp + body).digest("hex")}`;
    const response = await hooks.handle(
      new Request("https://example.com/twitch", {
        method: "POST",
        body,
        headers: {
          "Twitch-Eventsub-Message-Id": id,
          "Twitch-Eventsub-Message-Timestamp": timestamp,
          "Twitch-Eventsub-Message-Signature": signature,
          "Twitch-Eventsub-Message-Type": "notification",
        },
      }),
    );
    expect(response.status).toBe(400);
  });

  const secret = "a-very-secret-value";
  const callback = "https://example.com/twitch";
  const hookSub = (status = "enabled") => ({ ...sub("hook-1", "stream.online", online, "1"), status, transport: { method: "webhook", callback } });

  function delivery(type: string, payload: object, id: string): Request {
    const timestamp = new Date().toISOString();
    const body = JSON.stringify(payload);
    const signature = `sha256=${createHmac("sha256", secret).update(id + timestamp + body).digest("hex")}`;
    return new Request(callback, {
      method: "POST",
      body,
      headers: {
        "Twitch-Eventsub-Message-Id": id,
        "Twitch-Eventsub-Message-Timestamp": timestamp,
        "Twitch-Eventsub-Message-Signature": signature,
        "Twitch-Eventsub-Message-Type": type,
      },
    });
  }

  it("hands the handlers' work to waitUntil", async () => {
    vi.useRealTimers();
    const hooks = t.twitch.eventsub.webhook({ callback, secret, subscribe: false });
    let finished = false;
    await hooks.on("stream.online", online, async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      finished = true;
    }).ready;
    const pending: Promise<unknown>[] = [];
    const response = await hooks.handle(delivery("notification", { subscription: hookSub(), event: {} }, "m1"), {
      waitUntil: (work) => pending.push(work),
    });
    expect(response.status).toBe(204);
    expect(finished).toBe(false);
    expect(pending).toHaveLength(1);
    await pending[0];
    expect(finished).toBe(true);
  });

  it("remembers message IDs for the whole replay window, whatever the traffic", async () => {
    vi.useRealTimers();
    const hooks = t.twitch.eventsub.webhook({ callback, secret, subscribe: false });
    const handler = vi.fn();
    await hooks.on("stream.online", online, handler).ready;
    const payload = { subscription: hookSub(), event: {} };
    await hooks.handle(delivery("notification", payload, "first"));
    for (let i = 0; i < 2500; i++) await hooks.handle(delivery("notification", payload, `filler-${i}`));
    await hooks.handle(delivery("notification", payload, "first"));
    expect(handler).toHaveBeenCalledTimes(2501);
  }, 60_000);

  it("gives up waiting for the challenge and explains why", async () => {
    const hooks = t.twitch.eventsub.webhook({ callback, secret });
    const errors: Error[] = [];
    hooks.onError((error) => errors.push(error));
    t.reply({ data: [hookSub("webhook_callback_verification_pending")] });
    const handle = hooks.on("stream.online", online, () => {});
    const outcome = handle.ready.then(
      () => "ready",
      (error: Error) => error.message,
    );
    await vi.advanceTimersByTimeAsync(61_000);
    expect(await outcome).toMatch(/did not verify the callback/);
    expect(errors).toHaveLength(1);
    expect(hooks.size).toBe(1);
  });

  it("learns the ID of an existing subscription from its first notification", async () => {
    vi.useRealTimers();
    const hooks = t.twitch.eventsub.webhook({ callback, secret });
    t.reply({ error: "Conflict", status: 409, message: "subscription already exists" }, { status: 409 });
    const handle = hooks.on("stream.online", online, () => {});
    await handle.ready;
    await hooks.handle(delivery("notification", { subscription: hookSub(), event: {} }, "m1"));
    t.reply(undefined);
    await handle.stop();
    expect(t.last()).toMatchObject({ method: "DELETE", query: { id: "hook-1" } });
  });
});
