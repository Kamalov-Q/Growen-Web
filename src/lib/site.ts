/**
 * One place for the facts every page repeats.
 *
 * `SITE_URL` has to be absolute and correct in production: canonical links,
 * hreflang alternates, Open Graph images and the sitemap are all built from
 * it, and a wrong value there is the kind of SEO bug that looks fine locally
 * and quietly de-indexes the site.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ??
  "https://growencity.uz";

export const SITE_NAME = "Growen City";

/**
 * What the settings screen signs off with, the way the app prints its own
 * version there (`about.version`).
 *
 * Read from the env at build time rather than hardcoded, so a deploy cannot
 * claim to be a version it is not: Vercel sets `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA`,
 * and anything else can set `NEXT_PUBLIC_APP_VERSION`. With neither — a
 * local `next dev` — it says "dev", which is true.
 */
export const APP_VERSION =
  process.env.NEXT_PUBLIC_APP_VERSION ??
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
  "dev";

/**
 * The API's ORIGIN — no path. Matches what the mobile app's eas.json sets.
 */
export const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ??
  "https://api.growencity.uz";

/**
 * Where requests actually go.
 *
 * The `/api` prefix is NOT optional and not cosmetic: the NestJS app sets it
 * globally (`setGlobalPrefix('api')`) because the Click merchant dashboard
 * is configured with it in the webhook URLs. Leaving it off makes every call
 * 404 — which is exactly what happened the first time this page tried to
 * fetch the feed, and it failed quietly into the "could not load" branch
 * rather than throwing anything obvious.
 *
 * Derived here rather than expected in the env var, so the env var is the
 * same value the mobile app already uses (`src/lib/env.ts` does the same).
 */
export const API_URL = `${API_ORIGIN}/api`;

/**
 * Reachable addresses. Used by the support page, the footer and the legal
 * pages — nothing hardcodes a contact anywhere else, which is why changing
 * one is a change to this object and nothing more.
 *
 * `privacyEmail` is the SAME address as `email` on purpose. It is the one
 * the account-deletion page tells people to write to, and Google Play
 * requires that route to work — a deletion request bouncing off an address
 * nobody reads is a rejected submission, and worse, somebody who wanted
 * their data gone and believes it is being handled. Two separate inboxes is
 * a thing to split when there is somebody to read the second one.
 */
export const CONTACT = {
  email: "agromind5229@gmail.com",
  privacyEmail: "agromind5229@gmail.com",
  telegram: "https://t.me/growencity",
  /** As written for a person to read. */
  phone: "+998 95 555 52 29",
  /** The same number for a `tel:` link — no spaces, which some diallers choke on. */
  phoneHref: "tel:+998955555229",
} as const;

/** Store listings, for the landing page and the install prompts. */
export const STORES = {
  ios: "https://apps.apple.com/app/id6827230283",
  android: "https://play.google.com/store/apps/details?id=uz.growencity.app",
} as const;

/** The last time the legal copy changed. Shown on every legal page. */
export const LEGAL_UPDATED = "2026-10-29";
