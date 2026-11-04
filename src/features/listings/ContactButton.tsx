"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession } from "@/src/features/auth/session";
import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { api } from "@/src/lib/api";
import { prettyPhone } from "@/src/lib/phone";

/**
 * The seller's phone, behind a sign-in.
 *
 * ── Why the number is not a prop ───────────────────────────────────────────
 *
 * The obvious version takes `phone` from the server component and hides it
 * until the viewer signs in. That hides nothing. This page is STATICALLY
 * RENDERED for search engines, so the number would sit in the HTML — and in
 * the RSC payload — for anyone who opens View Source, and for every scraper
 * that never runs JavaScript. Gating the button while shipping the number is
 * worse than not gating it, because it looks protected.
 *
 * So the number is not rendered, not passed, and not in the payload. It is
 * fetched on CLICK, by someone who is signed in, and only then.
 *
 * ── Why clicking is better than revealing on load ──────────────────────────
 *
 * Fetching on click rather than on mount also means one request when someone
 * actually wants to call, instead of one on every page view.
 *
 * ── Where the real boundary is ─────────────────────────────────────────────
 *
 * The API. This component cannot be a security control — it runs on the
 * visitor's machine. It keeps numbers out of the crawlable HTML, which is
 * what stops bulk harvesting; the per-request decision of who may see a
 * phone number belongs to the endpoint that serves it.
 */
export function ContactButton({
  lang,
  listingId,
  compact = false,
}: {
  lang: Lang;
  listingId: string;
  /**
   * The half-width version, for the map card.
   *
   * Secondary rather than brand — it shares a row with "open the listing",
   * and two filled buttons side by side say neither is the main one. It
   * also says "call" instead of printing the number: there is no room for
   * twelve digits beside another button, and the detail page is where a
   * number is read off the screen.
   */
  compact?: boolean;
}) {
  const { status } = useSession();
  const [phone, setPhone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const cls = compact
    ? "flex flex-1 items-center justify-center gap-1.5 rounded-control px-3 py-2.5 text-[14px] font-bold text-ink ring-1 ring-line transition hover:bg-muted-bg disabled:opacity-60"
    : "nums shrink-0 rounded-control bg-brand px-5 py-3 text-sm font-semibold text-brand-ink transition hover:bg-brand-hover disabled:opacity-60";

  const phoneIcon = (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7.5 4.5h-2A1.5 1.5 0 0 0 4 6.2 14 14 0 0 0 17.8 20a1.5 1.5 0 0 0 1.7-1.5v-2a1.3 1.3 0 0 0-1-1.3l-2.4-.5a1.3 1.3 0 0 0-1.3.5l-.8 1a11 11 0 0 1-4.7-4.7l1-.8a1.3 1.3 0 0 0 .5-1.3l-.5-2.4a1.3 1.3 0 0 0-1.3-1Z" />
    </svg>
  );

  // Signed out: a link to the login page that remembers where to come back
  // to. A link, not a button with a router call — it should be openable in a
  // new tab and readable by a crawler as "this leads to sign-in".
  if (status !== "authenticated") {
    const next = encodeURIComponent(`/${lang}/listing/${listingId}`);
    return (
      <Link href={`/${lang}/login?next=${next}`} className={cls}>
        {compact ? phoneIcon : null}
        {t(lang, compact ? "map.call" : "detail.showPhone")}
      </Link>
    );
  }

  if (phone) {
    return (
      <a href={`tel:+${phone.replace(/\D/g, "")}`} className={cls}>
        {compact ? phoneIcon : null}
        {compact
          ? t(lang, "map.call")
          : prettyPhone(`+${phone.replace(/\D/g, "")}`)}
      </a>
    );
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        setFailed(false);
        try {
          const l = await api<{ contactPhone: string | null }>(
            `/listings/${listingId}`,
          );
          if (l.contactPhone) setPhone(l.contactPhone);
          else setFailed(true);
        } catch {
          setFailed(true);
        } finally {
          setBusy(false);
        }
      }}
      className={cls}
    >
      {compact && !failed ? phoneIcon : null}
      {t(
        lang,
        failed
          ? "detail.phoneFailed"
          : compact
            ? "map.call"
            : "detail.showPhone",
      )}
    </button>
  );
}
