"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Lang } from "@/src/i18n/config";
import { tw, type WalletKey } from "@/src/i18n/strings/wallet";
import { formatThousands } from "@/src/features/account/VirtualCard";
import {
  getTransaction,
  type FiscalStatus,
  type TransactionPayment,
  type WalletTxnDetail,
} from "@/src/features/account/api";
import { absoluteTime } from "@/src/lib/time";
import { ClickBrand, PaymeBrand, PaynetBrand } from "./brands";
import { txConfig } from "./txConfig";

/**
 * One operation, in full — the app's transaction detail screen.
 *
 * Two sections, because they answer two different questions. "Operation" is
 * what the LEDGER did: a type, an amount, the balance it left behind.
 * "Payment" is what happened OUTSIDE — which provider, which order number,
 * whether the receipt went out — and it only exists for a line that came
 * from one. A charge for posting a listing has no payment and does not
 * pretend to.
 *
 * The ids are copyable because they are the things somebody reads down a
 * phone to support, and transcribing a uuid by voice is how support
 * tickets end up about the wrong payment.
 */

const STATUS: Record<string, { key: WalletKey; tone: string }> = {
  PAID: { key: "wallet.statusPaid", tone: "bg-brand-soft text-brand" },
  CREATED: { key: "wallet.statusPending", tone: "bg-gold/15 text-gold" },
  PENDING: { key: "wallet.statusPending", tone: "bg-gold/15 text-gold" },
  PREPARED: { key: "wallet.statusPending", tone: "bg-gold/15 text-gold" },
  CANCELLED: { key: "wallet.statusCancelled", tone: "bg-danger/10 text-danger" },
  FAILED: { key: "wallet.statusCancelled", tone: "bg-danger/10 text-danger" },
};

const RECEIPT: Record<FiscalStatus, WalletKey> = {
  SENT: "wallet.receiptSent",
  PENDING: "wallet.receiptPending",
  SENDING: "wallet.receiptPending",
  BY_PROVIDER: "wallet.receiptByProvider",
  FAILED: "wallet.receiptFailed",
  NONE: "wallet.receiptNone",
};

export function TransactionPanel({ lang, id }: { lang: Lang; id: string }) {
  const [tx, setTx] = useState<WalletTxnDetail | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    getTransaction(id)
      .then((data) => alive && setTx(data))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [id]);

  if (failed) {
    return (
      <p
        role="alert"
        className="rounded-card bg-surface p-6 text-[15px] text-danger ring-1 ring-line"
      >
        {tw(lang, "wallet.txLoadError")}
      </p>
    );
  }

  if (!tx) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <div className="h-28 animate-pulse rounded-card bg-muted-bg" />
        <div className="h-48 animate-pulse rounded-card bg-muted-bg" />
      </div>
    );
  }

  const amount = Number(tx.amount);
  const config = txConfig(tx.kind, amount);
  const credit = amount > 0;
  const status = tx.payment ? STATUS[tx.payment.status] : null;

  return (
    <div className="flex flex-col gap-6">
      {/* What it was and how much, before any of the detail. */}
      <section className="flex flex-col items-center gap-3 rounded-card bg-surface p-8 text-center shadow-card ring-1 ring-line">
        <span
          className={`grid size-16 place-items-center rounded-full ${config.tone}`}
        >
          {config.icon}
        </span>
        <p
          className={`nums text-[2rem] font-bold leading-none tracking-tight ${
            credit ? "text-brand" : "text-ink"
          }`}
        >
          {credit ? "+" : ""}
          {formatThousands(amount)} UZS
        </p>
        <p className="text-[15px] font-semibold text-ink">
          {tw(lang, config.label)}
        </p>
        <span
          className={`rounded-full px-2.5 py-1 text-[12px] font-bold ${
            status?.tone ?? "bg-muted-bg text-muted"
          }`}
        >
          {tw(lang, status?.key ?? "wallet.statusCompleted")}
        </span>
      </section>

      <Section title={tw(lang, "wallet.sectionOperation")}>
        <Row label={tw(lang, "wallet.fieldType")} value={tw(lang, config.label)} />
        <Row
          label={tw(lang, "wallet.fieldDate")}
          value={absoluteTime(new Date(tx.createdAt))}
        />
        <Row
          label={tw(lang, "wallet.fieldAmount")}
          value={`${credit ? "+" : ""}${formatThousands(amount)} UZS`}
        />
        <Row
          label={tw(lang, "wallet.fieldBalanceAfter")}
          value={`${formatThousands(tx.balanceAfter)} UZS`}
        />
        {tx.note ? (
          <Row label={tw(lang, "wallet.fieldNote")} value={tx.note} />
        ) : null}
        <Row
          lang={lang}
          label={tw(lang, "wallet.fieldTransactionId")}
          value={tx.id}
          copyable
        />
      </Section>

      {tx.payment ? (
        <PaymentSection lang={lang} payment={tx.payment} />
      ) : null}

      {tx.listingId ? (
        <Link
          href={`/${lang}/listing/${tx.listingId}`}
          className="inline-flex h-12 items-center justify-center rounded-control text-[15px] font-bold text-ink ring-1 ring-line transition hover:bg-muted-bg"
        >
          {tw(lang, "wallet.openListing")}
        </Link>
      ) : null}
    </div>
  );
}

