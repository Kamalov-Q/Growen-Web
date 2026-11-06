"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import {
  tDeleteAccount,
  type DeleteAccountKey,
} from "@/src/i18n/strings/deleteAccount";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { groupDigits } from "@/src/features/listings/format";
import { ApiError, clearSession } from "@/src/lib/api";
import { deleteAccount, getWallet, type Wallet } from "./api";

/**
 * Deleting your own account.
 *
 * A PAGE rather than a dialog, for the reason the app gives: both stores
 * require this path to exist and to be reachable without contacting
 * support, and a reviewer has to be able to read what it does before
 * pressing it — a two-line alert cannot say which records survive and which
 * do not. It also gives the wallet warning somewhere to live, which is the
 * one consequence money can be lost to.
 */

const REASON_MAX = 500;

/** Section 3 of the published deletion policy, in the same order. */
const REMOVED: DeleteAccountKey[] = [
  "deleteAccount.goesProfile",
  "deleteAccount.goesListings",
  "deleteAccount.goesVideos",
  "deleteAccount.goesContacts",
  "deleteAccount.goesPush",
];

/** And section 4 — the records that outlive the account, and why. */
const KEPT: DeleteAccountKey[] = [
  "deleteAccount.staysMessages",
  "deleteAccount.staysPayments",
];

export function DeleteAccountPanel({ lang }: { lang: Lang }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    // Decoration for the warning below; a wallet that will not load is no
    // reason to block somebody from leaving.
    getWallet()
      .then((w) => alive && setWallet(w))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const balance = Number(wallet?.balance ?? 0);
  const locale = lang === "ru" ? "ru-RU" : "uz-UZ";

  async function remove() {
    setConfirming(false);
    setError(null);
    setBusy(true);
    try {
      await deleteAccount(reason.trim() || undefined);

      /**
       * Torn down HERE rather than through the usual sign-out.
       *
       * By the time that call returns the server has revoked every refresh
       * token, so `POST /auth/logout` would answer 401 against an account
       * that no longer exists. The order is the one sign-out uses: the
       * socket authenticates with the access token still in memory, so
       * dropping it after the session is cleared leaves it reconnecting.
       */
      // Dynamic for the same reason as sign-out: this page has no other
      // use for socket.io, and a static import would put it in the
      // account bundle.
      const { chatSocket } = await import("@/src/lib/socket");
      chatSocket.disconnect();
      clearSession();

      // Browsing is public, so there is somewhere to land. `replace`, not
      // push: nothing behind this page belongs to anybody any more.
      router.replace(`/${lang}`);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : t(lang, "auth.genericError"),
      );
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <p className="text-[15px] leading-7 text-muted">
        {tDeleteAccount(lang, "deleteAccount.intro")}
      </p>

      {/* Shown only when there is money to lose: a standing warning on an
          empty wallet is noise, and noise is what gets skipped. */}
      {balance > 0 ? (
        <p className="flex items-start gap-3 rounded-card bg-danger/10 p-4 text-[15px] leading-6 text-ink ring-1 ring-danger/30">
          <WalletGlyph />
          {tDeleteAccount(lang, "deleteAccount.balanceWarning", {
            balance: `${groupDigits(Math.round(balance))} ${
              wallet?.currency === "USD" ? "$" : "so'm"
            }`,
          })}
        </p>
      ) : null}

      <Section title={tDeleteAccount(lang, "deleteAccount.removedTitle")}>
        {REMOVED.map((key) => (
          <Line key={key} tone="danger">
            {tDeleteAccount(lang, key)}
          </Line>
        ))}
      </Section>

      <Section title={tDeleteAccount(lang, "deleteAccount.keptTitle")}>
        {KEPT.map((key) => (
          <Line key={key} tone="muted">
            {tDeleteAccount(lang, key)}
          </Line>
        ))}
      </Section>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="reason"
          className="text-[13px] font-semibold uppercase tracking-wide text-muted"
        >
          {tDeleteAccount(lang, "deleteAccount.reasonTitle")}
        </label>
        <div className="rounded-control bg-surface px-3.5 ring-1 ring-line transition focus-within:ring-2 focus-within:ring-brand">
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={tDeleteAccount(lang, "deleteAccount.reasonPlaceholder")}
            rows={3}
            maxLength={REASON_MAX}
            className="w-full resize-y bg-transparent py-3 text-[15px] leading-6 text-ink outline-none placeholder:text-faint"
          />
        </div>
        <p className="nums self-end text-[12px] text-faint">
          {reason.length.toLocaleString(locale)}/{REASON_MAX}
        </p>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-control bg-surface p-3.5 text-[14px] font-medium text-danger ring-1 ring-danger/40"
        >
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={busy}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-control bg-danger/10 text-[15px] font-bold text-danger ring-1 ring-danger/40 transition hover:bg-danger/15 disabled:opacity-50"
      >
        {busy ? (
          <span
            aria-hidden
            className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        ) : (
          <TrashGlyph />
        )}
        {tDeleteAccount(lang, "deleteAccount.action")}
      </button>

      <p className="text-center text-[13px] text-faint">
        {tDeleteAccount(lang, "deleteAccount.footnote")}
      </p>

      <ConfirmDialog
        open={confirming}
        title={tDeleteAccount(lang, "deleteAccount.confirmTitle")}
        body={tDeleteAccount(lang, "deleteAccount.confirmMessage")}
        confirmLabel={tDeleteAccount(lang, "deleteAccount.action")}
        cancelLabel={t(lang, "common.cancel")}
        danger
        onConfirm={() => void remove()}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-card bg-surface p-5 shadow-card ring-1 ring-line">
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted">
        {title}
      </h2>
      <ul className="flex flex-col gap-2.5">{children}</ul>
    </section>
  );
}

function Line({
  tone,
  children,
}: {
  tone: "danger" | "muted";
  children: string;
}) {
  return (
    <li className="flex items-start gap-2.5 text-[15px] leading-6 text-ink">
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className={`mt-1 size-4 shrink-0 ${
          tone === "danger" ? "text-danger" : "text-muted"
        }`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {tone === "danger" ? (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M8.5 8.5l7 7M15.5 8.5l-7 7" />
          </>
        ) : (
          <>
            <path d="M12 2.8 4.8 5.4v6c0 4.6 3 8.7 7.2 10 4.2-1.3 7.2-5.4 7.2-10v-6Z" />
            <path d="m9 12 2.2 2.2L15.4 10" />
          </>
        )}
      </svg>
      {children}
    </li>
  );
}

function WalletGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="mt-0.5 size-5 shrink-0 text-danger"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2.8" y="5.8" width="18.4" height="12.4" rx="2.6" />
      <path d="M2.8 10h18.4" />
    </svg>
  );
}

function TrashGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 6.5h16M9.5 6.5V4.8A1.3 1.3 0 0 1 10.8 3.5h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7" />
      <path d="M6.3 6.5 7.2 19a1.6 1.6 0 0 0 1.6 1.5h6.4a1.6 1.6 0 0 0 1.6-1.5l.9-12.5" />
    </svg>
  );
}
