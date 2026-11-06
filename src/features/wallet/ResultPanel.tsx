"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { Lang } from "@/src/i18n/config";
import { tw } from "@/src/i18n/strings/wallet";
import { formatThousands } from "@/src/features/account/VirtualCard";
import { getTopupStatus, type PaymentStatus } from "@/src/features/account/api";
import {
  noPending,
  pendingAmount,
  pendingPaymentId,
  subscribePending,
  writePendingTopup,
} from "./pending";

/**
 * Where a top-up lands when the payer comes back.
 *
 * ── The return link is not the answer ─────────────────────────────────────
 *
 * Click returns people to one address configured on the server, with no
 * payment id on it, and a return link proves only that a browser came back
 * — not that money moved. The WEBHOOK credits the wallet. So this page asks
 * the server what happened, and keeps asking until the answer is final.
 *
 * Which payment: the `paymentId` query parameter when something passed one,
 * otherwise the attempt this browser remembered before leaving (./pending).
 */

/** Click usually confirms within seconds; two minutes covers a slow SMS. */
const POLL_MS = 2_000;
const GIVE_UP_MS = 120_000;

type Outcome = "checking" | "paid" | "cancelled" | "pending";

export function ResultPanel({ lang }: { lang: Lang }) {
  const params = useSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  /** What the server says it was, once it has said anything. */
  const [paidAmount, setPaidAmount] = useState<number | null>(null);

  // The query parameter when something passed one, otherwise the attempt
  // this browser remembered before leaving.
  const remembered = useSyncExternalStore(
    subscribePending,
    pendingPaymentId,
    noPending,
  );
  const rememberedAmount = useSyncExternalStore(
    subscribePending,
    pendingAmount,
    noPending,
  );
  const paymentId = params.get("paymentId") ?? remembered;
  const amount = paidAmount ?? rememberedAmount;

  useEffect(() => {
    if (!paymentId) return;

    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const giveUp = setTimeout(() => alive && setTimedOut(true), GIVE_UP_MS);

    /**
     * Polling, not an interval: each round is scheduled only after the
     * previous answer, so a slow response cannot stack requests — the kind
     * of loop that keeps running long after anybody is looking.
     */
    const ask = async () => {
      try {
        const next = await getTopupStatus(paymentId);
        if (!alive) return;
        setStatus(next.status);
        if (next.amount) setPaidAmount(Number(next.amount));
        if (next.status === "PAID" || next.status === "CANCELLED") return;
      } catch {
        // A failed poll is not a failed payment: keep asking until the
        // deadline, and report "not confirmed yet" if it never answers.
      }
      if (alive) timer = setTimeout(() => void ask(), POLL_MS);
    };

    void ask();

    return () => {
      alive = false;
      clearTimeout(giveUp);
      if (timer) clearTimeout(timer);
    };
  }, [paymentId]);

  const outcome: Outcome = !paymentId
      ? "pending"
      : status === "PAID"
        ? "paid"
        : status === "CANCELLED"
          ? "cancelled"
          : timedOut
            ? "pending"
            : "checking";

  /**
   * Once the answer is final, forget the attempt — otherwise the next visit
   * to the wallet is bounced here to report on a payment from last week.
   * "Pending" is kept: it is the one outcome still worth resolving.
   */
  useEffect(() => {
    if (outcome === "paid" || outcome === "cancelled") writePendingTopup(null);
  }, [outcome]);

  const view = {
    checking: {
      tone: "bg-brand-soft text-brand",
      icon: (
        <span
          aria-hidden
          className="size-10 animate-spin rounded-full border-4 border-current border-t-transparent"
        />
      ),
      title: tw(lang, "wallet.resultChecking"),
      body: tw(lang, "wallet.resultCheckingBody"),
    },
    paid: {
      tone: "bg-brand-soft text-brand",
      icon: <Glyph d="m5 12.5 4.5 4.5L19 7.5" />,
      title: tw(lang, "wallet.resultPaid"),
      body: amount
        ? tw(lang, "wallet.resultPaidBody", { amount: formatThousands(amount) })
        : tw(lang, "wallet.resultPaidBodyNoAmount"),
    },
    cancelled: {
      tone: "bg-danger/10 text-danger",
      icon: <Glyph d="M6 6l12 12M18 6 6 18" />,
      title: tw(lang, "wallet.paymentCancelled"),
      body: tw(lang, "wallet.resultCancelledBody"),
    },
    pending: {
      tone: "bg-gold/15 text-gold",
      icon: <Glyph d="M12 7v5.5l3.5 2" circle />,
      title: tw(lang, "wallet.resultPending"),
      body: tw(lang, "wallet.resultPendingBody"),
    },
  }[outcome];

  return (
    <div className="flex flex-col items-center gap-5 py-6 text-center">
      <span
        className={`grid size-24 place-items-center rounded-full ${view.tone}`}
      >
        {view.icon}
      </span>

      <div className="flex flex-col gap-1.5">
        <h2 className="text-[1.25rem] font-bold tracking-tight text-ink">
          {view.title}
        </h2>
        <p className="max-w-prose text-[14px] leading-6 text-muted">
          {view.body}
        </p>
      </div>

      <div className="flex w-full flex-col gap-3 sm:max-w-sm">
        <button
          type="button"
          onClick={() => {
            // Cleared on the way out, or the wallet sends us straight back.
            writePendingTopup(null);
            router.replace(`/${lang}/wallet`);
          }}
          className={`h-12 rounded-control text-[15px] font-bold transition ${
            outcome === "checking"
              ? "text-ink ring-1 ring-line hover:bg-muted-bg"
              : "bg-brand text-brand-ink hover:bg-brand-hover"
          }`}
        >
          {tw(lang, "wallet.resultBackToWallet")}
        </button>

        {outcome === "paid" || outcome === "pending" ? (
          <Link
            href={`/${lang}/wallet/history`}
            onClick={() => writePendingTopup(null)}
            className="inline-flex h-12 items-center justify-center rounded-control text-[15px] font-semibold text-ink ring-1 ring-line transition hover:bg-muted-bg"
          >
            {tw(lang, "wallet.historyTitle")}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function Glyph({ d, circle = false }: { d: string; circle?: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {circle ? <circle cx="12" cy="12" r="9" /> : null}
      <path d={d} />
    </svg>
  );
}
