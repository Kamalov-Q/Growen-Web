import type { MetadataRoute } from "next";
import { HTML_LANG, LANGS } from "@/src/i18n/config";
import { LEGAL_UPDATED, SITE_URL } from "@/src/lib/site";
import { fetchFeed } from "@/src/features/listings/api";

/**
 * Generated, not hand-written.
 *
 * A hand-maintained sitemap.xml is a file somebody forgets the day they add
 * a page. This is derived from the same LANGS list the routes are, so a new
 * language appears here the moment it appears there.
 *
 * `alternates.languages` tells Google these are translations of one another
 * rather than competing pages — the same job the hreflang tags do, repeated
 * here because crawlers use both.
 */
const PATHS = ["", "/privacy", "/terms", "/account-deletion", "/support"] as const;

/**
 * How many listings to submit.
 *
 * A sitemap may hold 50,000 URLs, but this fetches them from the API on
 * every regeneration, so the cap is about what that request costs rather
 * than what the format allows. Past a few thousand listings this should page
 * through the feed and split into a sitemap index — the format for exactly
 * this — rather than growing one request.
 */
const LISTING_LIMIT = 1000;

/** Regenerated hourly. New listings are the point of submitting a sitemap. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const updated = new Date(LEGAL_UPDATED);

  // Only ACTIVE listings, which is what the feed returns. A sold or archived
  // advert is marked noindex on its own page; submitting it here would be
  // asking Google to crawl something we then tell it to drop.
  let listings: { id: string; publishedAt: string | null }[] = [];
  try {
    listings = await fetchFeed({ purpose: "SALE", limit: LISTING_LIMIT });
  } catch {
    // A sitemap missing its listings is a bad day; a sitemap that 500s is
    // one Google stops fetching. Ship the static pages regardless.
  }

  const listingEntries: MetadataRoute.Sitemap = listings.flatMap((listing) =>
    LANGS.map((lang) => ({
      url: `${SITE_URL}/${lang}/listing/${listing.id}`,
      lastModified: listing.publishedAt
        ? new Date(listing.publishedAt)
        : updated,
      changeFrequency: "daily" as const,
      priority: 0.8,
      alternates: {
        languages: {
          "x-default": `${SITE_URL}/uz/listing/${listing.id}`,
          ...Object.fromEntries(
            LANGS.map((code) => [
              HTML_LANG[code],
              `${SITE_URL}/${code}/listing/${listing.id}`,
            ]),
          ),
        },
      },
    })),
  );

  const staticEntries: MetadataRoute.Sitemap = PATHS.flatMap((path) =>
    LANGS.map((lang) => ({
      url: `${SITE_URL}/${lang}${path}`,
      lastModified: updated,
      changeFrequency: "monthly" as const,
      // The home page is the entry point; the legal pages matter less to a
      // crawler's budget. Relative, not absolute, importance.
      priority: path === "" ? 1 : 0.5,
      alternates: {
        // The SAME locale codes the <link rel="alternate"> tags use. Google
        // accepts both "uz" and "uz-UZ", but emitting one in the HTML and
        // the other in the sitemap is the kind of mismatch that makes a
        // hreflang audit light up for no real reason.
        languages: {
          "x-default": `${SITE_URL}/uz${path}`,
          ...Object.fromEntries(
            LANGS.map((code) => [
              HTML_LANG[code],
              `${SITE_URL}/${code}${path}`,
            ]),
          ),
        },
      },
    })),
  );

  return [...staticEntries, ...listingEntries];
}