function PaymentSection({
  lang,
  payment,
}: {
  lang: Lang;
  payment: TransactionPayment;
}) {
  const bonus = Number(payment.bonusAmount);
  const status = STATUS[payment.status];

  return (
    <Section title={tw(lang, "wallet.sectionPayment")}>
      <Row
        label={tw(lang, "wallet.fieldProvider")}
        value={
          payment.provider === "CLICK" ? (
            <ClickBrand />
          ) : payment.provider === "PAYME" ? (
            <PaymeBrand />
          ) : (
            <PaynetBrand />
          )
        }
      />
      <Row
        label={tw(lang, "wallet.fieldStatus")}
        value={tw(lang, status?.key ?? "wallet.statusCompleted")}
      />
      <Row
        label={tw(lang, "wallet.fieldOrderNo")}
        value={String(payment.orderNo)}
      />
      <Row
        label={tw(lang, "wallet.fieldAmount")}
        value={`${formatThousands(payment.amount)} UZS`}
      />
      {bonus > 0 ? (
        <Row
          label={tw(lang, "wallet.fieldBonus")}
          value={`+${formatThousands(bonus)} UZS`}
        />
      ) : null}
      {payment.providerTxnId ? (
        <Row
          lang={lang}
          label={tw(lang, "wallet.fieldProviderTxn")}
          value={payment.providerTxnId}
          copyable
        />
      ) : null}
      <Row
        label={tw(lang, "wallet.fieldCreatedAt")}
        value={absoluteTime(new Date(payment.createdAt))}
      />
      {payment.paidAt ? (
        <Row
          label={tw(lang, "wallet.fieldPaidAt")}
          value={absoluteTime(new Date(payment.paidAt))}
        />
      ) : null}
      {payment.cancelledAt ? (
        <Row
          label={tw(lang, "wallet.fieldCancelledAt")}
          value={absoluteTime(new Date(payment.cancelledAt))}
        />
      ) : null}
      {payment.cancelReason ? (
        <Row
          label={tw(lang, "wallet.fieldCancelReason")}
          value={payment.cancelReason}
        />
      ) : null}
      <Row
        label={tw(lang, "wallet.fieldReceipt")}
        value={tw(lang, RECEIPT[payment.fiscalStatus] ?? "wallet.receiptNone")}
      />
      <Row
        lang={lang}
        label={tw(lang, "wallet.fieldPaymentId")}
        value={payment.id}
        copyable
      />
    </Section>
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
    <section className="flex flex-col gap-1 rounded-card bg-surface p-5 shadow-card ring-1 ring-line">
      <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({
  lang,
  label,
  value,
  copyable = false,
}: {
  lang?: Lang;
  label: string;
  value: React.ReactNode;
  copyable?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <span className="shrink-0 text-[13px] text-muted">{label}</span>
      <span className="flex min-w-0 items-center gap-2">
        <span className="nums min-w-0 truncate text-end text-[14px] font-semibold text-ink">
          {value}
        </span>
        {copyable && typeof value === "string" ? (
          <button
            type="button"
            onClick={() => {
              // Swallowed: clipboard access is refused in an insecure
              // context and on a denied permission, and a failed copy is
              // not worth an error state on a receipt.
              void navigator.clipboard
                ?.writeText(value)
                .then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                })
                .catch(() => {});
            }}
            aria-label={lang ? tw(lang, "wallet.copy") : undefined}
            className="shrink-0 text-muted transition hover:text-brand"
          >
            {copied ? (
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="size-4 text-brand"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m5 12.5 4.5 4.5L19 7.5" />
              </svg>
            ) : (
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
                <rect x="9" y="9" width="11" height="11" rx="2" />
                <path d="M5 15V5.5A1.5 1.5 0 0 1 6.5 4H15" />
              </svg>
            )}
          </button>
        ) : null}
      </span>
    </div>
  );
}
