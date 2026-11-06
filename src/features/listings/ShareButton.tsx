"use client";

import { useState } from "react";
import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";

/**
 * Share this listing.
 *
 * ── Two behaviours, one button ────────────────────────────────────────────
 *
 * On a phone the browser has a real share sheet — `navigator.share` hands
 * the link to WhatsApp, Telegram, Messages, whatever the person actually
 * uses — and that is the whole point of sharing a flat. On a desktop,
 * where the API usually does not exist, the honest fallback is to put the
 * URL on the clipboard and say so.
 *
 * ── Why the URL is built here ─────────────────────────────────────────────
 *
 * From `window.location.href`, not from the id: whatever is in the address
 * bar is what the sender is looking at, including the language segment. A
 * link assembled from a default language is how an Uzbek speaker shares a
 * Russian page.
 *
 * Both paths swallow their failures. Dismissing the share sheet REJECTS —
 * on every browser that implements it — so an error here is overwhelmingly
 * "they changed their mind", and clipboard access is refused outright in
 * an insecure context. Neither is worth an error state on a button whose
 * job is optional.
 */
export function ShareButton({
  lang,
  title,
}: {
  lang: Lang;
  /** The listing's own title, so a shared card is not just a URL. */
  title: string | null;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    const text = title ?? t(lang, "listing.untitled");

    if (navigator.share) {
      try {
        await navigator.share({ title: text, text, url });
        return;
      } catch {
        // Cancelled, or the sheet refused: fall through to the clipboard
        // rather than leaving the press with nothing to show for it.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // No clipboard either (an http:// origin, or a denied permission).
      // Nothing to do, and nothing worth saying about it.
    }
  }

  /* An icon, like the view and comment glyphs it sits beside — a labelled
     pill made one of the three things in that row shout. The words live in
     `aria-label` and `title`, so a screen reader and a hover still get
     them, and the tick is the only feedback a copy needs. */
  return (
    <button
      type="button"
      onClick={() => void share()}
      aria-label={t(lang, copied ? "detail.linkCopied" : "detail.share")}
      title={t(lang, copied ? "detail.linkCopied" : "detail.share")}
      /* `text-ink-soft`, the weight the counts beside it carry — at
         `text-muted` on this dark surface it read as disabled. */
      className="grid size-7 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-muted-bg hover:text-brand"
    >
      {copied ? <TickGlyph /> : <ShareGlyph />}
    </button>
  );
}

function ShareGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-[17px] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3.5v11" />
      <path d="m8.5 7 3.5-3.5L15.5 7" />
      <path d="M6 12.5H5a1.5 1.5 0 0 0-1.5 1.5v5A1.5 1.5 0 0 0 5 20.5h14a1.5 1.5 0 0 0 1.5-1.5v-5a1.5 1.5 0 0 0-1.5-1.5h-1" />
    </svg>
  );
}

function TickGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-4 shrink-0 text-brand"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}
