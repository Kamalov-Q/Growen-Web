"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { getTransactions, getWallet, type Wallet, type WalletTxn } from "./api";

const money = (v: number | string, lang: Lang) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `${Math.round(n).toLocaleString(lang === "ru" ? "ru-RU" : "uz-UZ")} so'm`;
};

/**
 * Balance and payment history.
 *
 * Read-only on the web. Topping up goes through the payment providers the
 * app is integrated with, and wiring a payment flow is not something to
 * approximate — a button that takes money has to be the real one or not be
 * there. The lead says where it is.
 */
export function WalletPanel({ lang }: { lang: Lang }) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [txns, setTxns] = useState<WalletTxn[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    // Both at once: the balance and the history are independent reads and
    // waiting for one before asking for the other adds a round trip.
    Promise.all([getWallet(), getTransactions()])
      .then(([w, list]) => {
        if (!alive) return;
        setWallet(w);
        setTxns(list);
      })
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, []);

  if (error) {
    return (
      <p role="alert" className="rounded-card bg-surface p-6 text-[15px] text-danger ring-1 ring-line">
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
            {money(wallet.balance, lang)}
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted">
          {t(lang, "wallet.history")}
        </h2>

        {txns === null ? (
          <div className="flex flex-col gap-2" aria-busy="true">
            <div className="h-14 animate-pulse rounded-card bg-muted-bg" />
            <div className="h-14 animate-pulse rounded-card bg-muted-bg" />
          </div>
        ) : !txns.length ? (
          <p className="rounded-card bg-surface px-6 py-12 text-center text-[15px] text-muted shadow-card ring-1 ring-line">
            {t(lang, "wallet.empty")}
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-card bg-surface shadow-card ring-1 ring-line">
            {txns.map((x) => {
              const n = Number(x.amount);
              const credit = Number.isFinite(n) && n > 0;
              return (
                <li key={x.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-[15px] text-ink">
                      {x.description || x.type || "—"}
                    </span>
                    <span className="text-[13px] text-faint">
                      {new Date(x.createdAt).toLocaleDateString(
                        lang === "ru" ? "ru-RU" : "uz-UZ",
                        { dateStyle: "medium" },
                      )}
                    </span>
                  </div>
                  {/* Sign carries the meaning, so the colour is support, not
                      the only cue — it still reads correctly in greyscale. */}
                  <span
                    className={`nums shrink-0 text-[15px] font-semibold ${
                      credit ? "text-brand" : "text-ink"
                    }`}
                  >
                    {credit ? "+" : ""}
                    {money(x.amount, lang)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
