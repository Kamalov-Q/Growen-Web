"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/src/i18n/config";
import { t, type UiKey } from "@/src/i18n/dictionary";
import { Avatar } from "@/src/components/ui/Avatar";
import { MembershipPill, VerifiedPill, VerifiedSeal } from "@/src/components/ui/Seal";
import { SocialRow } from "@/src/features/account/SocialRow";
import type { SocialLinks } from "@/src/features/account/social";
import { prettyPhone } from "@/src/lib/phone";
import { monthYear } from "@/src/lib/time";
import { ListingCard } from "./ListingCard";
import {
  getUserListings,
  getUserProfile,
  type OwnerListingsQuery,
  type OwnerSort,
  type PublicProfile,
} from "./social-api";
import type { Listing } from "@/src/lib/listing-types";

/**
 * Somebody else's profile — who they are, and what they are selling.
 *
 * The same shape as your own profile page, which is the point: a seller you
 * are deciding whether to ring should be presented the way you are
 * presented to them. What differs is the DATA, not the layout — no edit
 * pencil, no wallet, no counts that are only meaningful about yourself.
 *
 * Client-rendered behind a session because the endpoint is: `/users/:id`
 * sits under `JwtAccessGuard`, so there is nothing to server-render for a
 * guest and nothing for a crawler to index.
 */

const PAGE = 20;

export function UserProfilePanel({
  lang,
  userId,
}: {
  lang: Lang;
  userId: string;
}) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [listings, setListings] = useState<Listing[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  /**
   * The filter, and the count that goes with it.
   *
   * `total` is the number for the filter IN FORCE, which is why it is held
   * separately from `listingCount` on the profile: the heading should say
   * how many the reader is actually looking at, not how many exist.
   */
  const [filter, setFilter] = useState<OwnerListingsQuery>({});
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let alive = true;
    getUserProfile(userId)
      .then((data) => {
        if (!alive) return;
        setProfile(data);
        // The card already carries the first page; asking again for what is
        // in hand would be a round trip to redraw the same rows.
        setListings(data.listings ?? []);
        setTotal(data.listingCount ?? 0);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [userId]);

  async function more() {
    if (!listings) return;
    setBusy(true);
    try {
      const page = await getUserListings(userId, PAGE, listings.length, filter);
      setListings([...listings, ...page.items]);
      setTotal(page.total);
    } catch {
      // The rows already on screen stay; nothing is lost by a failed page.
    } finally {
      setBusy(false);
    }
  }

  /**
   * Changing a filter re-asks from the first page.
   *
   * Not a client-side slice of what is loaded: the profile ships twenty
   * listings and somebody with forty would see "Kvartira" filter down to
   * whichever of the first twenty happened to be flats. The server knows
   * the whole set, so the server does the filtering.
   */
  async function apply(next: OwnerListingsQuery) {
    setFilter(next);
    setBusy(true);
    try {
      const page = await getUserListings(userId, PAGE, 0, next);
      setListings(page.items);
      setTotal(page.total);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  if (failed) {
    return (
      <p
        role="alert"
        className="rounded-card bg-surface p-6 text-center text-[15px] text-danger ring-1 ring-line"
      >
        {t(lang, "home.loadError")}
      </p>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center gap-4" aria-busy="true">
        <div className="size-24 animate-pulse rounded-full bg-muted-bg" />
        <div className="h-6 w-48 animate-pulse rounded bg-muted-bg" />
        <div className="h-40 w-full animate-pulse rounded-card bg-muted-bg" />
      </div>
    );
  }

  const name =
    profile.fullName?.trim() ||
    [profile.name, profile.surname].filter(Boolean).join(" ").trim() ||
    null;

  return (
    <div className="flex flex-col gap-8">
      {/* Centred on every width. On a phone this column IS the page, and
          a left-ranged avatar with centred text under it is the layout
          that reads as unfinished. */}
      <header className="flex flex-col items-center gap-2 pt-2 text-center">
        <span className="rounded-full p-[2.5px] ring-[2.5px] ring-line">
          <Avatar
            uri={profile.avatarThumbUrl ?? profile.avatarUrl}
            name={name}
            size={104}
            className="bg-brand text-brand-ink"
          />
        </span>

        <h1 className="flex max-w-full items-center justify-center gap-1.5 text-[1.45rem] font-bold leading-tight tracking-tight text-ink sm:text-[1.6rem]">
          <span className="truncate">{name ?? t(lang, "detail.seller")}</span>
          {profile.isVerifiedRealtor ? (
            <VerifiedSeal className="size-[26px]" />
          ) : null}
        </h1>

        {/* The seal outranks the pill: where both apply only the seal's
            wordier form is skipped. Same rule as your own profile. */}
        {profile.isVerifiedRealtor ? (
          <VerifiedPill lang={lang} />
        ) : (
          <MembershipPill lang={lang} member={profile.isMember} />
        )}

        <p className="text-[13px] text-faint">
          {t(lang, "profile.memberSince", {
            date: monthYear(profile.createdAt, lang),
          })}
        </p>

        {profile.bio ? (
          <p className="mt-1 max-w-prose text-[15px] leading-7 text-ink-soft">
            {profile.bio}
          </p>
        ) : null}

        <div className="mt-1">
          <SocialRow links={(profile.socialLinks as SocialLinks) ?? null} />
        </div>

        {/* ── How to reach them ────────────────────────────────────────
            Two round buttons and no labels. The number was printed in
            full, which made the row the widest thing on the page and said
            twice over what a handset says once; writing is app-only, so
            that one is an affordance rather than an action. Both carry
            their words in `aria-label` and `title`, so a screen reader and
            a hover still get the number itself. */}
        <div className="mt-3 flex items-center justify-center gap-3">
          {profile.phoneNumber ? (
            <a
              href={`tel:${profile.phoneNumber}`}
              aria-label={prettyPhone(profile.phoneNumber)}
              title={prettyPhone(profile.phoneNumber)}
              className="grid size-12 place-items-center rounded-full bg-brand text-brand-ink shadow-card transition hover:bg-brand-hover active:scale-95"
            >
              <PhoneGlyph />
            </a>
          ) : null}

          <button
            type="button"
            disabled
            aria-label={t(lang, "userProfile.message")}
            title={t(lang, "userProfile.messageInApp")}
            className="grid size-12 cursor-not-allowed place-items-center rounded-full bg-surface text-muted ring-1 ring-line"
          >
            <ChatGlyph />
          </button>
        </div>

      </header>

      <section className="flex flex-col gap-3">
        {/* Stacked on a phone, one line from `sm`: at 390px a heading and
            a three-way control cannot share a row without one of them
            being squeezed into two words a line. */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-2 text-[1.05rem] font-semibold tracking-tight text-ink">
            {t(lang, "userProfile.ads")}
            {total ? (
              <span className="nums rounded-full bg-muted-bg px-2 py-0.5 text-[12px] font-semibold text-muted">
                {total}
              </span>
            ) : null}
          </h2>

          <SortRow
            lang={lang}
            sort={filter.sort ?? "newest"}
            onChange={(sort) => void apply({ ...filter, sort })}
          />
        </div>
        {listings?.length ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} lang={lang} />
              ))}
            </div>

            {listings.length < profile.listingCount ? (
              <button
                type="button"
                onClick={() => void more()}
                disabled={busy}
                className="h-12 rounded-control text-[15px] font-semibold text-ink ring-1 ring-line transition hover:bg-muted-bg disabled:opacity-50"
              >
                {t(lang, "wallet.loadMore", {
                  n: profile.listingCount - listings.length,
                })}
              </button>
            ) : null}
          </>
        ) : (
          <p className="rounded-card bg-surface px-6 py-12 text-center text-[15px] text-muted shadow-card ring-1 ring-line">
            {t(lang, "userProfile.noAds")}
          </p>
        )}
      </section>
    </div>
  );
}

