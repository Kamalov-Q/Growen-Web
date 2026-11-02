import Link from "next/link";
import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { categoryName, type Category, type FeedQuery } from "./api";

/**
 * Category and sort, as LINKS.
 *
 * Every filter is a URL. That is the point and it is not a detail: a client
 * -side filter makes "apartments for sale in Tashkent" and "land for sale in
 * Tashkent" the same indexed page, which throws away the queries that
 * actually bring people to a property site. As links, each combination is a
 * page Google can rank, and a visitor can bookmark or send one.
 *
 * A SERVER component — no state, no JavaScript, and the whole filter row is
 * in the HTML a crawler reads.
 */

function href(lang: Lang, base: FeedQuery, patch: Partial<FeedQuery>) {
  const next = { ...base, ...patch };
  const params = new URLSearchParams({ purpose: next.purpose });
  if (next.q?.trim()) params.set("q", next.q.trim());
  if (next.category) params.set("category", next.category);
  if (next.sort && next.sort !== "newest") params.set("sort", next.sort);
  return `/${lang}?${params}`;
}

function Chip({
  active,
  children,
  ...rest
}: { active: boolean } & React.ComponentProps<typeof Link>) {
  return (
    <Link
      {...rest}
      aria-current={active ? "page" : undefined}
      className={`shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold transition ${
        active
          ? "bg-brand text-brand-ink"
          : "bg-raised text-ink-soft ring-1 ring-line hover:text-ink hover:ring-line-strong"
      }`}
    >
      {children}
    </Link>
  );
}

export function Filters({
  lang,
  query,
  categories,
}: {
  lang: Lang;
  query: FeedQuery;
  categories: Category[];
}) {
  return (
    <div>
      {/* Horizontally scrollable on a phone rather than wrapped to three
          rows: a filter bar that pushes the first listing below the fold is
          a filter bar nobody scrolls past. */}
      {/* `py-* -my-*` is not decoration — it stops the chips being sliced.

          `overflow-x-auto` cannot clip one axis only: the CSS spec computes
          a `visible` cross-axis to `auto` as soon as the other axis
          scrolls, so this box clips VERTICALLY too. Tailwind's `ring` is a
          box-shadow, which paints OUTSIDE the border box, so with no
          vertical padding the ring is cut flat along the top and bottom
          edges and the pills look chopped.

          The padding gives the shadow room inside the clip box and the
          equal negative margin takes it back out of the layout, so nothing
          below moves. */}
      <div className="no-scrollbar -mx-4 -my-1.5 flex gap-2 overflow-x-auto px-4 py-1.5 sm:mx-0 sm:px-0">
        <Chip
          href={href(lang, query, { category: undefined })}
          active={!query.category}
        >
          {t(lang, "filters.all")}
        </Chip>
        {categories.map((c) => (
          <Chip
            key={c.slug}
            href={href(lang, query, { category: c.slug })}
            active={query.category === c.slug}
          >
            {categoryName(c, lang)}
          </Chip>
        ))}
      </div>

    </div>
  );
}
