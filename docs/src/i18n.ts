// The words of the site's own interface (header, search, landing page), in
// each language. Starlight translates its own; page content is translated in
// `src/content/docs/<language>/`.
import { withBase, withLocale } from "../plugins/base-links.mjs";

const en = {
  // Header
  "nav.sections": "Sections",
  "nav.docs": "Docs",
  "nav.recipes": "Recipes",
  "nav.reference": "Reference",
  "nav.github": "GitHub repository",
  "nav.theme": "Switch between dark and light",
  "nav.language": "Language",

  // Names of the parts of the documentation, as the sidebar writes them
  "area.start": "Start",
  "area.reference": "Reference",
  "area.basics": "Basics",
  "area.auth": "Authentication",
  "area.events": "Events",
  "area.recipes": "Recipes",

  // Search
  "search.recent": "Recently opened",
  "search.clear": "Clear",
  "search.start": "Start here",
  "search.try": "Try a search",
  "search.query": "rate limit",
  "search.move": "move",
  "search.open": "open",
  "search.close": "close",

  // Landing page: opening
  "hero.eyebrow": "A Twitch API client for JavaScript and TypeScript",
  "hero.copy": "Copy the install command",
  "hero.facts": "Open source, MIT|Node 22 and later|No dependency",

  // Landing page: console
  "console.label": "Examples",
  "console.simulated": "Simulated output",
  "console.run": "Run",
  "console.again": "Run again",
  "console.lookup": "Look up",
  "console.pages": "Every page",
  "console.chat": "Chat bot",
  "console.live": "Go live",
  "console.say": "Say something in chat",
  "console.send": "Send",
  "console.hint": "Try !ping",
  "console.you": "you",
  "console.output": "Output",

  // Landing page: endpoint finder
  "finder.label": "Search the API",
  "finder.placeholder": "ban, clip, follow, chat message...",
  "finder.count": "{methods} methods and {events} event types",
  "finder.none": "Nothing matches “{query}”. Twitch may call it something else: browse the groups.",
  "finder.groups": "Browse the groups",
  "finder.event": "event",
  "finder.token.app": "app token",
  "finder.token.user": "user token",
  "finder.token.any": "app or user token",
  "finder.token.other": "extension JWT",
  "finder.more": "{count} more. Keep typing to narrow it down.",
} as const;

export type UiKey = keyof typeof en;

const fr: Record<UiKey, string> = {
  "nav.sections": "Rubriques",
  "nav.docs": "Docs",
  "nav.recipes": "Recettes",
  "nav.reference": "Référence",
  "nav.github": "Dépôt GitHub",
  "nav.theme": "Basculer entre sombre et clair",
  "nav.language": "Langue",

  "area.start": "Démarrer",
  "area.reference": "Référence",
  "area.basics": "Bases",
  "area.auth": "Authentification",
  "area.events": "Événements",
  "area.recipes": "Recettes",

  "search.recent": "Ouvertes récemment",
  "search.clear": "Effacer",
  "search.start": "Pour commencer",
  "search.try": "Essayer une recherche",
  "search.query": "limite de débit",
  "search.move": "naviguer",
  "search.open": "ouvrir",
  "search.close": "fermer",

  "hero.eyebrow": "Un client de l'API Twitch pour JavaScript et TypeScript",
  "hero.copy": "Copier la commande d'installation",
  "hero.facts": "Open source, MIT|Node 22 et suivants|Aucune dépendance",

  "console.label": "Exemples",
  "console.simulated": "Sortie simulée",
  "console.run": "Lancer",
  "console.again": "Relancer",
  "console.lookup": "Consulter",
  "console.pages": "Toutes les pages",
  "console.chat": "Bot de chat",
  "console.live": "Passage en direct",
  "console.say": "Écrire dans le chat",
  "console.send": "Envoyer",
  "console.hint": "Essayez !ping",
  "console.you": "vous",
  "console.output": "Sortie",

  "finder.label": "Chercher dans l'API",
  "finder.placeholder": "ban, clip, follow, message de chat...",
  "finder.count": "{methods} méthodes et {events} types d'événements",
  "finder.none": "Rien ne correspond à « {query} ». Twitch l'appelle peut-être autrement : parcourez les groupes.",
  "finder.groups": "Parcourir les groupes",
  "finder.event": "événement",
  "finder.token.app": "jeton d'application",
  "finder.token.user": "jeton utilisateur",
  "finder.token.any": "jeton d'application ou utilisateur",
  "finder.token.other": "JWT d'extension",
  "finder.more": "{count} de plus. Continuez à taper pour affiner.",
};

const DICTIONARIES: Record<string, Record<UiKey, string>> = { en, fr };

/** The languages of the site, in the order the switch lists them. `locale` is the folder and URL prefix. */
export const LANGUAGES = [
  { locale: undefined, code: "en", label: "English" },
  { locale: "fr", code: "fr", label: "Français" },
] as const;

/**
 * The translator for a page: `t("search.clear")`, `t("finder.more", { count: "12" })`.
 * `locale` is Starlight's (`undefined` for English).
 */
export function useT(locale: string | undefined) {
  const dictionary = DICTIONARIES[locale ?? "en"] ?? en;
  return (key: UiKey, values: Record<string, string> = {}): string =>
    (dictionary[key] ?? en[key]).replace(/\{(\w+)\}/g, (whole, name: string) => values[name] ?? whole);
}

/** A link written as in English ("/quick-start/"), for a page in `locale` and the site's base path. */
export function href(path: string, locale: string | undefined): string {
  return withBase(withLocale(path, locale), import.meta.env.BASE_URL);
}
