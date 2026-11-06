"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { tReviews } from "@/src/i18n/strings/reviews";
import { Avatar } from "@/src/components/ui/Avatar";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { useSession } from "@/src/features/auth/session";
import { ApiError } from "@/src/lib/api";
import { absoluteTime, relativeTime } from "@/src/lib/time";
import {
  deleteReview,
  getReviews,
  upsertReview,
  type Review,
  type ReviewsPage,
} from "./social-api";

/**
 * What people thought of a listing.
 *
 * ── Two averages, deliberately ────────────────────────────────────────────
 *
 * The big number is the listing's RATING — what the marketplace concluded,
 * the same figure its card shows. The bars under it are the plain
 * distribution of what people actually typed. They will not agree, and that
 * is not a bug: the rating carries a prior, the age of the reviews and any
 * upheld report. Showing the mean as the headline would make the card and
 * this page disagree by a tenth, which is the thing the server's own note
 * warns about.
 *
 * ── One review per person, so there is no "post" and "edit" ───────────────
 *
 * The endpoint is a PUT. Leaving a review and changing it are one action
 * from the reader's side, so the form is the same form either way and the
 * button is the only thing that changes word.
 */
export function ReviewsSection({
  lang,
  listingId,
  ownerId,
}: {
  lang: Lang;
  listingId: string;
  /** The seller cannot review their own listing — the server refuses too. */
  ownerId: string | null;
}) {
  const { user, status } = useSession();
  const [page, setPage] = useState<ReviewsPage | null>(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    let alive = true;
    getReviews(listingId)
      .then((data) => alive && setPage(data))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [listingId]);

  async function reload() {
    try {
      setPage(await getReviews(listingId));
    } catch {
      setFailed(true);
    }
  }

  async function remove() {
    setConfirming(false);
    try {
      await deleteReview(listingId);
      await reload();
    } catch {
      setFailed(true);
    }
  }

  if (failed && !page) return null;

  const own = user && ownerId && user.id === ownerId;
  const mine = page?.mine ?? null;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[1.05rem] font-semibold tracking-tight text-ink">
          {tReviews(lang, "reviews.title")}
          {page?.count ? (
            <span className="nums rounded-full bg-muted-bg px-2 py-0.5 text-[12px] font-semibold text-muted">
              {page.count}
            </span>
          ) : null}
        </h2>

        {/* The owner is told why there is no button rather than left to
            press one that 403s. */}
        {own ? null : status === "authenticated" ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-control px-3.5 py-2 text-[13px] font-bold text-brand ring-1 ring-brand-line transition hover:bg-brand-soft"
          >
            {tReviews(lang, mine ? "reviews.editMine" : "reviews.write")}
          </button>
        ) : (
          <Link
            href={`/${lang}/login?next=${encodeURIComponent(`/${lang}/listing/${listingId}`)}`}
            className="rounded-control px-3.5 py-2 text-[13px] font-bold text-brand ring-1 ring-brand-line transition hover:bg-brand-soft"
          >
            {tReviews(lang, "reviews.write")}
          </Link>
        )}
      </div>

      {page ? (
        <div className="flex flex-col gap-5 rounded-card bg-surface p-5 shadow-card ring-1 ring-line">
          {/* With nothing to average, the headline would read "5.0" with
              five filled stars under it — the PRIOR, printed as if people
              had said it. A listing nobody has reviewed says so instead. */}
          {page.count > 0 ? <Summary lang={lang} page={page} /> : null}

          {open && !own ? (
            <ReviewForm
              lang={lang}
              listingId={listingId}
              mine={mine}
              onDone={async () => {
                setOpen(false);
                await reload();
              }}
              onDelete={() => setConfirming(true)}
            />
          ) : null}

          {page.items.length ? (
            <ul className="flex flex-col divide-y divide-line">
              {page.items.map((review) => (
                <li key={review.id} className="py-4 first:pt-0 last:pb-0">
                  <Row
                    lang={lang}
                    review={review}
                    isMine={review.id === mine?.id}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-6 text-center">
              <p className="text-[15px] font-semibold text-ink">
                {tReviews(lang, "reviews.emptyTitle")}
              </p>
              <p className="mt-1 text-[14px] text-muted">
                {tReviews(lang, own ? "reviews.emptyOwner" : "reviews.emptyHint")}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="h-40 animate-pulse rounded-card bg-muted-bg" />
      )}

      <ConfirmDialog
        open={confirming}
        title={tReviews(lang, "reviews.deleteTitle")}
        body={tReviews(lang, "reviews.deleteMessage")}
        confirmLabel={t(lang, "common.delete")}
        cancelLabel={t(lang, "common.cancel")}
        danger
        onConfirm={() => void remove()}
        onCancel={() => setConfirming(false)}
      />
    </section>
  );
}

function Summary({ lang, page }: { lang: Lang; page: ReviewsPage }) {
  const max = Math.max(1, ...Object.values(page.distribution));

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="flex flex-col items-center gap-1">
        <span className="nums text-[2.25rem] font-bold leading-none tracking-tight text-ink">
          {page.average.toFixed(1)}
        </span>
        <Stars value={page.average} size={16} />
        <span className="nums text-[12px] text-faint">
          {tReviews(lang, "reviews.count", { count: page.count })}
        </span>
      </div>

      <div className="flex min-w-[12rem] flex-1 flex-col gap-1">
        {([5, 4, 3, 2, 1] as const).map((star) => {
          const n = page.distribution[String(star) as "5"] ?? 0;
          return (
            <div
              key={star}
              className="flex items-center gap-2"
              aria-label={tReviews(lang, "reviews.barLabel", { star, count: n })}
            >
              <span className="nums w-3 text-[12px] text-faint">{star}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted-bg">
                <span
                  className="block h-full rounded-full bg-sold"
                  style={{ width: `${(n / max) * 100}%` }}
                />
              </span>
              <span className="nums w-6 text-end text-[12px] text-faint">
                {n}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewForm({
  lang,
  listingId,
  mine,
  onDone,
  onDelete,
}: {
  lang: Lang;
  listingId: string;
  mine: Review | null;
  onDone: () => void | Promise<void>;
  onDelete: () => void;
}) {
  const [rating, setRating] = useState(mine?.rating ?? 0);
  const [comment, setComment] = useState(mine?.comment ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!rating) return;
    setBusy(true);
    setError(null);
    try {
      await upsertReview(listingId, {
        rating,
        comment: comment.trim() || undefined,
      });
      await onDone();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.code === "OWN_LISTING"
            ? tReviews(lang, "reviews.ownListing")
            : err.message
          : t(lang, "auth.genericError"),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-card bg-raised p-4">
      <p className="text-[14px] text-muted">
        {tReviews(lang, "reviews.writeSubtitle")}
      </p>

      <div className="flex items-center gap-1" role="radiogroup">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={rating === star}
            aria-label={String(star)}
            onClick={() => setRating(star)}
            className="p-0.5 transition hover:scale-110"
          >
            <Star filled={star <= rating} size={28} />
          </button>
        ))}
        {!rating ? (
          <span className="ms-2 text-[13px] text-faint">
            {tReviews(lang, "reviews.tapToRate")}
          </span>
        ) : null}
      </div>

      <div className="rounded-control bg-surface px-3.5 ring-1 ring-line transition focus-within:ring-2 focus-within:ring-brand">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={tReviews(lang, "reviews.commentPlaceholder")}
          rows={3}
          maxLength={1000}
          className="w-full resize-y bg-transparent py-3 text-[15px] leading-6 text-ink outline-none placeholder:text-faint"
        />
      </div>

      {error ? (
        <p role="alert" className="text-[13px] font-medium text-danger">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void submit()}
          disabled={!rating || busy}
          className="rounded-control bg-brand px-4 py-2.5 text-[14px] font-bold text-brand-ink transition hover:bg-brand-hover disabled:opacity-50"
        >
          {tReviews(lang, mine ? "reviews.saveEdit" : "reviews.submit")}
        </button>
        {mine ? (
          <button
            type="button"
            onClick={onDelete}
            className="rounded-control px-4 py-2.5 text-[14px] font-bold text-danger ring-1 ring-danger/30 transition hover:bg-danger/10"
          >
            {t(lang, "common.delete")}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function Row({
  lang,
  review,
  isMine,
}: {
  lang: Lang;
  review: Review;
  isMine: boolean;
}) {
  const name =
    [review.author?.name, review.author?.surname]
      .filter(Boolean)
      .join(" ")
      .trim() || null;

  /* Your own row is not a link to yourself: "Siz" with a profile link
     behind it is a detour to a page you already have in the menu. */
  const title = isMine ? (
    <span className="text-[14px] font-semibold text-ink">
      {tReviews(lang, "reviews.you")}
    </span>
  ) : (
    <Link
      href={`/${lang}/users/${review.authorId}`}
      className="text-[14px] font-semibold text-ink transition hover:text-brand"
    >
      {name ?? t(lang, "detail.seller")}
    </Link>
  );

  return (
    <article className="flex gap-3">
      {isMine ? (
        <Avatar uri={review.author?.avatarThumbUrl} name={name} size={36} />
      ) : (
        <Link href={`/${lang}/users/${review.authorId}`} className="shrink-0">
          <Avatar uri={review.author?.avatarThumbUrl} name={name} size={36} />
        </Link>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-x-2">
          {title}
          <Stars value={review.rating} size={13} />
          <span
            className="text-[12px] text-faint"
            title={absoluteTime(new Date(review.createdAt))}
          >
            {relativeTime(review.createdAt, lang)}
          </span>
          {review.updatedAt !== review.createdAt ? (
            <span className="rounded-full bg-muted-bg px-1.5 py-0.5 text-[11px] font-medium text-faint">
              {tReviews(lang, "reviews.edited")}
            </span>
          ) : null}
        </div>
        {review.comment ? (
          <p className="whitespace-pre-line text-[14px] leading-6 text-ink-soft">
            {review.comment}
          </p>
        ) : null}
      </div>
    </article>
  );
}

/** Five stars, filled to the rating — halves rounded, not drawn. */
function Stars({ value, size }: { value: number; size: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} filled={n <= Math.round(value)} size={size} />
      ))}
    </span>
  );
}

function Star({ filled, size }: { filled: boolean; size: number }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      style={{ width: size, height: size }}
      className={filled ? "text-sold" : "text-line-strong"}
      fill="currentColor"
    >
      <path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.7l5.8-.8z" />
    </svg>
  );
}
