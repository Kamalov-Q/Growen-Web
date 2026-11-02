"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { categoryName, type Category, type FeedQuery, type OfferPurpose } from "./api";
import { usePrefs } from "@/src/features/settings/prefs";
import { PriceRange } from "./PriceRange";

const PURPOSES: { id: OfferPurpose; key: Parameters<typeof t>[1] }[] = [
  { id: "SALE", key: "home.purposeSale" },
  { id: "RENT_MONTHLY", key: "home.purposeRent" },
  { id: "RENT_DAILY", key: "home.purposeDaily" },
];

const SORTS: { id: string; key: Parameters<typeof t>[1] }[] = [
  { id: "newest", key: "filters.newest" },
  { id: "priceAsc", key: "filters.priceAsc" },
  { id: "priceDesc", key: "filters.priceDesc" },
];

/**
 * The filter modal — the same set of controls the mobile app's filter sheet
 * offers: purpose, category, address, price, sort.
 *
 * ── A real <dialog> ────────────────────────────────────────────────────────
 *
 * `showModal()` rather than a div with a high z-index. The browser then
 * handles the focus trap, the inert background, Escape, and the top layer,
 * all of which a hand-rolled overlay gets wrong in ways that only show up
 * with a keyboard or a screen reader.
 *
 * ── Everything commits to the URL ──────────────────────────────────────────
 *
 * Nothing filters on the client. The feed is paged at 24, so client-side
 * filtering would search only what happened to be fetched; and a filtered
 * view needs a URL of its own to be shareable and server-rendered.
 *
 * The app's radius filter has no equivalent here: it belongs to the map,
 * which has its own viewport query. Offering it on a list that cannot honour
 * it would be a control that does nothing.
 */
export function FilterModal({
  lang,
  query,
  categories,
  open,
  onClose,
}: {
  lang: Lang;
  query: FeedQuery;
  categories: Category[];
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  // Only to pick the track's scale — the API filters in the offer's own
  // currency either way.
  const { currency } = usePrefs();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  const [purpose, setPurpose] = useState<OfferPurpose>(query.purpose);
  const [category, setCategory] = useState(query.category ?? "");
  const [q, setQ] = useState(query.q ?? "");
  const [min, setMin] = useState(query.priceMin?.toString() ?? "");
  const [max, setMax] = useState(query.priceMax?.toString() ?? "");
  const [sort, setSort] = useState(query.sort ?? "newest");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  const apply = () => {
    const params = new URLSearchParams({ purpose });
    if (q.trim()) params.set("q", q.trim());
    if (category) params.set("category", category);
    if (sort !== "newest") params.set("sort", sort);

    // Anything non-numeric is dropped rather than sent as NaN, which the
    // API would reject on a page that should simply ignore it.
    const n = (v: string) => {
      const parsed = Number(v.replace(/\s/g, ""));
      return v.trim() && Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
    };
    const lo = n(min);
    const hi = n(max);
    if (lo !== null) params.set("priceMin", String(lo));
    if (hi !== null) params.set("priceMax", String(hi));

    router.push(`/${lang}?${params}`);
    onClose();
  };

  const reset = () => {
    setCategory("");
    setQ("");
    setMin("");
    setMax("");
    setSort("newest");
    router.push(`/${lang}?purpose=${purpose}`);
    onClose();
  };

  const field =
    "h-12 w-full rounded-control bg-raised px-3.5 text-[15px] text-ink ring-1 ring-line outline-none transition focus:ring-2 focus:ring-brand placeholder:text-faint";

  const chip = (active: boolean) =>
    `rounded-full px-4 py-2 text-[14px] font-semibold transition ${
      active
        ? "bg-brand text-brand-ink"
        : "bg-raised text-ink ring-1 ring-line hover:ring-line-strong"
    }`;

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      // `close` fires for Escape and for the backdrop too, so the parent's
      // state stays in step however the dialog was dismissed.
      onClose={onClose}
      onClick={(e) => {
        // Clicking the backdrop closes. The target is the dialog itself only
        // when the click missed its contents.
        if (e.target === ref.current) onClose();
      }}
      className="m-auto w-[min(34rem,calc(100vw-2rem))] rounded-card bg-surface p-0 text-ink shadow-lift ring-1 ring-line backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      <div className="flex max-h-[85vh] flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <h2 id={titleId} className="text-[1.1rem] font-bold tracking-tight">
            {t(lang, "filters.open")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t(lang, "filters.close")}
            className="grid size-9 place-items-center rounded-control text-muted transition hover:bg-muted-bg hover:text-ink"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </header>

        <div className="flex flex-col gap-6 overflow-y-auto px-5 py-5">
          <Section label={t(lang, "filters.purposeTitle")}>
            <div className="grid grid-cols-3 gap-1 rounded-control bg-muted-bg p-1">
              {PURPOSES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPurpose(p.id)}
                  aria-pressed={purpose === p.id}
                  className={`rounded-[0.5rem] px-3 py-2.5 text-[14px] font-semibold transition ${
                    purpose === p.id
                      ? "bg-brand text-brand-ink shadow-card"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {t(lang, p.key)}
                </button>
              ))}
            </div>
          </Section>

          <Section label={t(lang, "filters.categoryTitle")}>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCategory("")}
                className={chip(!category)}
              >
                {t(lang, "filters.all")}
              </button>
              {categories.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => setCategory(c.slug)}
                  className={chip(category === c.slug)}
                >
                  {categoryName(c, lang)}
                </button>
              ))}
            </div>
          </Section>

          <Section label={t(lang, "filters.addressTitle")}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t(lang, "home.searchPlaceholder")}
              className={field}
            />
          </Section>

          <Section label={t(lang, "filters.price")}>
            {/* The track's range follows the PURPOSE, as it does in the app:
                $500k tops out a sale, $5k a monthly rent, $500 a night. One
                track for all three would put every nightly rate in its
                first pixel. */}
            <PriceRange
              lang={lang}
              purpose={purpose}
              currency={currency === "UZS" ? "UZS" : "USD"}
              min={min}
              max={max}
              onChangeMin={setMin}
              onChangeMax={setMax}
            />
          </Section>

          <Section label={t(lang, "filters.sortBy")}>
            <div className="flex flex-wrap gap-2">
              {SORTS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSort(s.id as typeof sort)}
                  className={chip(sort === s.id)}
                >
                  {t(lang, s.key)}
                </button>
              ))}
            </div>
          </Section>
        </div>

        <footer className="flex items-center gap-2 border-t border-line px-5 py-4">
          <button
            type="button"
            onClick={reset}
            className="h-12 rounded-control px-5 text-[15px] font-semibold text-muted ring-1 ring-line transition hover:text-ink"
          >
            {t(lang, "filters.reset")}
          </button>
          <button
            type="button"
            onClick={apply}
            className="h-12 flex-1 rounded-control bg-brand px-4 text-[15px] font-bold text-brand-ink transition hover:bg-brand-hover"
          >
            {t(lang, "filters.apply")}
          </button>
        </footer>
      </div>
    </dialog>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="text-[13px] font-semibold text-muted">{label}</h3>
      {children}
    </section>
  );
}
