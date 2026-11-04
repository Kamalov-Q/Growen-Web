import Link from "next/link";
import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { missingLabels, type Completeness } from "./completeness";

/**
 * The standing invitation on a profile that is still mostly empty.
 *
 * Wording, deliberately: "incomplete", never "unverified". The seal is a
 * passport check and must not share language with a form anybody can fill
 * in during an advert break — see components/ui/Seal.
 *
 * The gold is the emblem's, not danger red: nothing is broken and nothing
 * is lost. It is an invitation with a reason attached, and gold is already
 * this product's colour for "worth your attention".
 */
export function CompleteProfileBanner({
  lang,
  state,
  href,
}: {
  lang: Lang;
  state: Completeness;
  href: string;
}) {
  const missing = missingLabels(state)
    .map((key) => t(lang, key))
    .join(", ");

  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-card bg-sold-soft p-4 ring-1 ring-gold/30 transition hover:ring-gold/60"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-control bg-gold/15 text-gold">
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="size-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="10" r="3" />
          <path d="M6.3 18.4a6.3 6.3 0 0 1 11.4 0" />
        </svg>
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="text-[15px] font-bold text-ink">
          {t(lang, "completeProfile.bannerTitle")}
        </span>
        <span className="text-[13px] text-muted">
          {missing
            ? t(lang, "completeProfile.bannerMissing", { fields: missing })
            : t(lang, "completeProfile.bannerText")}
        </span>

        {/* How far along, so the ask is finite. "Fill in your profile" with
            no end in sight is a chore; a bar four-fifths across is a
            minute's work somebody can see the end of. */}
        <span className="mt-0.5 block h-[5px] overflow-hidden rounded-full bg-line">
          <span
            className="block h-full rounded-full bg-gold transition-[width] duration-500"
            style={{ width: `${Math.max(4, state.ratio * 100)}%` }}
          />
        </span>
      </span>

      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="size-4 shrink-0 text-gold"
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
