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

export function resolveMediaUrl(
  url: string | null | undefined,
): string | undefined {
  if (!url) return undefined;
  if (HAS_SCHEME.test(url)) return url;
  return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
}
