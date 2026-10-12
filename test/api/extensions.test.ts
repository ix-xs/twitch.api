import { describe, expect, it } from "vitest";
import { createTestClient } from "../helpers.js";

const jwt = "signed.extension.jwt";
const secrets = { format_version: 1, secrets: [{ content: "s3", active_at: "2024-01-01T00:00:00Z", expires_at: "2124-01-01T00:00:00Z" }] };
const product = { sku: "crate", cost: { amount: 50, type: "bits" }, display_name: "Crate" };

describe("extensions", () => {
  it("configuration: repeats segment in the query and sends the JWT as is", async () => {
    const t = createTestClient();
    const segments = [
      { segment: "broadcaster", broadcaster_id: "7", content: "a", version: "1" },
      { segment: "developer", broadcaster_id: "7", content: "b", version: "1" },
    ];
    t.reply({ data: segments });
    const result = await t.twitch.extensions.configuration(
      { extension_id: "ext", segment: ["broadcaster", "developer"], broadcaster_id: "7" },
      { token: jwt },
    );
    expect(result).toEqual(segments);
    expect(t.last()).toMatchObject({
      method: "GET",
      path: "extensions/configurations",
      query: { extension_id: "ext", segment: ["broadcaster", "developer"], broadcaster_id: "7" },
      token: jwt,
    });
    expect(t.last().body).toBeUndefined();
  });

  it("setConfiguration: PUT with everything in the body", async () => {
    const t = createTestClient();
    t.reply(undefined);
    const params = { extension_id: "ext", segment: "global", version: "2", content: "hi" } as const;
    expect(await t.twitch.extensions.setConfiguration(params, { token: jwt })).toBeUndefined();
    expect(t.last()).toMatchObject({ method: "PUT", path: "extensions/configurations", query: {}, body: params, token: jwt });
  });

  it("setRequiredConfiguration: broadcaster_id in the query, the rest in the body", async () => {
    const t = createTestClient();
    t.reply(undefined);
    await t.twitch.extensions.setRequiredConfiguration(
      { broadcaster_id: "7", extension_id: "ext", extension_version: "1.0.0", required_configuration: "v1" },
      { token: jwt },
    );
    const call = t.last();
    expect(call).toMatchObject({ method: "PUT", path: "extensions/required_configuration", token: jwt });
    expect(call.query).toEqual({ broadcaster_id: "7" });
    expect(call.body).toEqual({ extension_id: "ext", extension_version: "1.0.0", required_configuration: "v1" });
  });

  it("sendPubSub: POST with a JSON body", async () => {
    const t = createTestClient();
    t.reply(undefined);
    await t.twitch.extensions.sendPubSub(
      { broadcaster_id: "7", target: ["broadcast", "whisper-12"], message: "ping" },
      { token: jwt },
    );
    const call = t.last();
    expect(call).toMatchObject({ method: "POST", path: "extensions/pubsub", query: {}, token: jwt });
    expect(call.body).toEqual({ broadcaster_id: "7", target: ["broadcast", "whisper-12"], message: "ping" });

    t.reply(undefined);
    await t.twitch.extensions.sendPubSub({ target: ["global"], is_global_broadcast: true, message: "all" }, { token: jwt });
    expect(t.last().body).toEqual({ target: ["global"], is_global_broadcast: true, message: "all" });
  });

  it("liveChannels: one page when awaited, with the app token", async () => {
    const t = createTestClient();
    t.reply({ data: [{ broadcaster_id: "7", title: "hello" }], pagination: "c1" });
    const page = await t.twitch.extensions.liveChannels({ extension_id: "ext", first: 5 });
    expect(page.data).toEqual([{ broadcaster_id: "7", title: "hello" }]);
    expect(page.cursor).toBe("c1");
    expect(t.last()).toMatchObject({
      method: "GET",
      path: "extensions/live",
      query: { extension_id: "ext", first: "5" },
      token: "app-token",
    });
  });

  it("liveChannels: follows the string cursor until it is empty", async () => {
    const t = createTestClient();
    t.reply({ data: [{ broadcaster_id: "7" }], pagination: "c1" });
    t.reply({ data: [{ broadcaster_id: "8" }], pagination: "" });
    const ids: string[] = [];
    for await (const channel of t.twitch.extensions.liveChannels({ extension_id: "ext" })) ids.push(channel.broadcaster_id);
    expect(ids).toEqual(["7", "8"]);
    expect(t.calls).toHaveLength(2);
    expect(t.calls[0]?.query).toEqual({ extension_id: "ext", first: "100" });
    expect(t.calls[1]?.query).toEqual({ extension_id: "ext", first: "100", after: "c1" });
  });

  it("secrets: returns the secrets object", async () => {
    const t = createTestClient();
    t.reply({ data: [secrets] });
    expect(await t.twitch.extensions.secrets({ extension_id: "ext" }, { token: jwt })).toEqual(secrets);
    expect(t.last()).toMatchObject({
      method: "GET",
      path: "extensions/jwt/secrets",
      query: { extension_id: "ext" },
      token: jwt,
    });
  });

  it("createSecret: POST with extension_id and delay in the query", async () => {
    const t = createTestClient();
    t.reply({ data: [secrets] });
    expect(await t.twitch.extensions.createSecret({ extension_id: "ext", delay: 600 }, { token: jwt })).toEqual(secrets);
    const call = t.last();
    expect(call).toMatchObject({ method: "POST", path: "extensions/jwt/secrets", token: jwt });
    expect(call.query).toEqual({ extension_id: "ext", delay: "600" });
    expect(call.body).toBeUndefined();
  });

  it("sendChatMessage: broadcaster_id in the query, the message in the body", async () => {
    const t = createTestClient();
    t.reply(undefined);
    await t.twitch.extensions.sendChatMessage(
      { broadcaster_id: "7", text: "hello chat", extension_id: "ext", extension_version: "1.0.0" },
      { token: jwt },
    );
    const call = t.last();
    expect(call).toMatchObject({ method: "POST", path: "extensions/chat", token: jwt });
    expect(call.query).toEqual({ broadcaster_id: "7" });
    expect(call.body).toEqual({ text: "hello chat", extension_id: "ext", extension_version: "1.0.0" });
  });

  it("get: returns the extension, or null when the list is empty", async () => {
    const t = createTestClient();
    t.reply({ data: [{ id: "ext", version: "1.0.0" }] });
    const found = await t.twitch.extensions.get({ extension_id: "ext", extension_version: "1.0.0" }, { token: jwt });
    expect(found).toEqual({ id: "ext", version: "1.0.0" });
    expect(t.last()).toMatchObject({
      method: "GET",
      path: "extensions",
      query: { extension_id: "ext", extension_version: "1.0.0" },
      token: jwt,
    });

    t.reply({ data: [] });
    expect(await t.twitch.extensions.get({ extension_id: "ext" }, { token: jwt })).toBeNull();
    expect(t.last().query).toEqual({ extension_id: "ext" });
  });

  it("released: uses the app token", async () => {
    const t = createTestClient();
    t.reply({ data: [{ id: "ext", state: "Released" }] });
    expect(await t.twitch.extensions.released({ extension_id: "ext" })).toEqual({ id: "ext", state: "Released" });
    expect(t.last()).toMatchObject({
      method: "GET",
      path: "extensions/released",
      query: { extension_id: "ext" },
      token: "app-token",
    });
  });

  it("bitsProducts: app token even when a user is registered", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [product] });
    expect(await t.twitch.extensions.bitsProducts({ should_include_all: true })).toEqual([product]);
    expect(t.last()).toMatchObject({
      method: "GET",
      path: "bits/extensions",
      query: { should_include_all: "true" },
      token: "app-token",
    });

    await t.twitch.extensions.bitsProducts();
    expect(t.last().query).toEqual({});
  });

  it("updateBitsProduct: PUT with a JSON body, returns the product", async () => {
    const t = createTestClient();
    await t.addUser("100");
    t.reply({ data: [product] });
    const result = await t.twitch.extensions.updateBitsProduct({
      sku: "crate",
      cost: { amount: 50, type: "bits" },
      display_name: "Crate",
      expiration: new Date("2030-01-02T03:04:05.000Z"),
    });
    expect(result).toEqual(product);
    const call = t.last();
    expect(call).toMatchObject({ method: "PUT", path: "bits/extensions", query: {}, token: "app-token" });
    expect(call.body).toEqual({
      sku: "crate",
      cost: { amount: 50, type: "bits" },
      display_name: "Crate",
      expiration: "2030-01-02T03:04:05.000Z",
    });
  });
});
