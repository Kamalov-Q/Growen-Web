import Image from "next/image";
import Link from "next/link";
import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { resolveMediaUrl } from "@/src/lib/media";
import { absoluteTime, relativeTime } from "@/src/lib/time";
import type { ActivityListing } from "./api";

/**
 * One row of "your activity": the listing it happened on, and what you did
 * there.
 *
 * The LISTING is the anchor. A comment on its own gives no clue which of
 * forty adverts it was about, so the cover photo and the title lead, and
 * what you said is the second line.
 *
 * A deleted listing leaves its comments behind. The row stays readable and
 * simply stops pretending to go anywhere — a link to a 404 is worse than
 * plain text.
 */
export function ActivityRow({
  lang,
  listing,
  body,
  createdAt,
  rating,
  badge,
  imageThumbUrl,
}: {
  lang: Lang;
  listing: ActivityListing | null;
  /** What was said — the comment body, or the review text. */
  body: string | null;
  createdAt: string;
  /** Reviews show stars where a comment shows nothing. */
  rating?: number;
  /** A small trailing glyph: a heart for a like, an arrow for a reply. */
  badge?: "like" | "reply";
  /** A photo on the comment itself, not the listing's cover. */
  imageThumbUrl?: string | null;
}) {
  const cover = resolveMediaUrl(imageThumbUrl ?? listing?.thumbUrl);

  const inner = (
    <>
      <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-control bg-muted-bg">
        {cover ? (
          <Image
            src={cover}
            alt=""
            width={56}
            height={56}
            unoptimized
            className="size-full object-cover"
          />
        ) : (
          <HomeGlyph />
        )}
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-1.5">
          <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ink">
            {listing?.title ?? t(lang, "listing.untitled")}
          </span>
          {badge === "like" ? <Heart /> : null}
          {badge === "reply" ? <Reply /> : null}
        </span>

        {rating !== undefined ? <Stars value={rating} /> : null}

        {body ? (
          <span className="clamp-2 text-[14px] leading-5 text-muted">
            {body}
          </span>
        ) : imageThumbUrl ? (
          <span className="text-[14px] italic text-muted">
            {t(lang, "activity.photoOnly")}
          </span>
        ) : null}

        <span
          className="text-[12px] text-faint"
          title={absoluteTime(new Date(createdAt))}
        >
          {relativeTime(createdAt, lang)}
        </span>
      </span>
    </>
  );

  const shared =
    "flex items-start gap-3 rounded-card bg-surface p-3.5 shadow-card ring-1 ring-line";

  if (!listing) return <div className={shared}>{inner}</div>;

  return (
    <Link
      href={`/${lang}/listing/${listing.id}`}
      className={`${shared} transition hover:ring-brand-line`}
    >
      {inner}
    </Link>
  );
}

/** Five stars, filled to the rating. */
function Stars({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${value}/5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          aria-hidden
          viewBox="0 0 24 24"
          className={`size-3.5 ${n <= Math.round(value) ? "text-sold" : "text-line-strong"}`}
          fill="currentColor"
        >
          <path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.7l5.8-.8z" />
        </svg>
      ))}
    </span>
  );
}

function HomeGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-5 text-faint"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 10.2 12 3l9 7.2V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
    </svg>
  );
}

function Heart() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-4 shrink-0 text-danger"
      fill="currentColor"
    >
      <path d="M12 20.3 4.6 13a4.6 4.6 0 0 1 6.5-6.5l.9.9.9-.9A4.6 4.6 0 0 1 19.4 13Z" />
    </svg>
  );
}

function Reply() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-4 shrink-0 text-faint"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 5v4.5a2 2 0 0 0 2 2h8" />
      <path d="m14.5 8 3.5 3.5-3.5 3.5" />
    </svg>
  );
}
