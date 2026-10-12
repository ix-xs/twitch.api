import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { verifyEventSubSignature } from "../../src/index.js";
import { createTestClient } from "../helpers.js";

const secret = "a-very-secret-value";
const callback = "https://example.com/twitch";
const condition = { broadcaster_user_id: "1" };

const subscription = (status = "enabled") => ({
  id: "sub-1",
  status,
  type: "stream.online",
  version: "1",
  condition,
  created_at: "2026-01-01T00:00:00Z",
  transport: { method: "webhook", callback },
  cost: 1,
});

/** Builds a delivery signed the way Twitch signs it. */
function delivery(type: string, payload: object, options: { id?: string; at?: Date; key?: string } = {}): Request {
  const id = options.id ?? `msg-${Math.random()}`;
  const timestamp = (options.at ?? new Date()).toISOString();
  const body = JSON.stringify(payload);
  const signature = `sha256=${createHmac("sha256", options.key ?? secret).update(id + timestamp + body).digest("hex")}`;
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

function setup(options: { subscribe?: boolean } = {}) {
  const t = createTestClient();
  const hooks = t.twitch.eventsub.webhook({ callback, secret, ...options });
  return { t, hooks };
}

describe("EventSub over webhooks", () => {
  it("creates the subscription with the app token, then waits for the challenge", async () => {
    const { t, hooks } = setup();
    t.reply({ data: [subscription("webhook_callback_verification_pending")] });
    const handle = hooks.on("stream.online", condition, () => {});
    let ready = false;
    void handle.ready.then(() => (ready = true));
    await vi.waitFor(() => expect(t.calls).toHaveLength(1));
    expect(t.last()).toMatchObject({
      method: "POST",
      path: "eventsub/subscriptions",
      token: "app-token",
      body: { type: "stream.online", version: "1", condition, transport: { method: "webhook", callback, secret } },
    });
    expect(ready).toBe(false);

    const response = await hooks.handle(
      delivery("webhook_callback_verification", { challenge: "pogchamp-kappa-360noscope", subscription: subscription() }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/plain");
    expect(await response.text()).toBe("pogchamp-kappa-360noscope");
    await handle.ready;
  });

  it("delivers a signed notification to the typed handler", async () => {
    const { t, hooks } = setup();
    t.reply({ data: [subscription()] });
    const seen: string[] = [];
    const handle = hooks.on("stream.online", condition, (event, meta) => {
      seen.push(`${event.broadcaster_user_login}:${event.type}:${meta.messageId}`);
    });
    await handle.ready;
    const response = await hooks.handle(
      delivery("notification", { subscription: subscription(), event: { broadcaster_user_login: "ana", type: "live" } }, { id: "m1" }),
    );
    expect(response.status).toBe(204);
    expect(seen).toEqual(["ana:live:m1"]);
  });

  it("rejects a bad signature, a missing header and a stale delivery", async () => {
    const { t, hooks } = setup();
    t.reply({ data: [subscription()] });
    const handler = vi.fn();
    await hooks.on("stream.online", condition, handler).ready;
    const payload = { subscription: subscription(), event: {} };

    expect((await hooks.handle(delivery("notification", payload, { key: "another-secret" }))).status).toBe(403);
    expect((await hooks.handle(new Request(callback, { method: "POST", body: "{}" }))).status).toBe(400);
    const old = new Date(Date.now() - 11 * 60_000);
    expect((await hooks.handle(delivery("notification", payload, { at: old }))).status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });

  it("acknowledges a redelivery without running handlers twice", async () => {
    const { t, hooks } = setup();
    t.reply({ data: [subscription()] });
    const handler = vi.fn();
    await hooks.on("stream.online", condition, handler).ready;
    const payload = { subscription: subscription(), event: {} };
    await hooks.handle(delivery("notification", payload, { id: "same" }));
    const again = await hooks.handle(delivery("notification", payload, { id: "same" }));
    expect(again.status).toBe(204);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("drops a revoked subscription", async () => {
    const { t, hooks } = setup();
    t.reply({ data: [subscription()] });
    const revoked: string[] = [];
    hooks.onRevocation((sub) => revoked.push(sub.status));
    await hooks.on("stream.online", condition, () => {}).ready;
    await hooks.handle(delivery("revocation", { subscription: subscription("authorization_revoked") }));
    expect(revoked).toEqual(["authorization_revoked"]);
    expect(hooks.size).toBe(0);
  });

  it("treats an existing subscription (409) as ready", async () => {
    const { t, hooks } = setup();
    t.reply({ error: "Conflict", status: 409, message: "subscription already exists" }, { status: 409 });
    await hooks.on("stream.online", condition, () => {}).ready;
    expect(hooks.size).toBe(1);
  });

  it("only receives when subscribe is false", async () => {
    const { t, hooks } = setup({ subscribe: false });
    const handler = vi.fn();
    await hooks.on("stream.online", condition, handler).ready;
    expect(t.calls).toHaveLength(0);
    await hooks.handle(delivery("notification", { subscription: subscription(), event: {} }));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("deletes the subscription when its last handler stops", async () => {
    const { t, hooks } = setup();
    t.reply({ data: [subscription()] });
    const handle = hooks.on("stream.online", condition, () => {});
    await handle.ready;
    t.reply(undefined);
    await handle.stop();
    expect(t.last()).toMatchObject({ method: "DELETE", path: "eventsub/subscriptions", query: { id: "sub-1" }, token: "app-token" });
  });

  it("passes batched events through (drop.entitlement.grant)", async () => {
    const { t, hooks } = setup();
    const drops = { ...subscription(), type: "drop.entitlement.grant", condition: { organization_id: "o1" } };
    t.reply({ data: [drops] });
    const sizes: number[] = [];
    await hooks.on("drop.entitlement.grant", { organization_id: "o1" }, (events) => {
      sizes.push(events.length);
    }).ready;
    expect(t.last().body).toMatchObject({ type: "drop.entitlement.grant", is_batching_enabled: true });
    await hooks.handle(delivery("notification", { subscription: drops, events: [{ id: "a", data: {} }, { id: "b", data: {} }] }));
    expect(sizes).toEqual([2]);
  });

  it("serves Node.js requests: raw stream, raw body, and refuses a parsed body", async () => {
    const { t, hooks } = setup();
    t.reply({ data: [subscription()] });
    const handler = vi.fn();
    await hooks.on("stream.online", condition, handler).ready;
    const errors: Error[] = [];
    hooks.onError((error) => errors.push(error));
    const node = hooks.nodeHandler();

    const toNode = async (request: Request, body?: unknown) => {
      const text = await request.text();
      const headers: Record<string, string> = {};
      request.headers.forEach((value, key) => (headers[key] = value));
      const req = {
        headers,
        body,
        async *[Symbol.asyncIterator]() {
          yield Buffer.from(text.slice(0, 10));
          yield Buffer.from(text.slice(10));
        },
      };
      const res = { status: 0, body: undefined as string | undefined, writeHead(status: number) { this.status = status; }, end(data?: string) { this.body = data; } };
      await node(req, res);
      return res;
    };

    const payload = { subscription: subscription(), event: {} };
    expect((await toNode(delivery("notification", payload))).status).toBe(204);
    expect(handler).toHaveBeenCalledTimes(1);

    const raw = delivery("notification", payload);
    const rawText = await raw.clone().text();
    expect((await toNode(raw, Buffer.from(rawText))).status).toBe(204);
    expect(handler).toHaveBeenCalledTimes(2);

    expect((await toNode(delivery("notification", payload), payload)).status).toBe(500);
    expect(errors[0]?.message).toMatch(/already parsed/);
  });

  it("refuses a secret Twitch would reject", () => {
    const t = createTestClient();
    expect(() => t.twitch.eventsub.webhook({ callback, secret: "short" })).toThrow(/10 to 100/);
  });

  it("verifyEventSubSignature works on its own", async () => {
    const body = '{"hello":"world"}';
    const signature = `sha256=${createHmac("sha256", secret).update("id" + "ts" + body).digest("hex")}`;
    expect(await verifyEventSubSignature({ secret, messageId: "id", timestamp: "ts", signature, body })).toBe(true);
    expect(await verifyEventSubSignature({ secret, messageId: "id", timestamp: "ts", signature, body: body + " " })).toBe(false);
    expect(await verifyEventSubSignature({ secret, messageId: "id", timestamp: "ts", signature: null, body })).toBe(false);
  });
});

describe("eventsub subscriptions API", () => {
  it("subscribe: resolves the version and picks the token from the transport", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [subscription()] });
    await t.twitch.eventsub.subscribe({
      type: "channel.follow",
      condition: { broadcaster_user_id: "1", moderator_user_id: "100" },
      transport: { method: "websocket", session_id: "s1" },
    });
    expect(t.last()).toMatchObject({ token: "token-of-100", body: { type: "channel.follow", version: "2" } });

    t.reply({ data: [subscription()] });
    await t.twitch.eventsub.subscribe({ type: "some.future.type@3", condition: { a: "b" }, transport: { method: "conduit", conduit_id: "c" } });
    expect(t.last()).toMatchObject({ token: "app-token", body: { type: "some.future.type", version: "3" } });
  });

  it("subscriptions: paginates without a page size and exposes the totals", async () => {
    const t = createTestClient();
    t.reply({ data: [subscription()], total: 1, total_cost: 1, max_total_cost: 10000, pagination: { cursor: "c" } });
    t.reply({ data: [], total: 1, total_cost: 1, max_total_cost: 10000, pagination: {} });
    const all = await t.twitch.eventsub.subscriptions({ status: "enabled" }).all();
    expect(all).toHaveLength(1);
    expect(t.calls[0]?.query).toEqual({ status: "enabled" });
    expect(t.calls[1]?.query).toEqual({ status: "enabled", after: "c" });
    t.reply({ data: [], total: 0, total_cost: 0, max_total_cost: 10000 });
    expect((await t.twitch.eventsub.subscriptions()).raw.max_total_cost).toBe(10000);
  });

  it("unsubscribe", async () => {
    const t = createTestClient();
    t.reply(undefined);
    await t.twitch.eventsub.unsubscribe("sub-1");
    expect(t.last()).toMatchObject({ method: "DELETE", path: "eventsub/subscriptions", query: { id: "sub-1" } });
  });

  it("rejects an unknown type without a version", () => {
    const t = createTestClient();
    expect(() =>
      // @ts-expect-error unknown types must carry their version
      t.twitch.eventsub.subscribe({ type: "nope.nope", condition: {}, transport: { method: "conduit", conduit_id: "c" } }),
    ).toThrow(/@<version>/);
  });
});
