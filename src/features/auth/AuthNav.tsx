"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { Avatar } from "@/src/components/ui/Avatar";
import { prettyPhone } from "@/src/lib/phone";
import { Icon, type IconName } from "@/src/components/ui/Icon";
import { useSession } from "./session";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";

/**
 * The sign-in / signed-in corner of the header.
 *
 * Renders NOTHING while the opening refresh is in flight. That is
 * deliberate: showing "Sign in" and then swapping it for an avatar a moment
 * later is a flash of wrong content on every page load for every signed-in
 * visitor, and the header jumping is worse than it being briefly empty.
 * The space is reserved so nothing shifts.
 *
 * Signed in, it is an AVATAR with a menu rather than a name beside a
 * "sign out" button. Sign-out was the one thing permanently on screen, which
 * is backwards — it is the rarest action a signed-in person takes, and it
 * was crowding out the account links they actually want. Behind the avatar,
 * it costs one click and stops being a target they can hit by accident.
 */
export function AuthNav({ lang }: { lang: Lang }) {
  const { user, status, signOut } = useSession();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (status === "loading") return <span className="size-10" aria-hidden />;

  if (!user) {
    return (
      <Link
        href={`/${lang}/login`}
        className="rounded-control px-3 py-2 text-[14px] font-semibold text-ink ring-1 ring-line transition hover:bg-muted-bg"
      >
        {t(lang, "auth.signIn")}
      </Link>
    );
  }

  const label = [user.name, user.surname].filter(Boolean).join(" ").trim();
  /**
   * WHO, then how to reach them — two lines, never one.
   *
   * This used to be `name || phoneNumber`, which has the number standing in
   * for the person: an account with no name was addressed as
   * "+998900000000", and one with a name lost its number entirely. The name
   * is the identity and "Mehmon" is what an account without one is called
   * (the same word the profile's membership pill uses); the number belongs
   * underneath it, as the quieter line, and formatted — a run of twelve
   * digits is not checkable at a glance against the phone in your hand.
   */
  const who = label || t(lang, "membership.guest");
  const contact = user.phoneNumber
    ? prettyPhone(user.phoneNumber)
    : (user.email ?? "");

  return (
    <div ref={wrap} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={who}
        className="grid place-items-center rounded-full ring-1 ring-brand-line transition hover:ring-brand"
      >
        {/* No photo and no name falls back to a person glyph, never to the
            first character of the phone number — that is a "+". */}
        <Avatar uri={user.avatarUrl} name={label} size={40} />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute end-0 top-full z-50 mt-2 min-w-[13rem] overflow-hidden rounded-control bg-raised py-1 shadow-lift ring-1 ring-line"
        >
          <div className="border-b border-line px-3.5 py-2.5">
            <p className="truncate text-[14px] font-semibold text-ink">{who}</p>
            {contact ? (
              <p className="nums truncate text-[13px] text-muted">{contact}</p>
            ) : null}
          </div>

          <MenuLink
            href={`/${lang}/profile`}
            icon="person"
            label={t(lang, "profile.title")}
            onNavigate={() => setOpen(false)}
          />

          <MenuLink
            href={`/${lang}/listings/mine`}
            icon="listings"
            label={t(lang, "mine.title")}
            onNavigate={() => setOpen(false)}
          />

          <MenuLink
            href={`/${lang}/saved`}
            icon="heart"
            label={t(lang, "saved.title")}
            onNavigate={() => setOpen(false)}
          />

          <MenuLink
            href={`/${lang}/wallet`}
            icon="wallet"
            label={t(lang, "profile.linkWallet")}
            onNavigate={() => setOpen(false)}
          />

          <MenuLink
            href={`/${lang}/settings`}
            icon="settings"
            label={t(lang, "nav.settings")}
            onNavigate={() => setOpen(false)}
          />

          <MenuLink
            href={`/${lang}/account/sessions`}
            icon="sessions"
            label={t(lang, "sessions.title")}
            onNavigate={() => setOpen(false)}
            last
          />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setConfirming(true);
            }}
            className="flex w-full items-center gap-3 px-3.5 py-2.5 text-start text-[14px] text-danger transition hover:bg-muted-bg"
          >
            <Icon name="logout" className="size-[18px]" />
            {t(lang, "auth.signOut")}
          </button>
        </div>
      ) : null}

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

/**
 * One row of the avatar menu.
 *
 * Icons because the menu grew: with two items the words were enough, with
 * six they are a wall, and the glyph is what the eye lands on. They are the
 * SAME glyphs the settings page uses for the same destinations — two icons
 * for one place is worse than none.
 */
function MenuLink({
  href,
  icon,
  label,
  onNavigate,
  last = false,
}: {
  href: string;
  icon: IconName;
  label: string;
  onNavigate: () => void;
  /** Draws the divider above the sign-out button. */
  last?: boolean;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onNavigate}
      className={`flex items-center gap-3 px-3.5 py-2.5 text-[14px] text-ink transition hover:bg-muted-bg ${
        last ? "border-b border-line" : ""
      }`}
    >
      <Icon name={icon} className="size-[18px] text-muted" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </Link>
  );
}
