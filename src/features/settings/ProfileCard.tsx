"use client";

import Image from "next/image";
import Link from "next/link";
import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { useEffect, useState } from "react";
import { useSession } from "@/src/features/auth/session";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { prettyPhone } from "@/src/lib/phone";
import { getCounts, type AccountCounts } from "@/src/features/account/api";

/**
 * The account page.
 *
 * Reads the signed-in user from the SESSION rather than fetching it: the
 * session already holds exactly these fields, and a second request for data
 * sitting in memory is a round trip that buys nothing.
 *
 * The three totals are FETCHED, never assumed. A zero rendered while the
 * request is still out is a lie about the account — it says "you have no
 * listings" to somebody who has forty — so until the numbers arrive the
 * tiles show a placeholder, and if the request fails they show a dash
 * rather than a number nobody measured.
 */
export function ProfileCard({ lang }: { lang: Lang }) {
  const { user, signOut } = useSession();
  const [confirming, setConfirming] = useState(false);
  const [counts, setCounts] = useState<AccountCounts | null>(null);
  const [countsFailed, setCountsFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    getCounts()
      .then((c) => alive && setCounts(c))
      .catch(() => alive && setCountsFailed(true));
    return () => {
      alive = false;
    };
  }, []);
  if (!user) return null;

  const name = [user.name, user.surname].filter(Boolean).join(" ").trim();
  const initial = (name || user.phoneNumber || "?").charAt(0).toUpperCase();

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col items-center gap-4 rounded-card bg-surface p-6 text-center shadow-card ring-1 ring-line sm:flex-row sm:text-start">
        <span className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-soft text-[28px] font-bold text-brand ring-1 ring-brand-line">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt=""
              width={80}
              height={80}
              unoptimized
              className="size-full object-cover"
            />
          ) : (
            initial
          )}
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="truncate text-[1.4rem] font-bold tracking-tight text-ink">
            {name || t(lang, "profile.noName")}
          </h1>
          {user.phoneNumber ? (
            <p className="nums text-[15px] text-muted">
              {prettyPhone(user.phoneNumber)}
            </p>
          ) : null}
          {user.isVerifiedRealtor ? (
            <p className="flex items-center justify-center gap-1 text-[13px] font-semibold text-brand sm:justify-start">
              <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="currentColor">
                <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Zm-1 13-3-3 1.4-1.4L11 12.2l4.6-4.6L17 9l-6 6Z" />
              </svg>
              {t(lang, "profile.verified")}
            </p>
          ) : null}
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <Stat
          href={`/${lang}/listings/mine`}
          label={t(lang, "profile.statListings")}
          value={counts?.mine}
          failed={countsFailed}
          lang={lang}
        />
        <Stat
          href={`/${lang}/listings/mine`}
          label={t(lang, "profile.statActive")}
          value={counts?.mineActive}
          failed={countsFailed}
          lang={lang}
        />
        <Stat
          href={`/${lang}/saved`}
          label={t(lang, "profile.statSaved")}
          value={counts?.saved}
          failed={countsFailed}
          lang={lang}
        />
      </section>

      <section className="flex flex-col gap-3 rounded-card bg-surface p-5 shadow-card ring-1 ring-line">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted">
          {t(lang, "profile.links")}
        </h2>
        <nav className="flex flex-col">
          <Row href={`/${lang}/listings/mine`} label={t(lang, "profile.linkMine")} />
          <Row href={`/${lang}/saved`} label={t(lang, "profile.linkSaved")} />
          <Row href={`/${lang}/wallet`} label={t(lang, "profile.linkWallet")} />
          <Row href={`/${lang}/add`} label={t(lang, "nav.post")} />
          <Row href={`/${lang}/settings`} label={t(lang, "nav.settings")} />
          <Row
            href={`/${lang}/account/sessions`}
            label={t(lang, "sessions.title")}
          />
          <Row href={`/${lang}/support`} label={t(lang, "nav.support")} />
        </nav>
      </section>

      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="h-12 rounded-control text-[15px] font-semibold text-danger ring-1 ring-line transition hover:bg-muted-bg"
      >
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
  lang,
}: {
  href: string;
  label: string;
  value: number | undefined;
  failed: boolean;
  lang: Lang;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1 rounded-card bg-surface px-3 py-4 text-center shadow-card ring-1 ring-line transition hover:ring-brand-line"
    >
      {value === undefined ? (
        failed ? (
          <span className="text-[1.5rem] font-bold leading-none text-faint">—</span>
        ) : (
          <span className="h-6 w-8 animate-pulse rounded bg-muted-bg" />
        )
      ) : (
        <span className="nums text-[1.5rem] font-bold leading-none text-ink">
          {value.toLocaleString(lang === "ru" ? "ru-RU" : "uz-UZ")}
        </span>
      )}
      <span className="text-[12px] text-muted">{label}</span>
    </Link>
  );
}

function Row({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 border-b border-line py-3 text-[15px] text-ink transition last:border-0 hover:text-brand"
    >
      {label}
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
    </Link>
  );
}
