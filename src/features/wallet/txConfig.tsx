import type { WalletKey } from "@/src/i18n/strings/wallet";
import type { TxKind } from "@/src/features/account/api";

/**
 * Label, glyph and colour of one ledger line.
 *
 * A port of the app's `getTxConfig`, with one difference that is not a
 * simplification: the app picks a hex per colour scheme because React
 * Native has no CSS variables, while here each tone is a theme token that
 * already has a light and a dark value. The INTENT is the same — a mid-tone
 * that reads on the dark surface is a 2.5:1 blur on the white one — it is
 * just expressed where the rest of the site expresses it.
 */
export interface TxConfig {
  label: WalletKey;
  icon: React.ReactNode;
  /** Tailwind classes for the glyph: its colour and its wash. */
  tone: string;
  isCredit: boolean;
}

const Glyph = ({ d, fill = false }: { d: string; fill?: boolean }) => (
  <svg
    aria-hidden
    viewBox="0 0 24 24"
    className="size-5"
    fill={fill ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

const DOWN = "M12 4v13m0 0 4.5-4.5M12 17l-4.5-4.5M4 20h16";
const DOC = "M13.5 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5Z";
const ROCKET =
  "M5 14c-1 2.5-1 5-1 5s2.5 0 5-1m-4-4 3-7a9 9 0 0 1 8-5 9 9 0 0 1-5 8l-7 3Z";
const VIDEO = "M3.5 7.5h11v9h-11zM14.5 11l6-3v8l-6-3z";
const REFUND = "M20 11a8 8 0 1 0-.6 4M20 4v7h-7";
const SHIELD = "M12 2.8 4.8 5.4v6c0 4.6 3 8.7 7.2 10 4.2-1.3 7.2-5.4 7.2-10v-6Z";
const GIFT = "M4 10.5h16v9H4zM4 7h16v3.5H4zM12 7v12.5M12 7S10.5 3 8 3a2 2 0 0 0 0 4h4Zm0 0s1.5-4 4-4a2 2 0 0 1 0 4h-4Z";
const SWAP = "M4 8h13l-3-3M20 16H7l3 3";

export function txConfig(kind: TxKind, amount: number): TxConfig {
  switch (kind) {
    case "TOPUP":
      return {
        label: "wallet.topupTx",
        icon: <Glyph d={DOWN} />,
        tone: "bg-brand-soft text-brand",
        isCredit: true,
      };
    case "TOPUP_BONUS":
      return {
        label: "wallet.bonusTx",
        icon: <Glyph d={GIFT} />,
        tone: "bg-gold/15 text-gold",
        isCredit: true,
      };
    case "LISTING_POST":
      return {
        label: "wallet.listingPostTx",
        icon: <Glyph d={DOC} />,
        tone: "bg-muted-bg text-ink-soft",
        isCredit: false,
      };
    case "LISTING_PROMOTE":
      return {
        label: "wallet.listingPromoteTx",
        icon: <Glyph d={ROCKET} />,
        tone: "bg-sold-soft text-sold",
        isCredit: false,
      };
    case "VIDEO_POST":
      return {
        label: "wallet.videoPostTx",
        icon: <Glyph d={VIDEO} />,
        tone: "bg-muted-bg text-ink-soft",
        isCredit: false,
      };
    case "REFUND":
      return {
        label: "wallet.refundTx",
        icon: <Glyph d={REFUND} />,
        tone: "bg-brand-soft text-brand",
        isCredit: true,
      };
    case "ADMIN_ADJUST":
      return {
        label: "wallet.adminAdjustTx",
        icon: <Glyph d={SHIELD} />,
        tone: "bg-muted-bg text-ink-soft",
        // An adjustment goes either way, so the sign of the amount is the
        // only honest answer to "was this money in or out".
        isCredit: amount >= 0,
      };
    default:
      return {
        label: "wallet.topupTx",
        icon: <Glyph d={SWAP} />,
        tone: "bg-muted-bg text-muted",
        isCredit: amount >= 0,
      };
  }
}
