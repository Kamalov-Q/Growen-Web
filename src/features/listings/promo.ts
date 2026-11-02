/**
 * Paid placement, as the web sees it.
 *
 * `promoted_until` in the future means the seller bought TOP. The server
 * already ranks those first on the default sort, so the feed arrives with
 * them at the head — but the app shows them as a distinct shelf and the web
 * was showing nothing at all, which quietly made the thing you sell
 * invisible on the surface search engines read.
 */
export const isTop = (promotedUntil: string | null): boolean =>
  !!promotedUntil && new Date(promotedUntil).getTime() > Date.now();
