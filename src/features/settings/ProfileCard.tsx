"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { useSession } from "@/src/features/auth/session";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { Avatar } from "@/src/components/ui/Avatar";
import { Icon, type IconName } from "@/src/components/ui/Icon";
import { MembershipPill, VerifiedPill, VerifiedSeal } from "@/src/components/ui/Seal";
import { prettyPhone } from "@/src/lib/phone";
import {
  getCounts,
  getProfile,
  getWallet,
  type AccountCounts,
  type Profile,
  type Wallet,
} from "@/src/features/account/api";
import { completeness } from "@/src/features/account/completeness";
import { CompleteProfileBanner } from "@/src/features/account/CompleteProfileBanner";
import { SocialRow } from "@/src/features/account/SocialRow";
import { VirtualCard } from "@/src/features/account/VirtualCard";

/**
 * The account page, built to the shape of the app's profile tab.
 *
 * Same order, same meaning, top to bottom: who you are, then what you have,
 * then the card, then the way in to everything else, then the way out.
 * Somebody who uses both should not have to re-learn this screen.
 *
 * THREE SOURCES, and the split matters:
 *
 *   the SESSION   name, phone, avatar. Already in memory — asking the
 *                 server for it again is a round trip that buys nothing.
 *   GET /profile  the bio, the social accounts, the join date, and a
 *                 fresher `isVerifiedRealtor` than the session's, which was
 *                 minted at sign-in and still says no for somebody approved
 *                 this morning.
 *   GET /wallet   the balance the card prints.
 *
 * Everything FETCHED is fetched, never assumed. A zero rendered while a
 * request is still out is a lie about the account — it says "you have no
 * listings" to somebody who has forty — so the tiles show a placeholder
 * until the numbers arrive, and a dash if they never do.
 *
 * What the app has and this does not: the edit pencil, the
 * complete-your-profile banner and the push switch. All three are controls,
 * and there is nothing behind them here yet — the web cannot edit a
 * profile, and a row that opens nothing is worse than no row. The pill
 * under the name still says where the account stands.
 */
