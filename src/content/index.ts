import type { Lang } from "../i18n/config";
import { LANGS } from "../i18n/config";
import type { LegalDocument } from "./types";
import { privacyUz } from "./privacy/uz";
import { privacyRu } from "./privacy/ru";
import { accountDeletionUz } from "./account-deletion/uz";
import { accountDeletionRu } from "./account-deletion/ru";
import { termsUz } from "./terms/uz";
import { termsRu } from "./terms/ru";

export type LegalSlug = "privacy" | "terms" | "account-deletion";

const DOCUMENTS = {
  privacy: { uz: privacyUz, ru: privacyRu },
  "account-deletion": { uz: accountDeletionUz, ru: accountDeletionRu },
  terms: { uz: termsUz, ru: termsRu },
} satisfies Partial<Record<LegalSlug, Record<Lang, LegalDocument>>>;

/**
 * Translations drift. This is what catches it.
 *
 * The shared `LegalDocument` type guarantees both languages have the same
 * SHAPE, but not the same sections — nothing stops somebody adding a
 * "Cookies" section to the Russian policy and forgetting the Uzbek, and the
 * result is two documents that say different things to two readers while
 * typechecking perfectly.
 *
 * Section ids are the contract: they are the anchors, so a link to
 * `/ru/privacy#retention` must find the same subject at
 * `/uz/privacy#retention`. This runs at module load, which means at build
 * time, which means a drifted translation fails `next build` instead of
 * shipping.
 */
function assertParity(): void {
  for (const [slug, byLang] of Object.entries(DOCUMENTS)) {
    const reference = LANGS[0];
    const expected = byLang[reference].sections.map((s) => s.id);

    for (const lang of LANGS) {
      const actual = byLang[lang].sections.map((s) => s.id);
      const missing = expected.filter((id) => !actual.includes(id));
      const extra = actual.filter((id) => !expected.includes(id));

      if (missing.length || extra.length) {
        throw new Error(
          `Legal content out of sync: ${slug}/${lang} — ` +
            `missing [${missing.join(", ")}], unexpected [${extra.join(", ")}]. ` +
            `Every language must carry the same section ids; they are the anchors.`,
        );
      }
      if (actual.join() !== expected.join()) {
        throw new Error(
          `Legal content out of order: ${slug}/${lang} — sections must appear ` +
            `in the same order in every language.`,
        );
      }
    }
  }
}

/**
 * Catch a glyph from the wrong writing system.
 *
 * Not hypothetical: a single CJK character got pasted into the Russian
 * deletion page while this was being written, and it typechecked, rendered
 * and would have shipped — a reader would simply have seen a box in the
 * middle of a sentence. Uzbek Latin and Russian Cyrillic between them use
 * Latin, Cyrillic, punctuation and digits; anything from a CJK, Arabic,
 * Hebrew or Devanagari block is a paste accident.
 */
function assertScripts(): void {
  const foreign =
    /[\u0590-\u05FF\u0600-\u06FF\u0900-\u097F\u3000-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/;

  for (const [slug, byLang] of Object.entries(DOCUMENTS)) {
    for (const lang of LANGS) {
      const doc = byLang[lang];
      const text = JSON.stringify(doc);
      const hit = foreign.exec(text);
      if (hit) {
        throw new Error(
          `Legal content has a stray glyph: ${slug}/${lang} contains ` +
            `"${hit[0]}" (U+${hit[0].codePointAt(0)!.toString(16).toUpperCase()}). ` +
            `Expected Latin or Cyrillic only.`,
        );
      }
    }
  }
}

assertParity();
assertScripts();

export function getLegalDocument(
  slug: keyof typeof DOCUMENTS,
  lang: Lang,
): LegalDocument {
  return DOCUMENTS[slug][lang];
}

export const hasDocument = (slug: string): slug is keyof typeof DOCUMENTS =>
  slug in DOCUMENTS;
