import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { UserToken } from "../../src/index.js";
import { FileTokenStore } from "../../src/node.js";
import { createTestClient } from "../helpers.js";

let dir: string;
const token = (userId: string): UserToken => ({ userId, accessToken: `a-${userId}`, refreshToken: `r-${userId}`, scopes: ["user:read:follows"] });

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "twitch-api-"));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("FileTokenStore", () => {
  it("starts empty, then saves, lists and deletes", async () => {
    const store = new FileTokenStore(join(dir, "nested", "tokens.json"));
    expect(await store.list()).toEqual([]);
    expect(await store.get("1")).toBeUndefined();
    await store.set("1", token("1"));
    await store.set("2", token("2"));
    expect(await store.list()).toEqual(["1", "2"]);
    await store.delete("1");
    const onDisk = JSON.parse(await readFile(store.path, "utf8")) as Record<string, UserToken>;
    expect(Object.keys(onDisk)).toEqual(["2"]);
  });

  it("survives a restart and concurrent writes", async () => {
    const path = join(dir, "tokens.json");
    const first = new FileTokenStore(path);
    await Promise.all(Array.from({ length: 20 }, (_, i) => first.set(String(i), token(String(i)))));
    const second = new FileTokenStore(path);
    expect(await second.list()).toHaveLength(20);
    expect(await second.get("7")).toEqual(token("7"));
  });

  it("feeds the client: tokens are restored and refreshed tokens are written back", async () => {
    const path = join(dir, "tokens.json");
    await new FileTokenStore(path).set("100", token("100"));
    const store = new FileTokenStore(path);
    const t = createTestClient({ tokens: store });
    await t.twitch.streams.followed();
    expect(t.last().token).toBe("a-100");
    await t.twitch.auth.refresh("100");
    const reread = await new FileTokenStore(path).get("100");
    expect(reread?.accessToken).toBe("refreshed-r-100");
  });
});
