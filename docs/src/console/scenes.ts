// The four examples of the home page console: the code shown, and the output
// the console plays next to it. The code comes from real files under
// `samples/`, compiled against the library with the rest of the project, so an
// example can never drift from the API. The output is scripted: it shows what
// the library does, with invented data.
import type { UiKey } from "../i18n";
import chat from "./samples/chat.ts?raw";
import live from "./samples/live.ts?raw";
import lookup from "./samples/lookup.ts?raw";
import pages from "./samples/pages.ts?raw";

/** A sentence in each language of the site. */
type Text = { en: string; fr: string };

export type Line = { /** Milliseconds after the previous line. */ after: number } & (
  | { kind: "call"; method: "GET" | "POST" | "PATCH" | "DELETE"; path: string; status: number }
  | { kind: "note"; text: Text }
  | { kind: "log"; text: string }
  | { kind: "event"; name: string; detail: string }
  | { kind: "chat"; from: string; hue: number; text: string; bot?: boolean }
);

export interface Scene {
  id: string;
  label: UiKey;
  code: string;
  lines: Line[];
  /** Whether the visitor can type in the simulated chat once the scene has played. */
  interactive?: boolean;
}

/** Keeps what follows the `// ---` line: the part above only sets the stage for the compiler. */
function shown(source: string): string {
  const marker = source.indexOf("// ---");
  return source.slice(marker < 0 ? 0 : source.indexOf("\n", marker) + 1).trim();
}

export const SCENES: Scene[] = [
  {
    id: "lookup",
    label: "console.lookup",
    code: shown(lookup),
    lines: [
      { after: 250, kind: "note", text: { en: "No token yet: one is requested, once.", fr: "Pas encore de jeton : il est demandé, une seule fois." } },
      { after: 350, kind: "call", method: "POST", path: "id.twitch.tv/oauth2/token", status: 200 },
      { after: 300, kind: "call", method: "GET", path: "/users?login=twitchdev", status: 200 },
      { after: 300, kind: "call", method: "GET", path: "/channels?broadcaster_id=141981764", status: 200 },
      { after: 300, kind: "call", method: "GET", path: "/channels/followers?broadcaster_id=141981764&first=1", status: 200 },
      { after: 350, kind: "log", text: '"Building the next thing" 2841907' },
    ],
  },
  {
    id: "pages",
    label: "console.pages",
    code: shown(pages),
    lines: [
      { after: 250, kind: "call", method: "GET", path: "/streams?language=fr&first=100", status: 200 },
      { after: 280, kind: "call", method: "GET", path: "/streams?language=fr&first=100&after=eyJiIjp7Ik9m...", status: 200 },
      { after: 280, kind: "call", method: "GET", path: "/streams?language=fr&first=100&after=eyJiIjp7IkN1...", status: 200 },
      { after: 300, kind: "note", text: { en: "250 collected, the rest of the third page is dropped.", fr: "250 collectés, le reste de la troisième page est écarté." } },
      { after: 300, kind: "log", text: "nuit_blanche 18204" },
      { after: 120, kind: "log", text: "atelier_pixel 9311" },
      { after: 120, kind: "log", text: "LeGrandFroid 7754" },
    ],
  },
  {
    id: "chat",
    label: "console.chat",
    code: shown(chat),
    interactive: true,
    lines: [
      { after: 250, kind: "note", text: { en: "WebSocket open, session welcomed.", fr: "WebSocket ouvert, session accueillie." } },
      { after: 300, kind: "call", method: "POST", path: "/eventsub/subscriptions", status: 202 },
      { after: 500, kind: "chat", from: "marguerite", hue: 150, text: "hello everyone" },
      { after: 600, kind: "chat", from: "kowalczyk_dev", hue: 30, text: "is the bot awake?" },
      { after: 500, kind: "chat", from: "kowalczyk_dev", hue: 30, text: "!ping" },
      { after: 250, kind: "call", method: "POST", path: "/chat/messages", status: 200 },
      { after: 200, kind: "chat", from: "your_bot", hue: 265, text: "pong", bot: true },
    ],
  },
  {
    id: "live",
    label: "console.live",
    code: shown(live),
    lines: [
      { after: 250, kind: "call", method: "POST", path: "/eventsub/subscriptions", status: 202 },
      { after: 400, kind: "note", text: { en: "Twitch checks the callback: challenge answered.", fr: "Twitch vérifie le callback : défi relevé." } },
      { after: 700, kind: "event", name: "stream.online", detail: "TwitchDev" },
      { after: 250, kind: "note", text: { en: "Signature valid, not a replay, not a duplicate.", fr: "Signature valide, ni rejeu ni doublon." } },
      { after: 300, kind: "log", text: "notify: TwitchDev is live" },
    ],
  },
];
