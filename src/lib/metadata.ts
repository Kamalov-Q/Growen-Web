import type { Metadata } from "next";
import { LANGS, HTML_LANG, type Lang } from "@/src/i18n/config";

/**
 * Canonical + hreflang for one page, in one place.
 *
 * Getting this wrong is the classic multilingual SEO failure: without
 * `alternates`, Google sees /uz/privacy and /ru/privacy as two unrelated
 * pages competing for the same queries, and may pick the wrong one for a
 * Russian-speaking reader. With them it understands they are one document in
 * two languages and serves whichever matches.
 *
 * `x-default` points at Uzbek — the language a reader with no preference
 * gets, matching the redirect in next.config.
 */
export function pageMetadata({
  lang,
  path,
  title,
  description,
  query = "",
}: {
  lang: Lang;
  /** Everything after the language segment, e.g. "/privacy". "" for home. */
  path: string;
  title: string;
  description: string;
  /**
   * The query string that is PART OF THE PAGE'S IDENTITY, already encoded
   * and without a leading "?". Empty for pages that have none.
   *
   * This exists because of a bug worth remembering: the filtered listing
   * pages — `?purpose=SALE&category=APARTMENT`, the district and category
   * landing pages that are most of a property site's search surface — were
   * emitting a canonical of plain `/uz`. That tells Google the real page is
   * the unfiltered one and every filtered variant is a duplicate of it, so
   * none of them would ever rank. Making the filters crawlable links and
   * then canonicalising them away is worse than not building them.
   *
   * What belongs here is only what changes the CONTENT: purpose and
   * category. Not `sort`, which is the same listings in a different order
   * and really is a duplicate, and not `q`, which is a search result and is
   * marked noindex separately.
   */
  query?: string;
}): Metadata {
  const suffix = query ? `?${query}` : "";
  const languages: Record<string, string> = {
    "x-default": `/uz${path}${suffix}`,
  };
  for (const code of LANGS) {
    languages[HTML_LANG[code]] = `/${code}${path}${suffix}`;
  }

  return {
    title,
    description,
    alternates: { canonical: `/${lang}${path}${suffix}`, languages },
    openGraph: {
      title,
      description,
      url: `/${lang}${path}${suffix}`,
      locale: HTML_LANG[lang],
    },
  };
}
