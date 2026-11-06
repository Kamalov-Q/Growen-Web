"use client";

import { useCallback, useEffect, useState } from "react";
import type { Lang } from "@/src/i18n/config";
import { ACTIVITY_PAGE, type ActivityPage } from "./api";
import { tLabel, type ActivityKey } from "./labels";

/**
 * The body of every activity screen: a page of rows, a way to ask for the
 * next one, and the two things that are not rows — "nothing here yet" and
 * "that did not load".
 *
 * One component for all six lists, as in the app, because they differ only
 * in what a row looks like. The differences that matter — what is empty
 * called, what does a row render — come in as props; everything about
 * paging, loading and failing is the same and is written once.
 *
 * ── Why "load more" and not infinite scroll ───────────────────────────────
 *
 * These lists are read deliberately, not browsed: somebody is looking for a
 * comment they left or an offer they made. A button that says how many more
 * there are beats a scroll that fetches behind your back and moves the
 * thing you were reading.
 */
export function ActivityList<T>({
  lang,
  load,
  keyOf,
  render,
  emptyTitle,
  emptyHint,
  icon,
}: {
  lang: Lang;
  /** One page, from the API module. */
  load: (limit: number, offset: number) => Promise<ActivityPage<T>>;
  keyOf: (item: T) => string;
  render: (item: T) => React.ReactNode;
  emptyTitle: ActivityKey;
  emptyHint: ActivityKey;
  icon: React.ReactNode;
}) {
  const [items, setItems] = useState<T[] | null>(null);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  /**
   * The first page, in the shape every other panel here uses: the request
   * starts in the effect and every setState happens in its callback.
   *
   * Not `setBusy(true)` first — a synchronous setState in an effect body is
   * the cascading render the compiler lint rejects, and there is nothing to
   * show a spinner over anyway while `items` is still null.
   */
  useEffect(() => {
    let alive = true;
    load(ACTIVITY_PAGE, 0)
      .then((page) => {
        if (!alive) return;
        setTotal(page.total);
        setItems(page.items);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [load]);

  /** Every page after the first, which is a click and may show a spinner. */
  const more = useCallback(
    async (offset: number) => {
      setBusy(true);
      try {
        const page = await load(ACTIVITY_PAGE, offset);
        setTotal(page.total);
        setItems((prev) => [...(prev ?? []), ...page.items]);
      } catch {
        setFailed(true);
      } finally {
        setBusy(false);
      }
    },
    [load],
  );

  if (failed) {
    return (
      <p
        role="alert"
        className="rounded-card bg-surface p-6 text-[15px] text-danger ring-1 ring-line"
      >
        {tLabel(lang, "home.loadError")}
      </p>
    );
  }

  if (!items) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <div className="h-20 animate-pulse rounded-card bg-muted-bg" />
        <div className="h-20 animate-pulse rounded-card bg-muted-bg" />
        <div className="h-20 animate-pulse rounded-card bg-muted-bg" />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-card bg-surface px-6 py-16 text-center shadow-card ring-1 ring-line">
        <span className="grid size-14 place-items-center rounded-full bg-muted-bg text-faint">
          {icon}
        </span>
        <p className="text-[16px] font-semibold text-ink">
          {tLabel(lang, emptyTitle)}
        </p>
        <p className="max-w-prose text-[14px] leading-6 text-muted">
          {tLabel(lang, emptyHint)}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div key={keyOf(item)}>{render(item)}</div>
      ))}

      {items.length < total ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void more(items.length)}
          className="h-12 rounded-control text-[15px] font-semibold text-ink ring-1 ring-line transition hover:bg-muted-bg disabled:opacity-50"
        >
          {busy
            ? "…"
            : tLabel(lang, "activity.more", { n: total - items.length })}
        </button>
      ) : null}
    </div>
  );
}
