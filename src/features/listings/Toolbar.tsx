import Link from "next/link";
import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import type { FeedQuery } from "./api";
import { groupDigits } from "./format";

/**
 * Result count, sort, and the view switch — one row, above the grid.
 *
 * The count was a small grey line nobody saw. On a marketplace it is a
 * headline: "37,178 found" tells a visitor the inventory is real, which is
 * the single most reassuring thing a listings site can say. It gets size
 * here.
 *
 * Sort moved out of the chip rows. Three chip rows stacked (category, sort,
 * purpose) pushed the first listing off the screen, and sort is not a filter
 * — it does not change WHICH listings, only their order, so it does not
 * belong next to the ones that do.
 *
 * It is also why sort sits here and not in the view bar at the top: that bar
 * is about finding listings, this line is about the ones already found.
 */
export function Toolbar({
  lang,
  query,
  count,
}: {
  lang: Lang;
  query: FeedQuery;
  count: number;
}) {
  const sorts = [
    { id: "newest", label: t(lang, "filters.newest") },
    { id: "priceAsc", label: t(lang, "filters.priceAsc") },
    { id: "priceDesc", label: t(lang, "filters.priceDesc") },
  ] as const;

  const href = (sort: string) => {
    const params = new URLSearchParams({ purpose: query.purpose });
    if (query.q?.trim()) params.set("q", query.q.trim());
    if (query.category) params.set("category", query.category);
    if (sort !== "newest") params.set("sort", sort);
    return `/${lang}?${params}`;
  };

  const active = query.sort ?? "newest";

  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="flex flex-col">
        <p className="nums text-[1.6rem] font-bold leading-none tracking-tight text-ink">
          {groupDigits(count)}
        </p>
        <p className="text-[13px] text-muted">{t(lang, "home.foundLabel")}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Links, so each ordering is its own URL. The canonical drops
            `sort`, because the same listings in a different order are a
            duplicate — see pageMetadata. */}
        <div className="flex gap-1 rounded-control bg-muted-bg p-1">
          {sorts.map((s) => (
            <Link
              key={s.id}
              href={href(s.id)}
              aria-current={active === s.id ? "page" : undefined}
              className={`rounded-[0.5rem] px-3 py-1.5 text-[13px] font-semibold transition ${
                active === s.id
                  ? "bg-surface text-ink shadow-card"
                  : "text-muted hover:text-ink"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
