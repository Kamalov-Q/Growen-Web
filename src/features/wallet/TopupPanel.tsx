"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Lang } from "@/src/i18n/config";
import { t, type UiKey } from "@/src/i18n/dictionary";
import { useSession } from "@/src/features/auth/session";
import {
  VirtualCard,
  formatThousands,
} from "@/src/features/account/VirtualCard";
import {
  createTopup,
  getWallet,
  paynetLink,
  type TopupProvider,
  type Wallet,
} from "@/src/features/account/api";
import { ApiError } from "@/src/lib/api";
import { ClickBrand, PaymeBrand, PaynetBrand } from "./brands";
import { readPendingTopup, writePendingTopup } from "./pending";

/**
 * Topping up — the app's wallet screen, on the web.
 *
 * ── UI only, and it says so ───────────────────────────────────────────────
 *
 * The amount, the presets and the method chooser are all real state; what
 * is NOT here is the payment. Click and Payme need a checkout redirect and
 * a webhook to credit the wallet, Paynet needs a merchant link, and none of
 * that is wired on the web yet. So where the app has its pay button, this
 * has a sentence saying where to finish — because a button that takes an
 * amount and then does nothing is worse than no button, and one that looks
 * like it takes money and does not is worse still.
 */

const QUICK_AMOUNTS = [1_000, 50_000, 100_000, 200_000, 500_000];

/**
 * What the server will take in one go.
 *
 * The presets are the common amounts, not the only ones. Both bounds are
 * the server's, repeated here so a wrong amount is a quiet hint under the
 * field rather than a rejection after somebody has left the site.
 */
const MIN_TOPUP = 1_000;
const MAX_TOPUP = 10_000_000;
/** 10 000 000 is eight digits; one more lets it be typed and corrected. */
const MAX_DIGITS = 9;

const METHODS: {
  id: TopupProvider;
  brand: React.ReactNode;
  subtitle: UiKey;
  badge: UiKey;
  badgeClass: string;
  /** Listed, but not payable here — see `wallet.soon`. */
  soon?: boolean;
}[] = [
  {
    id: "CLICK",
    brand: <ClickBrand />,
    subtitle: "wallet.clickSubtitle",
    badge: "wallet.badgeZeroFee",
    badgeClass: "bg-[#0073FF]/15 text-[#3A8CFF]",
  },
  {
    id: "PAYME",
    brand: <PaymeBrand />,
    subtitle: "wallet.paymeSubtitle",
    badge: "wallet.badgeInstant",
    badgeClass: "bg-[#00BBC7]/15 text-[#00BBC7]",
  },
  {
    id: "PAYNET",
    brand: <PaynetBrand />,
    subtitle: "wallet.paynetSubtitle",
    badge: "wallet.badgeCash",
    badgeClass: "bg-[#00A859]/15 text-[#00A859]",
  },
];

