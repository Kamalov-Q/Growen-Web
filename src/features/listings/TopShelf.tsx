import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import type { Listing } from "@/src/lib/listing-types";
import { ListingCard } from "./ListingCard";

/**
 * Paid placement, given its own shelf.
 *
 * This is the thing the business sells — `promote()` charges a tariff for
 * it — and the web showed nothing at all: promoted listings arrived at the
 * head of the feed and looked like every other card, so a seller paying for
 * TOP got no visible difference on the surface search engines read.
 *
 * A horizontal strip rather than a grid, so it reads as a distinct shelf
 * above the results and does not eat the fold.
 */
export function TopShelf({
  listings,
  lang,
}: {
  listings: Listing[];
  lang: Lang;
}) {
  if (!listings.length) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-[1.05rem] font-bold tracking-tight text-ink">
        <span className="rounded-md bg-gold px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-on-gold">
          TOP
        </span>
        {t(lang, "home.topTitle")}
      </h2>

      {/* Scrolls rather than wraps: a promoted shelf that grows to three
          rows pushes the actual results off the screen, which is the
          opposite of what the people paying for it want. */}
      {/* A mask fades the right edge so the strip reads as scrollable
          without arrows — arrows would need a client component and a scroll
          listener to say what a cut-off card already says. */}
      <ul
        className="no-scrollbar -mx-4 -my-3 flex snap-x gap-4 overflow-x-auto px-4 py-3 sm:mx-0 sm:px-0"
        style={{
          maskImage:
            "linear-gradient(to right, #000 0, #000 calc(100% - 3rem), transparent 100%)",
        }}
      >
        {listings.map((listing, i) => (
          <li
            key={listing.id}
            className="w-[44%] shrink-0 snap-start sm:w-[30%] lg:w-[19%]"
          >
            <ListingCard listing={listing} lang={lang} priority={i < 3} />
          </li>
        ))}
      </ul>
    </section>
  );
}