/**
 * Sort, as a segmented control rather than loose chips.
 *
 * Three mutually exclusive options are a segment, not a row of pills: the
 * pills left the phone layout ragged — three widths, left-aligned under a
 * heading, with the selected one the only clue they belonged together —
 * while a segment says "pick one of these" by its shape. It is also the
 * control this site already uses for the purpose bar and for the settings
 * pickers, so the profile stops looking like a different product.
 *
 * Full width on a phone, where it is the only thing on its line; its own
 * width from `sm`, where it shares a line with the heading.
 */
function SortRow({
  lang,
  sort,
  onChange,
}: {
  lang: Lang;
  sort: OwnerSort;
  onChange: (sort: OwnerSort) => void;
}) {
  const SORTS: { id: OwnerSort; key: UiKey }[] = [
    { id: "newest", key: "userProfile.sortNewest" },
    { id: "priceAsc", key: "filters.priceAsc" },
    { id: "priceDesc", key: "filters.priceDesc" },
  ];

  return (
    <div
      role="radiogroup"
      className="grid grid-cols-3 gap-1 rounded-control bg-muted-bg p-1 sm:inline-grid sm:w-auto"
    >
      {SORTS.map((option) => {
        const on = sort === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(option.id)}
            /* `text-center leading-tight`: "Avval qimmat" wraps at 360px,
               and a wrapped label must not push its neighbours off the
               baseline. */
            className={`rounded-[0.55rem] px-3 py-2 text-center text-[13px] font-semibold leading-tight transition sm:px-4 ${
              on
                ? "bg-brand text-brand-ink shadow-card"
                : "text-muted hover:text-ink"
            }`}
          >
            {t(lang, option.key)}
          </button>
        );
      })}
    </div>
  );
}

function PhoneGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-[22px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7.5 4.5h-2A1.5 1.5 0 0 0 4 6.2 14 14 0 0 0 17.8 20a1.5 1.5 0 0 0 1.7-1.5v-2a1.3 1.3 0 0 0-1-1.3l-2.4-.5a1.3 1.3 0 0 0-1.3.5l-.8 1a11 11 0 0 1-4.7-4.7l1-.8a1.3 1.3 0 0 0 .5-1.3l-.5-2.4a1.3 1.3 0 0 0-1.3-1Z" />
    </svg>
  );
}

function ChatGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-[22px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.5 11.6a7.9 7.9 0 0 1-8.5 7.9 9 9 0 0 1-2.6-.4L4.2 21l1.4-4.2a7.4 7.4 0 0 1-1.6-4.6 7.9 7.9 0 0 1 8.5-7.7 7.9 7.9 0 0 1 8 7.1Z" />
    </svg>
  );
}
