"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Lang } from "@/src/i18n/config";
import { t, type UiKey } from "@/src/i18n/dictionary";
import { useSession } from "@/src/features/auth/session";
import { ApiError } from "@/src/lib/api";
import { REPORT_REASONS, reportListing, type ReportReason } from "./social-api";

/**
 * "Report this listing" — the app's sheet, as a dialog.
 *
 * The reasons are the server's fixed keys (`REPORT_REASONS`); only their
 * labels live here, which is why adding one is a change in two places and
 * not seven. `OTHER` requires the free-text box — the server enforces that
 * too, and a report that says only "other" is one a moderator cannot act
 * on.
 *
 * Signed out, the button goes to sign-in carrying `next`: reporting needs
 * an account answerable at a verified number, because a report is an
 * accusation and an anonymous one is noise.
 */
export function ReportButton({
  lang,
  listingId,
}: {
  lang: Lang;
  listingId: string;
}) {
  const { status } = useSession();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const needsComment = reason === "OTHER";
  const ready = reason !== null && (!needsComment || comment.trim().length > 0);

  function start() {
    if (status !== "authenticated") {
      const next = encodeURIComponent(`/${lang}/listing/${listingId}`);
      router.push(`/${lang}/login?next=${next}`);
      return;
    }
    setOpen(true);
  }

  async function submit() {
    if (!ready || busy || !reason) return;
    setBusy(true);
    setError(null);
    try {
      await reportListing(listingId, {
        reason,
        comment: comment.trim() || undefined,
      });
      setSent(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? // The server says so plainly when there is already one from
            // this account; repeating it as a generic failure would invite
            // somebody to try again and again.
            err.code === "ALREADY_REPORTED"
            ? t(lang, "report.already")
            : err.message
          : t(lang, "auth.genericError"),
      );
    } finally {
      setBusy(false);
    }
  }

  function close() {
    setOpen(false);
    // Reset only after it is out of sight, so the dialog does not visibly
    // empty itself on the way.
    setTimeout(() => {
      setReason(null);
      setComment("");
      setError(null);
      setSent(false);
    }, 200);
  }

  return (
    <>
      {/* A bordered pill rather than loose text. At the foot of a long
          page a bare label reads as a stray caption, and on a phone it was
          a 13px tap target with nothing around it. Quiet by default —
          muted, hairline ring — and only turns the colour of what it does
          on hover. */}
      <button
        type="button"
        onClick={start}
        className="flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold text-muted ring-1 ring-line transition hover:text-danger hover:ring-danger/40"
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 21V4.5h10l-1 3 1 3H5" />
        </svg>
        {t(lang, "report.action")}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={close}
        >
          {/* The sheet itself. The backdrop closes; a click inside must not
              bubble out to it and close the thing being used. */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t(lang, "report.action")}
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-md flex-col gap-4 rounded-t-card bg-surface p-5 shadow-lift ring-1 ring-line sm:rounded-card"
          >
            {sent ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <span className="grid size-14 place-items-center rounded-full bg-brand-soft text-brand">
                  <svg
                    aria-hidden
                    viewBox="0 0 24 24"
                    className="size-8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m5 12.5 4.5 4.5L19 7.5" />
                  </svg>
                </span>
                <p className="text-[15px] font-semibold text-ink">
                  {t(lang, "report.sent")}
                </p>
                <button
                  type="button"
                  onClick={close}
                  className="mt-1 h-11 w-full rounded-control bg-brand text-[15px] font-bold text-brand-ink transition hover:bg-brand-hover"
                >
                  {t(lang, "filters.close")}
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-danger/10 text-danger">
                    <svg
                      aria-hidden
                      viewBox="0 0 24 24"
                      className="size-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 21V4.5h10l-1 3 1 3H5" />
                    </svg>
                  </span>

                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <h2 className="text-[1.05rem] font-bold tracking-tight text-ink">
                      {t(lang, "report.action")}
                    </h2>
                    <p className="text-[14px] leading-5 text-muted">
                      {t(lang, "report.subtitle")}
                    </p>
                  </div>

                  {/* A way out that is not the backdrop: on a phone the
                      sheet covers the screen and there is nothing beside
                      it left to press. */}
                  <button
                    type="button"
                    onClick={close}
                    aria-label={t(lang, "filters.close")}
                    className="grid size-8 shrink-0 place-items-center rounded-full text-muted transition hover:bg-muted-bg hover:text-ink"
                  >
                    <svg
                      aria-hidden
                      viewBox="0 0 24 24"
                      className="size-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    >
                      <path d="M6 6l12 12M18 6 6 18" />
                    </svg>
                  </button>
                </div>

                <div role="radiogroup" className="flex flex-col">
                  {REPORT_REASONS.map((key, index) => (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={reason === key}
                      onClick={() => setReason(key)}
                      className={`flex items-center gap-3 px-1 py-3 text-start text-[15px] transition ${
                        index === 0 ? "" : "border-t border-line"
                      } ${reason === key ? "font-semibold text-ink" : "text-ink-soft hover:text-ink"}`}
                    >
                      <span
                        className={`grid size-5 shrink-0 place-items-center rounded-full ring-2 ${
                          reason === key
                            ? "bg-brand text-brand-ink ring-brand"
                            : "ring-line-strong"
                        }`}
                      >
                        {reason === key ? (
                          <span className="size-1.5 rounded-full bg-current" />
                        ) : null}
                      </span>
                      {t(lang, `report.${key}` as UiKey)}
                    </button>
                  ))}
                </div>

                {needsComment ? (
                  <div className="rounded-control bg-raised px-3.5 ring-1 ring-line transition focus-within:ring-2 focus-within:ring-brand">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={t(lang, "report.otherPlaceholder")}
                      rows={3}
                      maxLength={500}
                      autoFocus
                      className="w-full resize-y bg-transparent py-2.5 text-[15px] leading-6 text-ink outline-none placeholder:text-faint"
                    />
                  </div>
                ) : null}

                {error ? (
                  <p
                    role="alert"
                    className="text-[13px] font-medium text-danger"
                  >
                    {error}
                  </p>
                ) : null}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={close}
                    className="h-11 flex-1 rounded-control text-[15px] font-semibold text-ink ring-1 ring-line transition hover:bg-muted-bg"
                  >
                    {t(lang, "common.cancel")}
                  </button>
                  <button
                    type="button"
                    onClick={() => void submit()}
                    disabled={!ready || busy}
                    className="h-11 flex-1 rounded-control bg-danger/10 text-[15px] font-bold text-danger ring-1 ring-danger/40 transition hover:bg-danger/15 disabled:opacity-50"
                  >
                    {t(lang, "report.submit")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
