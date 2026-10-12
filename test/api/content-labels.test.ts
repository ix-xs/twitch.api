import { describe, expect, it } from "vitest";
import { createTestClient } from "../helpers.js";

describe("content-labels", () => {
  it("list: sends the locale and returns the labels", async () => {
    const t = createTestClient();
    const label = { id: "Gambling", name: "Jeux d'argent", description: "Paris avec de l'argent." };
    t.reply({ data: [label] });
    expect(await t.twitch.contentLabels.list({ locale: "fr-FR" })).toEqual([label]);
    expect(t.last()).toMatchObject({ method: "GET", path: "content_classification_labels", token: "app-token" });
    expect(t.last().query).toEqual({ locale: "fr-FR" });
  });

  it("list: works without parameters", async () => {
    const t = createTestClient();
    expect(await t.twitch.contentLabels.list()).toEqual([]);
    expect(t.last().query).toEqual({});
    expect(t.last().body).toBeUndefined();
  });
});
