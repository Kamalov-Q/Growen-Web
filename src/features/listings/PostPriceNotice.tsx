"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/src/i18n/config";
import { tCreate } from "@/src/i18n/strings/create";
import { getTariffs, getWallet } from "@/src/features/account/api";

const ACTION = "LISTING_POST";

const money = (v: number | string, lang: Lang) =>
  `${Math.round(Number(v)).toLocaleString(lang === "ru" ? "ru-RU" : "uz-UZ")} ${
    lang === "ru" ? "сум" : "so'm"
  }`;

/**
 * What posting will cost, said before the button that costs it.
 *
 * Mirrors the app's PriceNotice (mobile/src/features/tariffs/components)
 * down to the three states, because a seller who checked the price in the
 * app and then posted from a laptop must not be told two different things:
 *
 *   no tariff   nothing is rendered. An action nobody has priced is free,
 *               and a row reading "0 so'm" only raises the question of
 *               whether the price failed to load.
 *   free        there IS a price and this account is not paying it this
 *               once. The price is struck through rather than hidden: the
 *               point is that they are being given something.
 *   priced      the price, with the balance underneath as context.
 *
 * The balance line is dropped entirely in the free state. It has to be — a
 * new account's balance is zero, so the shortfall warning would fire on the
 * very first listing anybody posts, on the one screen where there is nothing
 * to do about it and nothing wrong.
 *
 * Both reads are client-side and deliberately silent on failure. This is a
 * courtesy, not a gate: the server is what charges, and a price row that
 * could not load must never stop somebody posting.
 */
export function PostPriceNotice({ lang }: { lang: Lang }) {
  const [price, setPrice] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [free, setFree] = useState(false);

  useEffect(() => {
    let alive = true;
    // Independent reads: waiting for one before asking for the other adds a
    // round trip to a row nobody is blocked on.
    Promise.all([getTariffs(), getWallet()])
      .then(([tariffs, wallet]) => {
        if (!alive) return;
        const tariff = tariffs.find((x) => x.action === ACTION && x.isActive);
        setPrice(tariff ? tariff.price : null);
        setBalance(String(wallet.balance));
        setFree((wallet.freeActions ?? []).includes(ACTION));
      })
      .catch(() => {
        /* Silent on purpose — see the note above. */
      });
    return () => {
      alive = false;
    };
  }, []);

  if (price === null || Number(price) <= 0) return null;

  // Compared as numbers: both are decimal strings, and "9000" > "10000"
  // lexically. A free post is never short — nothing is being taken.
  const short = !free && balance !== null && Number(balance) < Number(price);

  return (
    <section
      className={`flex flex-col gap-2 rounded-card bg-surface p-5 shadow-card ring-1 ${
        short ? "ring-danger" : "ring-line"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-[13px] font-semibold uppercase tracking-wide text-muted">
          {tCreate(lang, "create.cost")}
        </span>
        <span
          className={`nums ml-auto text-[15px] font-bold ${
            free ? "text-faint line-through" : "text-ink"
          }`}
        >
          {money(price, lang)}
        </span>
        {free ? (
          <span className="rounded-control bg-brand-soft px-2 py-0.5 text-[13px] font-bold text-brand ring-1 ring-brand-line">
            {tCreate(lang, "create.free")}
          </span>
        ) : null}
      </div>

      {/* Why it is free, said once. Without this the struck-through price
          reads as a bug or a discount nobody can account for. */}
      {free ? (
        <p className="text-[13px] text-faint">{tCreate(lang, "create.firstFreeHint")}</p>
      ) : balance !== null ? (
        <p className={`text-[13px] ${short ? "text-danger" : "text-faint"}`}>
          {short
            ? tCreate(lang, "create.notEnough")
            : `${tCreate(lang, "create.balance")}: ${money(balance, lang)}`}
        </p>
      ) : null}
    </section>
  );
}
