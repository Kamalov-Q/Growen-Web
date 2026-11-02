/**
 * The two languages this market reads.
 *
 * Routing is by path segment (`/uz/privacy`, `/ru/privacy`) rather than by a
 * cookie or a client-side provider, for three reasons that all matter here:
 *
 *  - Google indexes a URL, not a preference. Two languages behind one URL is
 *    one indexed page, and the whole point of this site is being found.
 *  - A dictionary shipped to the browser is dead weight on a page made of
 *    prose. Server components read the copy at build time and send HTML.
 *  - `generateStaticParams` over this list is what makes every page static.
 */
export const LANGS = ["uz", "ru"] as const;

export type Lang = (typeof LANGS)[number];

/** Uzbek: the language of the market, and what an unprefixed URL lands on. */
export const DEFAULT_LANG: Lang = "uz";

export const isLang = (value: string): value is Lang =>
  (LANGS as readonly string[]).includes(value);

/** What `<html lang>` and `hreflang` need — not the same as our segment. */
export const HTML_LANG: Record<Lang, string> = {
  uz: "uz-UZ",
  ru: "ru-RU",
};

/** How each language names itself, for the switcher. Never translated. */
export const LANG_LABEL: Record<Lang, string> = {
  uz: "O'zbekcha",
  ru: "Русский",
};
