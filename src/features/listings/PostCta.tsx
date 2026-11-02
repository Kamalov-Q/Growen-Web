"use client";

import Link from "next/link";
import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { useSession } from "@/src/features/auth/session";

/**
 * The "post a listing" button.
 *
 * It used to link to `/login` unconditionally, so a signed-in person
 * pressing it was told to sign in — which is both wrong and alarming, since
 * the obvious reading is that the session was lost.
 *
 * Signed out it still goes to the login page, but carries `next`, so signing
 * in continues to the thing they were trying to do instead of dropping them
 * on the home page to find it again.
 */
export function PostCta({ lang }: { lang: Lang }) {
  const { status } = useSession();
  const target = `/${lang}/add`;

  // While the opening refresh is in flight the answer is not known yet.
  // Pointing at `add` is the safe guess: that page gates itself, so a
  // signed-out visitor who gets there is sent on to login, whereas guessing
  // `login` would bounce a signed-in one for no reason.
  const href =
    status === "unauthenticated"
      ? `/${lang}/login?next=${encodeURIComponent(target)}`
      : target;

  return (
    <Link
      href={href}
      // `md`, not `sm`: below 768px this action lives in MobileTabBar as the
      // raised centre button, and showing both would be two primary buttons
      // on one screen. Above it there is no bar, so the header carries it.
      className="hidden shrink-0 rounded-control bg-brand px-4 py-2.5 text-sm font-bold text-brand-ink transition hover:bg-brand-hover md:block"
    >
      {t(lang, "nav.post")}
    </Link>
  );
}
