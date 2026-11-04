"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { useSession } from "@/src/features/auth/session";
import {
  VirtualCard,
  formatThousands,
} from "@/src/features/account/VirtualCard";
import {
  getTransactions,
  getWallet,
  type Wallet,
  type WalletTxn,
} from "@/src/features/account/api";
import { absoluteTime, relativeTime } from "@/src/lib/time";
import { downloadCsv, fetchAllTransactions, toCsv } from "./csv";
import { txConfig } from "./txConfig";

/**
 * The ledger — every line the wallet has been moved by, newest first.
 *
 * The app's history screen: the card on top, the count beside the heading,
 * pull-to-refresh, and a row that opens the operation in full. What is here
 * and not there is the EXPORT — a phone has nowhere useful to put a file
 * and a browser does, and anybody reconciling this against an accounting
 * entry wants it as a spreadsheet rather than as a screenshot.
 */

const PAGE = 30;

export function HistoryPanel({ lang }: { lang: Lang }) {
  const { user } = useSession();
  const [items, setItems] = useState<WalletTxn[] | null>(null);
  const [total, setTotal] = useState(0);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);

  // One request for the balance and one for the first page, together: they
  // are independent reads and waiting for one adds a round trip.
  useEffect(() => {
    let alive = true;
    Promise.all([getWallet(), getTransactions(PAGE, 0)])
      .then(([w, page]) => {
        if (!alive) return;
        setWallet(w);
        setItems(page.items);
        setTotal(page.total);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setBusy(true);
    try {
      const [w, page] = await Promise.all([getWallet(), getTransactions(PAGE, 0)]);
      setWallet(w);
      setItems(page.items);
      setTotal(page.total);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }, []);

  const more = useCallback(async (offset: number) => {
    setBusy(true);
    try {
      const page = await getTransactions(PAGE, offset);
      setTotal(page.total);
      setItems((prev) => [...(prev ?? []), ...page.items]);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }, []);

  /**
   * Every page, not the ones on screen.
   *
   * An export that silently stops at whatever happened to be loaded is a
   * file somebody balances their books against and comes up short.
   */
  async function exportCsv() {
    setExporting(true);
    try {
      const rows = await fetchAllTransactions();
      const stamp = new Date().toISOString().slice(0, 10);
      downloadCsv(toCsv(rows, lang), `growencity-wallet-${stamp}.csv`);
    } catch {
      setFailed(true);
    } finally {
      setExporting(false);
    }
  }

  const name = [user?.name, user?.surname].filter(Boolean).join(" ").trim();

  return (
    <div className="flex flex-col gap-6">
      {user?.phoneNumber ? (
        <VirtualCard
          lang={lang}
          phone={user.phoneNumber}
          name={name}
          userId={user.id}
          accountNo={wallet?.accountNo ?? null}
          balance={wallet?.balance}
          topupHref={`/${lang}/wallet`}
        />
      ) : (
        <section className="flex flex-col gap-1 rounded-card bg-surface p-6 shadow-card ring-1 ring-line">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-muted">
            {t(lang, "wallet.balance")}
          </p>
          {wallet === null ? (
            <div className="h-9 w-40 animate-pulse rounded-control bg-muted-bg" />
          ) : (
            <p className="nums text-[2rem] font-bold leading-tight tracking-tight text-ink">
              {formatThousands(wallet.balance)} so&apos;m
            </p>
          )}
        </section>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <h2 className="flex items-center gap-2 text-[1.05rem] font-bold tracking-tight text-ink">
          {t(lang, "wallet.transactions")}
          {total ? (
            <span className="nums rounded-full bg-muted-bg px-2 py-0.5 text-[12px] font-semibold text-muted">
              {total}
            </span>
          ) : null}
        </h2>

        <span className="flex-1" />

        <button
          type="button"
          onClick={() => void refresh()}
          disabled={busy}
          aria-label={t(lang, "wallet.refresh")}
          className="grid size-9 place-items-center rounded-control text-muted ring-1 ring-line transition hover:text-ink disabled:opacity-50"
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className={`size-4 ${busy ? "animate-spin" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 11a8 8 0 1 0-.6 4M20 4v7h-7" />
          </svg>
        </button>

        {items?.length ? (
          <button
            type="button"
            onClick={() => void exportCsv()}
            disabled={exporting}
            className="flex items-center gap-2 rounded-control px-3 py-2 text-[13px] font-bold text-ink ring-1 ring-line transition hover:bg-muted-bg disabled:opacity-50"
          >
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
              <path d="M12 4v11m0 0 4-4m-4 4-4-4M4 19h16" />
            </svg>
            {t(lang, exporting ? "wallet.downloading" : "wallet.download")}
          </button>
        ) : null}
      </div>

      {failed ? (
        <p
          role="alert"
          className="rounded-card bg-surface p-6 text-[15px] text-danger ring-1 ring-line"
        >
          {t(lang, "home.loadError")}
        </p>
      ) : null}

      {items === null ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          <div className="h-16 animate-pulse rounded-card bg-muted-bg" />
          <div className="h-16 animate-pulse rounded-card bg-muted-bg" />
          <div className="h-16 animate-pulse rounded-card bg-muted-bg" />
        </div>
      ) : !items.length ? (
        <p className="rounded-card bg-surface px-6 py-16 text-center text-[15px] text-muted shadow-card ring-1 ring-line">
          {t(lang, "wallet.noHistory")}
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {items.map((tx) => (
              <li key={tx.id}>
                <Row lang={lang} tx={tx} />
              </li>
            ))}
          </ul>

          {items.length < total ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void more(items.length)}
              className="h-12 rounded-control text-[15px] font-semibold text-ink ring-1 ring-line transition hover:bg-muted-bg disabled:opacity-50"
            >
              {t(lang, "wallet.loadMore", { n: total - items.length })}
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}

/** One ledger line. The whole row opens it — see the transaction page. */
function Row({ lang, tx }: { lang: Lang; tx: WalletTxn }) {
  const amount = Number(tx.amount);
  const config = txConfig(tx.kind, amount);
  const credit = amount > 0;

  return (
    <Link
      href={`/${lang}/wallet/transaction/${tx.id}`}
      className="flex items-center gap-3 rounded-card bg-surface p-3.5 shadow-card ring-1 ring-line transition hover:ring-brand-line"
    >
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-full ${config.tone}`}
      >
        {config.icon}
      </span>

      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[15px] font-semibold text-ink">
          {t(lang, config.label)}
        </span>
        <span
          className="text-[12px] text-faint"
          title={absoluteTime(new Date(tx.createdAt))}
        >
          {relativeTime(tx.createdAt, lang)}
        </span>
        {tx.note ? (
          <span className="truncate text-[12px] text-muted">{tx.note}</span>
        ) : null}
      </span>

      <span className="flex shrink-0 flex-col items-end">
        <span
          className={`nums text-[15px] font-bold ${
            credit ? "text-brand" : "text-ink"
          }`}
        >
          {credit ? "+" : ""}
          {formatThousands(amount)}
        </span>
        <span className="nums text-[12px] text-faint">
          {t(lang, "wallet.balanceAfter", {
            amount: formatThousands(tx.balanceAfter),
          })}
        </span>
      </span>

      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="size-4 shrink-0 text-faint rtl:rotate-180"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m9 6 6 6-6 6" />
      </svg>
    </Link>
  );
}