export function TopupPanel({ lang }: { lang: Lang }) {
  const { user } = useSession();
  const [wallet, setWallet] = useState<Wallet | null>(null);

  /**
   * The amount, as the digits the field holds.
   *
   * Text rather than a number: an empty field is a state somebody is in the
   * middle of typing through, and `0` cannot say that. The presets write to
   * the same place, so a chosen amount is as editable afterwards as a typed
   * one — the app learned that from a read-only display that left anybody
   * wanting 75 000 with no way to ask for it.
   */
  const [amountText, setAmountText] = useState(String(QUICK_AMOUNTS[0]));
  const [method, setMethod] = useState<TopupProvider>("CLICK");
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Shown after Paynet opens: there is no result page to come back to. */
  const [paynetOpened, setPaynetOpened] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let alive = true;
    getWallet()
      .then((w) => alive && setWallet(w))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const amount = Number(amountText) || 0;
  const valid = amount >= MIN_TOPUP && amount <= MAX_TOPUP;
  // An empty field is on the way somewhere, not a mistake: it fails the
  // check like any other unpayable amount, but it is not painted red.
  const invalid = amountText.length > 0 && !valid;

  const onAmount = (next: string) => {
    // The field shows "1 000 000", so the separators have to come back out
    // before this is a number again. Leading zeros go too — "0500 000" is
    // not an amount anyone meant to type.
    const digits = next.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
    if (digits.length > MAX_DIGITS) return;
    setAmountText(digits);
  };

  /**
   * Only the providers the server has credentials for — and the whole list
   * until it answers, because a brief extra option is a smaller wrong than
   * a screen with nothing on it.
   */
  const methods = wallet?.providers
    ? METHODS.filter((m) => m.soon || wallet.providers?.includes(m.id))
    : METHODS;
  // The selection follows the list rather than an effect writing state
  // back: if the server does not offer what is selected — or it is one of
  // the rows that cannot be paid here yet — the first payable one is what
  // is marked.
  const payable = methods.filter((m) => !m.soon);
  const active = payable.some((m) => m.id === method)
    ? method
    : (payable[0]?.id ?? method);

  /**
   * Hand off to the provider.
   *
   * The ORDER is created first, by the server, and only then is the payer
   * sent away — the checkout URL carries our payment's id, and the webhook
   * behind it is what credits the wallet. The return link is only how
   * somebody gets back; it is never the proof that they paid.
   */
  async function pay() {
    if (!valid || paying) return;

    /**
     * The tab is opened NOW, before any await.
     *
     * A popup opened after an `await` has lost the click that justified it
     * and browsers block it — which is how "pay" ends up doing nothing
     * visible. This one is opened blank while the gesture is still live
     * and pointed at the URL once the server answers. Only Paynet needs
     * it: Click and Payme navigate this tab, because they come back to it.
     */
    const tab =
      active === "PAYNET" ? window.open("", "_blank", "noopener") : null;

    /**
     * The phone gate is for the ORDER, not for every provider.
     *
     * `POST /wallet/topup` sits behind PhoneRequiredGuard — a card payment
     * is vouched for by a verified number — while `/wallet/paynet-link`
     * does not, because paying into an account number needs nothing of the
     * sort. Gating Paynet here would invent a requirement the server does
     * not have.
     */
    if (active !== "PAYNET" && !user?.phoneNumber) {
      setError(t(lang, "wallet.needPhone"));
      return;
    }

    setError(null);
    setPaying(true);

    /**
     * Paynet first, because it is not the same kind of thing.
     *
     * There is no order to create and no checkout to return from: the
     * server hands back a link carrying this account's number and the
     * amount, the payer settles it at a terminal or in Paynet's app, and
     * the money lands when Paynet's webhook says so. Nothing here can wait
     * for that, so nothing here pretends to — the page says what will
     * happen and the balance updates on the next load.
     */
    if (active === "PAYNET") {
      try {
        const { payUrl } = await paynetLink(amount);
        // The blank tab opened above, pointed at the link now it is here.
        if (tab) tab.location.href = payUrl;
        // The popup was blocked: take this tab instead of doing nothing
        // visible. Paynet has nowhere to send the payer back to anyway.
        else window.location.assign(payUrl);
        setPaynetOpened(true);
      } catch (err) {
        tab?.close();
        setError(
          err instanceof ApiError ? err.message : t(lang, "auth.genericError"),
        );
      } finally {
        setPaying(false);
      }
      return;
    }

    try {
      const order = await createTopup({
        amount,
        provider: active,
        // One per attempt: the server is idempotent on it, so a double
        // click cannot open two payments for one amount.
        clientId: crypto.randomUUID(),
        // So Payme's checkout opens in the language this page is in, and
        // so the provider returns the payer to the WEBSITE rather than to
        // the app's deep link.
        lang,
        client: "WEB",
      });

      // Remembered BEFORE leaving: Click's return URL is one address for
      // every client and carries no id, so this is how the result page
      // knows which payment to ask about. See ./pending.
      writePendingTopup({
        paymentId: order.paymentId,
        amount,
        startedAt: Date.now(),
      });

      // A full navigation, not a new tab: a popup here is blocked about as
      // often as it works, and paying is the thing the person came to do.
      window.location.assign(order.payUrl);
    } catch (err) {
      setPaying(false);
      setError(
        err instanceof ApiError ? err.message : t(lang, "auth.genericError"),
      );
    }
  }

  /**
   * Somebody came back from a checkout. Pick the result up where they left
   * it rather than making them hunt for it — the status page polls the
   * server, which is the only thing that knows.
   */
  useEffect(() => {
    const pending = readPendingTopup();
    if (pending) router.replace(`/${lang}/wallet/result`);
  }, [lang, router]);

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
          variant="full"
        />
      ) : null}

      {/* ---- the amount ------------------------------------------------- */}
      <div className="flex flex-col gap-2">
        <div
          className={`flex items-center gap-3 rounded-card bg-raised px-4 py-3 ring-1 transition ${
            invalid ? "ring-danger" : "ring-line focus-within:ring-brand"
          }`}
        >
          <span className="flex min-w-0 flex-1 flex-col">
            <label
              htmlFor="amount"
              className="text-[12px] font-medium uppercase tracking-wide text-faint"
            >
              {t(lang, "wallet.enterAmount")}
            </label>
            <input
              id="amount"
              value={amountText ? formatThousands(amountText) : ""}
              onChange={(e) => onAmount(e.target.value)}
              inputMode="numeric"
              placeholder="0"
              aria-label={t(lang, "wallet.enterAmount")}
              className="nums w-full bg-transparent text-[26px] font-extrabold tracking-tight text-ink outline-none placeholder:text-faint"
            />
          </span>

          <span className="shrink-0 text-[14px] font-bold text-muted">UZS</span>

          {/* Clears in one press rather than nine backspaces over a number
              that is mostly zeros. */}
          {amountText ? (
            <button
              type="button"
              onClick={() => setAmountText("")}
              aria-label={t(lang, "filters.reset")}
              className="grid size-7 shrink-0 place-items-center rounded-full bg-surface text-muted transition hover:text-ink"
            >
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              >
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          ) : null}
        </div>

        {/* The bounds, said in place rather than after a press. */}
        <p
          className={`nums text-[12px] ${invalid ? "text-danger" : "text-faint"}`}
        >
          {t(lang, "validation.range", {
            min: formatThousands(MIN_TOPUP),
            max: formatThousands(MAX_TOPUP),
          })}
        </p>
      </div>

      {/* ---- the usual amounts ------------------------------------------ */}
      <div className="flex flex-wrap gap-2">
        {QUICK_AMOUNTS.map((preset) => {
          const on = amount === preset;
          return (
            <button
              key={preset}
              type="button"
              aria-pressed={on}
              onClick={() => setAmountText(String(preset))}
              className={`nums rounded-full px-3.5 py-2 text-[13px] font-bold transition ${
                on
                  ? "bg-brand text-brand-ink"
                  : "bg-raised text-ink ring-1 ring-line hover:ring-line-strong"
              }`}
            >
              {formatThousands(preset)}
            </button>
          );
        })}
      </div>

      {/* ---- how to pay ------------------------------------------------- */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted">
          {t(lang, "wallet.paymentMethods")}
        </h2>

        <div role="radiogroup" className="flex flex-col gap-2.5">
          {methods.map((m) => {
            const on = !m.soon && active === m.id;
            return (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={on}
                // Not a disabled control: there is nothing wrong with the
                // choice, it simply is not built here yet, and a greyed row
                // that cannot say why is the version people complain about.
                aria-disabled={m.soon || undefined}
                onClick={() => !m.soon && setMethod(m.id)}
                className={`flex flex-col gap-1.5 rounded-card p-4 text-start transition ${
                  on
                    ? "bg-brand-soft ring-2 ring-brand"
                    : m.soon
                      ? "bg-surface ring-1 ring-line opacity-70"
                      : "bg-surface ring-1 ring-line hover:ring-line-strong"
                }`}
              >
                <span className="flex items-center gap-3">
                  {m.brand}
                  <span className="flex-1" />
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      m.soon
                        ? "bg-gold/15 text-gold ring-1 ring-gold/30"
                        : m.badgeClass
                    }`}
                  >
                    {t(lang, m.soon ? "wallet.soon" : m.badge)}
                  </span>
                  <span
                    className={`grid size-5 shrink-0 place-items-center rounded-full ring-2 ${
                      on
                        ? "bg-brand text-brand-ink ring-brand"
                        : m.soon
                          ? "ring-line"
                          : "ring-line-strong"
                    }`}
                  >
                    {on ? (
                      <svg
                        aria-hidden
                        viewBox="0 0 24 24"
                        className="size-3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m5 12.5 4.5 4.5L19 7.5" />
                      </svg>
                    ) : null}
                  </span>
                </span>
                <span className="text-[13px] text-muted">
                  {t(lang, m.subtitle)}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {error ? (
        <p
          role="alert"
          className="rounded-control bg-surface p-3.5 text-[14px] font-medium text-danger ring-1 ring-danger/40"
        >
          {error}
        </p>
      ) : null}

      {/* The handoff. Disabled on an amount the server would refuse, so the
          rejection happens here rather than after a redirect. */}
      <button
        type="button"
        onClick={() => void pay()}
        disabled={!valid || paying || !payable.length}
        className="inline-flex h-13 items-center justify-center gap-2 rounded-control bg-brand py-3.5 text-[15px] font-bold text-brand-ink transition hover:bg-brand-hover disabled:opacity-50"
      >
        {paying ? (
          <span
            aria-hidden
            className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        ) : null}
        {valid
          ? `${t(lang, "wallet.pay")} · ${formatThousands(amount)} UZS`
          : t(lang, "wallet.pay")}
      </button>

      {/* After Paynet: there is no result page to send anybody to, so the
          outcome is stated here. */}
      {paynetOpened ? (
        <section className="flex flex-col gap-1.5 rounded-card bg-sold-soft p-4 ring-1 ring-gold/30">
          <p className="text-[15px] font-bold text-ink">
            {t(lang, "wallet.paynetOpened")}
          </p>
          <p className="text-[13px] leading-5 text-muted">
            {t(lang, "wallet.paynetOpenedHint")}
          </p>
        </section>
      ) : null}

      {/* The number the payer types into a terminal. Printed whatever is
          selected: somebody standing at a Paynet machine needs it, and by
          then this page is in their pocket. */}
      {wallet?.accountNo ? (
        <p className="text-center text-[13px] text-muted">
          {t(lang, active === "PAYNET" ? "wallet.paynetAccountHint" : "wallet.accountNo")}
          {": "}
          <span className="nums font-bold text-ink">{wallet.accountNo}</span>
        </p>
      ) : null}

      <Link
        href={`/${lang}/wallet/history`}
        className="flex items-center gap-3 rounded-card bg-surface p-4 shadow-card ring-1 ring-line transition hover:ring-brand-line"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
            <path d="M9 8h6M9 12h6" />
          </svg>
        </span>
        <span className="flex-1 text-[15px] font-semibold text-ink">
          {t(lang, "wallet.historyTitle")}
        </span>
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="size-4 text-faint rtl:rotate-180"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m9 6 6 6-6 6" />
        </svg>
      </Link>
    </div>
  );
}
