"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { useSession } from "@/src/features/auth/session";

/**
 * The bottom bar, on phones only.
 *
 * ── Why a bar and not a smaller header ─────────────────────────────────────
 *
 * The header fits a logo, a search box, a sign-in button, a theme switch and
 * a language menu. It does not also fit "post a listing", so that button was
 * given `hidden sm:block` and simply disappeared below 640px — the single
 * most valuable action on a marketplace, gone on the devices most people
 * browse from. Shrinking it further is not the answer; there is no width at
 * which seven controls fit across a 360px screen.
 *
 * So the destinations come out of the header and go where a thumb already
 * is. This is what the app does, and what every marketplace does, because
 * the top of a phone screen is the hardest part of it to reach.
 *
 * ── Why these five ─────────────────────────────────────────────────────────
 *
 * The app's bar is home · videos · (+) · chat · profile. Web has neither a
 * videos route nor a chat route, and inventing dead tabs for them would be
 * worse than not having them. The two slots go to the surfaces web does
 * have and the app keeps one level down, under the account tab: saved, and
 * my listings.
 *
 * The labels are the app's own, copied from its dictionary rather than
 * retranslated, so the same place is not called two things.
 *
 * ── Why the middle one is a disc ───────────────────────────────────────────
 *
 * Same reason as the app (see mobile/app/(tabs)/_layout.tsx): lifted out of
 * the bar it reads as the primary action rather than a fifth equal tab.
 */

type Tab = {
  key: "home" | "saved" | "add" | "mine" | "profile";
  href: string;
  label: string;
  /** Needs a session; signed-out visitors are sent to login carrying `next`. */
  gated: boolean;
};

/**
 * Filled when selected, outline when not — the same rule as the app's
 * Ionicons pair. The icon carries the active state alongside the tint, so it
 * still reads for someone who cannot see the colour change.
 */
function Icon({ name, active }: { name: Tab["key"]; active: boolean }) {
  const common = {
    viewBox: "0 0 24 24",
    className: "size-6 shrink-0",
    fill: active ? "currentColor" : "none",
    stroke: "currentColor",
    strokeWidth: active ? 0 : 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "home":
      return (
        <svg {...common} aria-hidden>
          <path d="M3 10.2 12 3l9 7.2V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
        </svg>
      );
    case "saved":
      return (
        <svg {...common} aria-hidden>
          <path d="M12 20.3 4.6 13a4.6 4.6 0 0 1 0-6.5 4.6 4.6 0 0 1 6.5 0l.9.9.9-.9a4.6 4.6 0 0 1 6.5 0 4.6 4.6 0 0 1 0 6.5z" />
        </svg>
      );
    case "mine":
      return (
        <svg {...common} aria-hidden>
          <rect x="3" y="4" width="18" height="16" rx="2.5" />
          <path
            d="M7 9h10M7 13h10M7 17h6"
            stroke={active ? "var(--color-surface)" : "currentColor"}
            strokeWidth="1.7"
          />
        </svg>
      );
    case "profile":
      return (
        <svg {...common} aria-hidden>
          <circle cx="12" cy="8.5" r="3.8" />
          <path d="M4.5 20.2a7.5 7.5 0 0 1 15 0" />
        </svg>
      );
    case "add":
      return (
        <svg
          viewBox="0 0 24 24"
          className="size-7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
  }
}

export function MobileTabBar({ lang }: { lang: Lang }) {
  const pathname = usePathname();
  const { status } = useSession();

  const tabs: Tab[] = [
    { key: "home", href: `/${lang}`, label: t(lang, "tabs.home"), gated: false },
    {
      key: "saved",
      href: `/${lang}/saved`,
      label: t(lang, "tabs.saved"),
      gated: true,
    },
    { key: "add", href: `/${lang}/add`, label: t(lang, "tabs.add"), gated: true },
    {
      key: "mine",
      href: `/${lang}/listings/mine`,
      label: t(lang, "tabs.myListings"),
      gated: true,
    },
    {
      key: "profile",
      href: `/${lang}/profile`,
      label: t(lang, "tabs.profile"),
      gated: true,
    },
  ];

  /**
   * Home matches only itself. Everything else matches its subtree, so a
   * listing opened from "my listings" keeps that tab lit.
   */
  const isActive = (href: string) =>
    href === `/${lang}`
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  /**
   * Same rule as PostCta: only send someone to login once we KNOW they are
   * signed out. While the opening refresh is in flight the answer is not
   * known, and guessing "login" bounces a signed-in person for no reason.
   */
  const resolve = (tab: Tab) =>
    tab.gated && status === "unauthenticated"
      ? `/${lang}/login?next=${encodeURIComponent(tab.href)}`
      : tab.href;

  return (
    <nav
      aria-label={t(lang, "tabs.nav")}
      /* `pb-[env(safe-area-inset-bottom)]` is the home-indicator gap on an
         iPhone. Without it the labels sit under the swipe bar. */
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      <ul className="mx-auto flex h-[58px] max-w-lg items-stretch">
        {tabs.map((tab) => {
          const active = isActive(tab.href);

          if (tab.key === "add") {
            return (
              <li key={tab.key} className="flex-1">
                <Link
                  href={resolve(tab)}
                  aria-current={active ? "page" : undefined}
                  aria-label={tab.label}
                  className="flex h-full flex-col items-center justify-start pt-[5px]"
                >
                  {/* -16px, as in the app: what makes it read as the
                      primary action rather than a fifth equal tab. */}
                  <span className="-mt-4 grid size-[46px] place-items-center rounded-full bg-brand text-brand-ink shadow-lift transition active:bg-brand-hover">
                    <Icon name="add" active />
                  </span>
                  <span className="mt-[2px] text-[11px] font-semibold leading-[14px] text-muted">
                    {tab.label}
                  </span>
                </Link>
              </li>
            );
          }

          return (
            <li key={tab.key} className="flex-1">
              <Link
                href={resolve(tab)}
                aria-current={active ? "page" : undefined}
                className={`flex h-full flex-col items-center justify-start pt-[5px] transition-colors ${
                  active ? "text-brand" : "text-faint"
                }`}
              >
                <span className="grid h-7 place-items-center">
                  <Icon name={tab.key} active={active} />
                </span>
                <span className="mt-[2px] w-full truncate px-1 text-center text-[11px] font-semibold leading-[14px]">
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
