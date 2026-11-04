"use client";

import Link from "next/link";
import { useState } from "react";
import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { usePrefs } from "@/src/features/settings/prefs";

/**
 * The Growen City virtual card.
 *
 * A port of the app's VirtualCard (compact variant) — the same dark plate,
 * the same gold accent, the same flip from so'm to dollars. It is the one
 * thing on the account tab people recognise at a glance, and a web profile
 * without it reads as a different product.
 *
 * Two deliberate differences from the app:
 *
 *   the RATE is the server's, fetched for the price display (see prefs),
 *   not a constant compiled into the client. The app's own constant is the
 *   fallback for the moment before it arrives.
 *
 *   TOPPING UP is a link to the wallet page, not a payment sheet. The web
 *   does not take money — a button that appears to and does not is worse
 *   than one that says where to go.
 */

/** The app's fallback rate, used only until the real one lands. */
const UZS_PER_USD = 12_850;

/** "1 234 567" — the API sends "1000.00", so the tiyin go first. */
export function formatThousands(val: number | string): string {
  const num = Math.trunc(
    typeof val === "number"
      ? val
      : Number(String(val).replace(/[^\d.-]/g, "")) || 0,
  );
  return String(num).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function formatUsd(val: number | string, rate: number): string {
  const num = Math.trunc(
    typeof val === "number"
      ? val
      : Number(String(val).replace(/[^\d.-]/g, "")) || 0,
  );
  if (num === 0) return "$0.00";
  return `$${(num / rate).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** +998901234567 → "+998 (90) 123-45-67", the way the card prints it. */
function cardPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("998")) {
    return `+998 (${digits.slice(3, 5)}) ${digits.slice(5, 8)}-${digits.slice(8, 10)}-${digits.slice(10, 12)}`;
  }
  if (digits.length === 9) {
    return `+998 (${digits.slice(0, 2)}) ${digits.slice(2, 5)}-${digits.slice(5, 7)}-${digits.slice(7, 9)}`;
  }
  return phone;
}

/**
 * What the card prints as the account's identifier.
 *
 * The account number when there is one — a payer types exactly these digits
 * into Paynet, so it is shown whole and unformatted; a space in the middle
 * is something somebody will copy across and then wonder why the payment
 * bounced. The uuid is only the fallback for the instant before the wallet
 * answers, and is abbreviated because nobody can pay into it.
 */
function cardId(id?: string | null, accountNo?: number | null): string {
  if (accountNo) return `ID: ${accountNo}`;
  if (!id) return "ID: #0001";
  const clean = id.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return clean.length > 8
    ? `ID: #${clean.slice(0, 4)} ${clean.slice(-4)}`
    : `ID: #${clean}`;
}

const ACCENT = "#DCC083";

interface Props {
  lang: Lang;
  phone: string;
  name: string;
  userId?: string | null;
  accountNo?: number | null;
  /** Undefined while the wallet request is still out. */
  balance?: number | string;
  topupHref: string;
}

export function VirtualCard({
  lang,
  phone,
  name,
  userId,
  accountNo,
  balance,
  topupHref,
}: Props) {
  const { rate } = usePrefs();
  const [flipped, setFlipped] = useState(false);

  const face = {
    phone: cardPhone(phone),
    id: cardId(userId, accountNo),
    name: name.toUpperCase(),
    topupHref,
    lang,
  };

  return (
    <div className="w-full [perspective:1200px]">
      <div
        role="button"
        tabIndex={0}
        aria-label={t(lang, "wallet.flipHint")}
        onClick={() => setFlipped((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setFlipped((v) => !v);
          }
        }}
        className="relative cursor-pointer transition-transform duration-500 [transform-style:preserve-3d]"
        style={flipped ? { transform: "rotateY(180deg)" } : undefined}
      >
        <Face
          {...face}
          className="relative"
          label={t(lang, "wallet.currentBalance")}
          amount={balance === undefined ? null : formatThousands(balance)}
          currency="UZS"
          swapTo={t(lang, "wallet.toUsd")}
          corner="VIRTUAL"
        />
        {/* Stacked exactly over the front and turned away from the viewer.
            `backface-visibility` is what hides it: without it the dollars
            show through the so'm, mirrored.

            The POSITION is passed in rather than defaulted in `Face`, and
            that is not a style preference. A base class of `relative` with
            `absolute` added here does not work: Tailwind sorts the position
            utilities and emits `.relative` after `.absolute`, so the later
            rule wins whatever the order in the attribute — the back face
            stayed in flow and reserved a card's worth of blank page under
            the plate. */}
        <Face
          {...face}
          className="absolute inset-0 [transform:rotateY(180deg)]"
          label={t(lang, "wallet.currentBalanceUsd")}
          amount={
            balance === undefined
              ? null
              : formatUsd(balance, rate ?? UZS_PER_USD)
          }
          currency="USD"
          swapTo={t(lang, "wallet.toUzs")}
          corner="USD"
        />
      </div>
    </div>
  );
}

function Face({
  lang,
  label,
  amount,
  currency,
  swapTo,
  corner,
  phone,
  id,
  name,
  topupHref,
  className = "",
}: {
  lang: Lang;
  label: string;
  /** null while the balance is still being fetched. */
  amount: string | null;
  currency: string;
  swapTo: string;
  corner: string;
  phone: string;
  id: string;
  name: string;
  topupHref: string;
  className?: string;
}) {
  return (
    <div
      className={`flex min-h-[210px] flex-col justify-between overflow-hidden rounded-[22px] border border-white/12 bg-[#0A2024] p-6 [backface-visibility:hidden] ${className}`}
    >
      {/* The two glows. Decorative, and behind everything: `-z-0` would put
          them behind the card's own background. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 size-44 rounded-full bg-[#DCC083]/20 blur-2xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-12 -left-8 size-40 rounded-full bg-[#2FB8A8]/18 blur-2xl"
      />

      <div className="relative flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <span
            className="size-2.5 rounded-full"
            style={{ background: ACCENT, boxShadow: `0 0 7px ${ACCENT}` }}
          />
          <span className="text-[16px] font-extrabold tracking-tight text-white">
            Growen City
          </span>
        </span>

        <span className="flex items-center gap-1.5">
          <Contactless />
          <span
            className="flex items-center gap-1 rounded-lg border border-white/12 bg-white/8 px-1.5 py-0.5 text-[10px] font-bold"
            style={{ color: ACCENT }}
          >
            <Swap />
            {swapTo}
          </span>
          <span
            className="rounded-lg border px-2 py-0.5 text-[10px] font-bold tracking-wider"
            style={
              corner === "VIRTUAL"
                ? {
                    color: "#94A3B8",
                    borderColor: "rgb(255 255 255 / 0.15)",
                    background: "rgb(255 255 255 / 0.08)",
                  }
                : {
                    color: ACCENT,
                    borderColor: ACCENT,
                    background: `${ACCENT}1A`,
                  }
            }
          >
            {corner}
          </span>
        </span>
      </div>

      <div className="relative flex items-end justify-between gap-3">
        <span className="flex flex-col gap-2">
          {/* The app prints the chip on the FULL card and drops it from the
              compact one for want of room. At this width there is room. */}
          <EmvChip />
          <span className="flex flex-col gap-0.5">
            <span className="text-[11px] font-medium uppercase tracking-wide text-[#94A3B8]">
              {label}
            </span>
            {amount === null ? (
              <span className="h-8 w-36 animate-pulse rounded bg-white/10" />
            ) : (
              <span className="flex items-baseline gap-1.5">
                <span className="nums text-[30px] font-extrabold leading-none tracking-tight text-white">
                  {amount}
                </span>
                <span
                  className="text-[15px] font-bold"
                  style={{ color: ACCENT }}
                >
                  {currency}
                </span>
              </span>
            )}
          </span>
        </span>

        {/* A link, not a button: it goes to the wallet page. The click must
            not also reach the card, or topping up flips it on the way. */}
        <Link
          href={topupHref}
          onClick={(e) => e.stopPropagation()}
          className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[13px] font-bold transition hover:brightness-110"
          style={{ background: ACCENT, color: "#07191D" }}
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          {t(lang, "wallet.topup")}
        </Link>
      </div>

      <div className="relative flex items-end justify-between gap-3">
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="nums truncate text-[13.5px] font-semibold tracking-wide text-[#E2E8F0]">
            {phone}
          </span>
          {name ? (
            <span className="truncate text-[10.5px] font-semibold tracking-[0.06em] text-[#94A3B8]">
              {name}
            </span>
          ) : null}
        </span>
        <span className="nums shrink-0 rounded-[10px] border border-white/12 bg-[#0F172A]/70 px-2.5 py-1 text-[12px] font-bold tracking-wide text-[#CBD5E1]">
          {id}
        </span>
      </div>
    </div>
  );
}

/** The gold contact plate every bank card carries. Decorative, and the one
 *  thing that makes a dark rectangle read as a CARD. */
function EmvChip() {
  return (
    <svg aria-hidden viewBox="0 0 30 22" className="h-[22px] w-[30px]">
      <rect width="30" height="22" rx="4" fill="#D4AF37" />
      <rect x="1" y="1" width="28" height="20" rx="3" fill="#E8C355" />
      <path
        d="M0 7h10M0 15h10M30 7h-10M30 15h-10M10 0v22M20 0v22M10 11h10"
        stroke="#9A7B1C"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
      <rect x="12" y="8" width="6" height="6" rx="1" fill="#D4AF37" />
    </svg>
  );
}

function Contactless() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-[18px] rotate-90 text-white/70"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    >
      <path d="M4.5 12a7.5 7.5 0 0 1 15 0" />
      <path d="M8 12a4 4 0 0 1 8 0" />
      <path d="M11 12a1 1 0 0 1 2 0" />
    </svg>
  );
}

function Swap() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 8h13l-3-3M20 16H7l3 3" />
    </svg>
  );
}
