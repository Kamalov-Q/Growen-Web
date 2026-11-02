"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
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
  const display = label || user.phoneNumber || "";
  const initial = (label || user.phoneNumber || "?").charAt(0).toUpperCase();

  return (
    <div ref={wrap} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={display}
        className="grid size-10 place-items-center overflow-hidden rounded-full bg-brand-soft text-[15px] font-bold text-brand ring-1 ring-brand-line transition hover:ring-brand"
      >
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt=""
            width={40}
            height={40}
            // Already an avatar-sized file from the CDN; Next would generate
            // larger variants from a small source, which is an upscale and
            // a metered optimization for no gain.
            unoptimized
            className="size-full object-cover"
          />
        ) : (
          initial
        )}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute end-0 top-full z-50 mt-2 min-w-[13rem] overflow-hidden rounded-control bg-raised py-1 shadow-lift ring-1 ring-line"
        >
          <p className="truncate border-b border-line px-3.5 py-2.5 text-[13px] text-muted">
            {display}
          </p>

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
