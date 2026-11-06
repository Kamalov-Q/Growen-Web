import { API_ORIGIN } from "./site";

/**
 * An API-relative media path, as a URL a browser can load.
 *
 * Mirrors mobile/src/lib/media-url.ts. Most media comes back as an absolute
 * CDN URL and passes straight through; avatars uploaded before the CDN move
 * are stored as `/uploads/...`, which is relative to the API origin and NOT
 * to this site — rendering one as-is asks growencity.uz for a file only the
 * API has.
 *
 * The test is "has a scheme", not "starts with http": a blob: or data: URL
 * is already final too.
 */
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/**
 * One spelling per file.
 *
 * Some rows carry a doubled slash — `https://qayoda.b-cdn.net//listings/…`
 * — from a base that ends in `/` being joined to a path that starts with
 * one. Bunny serves both, so it never looked broken, but they are two
 * different URLs to everything that caches by URL: the browser, the CDN
 * edge and, most expensively, the Next image optimizer, which would
 * generate and store a second full set of variants for the same photo.
 *
 * Only slashes INSIDE the path are collapsed — the `//` after the scheme is
 * preceded by a colon, which the pattern excludes.
 *
 * `data:` and `blob:` URLs are returned untouched. Their payload is opaque
 * and base64 contains `/` freely, so "tidying" one corrupts the image —
 * which is exactly what a picked-but-not-yet-uploaded photo is.
 */
export function cdnSrc(url: string): string {
  if (HAS_SCHEME.test(url) && !/^https?:/i.test(url)) return url;
  return url.replace(/([^:])\/\/+/g, "$1/");
}

export function resolveMediaUrl(
  url: string | null | undefined,
): string | undefined {
  if (!url) return undefined;
  if (HAS_SCHEME.test(url)) return cdnSrc(url);
  return cdnSrc(`${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`);
}
