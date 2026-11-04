"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/src/components/ui/Button";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { Icon } from "@/src/components/ui/Icon";
import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { absoluteTime, relativeTime } from "@/src/lib/time";
import { api } from "@/src/lib/api";

interface SessionRow {
  familyId: string;
  startedAt: string;
  lastSeenAt: string;
  expiresAt: string;
  current: boolean;
}

/**
 * Dates WITHOUT Intl, for the same reason prices are grouped by hand.
 *
 * `toLocaleString("uz-UZ", { dateStyle: "medium" })` gives "2-noy, 2026" in
 * Node and "2026 M11 2" in the browser — "M11" being CLDR's fallback when a
 * locale has no month names for that skeleton. One of those is readable and
 * which one you get depends on whose device you are holding, which is not a
 * thing to leave to chance on a security screen.
 *
 * dd.MM.yyyy is how both Uzbek and Russian write a date anyway.
 */
/**
 * The signed-in devices, and the ability to end them.
 *
 * This matters more on the web than on a phone: a browser session can be
 * left open on a shared or public computer, and until this existed there was
 * no way to end it from anywhere else. The data was always there —
 * refresh_tokens carries family_id and created_at — it simply had nothing
 * reading it.
 *
 * One row per FAMILY, because a family is a sign-in: rotation replaces the
 * token and keeps the family, so a device open for a month is one row here
 * rather than thirty.
 */
export function SessionsList({ lang }: { lang: Lang }) {
  const [rows, setRows] = useState<SessionRow[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  /**
   * A counter, not a callback.
   *
   * The obvious shape — a `load` function called from an effect — trips the
   * React Compiler's rule against setState inside an effect body, and the
   * rule is right: the effect becomes the thing that drives rendering rather
   * than something that synchronises with the outside world. Bumping a
   * version is the standard way to say "fetch again" without the effect
   * calling back into component state directly.
   */
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    // `alive` so a response that arrives after the component has gone does
    // not setState on an unmounted tree.
    let alive = true;

    api<SessionRow[]>("/auth/sessions")
      .then((data) => {
        if (alive) setRows(data);
      })
      .catch(() => {
        if (alive) setError(t(lang, "auth.genericError"));
      });

    return () => {
      alive = false;
    };
  }, [lang, version]);

  const endOne = async (familyId: string) => {
    setBusy(familyId);
    setError(null);
    try {
      await api<void>(`/auth/sessions/${familyId}`, { method: "DELETE" });
      reload();
    } catch {
      setError(t(lang, "auth.genericError"));
    } finally {
      setBusy(null);
    }
  };

  const endOthers = async () => {
    setBusy("others");
    setError(null);
    try {
      await api<void>("/auth/sessions/revoke-others", { method: "POST" });
      setConfirming(false);
      reload();
    } catch {
      setError(t(lang, "auth.genericError"));
    } finally {
      setBusy(null);
    }
  };

  /**
   * The error comes FIRST.
   *
   * It used to sit below this guard, so a request that failed left `rows`
   * null for ever and the page showed a bare "…" with the error rendered
   * underneath a `return` that had already run. A failed load looked
   * identical to a slow one, which is how a 404 from the API reads as a
   * hung page.
   */
  if (error && rows === null) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-card bg-surface p-6 shadow-card ring-1 ring-line">
        <p role="alert" className="text-[15px] text-danger">
          {error}
        </p>
        <Button variant="ghost" onClick={reload}>
          {t(lang, "common.retry")}
        </Button>
      </div>
    );
  }

  if (rows === null) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <div className="h-[4.75rem] animate-pulse rounded-card bg-muted-bg" />
        <div className="h-[4.75rem] animate-pulse rounded-card bg-muted-bg" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-card bg-surface p-6 text-[15px] text-muted shadow-card ring-1 ring-line">
        {t(lang, "sessions.empty")}
      </p>
    );
  }

  const others = rows.filter((r) => !r.current);

  return (
    <div className="flex flex-col gap-4">
      <p className="nums text-[13px] font-medium uppercase tracking-wide text-faint">
        {t(lang, "sessions.active", { n: rows.length })}
      </p>

      {error ? (
        <p
          role="alert"
          className="rounded-control bg-danger/10 px-4 py-3 text-[14px] text-danger"
        >
          {error}
        </p>
      ) : null}

      <ul className="flex flex-col gap-3">
        {rows.map((row) => (
          <li
            key={row.familyId}
            className={`flex items-center gap-4 rounded-card bg-surface p-4 shadow-card ring-1 transition ${
              row.current ? "ring-brand/40" : "ring-line hover:ring-line-strong"
            }`}
          >
            <span
              className={`grid size-11 shrink-0 place-items-center rounded-control ${
                row.current
                  ? "bg-brand-soft text-brand"
                  : "bg-muted-bg text-muted"
              }`}
            >
              <Icon name="sessions" className="size-5" />
            </span>

            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="flex flex-wrap items-center gap-2 text-[15px] font-semibold text-ink">
                {row.current
                  ? t(lang, "sessions.thisDevice")
                  : t(lang, "sessions.otherDevice")}
                {row.current ? (
                  <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand-ink">
                    {t(lang, "sessions.current")}
                  </span>
                ) : null}
              </span>

              {/* The exact timestamp stays available on hover — a relative
                  one answers "is someone on my account now?", an absolute
                  one answers "was that me on Tuesday?". */}
              <span
                className="text-[13px] text-muted"
                title={absoluteTime(new Date(row.lastSeenAt))}
              >
                {t(lang, "sessions.lastSeen", {
                  when: relativeTime(row.lastSeenAt, lang),
                })}
              </span>
              <span className="nums text-[12px] text-faint">
                {t(lang, "sessions.started", {
                  when: absoluteTime(new Date(row.startedAt)),
                })}
              </span>
            </div>

            {/* The current session is not revocable here. Ending the session
                you are using is what "Sign out" does, with the cookie
                cleared and the access token killed — doing it from this list
                would leave the browser holding a dead session and looking
                signed in. */}
            {row.current ? null : (
              <button
                type="button"
                onClick={() => void endOne(row.familyId)}
                disabled={busy !== null}
                className="shrink-0 rounded-control px-3 py-2 text-[13px] font-semibold text-danger ring-1 ring-danger/30 transition hover:bg-danger/10 disabled:opacity-50"
              >
                {busy === row.familyId ? "…" : t(lang, "sessions.end")}
              </button>
            )}
          </li>
        ))}
      </ul>

      {others.length > 0 ? (
        <div className="flex">
          <Button variant="ghost" onClick={() => setConfirming(true)}>
            {t(lang, "sessions.endOthers")}
          </Button>
        </div>
      ) : null}

      {/* Confirmed, because it is irreversible and it signs other people's
          devices out — including, quite possibly, your own phone. */}
      <ConfirmDialog
        open={confirming}
        title={t(lang, "sessions.endOthersTitle")}
        body={t(lang, "sessions.endOthersBody")}
        confirmLabel={t(lang, "sessions.endOthers")}
        cancelLabel={t(lang, "common.cancel")}
        danger
        busy={busy === "others"}
        onConfirm={() => void endOthers()}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
