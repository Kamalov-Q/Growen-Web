import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import type { Lang } from "@/src/i18n/config";
import { CONTACT, LEGAL_UPDATED, SITE_NAME, STORES } from "@/src/lib/site";
import { t } from "@/src/i18n/dictionary";
import { AuthNav } from "@/src/features/auth/AuthNav";
import { PostCta } from "@/src/features/listings/PostCta";
import { ThemeToggle } from "@/src/features/theme/ThemeToggle";
import { LangMenu } from "./LangMenu";
import { HeaderSearch } from "@/src/features/listings/HeaderSearch";

/**
 * Header and footer. Server components; the only client part is AuthNav,
 * which has to know who is signed in.
 *
 * The language switcher is two plain links rather than a dropdown: a link is
 * crawlable, so Google follows it to the other language, and it needs no
 * JavaScript to do a job an anchor already does.
 */

/**
 * The real emblem — the same gold leaf and buildings the app ships as its
 * launcher icon (mobile/assets/icon.png), resized into public/logo.png.
 *
 * It was a brand-coloured tile with a "G" in it, which is what you draw
 * before anyone sends you the artwork. Somebody who installed the app and
 * then found the site had no way to tell it was the same company.
 *
 * `unoptimized`: the file is already a 96px PNG cut for this 32px slot, so
 * Next's optimizer would spend a transform and a cache entry producing
 * something the same size.
 */
function Mark() {
  return (
    <Image
      src="/logo.png"
      alt=""
      width={32}
      height={32}
      unoptimized
      priority
      className="size-8 shrink-0 rounded-[0.6rem]"
    />
  );
}

export function Header({
  lang,
  path,
  minimal = false,
}: {
  lang: Lang;
  path: string;
  /**
   * Strip the header to the logo and the language switch.
   *
   * On a sign-in page the search box and the "post a listing" button are
   * not just unused, they are a way out of the task: a person who came to
   * sign in is offered two things to do instead, one of which bounces them
   * back to this same page. Auth screens show the way forward and nothing
   * else.
   */
  minimal?: boolean;
}) {
  /**
   * Glass, not a lid.
   *
   * The map runs the full width of the window underneath this bar, and a
   * solid strip across the top of it reads as a lid on the page. At 45%
   * with a heavy blur and a little extra saturation, the streets and the
   * parks carry through — the bar belongs to the map instead of covering
   * it — while the blur keeps the search box and the buttons legible over
   * whatever happens to be behind them, which plain transparency would
   * not.
   *
   * The border goes with it: a hard line under a pane of glass is the one
   * thing that gives it away as a separate strip, so it is a hairline of
   * white at 10% rather than the page's own divider colour.
   *
   * `supports-[backdrop-filter]` steps the background back up to 92% where
   * the blur is unavailable, because 45% with nothing behind it is
   * unreadable text over a satellite photograph.
   */
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-surface/92 shadow-bar backdrop-blur-2xl backdrop-saturate-150 supports-[backdrop-filter]:border-white/10 supports-[backdrop-filter]:bg-surface/45">
      {/* TWO ROWS on a phone, one from `sm` up.
          Everything used to share one row, and the search box took what was
          left after the logo, the avatar, the theme toggle and the language
          menu — about 140px on a 390px screen, which cuts the placeholder
          mid-word and leaves room for roughly two words of a query.
          Wrapping gives it the full width instead. No duplicated markup:
          the order is reshuffled with `order-*` and reset above `sm`, so
          there is one header, not a mobile one and a desktop one. */}
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 sm:h-16 sm:flex-nowrap sm:py-0">
        <Link
          href={`/${lang}`}
          className="flex shrink-0 items-center gap-2.5 text-[17px] font-bold tracking-tight text-ink"
        >
          <Mark />
          <span className="hidden lg:inline">{SITE_NAME}</span>
        </Link>

        {/* Search lives in the header, not in a hero.
            A hero band with a heading and a tagline above the search box
            pushed every listing below the fold — on a marketplace the
            inventory IS the landing page, and the first screen should show
            it. */}
        {/* Suspense is REQUIRED, not decorative.
            HeaderSearch calls useSearchParams, which makes everything up to
            the nearest boundary client-rendered — without one, every
            statically prerendered page on the site (the legal pages, login,
            sessions) fails to build at all. The boundary contains the
            bail-out to this one box and leaves the rest of the page static.

            The fallback is the same shape, so nothing shifts when it
            hydrates. */}
        {minimal ? (
          <div className="hidden flex-1 sm:block" />
        ) : (
          <div className="order-3 w-full min-w-0 sm:order-none sm:w-auto sm:flex-1">
            <Suspense
            fallback={
              <div
                aria-hidden
                className="h-11 rounded-control bg-muted-bg"
              />
            }
          >
              <HeaderSearch lang={lang} />
            </Suspense>
          </div>
        )}

        {minimal ? null : <PostCta lang={lang} />}

        {/* Pulled to the end of the first row on a phone — `ms-auto` is what
            keeps it against the edge once the search box has wrapped away
            from between them. */}
        <div className="order-2 ms-auto flex shrink-0 items-center gap-2 sm:order-none sm:ms-0">
          {minimal ? null : <AuthNav lang={lang} />}

          <ThemeToggle lang={lang} />
          <LangMenu lang={lang} path={path} />
        </div>
      </div>
    </header>
  );
}

