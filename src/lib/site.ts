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

/** Reachable addresses. Used by the support page and the legal pages. */
export const CONTACT = {
  email: "support@growencity.uz",
  privacyEmail: "privacy@growencity.uz",
  telegram: "https://t.me/growencity",
} as const;

/** Store listings, for the landing page and the install prompts. */
export const STORES = {
  ios: "https://apps.apple.com/app/id6827230283",
  android: "https://play.google.com/store/apps/details?id=uz.growencity.app",
} as const;

/** The last time the legal copy changed. Shown on every legal page. */
export const LEGAL_UPDATED = "2026-10-29";
