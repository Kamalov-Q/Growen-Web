"use client";

import { useCallback, useEffect, useState } from "react";
import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { ListingRow } from "@/src/features/listings/ListingRow";
import { getMine, getSaved } from "./api";
import type { Listing } from "@/src/lib/listing-types";

/**
 * A list of the account's own listings — "my listings" or "saved".
 *
 * One component for both because the only thing that differs is which
 * endpoint fills it. Everything else — the four states a fetched list has,
 * and the fact that THREE of them are not "rows" — is identical, and
 * writing it twice is how one copy ends up without an error branch. The
 * sessions page shipped exactly that bug.
 *
 * Client-side rather than server-rendered: these rows are private, and a
 * server component cannot read the httpOnly refresh cookie to know who is
 * asking. See RequireAuth.
 */
/**
 * Which list to show.
 *
 * A NAME, not a loader function. The pages that render this are server
 * components, and a function cannot cross that boundary — React refuses it
 * at build time ("Functions cannot be passed directly to Client
 * Components"). Passing the name keeps the choice declarative and the fetch
 * on the side that can actually perform it.
 */
const SOURCES = { mine: getMine, saved: getSaved } as const;

export function AccountList({
  lang,
  source,
  empty,
}: {
  lang: Lang;
  source: keyof typeof SOURCES;
  empty: string;
}) {
  const load = SOURCES[source];
  const [rows, setRows] = useState<Listing[] | null>(null);
  const [error, setError] = useState(false);
  const [version, setVersion] = useState(0);

  /**
   * Clearing the error happens HERE, in the event handler, not at the top of
   * the effect.
   *
   * Resetting it inside the effect body is a synchronous setState during an
   * effect — a second render pass for a value that was already correct on
   * every path except a retry, and the compiler lint rejects it. The retry
   * is the only moment the flag needs clearing, and the retry is a click.
   */
  const reload = useCallback(() => {
    setError(false);
    setRows(null);
    setVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    let alive = true;
    load()
      .then((data) => alive && setRows(data))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [load, version]);

  if (error) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-card bg-surface p-6 ring-1 ring-line">
        <p role="alert" className="text-[15px] text-danger">
          {t(lang, "home.loadError")}
        </p>
        <button
          type="button"
          onClick={reload}
          className="h-10 rounded-control px-4 text-[14px] font-semibold text-ink ring-1 ring-line transition hover:bg-muted-bg"
        >
          {t(lang, "common.retry")}
        </button>
      </div>
    );
  }

  if (rows === null) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <div className="h-32 animate-pulse rounded-card bg-muted-bg" />
        <div className="h-32 animate-pulse rounded-card bg-muted-bg" />
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-card bg-surface px-6 py-16 text-center shadow-card ring-1 ring-line">
        <p className="text-[15px] text-muted">{empty}</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {rows.map((listing) => (
        <li key={listing.id}>
          <ListingRow listing={listing} lang={lang} />
        </li>
      ))}
    </ul>
  );
}