export function ProfileCard({ lang }: { lang: Lang }) {
  const { user, signOut } = useSession();
  const [confirming, setConfirming] = useState(false);
  const [counts, setCounts] = useState<AccountCounts | null>(null);
  const [countsFailed, setCountsFailed] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);

  useEffect(() => {
    let alive = true;

    // Three independent reads, fired together. Chaining them would stack
    // three round trips to paint one screen.
    getCounts()
      .then((c) => alive && setCounts(c))
      .catch(() => alive && setCountsFailed(true));
    // Swallowed on purpose: the profile and the wallet each only ADD to
    // what the session already shows. A failed bio should not replace a
    // readable page with an error.
    getProfile()
      .then((p) => alive && setProfile(p))
      .catch(() => {});
    getWallet()
      .then((w) => alive && setWallet(w))
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, []);

  if (!user) return null;

  const name = [user.name, user.surname].filter(Boolean).join(" ").trim();
  const phone = user.phoneNumber ?? profile?.phoneNumber ?? null;
  // The live profile first, the session's copy as the fallback.
  const verified = profile?.isVerifiedRealtor ?? user.isVerifiedRealtor;
  const locale = lang === "ru" ? "ru-RU" : "uz-UZ";

  const links: { href: string; label: string; icon: IconName }[] = [
    {
      href: `/${lang}/listings/mine`,
      label: t(lang, "profile.linkMine"),
      icon: "listings",
    },
    {
      href: `/${lang}/saved`,
      label: t(lang, "profile.linkSaved"),
      icon: "heart",
    },
    {
      href: `/${lang}/wallet`,
      label: t(lang, "profile.linkWallet"),
      icon: "wallet",
    },
    { href: `/${lang}/add`, label: t(lang, "profile.linkAdd"), icon: "add" },
    {
      href: `/${lang}/settings`,
      label: t(lang, "nav.settings"),
      icon: "settings",
    },
    {
      href: `/${lang}/account/sessions`,
      label: t(lang, "sessions.title"),
      icon: "sessions",
    },
    {
      href: `/${lang}/support`,
      label: t(lang, "nav.support"),
      icon: "support",
    },
  ];

  return (
    <div className="flex flex-col gap-7">
      {/* No card around the header, exactly as in the app: the photo and the
          name sit on the page itself, and the panels below are what the eye
          reads as objects. */}
      <header className="flex flex-col items-center gap-2 text-center">
        {/* Ringed the way the app rings it. A photo, else initials from the
            name, else a person glyph — see components/ui/Avatar. */}
        <span className="relative rounded-full p-[2.5px] ring-[2.5px] ring-line">
          <Avatar
            uri={profile?.avatarThumbUrl ?? profile?.avatarUrl ?? user.avatarUrl}
            name={name}
            size={104}
            className="bg-brand text-brand-ink"
          />
          {/* On the photo rather than off in a corner: editing your identity
              belongs where the identity is. */}
          <Link
            href={`/${lang}/profile/edit`}
            aria-label={t(lang, "profile.edit")}
            className="absolute -bottom-0.5 -end-0.5 grid size-9 place-items-center rounded-full bg-brand text-brand-ink ring-2 ring-page transition hover:bg-brand-hover"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="size-[17px]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
              <path d="M14.5 6.5 17.5 9.5" />
            </svg>
          </Link>
        </span>

        <h1 className="flex max-w-full items-center justify-center gap-1.5 text-[1.6rem] font-bold leading-tight tracking-tight text-ink">
          <span className="truncate">{name || t(lang, "profile.noName")}</span>
          {/* Beside the name, not in a panel further down: it is a claim
              about this person and it is worth nothing anywhere else. */}
          {verified ? <VerifiedSeal className="size-[26px]" /> : null}
        </h1>

        {/* Two different claims, ranked. Where both are true the seal is
            already beside the name, so only its wordier form is skipped. */}
        {verified ? (
          <VerifiedPill lang={lang} />
        ) : profile ? (
          <MembershipPill lang={lang} member={completeness(profile).complete} />
        ) : null}

        {phone ? (
          <p className="nums text-[15px] text-muted">{prettyPhone(phone)}</p>
        ) : user.email ? (
          <p className="text-[15px] text-muted">{user.email}</p>
        ) : null}

        {profile ? (
          <p className="text-[13px] text-faint">
            {t(lang, "profile.memberSince", {
              date: new Date(profile.createdAt).toLocaleDateString(locale, {
                year: "numeric",
                month: "long",
              }),
            })}
          </p>
        ) : null}

        {profile?.bio ? (
          <p className="mt-1 max-w-prose text-[15px] leading-7 text-ink-soft">
            {profile.bio}
          </p>
        ) : null}

        <div className="mt-1">
          <SocialRow links={profile?.socialLinks ?? null} />
        </div>
      </header>

      {/* The standing invitation, where the app's one-time sheet is an
          interruption. It carries its own progress, so it answers "how much
          is left" rather than just repeating the ask — and it is what turns
          the "Mehmon" pill above into "GrowenCity a'zosi". */}
      {profile && !completeness(profile).complete ? (
        <CompleteProfileBanner
          lang={lang}
          state={completeness(profile)}
          href={`/${lang}/profile/edit`}
        />
      ) : null}

      {/* One panel with three cells, not three cards: the numbers are read
          against each other, and gaps between them invite the eye to
          compare them with everything else on the page instead. */}
      <section className="grid grid-cols-3 overflow-hidden rounded-card bg-raised ring-1 ring-line">
        <Stat
          href={`/${lang}/listings/mine`}
          label={t(lang, "profile.statListings")}
          value={counts?.mine}
          failed={countsFailed}
          locale={locale}
        />
        <Stat
          href={`/${lang}/listings/mine`}
          label={t(lang, "profile.statActive")}
          value={counts?.mineActive}
          failed={countsFailed}
          locale={locale}
          divider
        />
        <Stat
          href={`/${lang}/saved`}
          label={t(lang, "profile.statSaved")}
          value={counts?.saved}
          failed={countsFailed}
          locale={locale}
          divider
        />
      </section>

      {/* The card is issued against the phone number, so an account with no
          verified number has none to show — see the app's CreateCardPrompt,
          which offers to link one. There is no such flow here, so rather
          than print an empty plate this shows nothing at all. */}
      {phone ? (
        <VirtualCard
          lang={lang}
          phone={phone}
          name={name}
          userId={user.id}
          accountNo={wallet?.accountNo ?? null}
          balance={wallet?.balance}
          topupHref={`/${lang}/wallet`}
        />
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-muted">
          {t(lang, "profile.links")}
        </h2>
        <nav className="flex flex-col overflow-hidden rounded-card bg-surface shadow-card ring-1 ring-line">
          {links.map((link, index) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3.5 text-[15px] font-semibold text-ink transition hover:bg-raised ${
                index === 0 ? "" : "border-t border-line"
              }`}
            >
              <span className="text-brand">
                <Icon name={link.icon} />
              </span>
              <span className="flex-1 truncate">{link.label}</span>
              <Chevron />
            </Link>
          ))}
        </nav>
      </section>

      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-control text-[15px] font-bold text-danger ring-1 ring-danger/35 transition hover:bg-danger/10"
      >
        <Icon name="logout" />
        {t(lang, "auth.signOut")}
      </button>

      <ConfirmDialog
        open={confirming}
        title={t(lang, "auth.signOutConfirm")}
        body={t(lang, "auth.signOutBody")}
        confirmLabel={t(lang, "auth.signOut")}
        cancelLabel={t(lang, "common.cancel")}
        danger
        onConfirm={() => {
          setConfirming(false);
          void signOut();
        }}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}

function Stat({
  href,
  label,
  value,
  failed,
  locale,
  divider,
}: {
  href: string;
  label: string;
  /** undefined while the backing request has not resolved. */
  value: number | undefined;
  failed: boolean;
  locale: string;
  divider?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={`${label}: ${value ?? "—"}`}
      className={`flex flex-col items-center gap-1 px-3 py-4 text-center transition hover:bg-surface ${
        divider ? "border-l border-line" : ""
      }`}
    >
      {value === undefined ? (
        failed ? (
          <span className="text-[1.5rem] font-bold leading-none text-faint">
            —
          </span>
        ) : (
          <span className="h-6 w-8 animate-pulse rounded bg-muted-bg" />
        )
      ) : (
        <span className="nums text-[1.5rem] font-bold leading-none text-ink">
          {value.toLocaleString(locale)}
        </span>
      )}
      <span className="text-[12px] text-muted">{label}</span>
    </Link>
  );
}

function Chevron() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-4 shrink-0 text-faint"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
