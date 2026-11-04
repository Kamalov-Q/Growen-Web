"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Lang } from "@/src/i18n/config";
import { t, type UiKey } from "@/src/i18n/dictionary";
import { getCounts } from "@/src/features/account/api";
import { unreadCount } from "./api";

/**
 * "Your activity" — the hub. One row per thing you have left behind, in the
 * order you are most likely to want it back, which is the app's order and
 * not alphabetical.
 *
 * Two numbers are shown and no more. Unread notifications is the one count
 * on this page that is about other people's actions rather than your own,
 * which is why it leads; saved is the only other one already kept for free
 * (the account page fetches it anyway, so this is a warm cache). Every
 * other row would cost a request to print a number nobody navigates by.
 */
interface Row {
  href: string;
  label: UiKey;
  hint: UiKey;
  icon: React.ReactNode;
  count?: number;
}

export function ActivityHub({ lang }: { lang: Lang }) {
  const [unread, setUnread] = useState<number | undefined>();
  const [saved, setSaved] = useState<number | undefined>();

  useEffect(() => {
    let alive = true;
    // Both are decoration: a hub that fails to show a badge is still a hub,
    // so neither failure is surfaced.
    unreadCount()
      .then((r) => alive && setUnread(r.count))
      .catch(() => {});
    getCounts()
      .then((c) => alive && setSaved(c.saved))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const rows: Row[] = [
    {
      href: `/${lang}/activity/notifications`,
      label: "notifications.title",
      hint: "notifications.emptyHint",
      icon: (
        <Glyph d="M6 9.5a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13.5 6 9.5ZM10 19a2 2 0 0 0 4 0" />
      ),
      count: unread || undefined,
    },
    {
      href: `/${lang}/activity/bids`,
      label: "bids.myTitle",
      hint: "bids.myHint",
      icon: <Glyph d="M3.5 12.5 11 5h7.5v7.5L11 20z" />,
    },
    {
      href: `/${lang}/saved`,
      label: "activity.saved",
      hint: "activity.savedHint",
      icon: <Glyph d="M7 4h10a1 1 0 0 1 1 1v15l-6-3.5L6 20V5a1 1 0 0 1 1-1Z" />,
      count: saved,
    },
    {
      href: `/${lang}/activity/likes`,
      label: "activity.likes",
      hint: "activity.likesHint",
      icon: (
        <Glyph d="M12 20.3 4.6 13a4.6 4.6 0 0 1 6.5-6.5l.9.9.9-.9A4.6 4.6 0 0 1 19.4 13Z" />
      ),
    },
    {
      href: `/${lang}/activity/comments`,
      label: "activity.comments",
      hint: "activity.commentsHint",
      icon: (
        <Glyph d="M20.5 11.6a7.9 7.9 0 0 1-8.5 7.9 9 9 0 0 1-2.6-.4L4.2 21l1.4-4.2a7.4 7.4 0 0 1-1.6-4.6 7.9 7.9 0 0 1 8.5-7.7 7.9 7.9 0 0 1 8 7.1Z" />
      ),
    },
    {
      href: `/${lang}/activity/reviews`,
      label: "activity.reviews",
      hint: "activity.reviewsHint",
      icon: (
        <Glyph d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.7l5.8-.8z" />
      ),
    },
    {
      href: `/${lang}/activity/blocked`,
      label: "blocks.title",
      hint: "blocks.hint",
      icon: <Glyph d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-6.4 2.6 12.8 12.8" />,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[15px] leading-7 text-muted">
        {t(lang, "activity.intro")}
      </p>

      <nav className="flex flex-col gap-3">
        {rows.map((row) => (
          <Link
            key={row.href}
            href={row.href}
            className="flex items-center gap-3 rounded-card bg-surface p-4 shadow-card ring-1 ring-line transition hover:ring-brand-line"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
              {row.icon}
            </span>

            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[15px] font-semibold text-ink">
                {t(lang, row.label)}
              </span>
              <span className="truncate text-[13px] text-muted">
                {t(lang, row.hint)}
              </span>
            </span>

            {row.count ? (
              <span className="nums shrink-0 rounded-full bg-brand px-2 py-0.5 text-[12px] font-bold text-brand-ink">
                {row.count}
              </span>
            ) : null}

            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="size-4 shrink-0 text-faint rtl:rotate-180"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9 6 6 6-6 6" />
            </svg>
          </Link>
        ))}
      </nav>
    </div>
  );
}

function Glyph({ d }: { d: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-[19px]"
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
