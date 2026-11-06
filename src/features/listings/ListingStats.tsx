"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import type { ListingStats as Stats } from "@/src/lib/listings-socket";
import { absoluteDate } from "@/src/lib/time";
import { recordView } from "./social-api";

/**
 * Views, comments and age — the three numbers under a listing's address.
 *
 * ── Live, like the app ────────────────────────────────────────────────────
 *
 * It joins the listing's room on the public `/listings` namespace, so the
 * counts move while the page is open rather than only on the next load:
 * somebody else opening the listing bumps the views in front of you, and a
 * comment posted below pushes the comment count here without either of
 * them refetching the page.
 *
 * ── It also records the view ──────────────────────────────────────────────
 *
 * Opening the page IS the visit, so this is where it is counted — once per
 * person, by user id when signed in and by a stored device id when not.
 * The server answers with the new total and broadcasts it to everyone else
 * in the room. Failure is deliberately silent: a view that did not
 * register is not worth interrupting a reader for, and the number on
 * screen is still the one the page was rendered with.
 *
 * The initial values come from the SERVER render, so the row is correct in
 * the HTML a crawler reads and never flashes zero on the way to the truth.
 *
 * ── The socket is imported inside the effect, not at the top ─────────────
 *
 * socket.io is 13 KB gzipped and this was the only static import of it on
 * the listing page, so it sat in the first load — downloaded, parsed and
 * executed before anything could become interactive, in aid of a number
 * that is ALREADY CORRECT in the HTML. Nobody is waiting on it: the counts
 * are server-rendered, and the only thing the socket adds is that they keep
 * moving afterwards.
 *
 * So it is fetched after mount. `import type` above is erased at compile
 * time and pulls nothing in; the real import is the `await` below. The
 * `alive` flag is what makes this safe — an effect that is torn down before
 * the chunk lands must not then go and subscribe, which is the classic way
 * this pattern leaks a listener on every navigation.
 */
export function ListingStats({
  lang,
  listingId,
  viewCount,
  commentCount,
  publishedAt,
  children,
}: {
  lang: Lang;
  listingId: string;
  viewCount: number;
  commentCount: number;
  /** Null on a listing that was never published — a draft preview. */
  publishedAt: string | null;
  /** Share, and anything else that belongs on this line. */
  children?: React.ReactNode;
}) {
  const [views, setViews] = useState(viewCount);
  const [comments, setComments] = useState(commentCount);

  useEffect(() => {
    let alive = true;
    /** Set once the socket is up; undefined if it never got that far. */
    let detach: (() => void) | undefined;

    recordView(listingId)
      .then((res) => alive && setViews(res.viewCount))
      .catch(() => {});

    const onStats = ({ listingId: id, ...patch }: Stats) => {
      if (!alive || id !== listingId) return;
      // A broadcast says only what changed, so each field is applied only
      // when it is present — `?? views` would overwrite a live count with
      // a stale one on an event about something else.
      if (patch.viewCount !== undefined) setViews(patch.viewCount);
      if (patch.commentCount !== undefined) setComments(patch.commentCount);
    };

    void import("@/src/lib/listings-socket")
      .then(({ getListingsSocket, watchListing }) => {
        // Left this page while the chunk was in flight. Subscribing now
        // would attach a listener nothing will ever remove.
        if (!alive) return;

        const socket = getListingsSocket();
        socket.on("listing:stats", onStats);
        const unwatch = watchListing(listingId);

        detach = () => {
          socket.off("listing:stats", onStats);
          unwatch();
        };
      })
      // A listing whose counts do not tick is a listing; a page that
      // throws because a chunk would not load is not.
      .catch(() => {});

    return () => {
      alive = false;
      detach?.();
    };
  }, [listingId]);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-muted">
      <span className="flex items-center gap-1.5">
        <EyeGlyph />
        <span className="nums font-semibold text-ink-soft">{views}</span>
      </span>

      {/* An anchor, not a counter: the comments are further down the same
          page, and a number you cannot act on is trivia. */}
      <a
        href="#comments"
        className="flex items-center gap-1.5 transition hover:text-brand"
      >
        <CommentGlyph />
        <span className="nums font-semibold text-ink-soft">{comments}</span>
      </a>

      {/* The DATE it went up, not the hour.
          "5 soat oldin" answers a question nobody asked of an advert — a
          flat is not news — and the minute it was published is noise
          beside a price. A date is what somebody checks when they are
          deciding whether a listing is stale, so that is all this says,
          and there is no tooltip behind it holding something more
          precise. */}
      {publishedAt ? (
        <span className="flex items-center gap-1.5">
          <ClockGlyph />
          <span className="nums">{absoluteDate(new Date(publishedAt))}</span>
        </span>
      ) : null}

      {children}

      {/* Said once, for the two numbers that are not self-evident as
          icons. Visible only to a screen reader — the glyphs carry it for
          everybody else. */}
      <span className="sr-only">{t(lang, "detail.views", { n: views })}</span>
    </div>
  );
}

function EyeGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  );
}

function CommentGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.5 11.6a7.9 7.9 0 0 1-8.5 7.9 9 9 0 0 1-2.6-.4L4.2 21l1.4-4.2a7.4 7.4 0 0 1-1.6-4.6 7.9 7.9 0 0 1 8.5-7.7 7.9 7.9 0 0 1 8 7.1Z" />
    </svg>
  );
}

function ClockGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.5l3.5 2" />
    </svg>
  );
}
