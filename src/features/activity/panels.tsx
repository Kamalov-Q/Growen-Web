"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Lang } from "@/src/i18n/config";
import { Avatar } from "@/src/components/ui/Avatar";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { groupDigits } from "@/src/features/listings/format";
import { resolveMediaUrl } from "@/src/lib/media";
import { absoluteTime, relativeTime } from "@/src/lib/time";
import { ActivityList } from "./ActivityList";
import { ActivityRow } from "./ActivityRow";
import {
  markAllRead,
  myBids,
  myBlocks,
  myComments,
  myLikedComments,
  myNotifications,
  myReviews,
  unblock,
  type AppNotification,
  type BlockedPerson,
  type MyPriceBid,
} from "./api";
import { tLabel, type ActivityKey } from "./labels";

/**
 * The six lists behind "my activity", each one thin because `ActivityList`
 * carries the paging and `ActivityRow` carries the shape of a row.
 *
 * Kept in one file rather than six: every one of them is a `load` function
 * and a `render` function, and splitting twenty lines into its own module
 * six times makes the set harder to read than it is.
 */

// ---- things you said ------------------------------------------------------

export function MyCommentsPanel({ lang }: { lang: Lang }) {
  return (
    <ActivityList
      lang={lang}
      load={myComments}
      keyOf={(c) => c.id}
      emptyTitle="activity.commentsEmpty"
      emptyHint="activity.commentsEmptyHint"
      icon={
        <Glyph d="M20.5 11.6a7.9 7.9 0 0 1-8.5 7.9 9 9 0 0 1-2.6-.4L4.2 21l1.4-4.2a7.4 7.4 0 0 1-1.6-4.6 7.9 7.9 0 0 1 8.5-7.7 7.9 7.9 0 0 1 8 7.1Z" />
      }
      render={(c) => (
        <ActivityRow
          lang={lang}
          listing={c.listing}
          body={c.body}
          createdAt={c.createdAt}
          imageThumbUrl={c.imageThumbUrl}
          /* A reply is marked, because out of its thread it otherwise reads
             as a comment that answers nothing. */
          badge={c.isReply ? "reply" : undefined}
        />
      )}
    />
  );
}

export function MyLikesPanel({ lang }: { lang: Lang }) {
  return (
    <ActivityList
      lang={lang}
      load={myLikedComments}
      keyOf={(c) => c.id}
      emptyTitle="activity.likesEmpty"
      emptyHint="activity.likesEmptyHint"
      icon={
        <Glyph d="M12 20.3 4.6 13a4.6 4.6 0 0 1 6.5-6.5l.9.9.9-.9A4.6 4.6 0 0 1 19.4 13Z" />
      }
      render={(c) => (
        <ActivityRow
          lang={lang}
          listing={c.listing}
          body={c.body}
          createdAt={c.createdAt}
          imageThumbUrl={c.imageThumbUrl}
          badge="like"
        />
      )}
    />
  );
}

export function MyReviewsPanel({ lang }: { lang: Lang }) {
  return (
    <ActivityList
      lang={lang}
      load={myReviews}
      keyOf={(r) => r.id}
      emptyTitle="activity.reviewsEmpty"
      emptyHint="activity.reviewsEmptyHint"
      icon={
        <Glyph d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.7l5.8-.8z" />
      }
      render={(r) => (
        <ActivityRow
          lang={lang}
          listing={r.listing}
          body={r.comment}
          createdAt={r.createdAt}
          rating={r.rating}
        />
      )}
    />
  );
}

// ---- price offers ---------------------------------------------------------

const BID_STATUS: Record<MyPriceBid["status"], ActivityKey> = {
  PENDING: "bids.statusPending",
  ACCEPTED: "bids.statusAccepted",
  DECLINED: "bids.statusDeclined",
  COUNTERED: "bids.statusCountered",
  WITHDRAWN: "bids.statusWithdrawn",
  EXPIRED: "bids.statusExpired",
};

/**
 * Every negotiation you are in — the one view of them outside the chat
 * threads they live in.
 *
 * READ-ONLY here, and that is deliberate rather than unfinished: accepting
 * or countering happens inside the conversation, which the web does not
 * have, and a button that cannot finish what it starts is worse than a row
 * that says where the answer belongs.
 */
export function MyBidsPanel({ lang }: { lang: Lang }) {
  return (
    <ActivityList
      lang={lang}
      load={myBids}
      keyOf={(b) => b.id}
      emptyTitle="bids.myEmpty"
      emptyHint="bids.myEmptyHint"
      icon={<Glyph d="M3.5 12.5 11 5h7.5v7.5L11 20z" />}
      render={(bid) => <BidRow lang={lang} bid={bid} />}
    />
  );
}

