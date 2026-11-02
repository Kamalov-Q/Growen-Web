"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/src/components/ui/Button";
import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { api } from "@/src/lib/api";

interface SessionRow {
  familyId: string;
  startedAt: string;
  lastSeenAt: string;
  expiresAt: string;
  current: boolean;
}

/**
 * The signed-in devices, and the ability to end them.
 *
 * This matters more on the web than on a phone: a browser session can be
 * left open on a shared or public computer, and until now there was no way
 * to end it from anywhere else. The data has always existed — refresh_tokens
 * carries family_id and created_at — it simply had nothing reading it.
 *
 * One row per FAMILY, because a family is a sign-in: rotation replaces the
 * token and keeps the family, so a device open for a month is one row here
 * rather than thirty.
 */
export function SessionsList({ lang }: { lang: Lang }) {
  const [rows, setRows] = useState<SessionRow[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      reload();
    } catch {
      setError(t(lang, "auth.genericError"));
    } finally {
      setBusy(null);
    }
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(lang === "ru" ? "ru-RU" : "uz-UZ", {
      dateStyle: "medium",
      timeStyle: "short",
    });

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
      <div className="flex flex-col items-start gap-3">
        <p role="alert" className="text-[15px] text-danger">
          {error}
        </p>
        <button
          type="button"
          onClick={reload}
          className="h-10 rounded-control px-4 text-[14px] font-semibold text-ink ring-1 ring-line transition hover:bg-muted-bg"
        >
          {t(lang, "common.retry")}
        </button>
      </div>
    );
  }

  if (rows === null) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <div className="h-20 animate-pulse rounded-card bg-muted-bg" />
        <div className="h-20 animate-pulse rounded-card bg-muted-bg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {error ? (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      ) : null}

      <ul className="flex flex-col gap-3">
        {rows.map((row) => (
          <li
            key={row.familyId}
            className="flex items-center gap-4 rounded-control border border-line bg-muted-bg p-4"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-[15px] font-medium text-ink">
                {row.current
                  ? t(lang, "sessions.thisDevice")
                  : t(lang, "sessions.otherDevice")}
              </span>
              <span className="text-sm text-muted">
                {t(lang, "sessions.lastSeen", { when: fmt(row.lastSeenAt) })}
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
                className="shrink-0 rounded-lg border border-line px-3 py-1.5 text-sm text-ink hover:bg-muted-bg disabled:opacity-50"
              >
                {t(lang, "sessions.end")}
              </button>
            )}
          </li>
        ))}
      </ul>

      {rows.filter((r) => !r.current).length > 0 ? (
        <Button
          variant="ghost"
          loading={busy === "others"}
          onClick={() => void endOthers()}
        >
          {t(lang, "sessions.endOthers")}
        </Button>
      ) : null}
    </div>
  );
}
