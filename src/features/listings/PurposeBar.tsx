import Link from "next/link";
import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import type { FeedQuery, OfferPurpose } from "./api";

const PURPOSES: { id: OfferPurpose; key: Parameters<typeof t>[1] }[] = [
  { id: "SALE", key: "home.purposeSale" },
  { id: "RENT_MONTHLY", key: "home.purposeRent" },
  { id: "RENT_DAILY", key: "home.purposeDaily" },
];

/**
 * Sale / rent / daily — the single most important choice on the site, so it
 * gets a full-width bar rather than a chip in a row of chips.
 *
 * Links, not client tabs. "Flats for rent in Tashkent" and "flats for sale
 * in Tashkent" are different searches, and a crawler can only rank them
 * separately if they are separate URLs. A client-side tab collapses all
 * three into one indexed page and throws away two-thirds of the search
 * surface.
 */
export function PurposeBar({
  lang,
  query,
}: {
  lang: Lang;
  query: FeedQuery;
}) {
  return (
    <nav
      aria-label={t(lang, "home.search")}
      className="grid grid-cols-3 gap-1 rounded-control bg-muted-bg p-1"
    >
      {PURPOSES.map((p) => {
        const params = new URLSearchParams({ purpose: p.id });
        if (query.q?.trim()) params.set("q", query.q.trim());
        if (query.category) params.set("category", query.category);
        const active = p.id === query.purpose;
        return (
          <Link
            key={p.id}
            href={`/${lang}?${params}`}
            aria-current={active ? "page" : undefined}
            className={`rounded-[0.55rem] py-2.5 text-center text-sm font-bold transition ${
              active
                ? "bg-brand text-brand-ink shadow-card"
                : "text-muted hover:text-ink"
            }`}
          >
            {t(lang, p.key)}
          </Link>
        );
      })}
    </nav>
  );
}
