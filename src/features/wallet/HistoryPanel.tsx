"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { formatThousands } from "@/src/features/account/VirtualCard";
import {
  getTransactions,
  getWallet,
  type Wallet,
  type WalletTxn,
} from "@/src/features/account/api";
import { absoluteTime, relativeTime } from "@/src/lib/time";
import { txConfig } from "./txConfig";

/**
 * The ledger — every line the wallet has been moved by, newest first.
 *
 * ── It used to show nothing ───────────────────────────────────────────────
 *
 * `/wallet/transactions` answers `{ items, total, limit, offset }` and this
 * page's client typed it as an array, so `txns.length` was `undefined`,
 * `!undefined` was true, and every account — however many payments it had —
 * was told it had no history. The type is the server's shape now; see
 * `WalletTxnPage`.
 *
 * ── Signs, not colours alone ──────────────────────────────────────────────
 *
 * Money in is "+" and brand-coloured, money out carries the minus the
 * server already put in the amount. The sign is what survives being read in
 * greyscale, and it is the thing somebody is actually scanning for.
 */
export function HistoryPanel({ lang }: { lang: Lang }) {
  const [items, setItems] = useState<WalletTxn[] | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    // Both at once: the balance and the ledger are independent reads and
    // waiting for one before asking for the other adds a round trip.
    Promise.all([getWallet(), getTransactions(50)])
      .then(([w, page]) => {
        if (!alive) return;
        setWallet(w);
        setItems(page.items);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  if (failed) {
    return (
      <p
        role="alert"
        className="rounded-card bg-surface p-6 text-[15px] text-danger ring-1 ring-line"
      >
        {t(lang, "home.loadError")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
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
        <ul className="flex flex-col gap-2">
          {items.map((tx) => {
            const amount = Number(tx.amount);
            const config = txConfig(tx.kind, amount);
            const credit = amount > 0;

            return (
              <li
                key={tx.id}
                className="flex items-center gap-3 rounded-card bg-surface p-3.5 shadow-card ring-1 ring-line"
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
                    <span className="truncate text-[12px] text-muted">
                      {tx.note}
                    </span>
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
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
