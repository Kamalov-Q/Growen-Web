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
}: {
  lang: Lang;
  listingId: string;
}) {
  const { status } = useSession();
  const [phone, setPhone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const cls =
    "nums shrink-0 rounded-control bg-brand px-5 py-3 text-sm font-semibold text-brand-ink transition hover:bg-brand-hover disabled:opacity-60";

  // Signed out: a link to the login page that remembers where to come back
  // to. A link, not a button with a router call — it should be openable in a
  // new tab and readable by a crawler as "this leads to sign-in".
  if (status !== "authenticated") {
    const next = encodeURIComponent(`/${lang}/listing/${listingId}`);
    return (
      <Link href={`/${lang}/login?next=${next}`} className={cls}>
        {t(lang, "detail.showPhone")}
      </Link>
    );
  }

  if (phone) {
    return (
      <a href={`tel:+${phone.replace(/\D/g, "")}`} className={cls}>
        {prettyPhone(`+${phone.replace(/\D/g, "")}`)}
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
      {t(lang, failed ? "detail.phoneFailed" : "detail.showPhone")}
    </button>
  );
}
