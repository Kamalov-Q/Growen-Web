"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/src/features/auth/session";
import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { toggleSaved } from "./api";
import { useSavedIds } from "./saved-store";

/**
 * The heart on a listing card.
 *
 * ── Why it stops the click ────────────────────────────────────────────────
 *
 * It sits inside the card's `<Link>`, so without `preventDefault` saving a
 * listing would also navigate to it. `stopPropagation` as well, because the
 * link is the ANCESTOR — the event would otherwise reach it on the way up.
 *
 * ── Signed out ────────────────────────────────────────────────────────────
 *
 * Saving needs an account, so it goes to sign-in carrying a `next` back to
 * the page they were on, rather than failing with a 401 they cannot act on.
 *
 * ── Optimistic, but honest ────────────────────────────────────────────────
 *
 * The heart fills immediately and reverts if the request fails. A save that
 * silently did not happen is worse than a slow one: the listing is simply
 * missing from Saved later, with nothing to explain why.
 */
export function SaveButton({
  lang,
  listingId,
  className = "",
}: {
  lang: Lang;
  listingId: string;
  className?: string;
}) {
  const { status } = useSession();
  const { isSaved, setSaved } = useSavedIds();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const saved = isSaved(listingId);

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (status !== "authenticated") {
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      router.push(`/${lang}/login?next=${next}`);
      return;
    }

    const optimistic = !saved;
    setSaved(listingId, optimistic);
    setBusy(true);
    try {
      const res = await toggleSaved(listingId);
      // Trust the server's answer over the guess — they agree unless two
      // tabs raced, and then the server is right.
      setSaved(listingId, res.saved);
    } catch {
      setSaved(listingId, !optimistic);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-pressed={saved}
      aria-label={t(lang, saved ? "saved.remove" : "saved.add")}
      title={t(lang, saved ? "saved.remove" : "saved.add")}
      className={`grid size-8 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/65 disabled:opacity-60 ${className}`}
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className={`size-[17px] transition ${saved ? "scale-110" : ""}`}
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      >
        <path d="M12 20.3 4.6 13a4.8 4.8 0 0 1 6.8-6.8l.6.6.6-.6A4.8 4.8 0 1 1 19.4 13Z" />
      </svg>
    </button>
  );
}