export function Footer({ lang }: { lang: Lang }) {
  const legal = [
    { href: `/${lang}/privacy`, label: t(lang, "nav.privacy") },
    { href: `/${lang}/terms`, label: t(lang, "nav.terms") },
    { href: `/${lang}/account-deletion`, label: t(lang, "nav.deletion") },
    { href: `/${lang}/support`, label: t(lang, "nav.support") },
  ];

  return (
    <footer className="mt-20 border-t border-line bg-surface">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-8 px-4 py-12">
        {/* Centred on a phone, left-aligned from `sm` up.
            Ranged left in a single narrow column, the brand block, the two
            store buttons and the five links all started at the same x and
            ended at five different ones — a ragged edge down the whole
            footer with empty space beside it. Centring gives the column an
            axis to hang from. Above `sm` the two blocks sit side by side
            and left-alignment is right again. */}
        <div className="flex flex-col items-center gap-8 text-center sm:flex-row sm:items-start sm:justify-between sm:text-start">
          <div className="flex max-w-xs flex-col items-center gap-3 sm:items-start">
            <Link
              href={`/${lang}`}
              className="flex items-center gap-2.5 text-[17px] font-bold tracking-tight text-ink"
            >
              <Mark />
              {SITE_NAME}
            </Link>
            <p className="text-sm leading-6 text-muted">
              {t(lang, "home.tagline")}
            </p>
            <div className="flex gap-2">
              <a
                href={STORES.ios}
                rel="noopener noreferrer"
                target="_blank"
                className="rounded-[0.6rem] border border-line px-3 py-1.5 text-[13px] font-medium text-ink transition hover:border-line-strong"
              >
                App Store
              </a>
              <a
                href={STORES.android}
                rel="noopener noreferrer"
                target="_blank"
                className="rounded-[0.6rem] border border-line px-3 py-1.5 text-[13px] font-medium text-ink transition hover:border-line-strong"
              >
                Google Play
              </a>
            </div>
          </div>

          <nav
            aria-label={t(lang, "nav.legal")}
            className="flex flex-col items-center gap-2.5 text-sm sm:items-start"
          >
            {legal.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-muted transition hover:text-ink"
              >
                {l.label}
              </Link>
            ))}
            <a
              href={`mailto:${CONTACT.email}`}
              className="text-muted transition hover:text-ink"
            >
              {CONTACT.email}
            </a>
            {/* `nums`, so the groups in a phone number line up rather than
                drifting with proportional digits. */}
            <a
              href={CONTACT.phoneHref}
              className="nums text-muted transition hover:text-ink"
            >
              {CONTACT.phone}
            </a>
          </nav>
        </div>

        <p className="border-t border-line pt-6 text-center text-[13px] text-faint sm:text-start">
          © {new Date().getFullYear()} {SITE_NAME} · {t(lang, "footer.updated")}{" "}
          <time dateTime={LEGAL_UPDATED}>{LEGAL_UPDATED}</time>
        </p>
      </div>
    </footer>
  );
}
