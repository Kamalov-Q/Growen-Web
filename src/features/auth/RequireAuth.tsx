"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { Lang } from "@/src/i18n/config";
import { useSession } from "./session";

/**
 * Gates the parts of the site that need a session.
 *
 * ── Why this is client-side, and has to be ─────────────────────────────────
 *
 * The refresh cookie is httpOnly and scoped to `/api/auth` on the API's own
 * subdomain. A Next middleware or server component cannot read it — that
 * unreadability is precisely what makes it safe against XSS — so the server
 * rendering this site genuinely does not know who is asking. Protection
 * therefore lives where the session does.
 *
 * ── This is NOT a security boundary ────────────────────────────────────────
 *
 * The API is. Every protected endpoint checks the access token itself, so
 * the worst a person who defeats this can reach is an empty shell that then
 * 401s. Treating a client guard as the gate is how apps leak data to the
 * Network tab.
 *
 * Concretely: this is a CLIENT component, so the server renders its children
 * into the RSC payload and ships them whatever the session is. Nothing is
 * displayed — the page shows a skeleton and then redirects — but the markup
 * is in the response and anybody can read it with View Source. On this page
 * that is the words "Active sessions" and a description, which is fine.
 *
 * So: never put data behind this guard. Fetch it from an authenticated
 * endpoint in a child that runs on the client, the way SessionsList does.
 * Anything passed as `children` from a server component should be assumed
 * public.
 *
 * ── What it renders while it decides ───────────────────────────────────────
 *
 * It used to return `null` for both "still checking" and "signed out", and
 * the page's own heading sat OUTSIDE it — so a signed-out visitor saw the
 * title and an empty page for a moment before being redirected, which looks
 * like the page loaded and then broke. Now the whole page passes through
 * here, and the two states are told apart: a skeleton while the opening
 * refresh is in flight, and nothing at all once the answer is "no", because
 * at that point the redirect is already under way.
 */
export function RequireAuth({
  lang,
  children,
}: {
  lang: Lang;
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== "unauthenticated") return;
    // `replace`, not `push`: the back button should go wherever the person
    // came from, not back to a page that will bounce them again.
    router.replace(`/${lang}/login`);
  }, [status, lang, router]);

  if (status === "loading") {
    return (
      <div
        role="status"
        aria-busy="true"
        className="flex flex-col gap-4 py-10"
      >
        <span className="sr-only">…</span>
        <div className="h-7 w-48 animate-pulse rounded-control bg-muted-bg" />
        <div className="h-20 animate-pulse rounded-card bg-muted-bg" />
        <div className="h-20 animate-pulse rounded-card bg-muted-bg" />
      </div>
    );
  }

  // Signed out: render nothing. The redirect is already running, and a
  // flash of the real page on the way out is worse than a blank moment.
  if (status !== "authenticated") return null;

  return <>{children}</>;
}
