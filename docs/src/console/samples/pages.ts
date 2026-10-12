import type { Twitch } from "@ix-xs/twitch.api";

declare const twitch: Twitch;
// ---
// 250 streams: three requests, one array.
const top = await twitch.streams.get({ language: "fr" }).take(250);

for (const stream of top.slice(0, 3)) {
  console.log(stream.user_name, stream.viewer_count);
}

// Or walk every page without holding them all in memory.
for await (const stream of twitch.streams.get({ language: "fr" })) {
  if (stream.viewer_count < 1000) break;
}