function BidRow({ lang, bid }: { lang: Lang; bid: MyPriceBid }) {
  const tone =
    bid.status === "ACCEPTED"
      ? "bg-brand-soft text-brand ring-brand-line"
      : bid.status === "DECLINED" || bid.status === "EXPIRED"
        ? "bg-danger/10 text-danger ring-danger/30"
        : "bg-muted-bg text-muted ring-line";

  const money = `${groupDigits(Math.round(bid.amount))} ${bid.currency === "UZS" ? "so'm" : "$"}`;

  const inner = (
    <>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-[15px] font-semibold text-ink">
          {bid.listing?.title ?? tLabel(lang, "listing.untitled")}
        </span>
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span className="nums text-[17px] font-bold text-ink">{money}</span>
          {bid.askingAmount ? (
            <span className="nums text-[13px] text-faint line-through">
              {groupDigits(Math.round(bid.askingAmount))}{" "}
              {bid.askingCurrency === "UZS" ? "so'm" : "$"}
            </span>
          ) : null}
        </span>
        <span
          className="text-[12px] text-faint"
          title={absoluteTime(new Date(bid.createdAt))}
        >
          {tLabel(
            lang,
            bid.direction === "BUYER" ? "bids.rowYou" : "bids.rowThem",
          )}
          {" · "}
          {relativeTime(bid.createdAt, lang)}
        </span>
      </span>

      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold ring-1 ${tone}`}
      >
        {tLabel(lang, BID_STATUS[bid.status])}
      </span>
    </>
  );

  const shared =
    "flex items-start gap-3 rounded-card bg-surface p-3.5 shadow-card ring-1 ring-line";

  if (!bid.listing) return <div className={shared}>{inner}</div>;

  return (
    <Link
      href={`/${lang}/listing/${bid.listing.id}`}
      className={`${shared} transition hover:ring-brand-line`}
    >
      {inner}
    </Link>
  );
}

// ---- notifications --------------------------------------------------------

/**
 * One line per kind.
 *
 * The actor's name is printed by the row, so most of these read as the
 * predicate: "Bek · sizning videongizni yoqtirdi". The ones with no actor —
 * a payment, a video finishing — are whole sentences.
 */
const NOTIFICATION_TEXT: Record<string, ActivityKey> = {
  VIDEO_READY: "notifications.videoReady",
  VIDEO_FAILED: "notifications.videoFailed",
  VIDEO_AWAITING_PAYMENT: "notifications.videoAwaitingPayment",
  VIDEO_LIKE: "notifications.videoLike",
  VIDEO_COMMENT: "notifications.videoComment",
  COMMENT_REPLY: "notifications.commentReply",
  NEW_FOLLOWER: "notifications.newFollower",
  FOLLOWED_USER_POSTED: "notifications.followedUserPosted",
  LISTING_COMMENT: "notifications.listingComment",
  LISTING_COMMENT_REPLY: "notifications.listingCommentReply",
  LISTING_REVIEW: "notifications.listingReview",
  PRICE_BID_RECEIVED: "notifications.priceBidReceived",
  PRICE_BID_COUNTERED: "notifications.priceBidCountered",
  PRICE_BID_ACCEPTED: "notifications.priceBidAccepted",
  PRICE_BID_DECLINED: "notifications.priceBidDeclined",
  PRICE_BID_EXPIRED: "notifications.priceBidExpired",
  CHAT_MESSAGE: "notifications.chatMessage",
  TOPUP_SUCCEEDED: "notifications.topupSucceeded",
  TOPUP_FAILED: "notifications.topupFailed",
  TARIFF_PAID: "notifications.tariffPaid",
  TARIFF_EXPIRING: "notifications.tariffExpiring",
};

export function NotificationsPanel({ lang }: { lang: Lang }) {
  const [marked, setMarked] = useState(false);

  /**
   * Opening the list is what reads it — the app's rule, and the only one
   * that makes sense for a page whose whole content is the unread things.
   * Fired once, after the first page is on screen; a failure is silent
   * because nothing the reader can see depends on it.
   */
  useEffect(() => {
    let alive = true;
    markAllRead()
      .then(() => alive && setMarked(true))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return (
    <ActivityList
      lang={lang}
      load={myNotifications}
      keyOf={(n) => n.id}
      emptyTitle="notifications.empty"
      emptyHint="notifications.emptyHint"
      icon={
        <Glyph d="M6 9.5a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13.5 6 9.5ZM10 19a2 2 0 0 0 4 0" />
      }
      render={(n) => (
        <NotificationRow lang={lang} notification={n} readAll={marked} />
      )}
    />
  );
}

function NotificationRow({
  lang,
  notification: n,
  readAll,
}: {
  lang: Lang;
  notification: AppNotification;
  readAll: boolean;
}) {
  const key = NOTIFICATION_TEXT[n.type];
  const actorName =
    [n.actor?.name, n.actor?.surname].filter(Boolean).join(" ").trim() || null;
  const cover = resolveMediaUrl(n.listing?.thumbUrl ?? n.video?.thumbUrl);
  // Unread until the mark-all-read lands; after that the dots would be
  // lying, and a page of dots that mean nothing is noise.
  const unread = n.read === false && !readAll;

  const inner = (
    <>
      {n.actor ? (
        <Avatar uri={n.actor.avatarThumbUrl} name={actorName} size={40} />
      ) : (
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
          <Glyph d="M6 9.5a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13.5 6 9.5ZM10 19a2 2 0 0 0 4 0" />
        </span>
      )}

      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[14px] leading-5 text-ink">
          {actorName ? (
            <span className="font-semibold">{actorName} </span>
          ) : null}
          {key ? tLabel(lang, key) : n.type}
        </span>
        <span
          className="text-[12px] text-faint"
          title={absoluteTime(new Date(n.createdAt))}
        >
          {relativeTime(n.createdAt, lang)}
        </span>
      </span>

      {cover ? (
        <Image
          src={cover}
          alt=""
          width={44}
          height={44}
          unoptimized
          className="size-11 shrink-0 rounded-control object-cover"
        />
      ) : null}

      {unread ? (
        <span
          aria-hidden
          className="mt-1.5 size-2 shrink-0 rounded-full bg-brand"
        />
      ) : null}
    </>
  );

  const shared = `flex items-start gap-3 rounded-card p-3.5 shadow-card ring-1 ${
    unread ? "bg-brand-soft/40 ring-brand-line" : "bg-surface ring-line"
  }`;

  if (!n.listing) return <div className={shared}>{inner}</div>;

  return (
    <Link
      href={`/${lang}/listing/${n.listing.id}`}
      className={`${shared} transition hover:ring-brand-line`}
    >
      {inner}
    </Link>
  );
}

// ---- people you shut out --------------------------------------------------

export function BlockedPanel({ lang }: { lang: Lang }) {
  const [rows, setRows] = useState<BlockedPerson[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [confirming, setConfirming] = useState<BlockedPerson | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const reload = useCallback(() => {
    myBlocks()
      .then(setRows)
      .catch(() => setFailed(true));
  }, []);

  useEffect(reload, [reload]);

  async function remove(person: BlockedPerson) {
    setConfirming(null);
    setBusy(person.id);
    try {
      await unblock(person.id);
      setRows((prev) => (prev ?? []).filter((r) => r.id !== person.id));
    } catch {
      setFailed(true);
    } finally {
      setBusy(null);
    }
  }

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

  if (!rows) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <div className="h-16 animate-pulse rounded-card bg-muted-bg" />
        <div className="h-16 animate-pulse rounded-card bg-muted-bg" />
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-card bg-surface px-6 py-16 text-center shadow-card ring-1 ring-line">
        <span className="grid size-14 place-items-center rounded-full bg-muted-bg text-faint">
          <Glyph d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-6.4 2.6 12.8 12.8" />
        </span>
        <p className="text-[16px] font-semibold text-ink">
          {tLabel(lang, "blocks.emptyTitle")}
        </p>
        <p className="max-w-prose text-[14px] leading-6 text-muted">
          {tLabel(lang, "blocks.emptyHint")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map((person) => {
        const name =
          [person.name, person.surname].filter(Boolean).join(" ").trim() ||
          null;
        return (
          <div
            key={person.id}
            className="flex items-center gap-3 rounded-card bg-surface p-3.5 shadow-card ring-1 ring-line"
          >
            <Avatar uri={person.avatarThumbUrl} name={name} size={40} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[15px] font-semibold text-ink">
                {name ?? tLabel(lang, "profile.noName")}
              </span>
              <span
                className="text-[12px] text-faint"
                title={absoluteTime(new Date(person.blockedAt))}
              >
                {relativeTime(person.blockedAt, lang)}
              </span>
            </span>
            <button
              type="button"
              disabled={busy === person.id}
              onClick={() => setConfirming(person)}
              className="shrink-0 rounded-control px-3 py-2 text-[13px] font-bold text-brand ring-1 ring-brand-line transition hover:bg-brand-soft disabled:opacity-50"
            >
              {tLabel(lang, "blocks.unblock")}
            </button>
          </div>
        );
      })}

      <ConfirmDialog
        open={confirming !== null}
        title={tLabel(lang, "blocks.unblock")}
        body={tLabel(lang, "blocks.unblockConfirm")}
        confirmLabel={tLabel(lang, "blocks.unblock")}
        cancelLabel={tLabel(lang, "common.cancel")}
        onConfirm={() => confirming && void remove(confirming)}
        onCancel={() => setConfirming(null)}
      />
    </div>
  );
}

/** One path, at the size these panels use it. */
function Glyph({ d }: { d: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}
