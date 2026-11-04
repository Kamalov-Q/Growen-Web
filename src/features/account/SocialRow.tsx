import {
  SOCIAL_COLORS,
  SOCIAL_PLATFORMS,
  socialUrl,
  type SocialLinks,
  type SocialPlatform,
} from "./social";

/**
 * The accounts someone advertises, as a row of their own marks.
 *
 * The app's SocialRow, redrawn: platform colours rather than the site's
 * teal, because these are other people's marks and are recognised by colour
 * before shape. Renders NOTHING when there is nothing to show — an empty
 * band of grey circles says less than no band at all.
 *
 * The black marks (TikTok, X, Threads) carry `text-ink` instead, since
 * black on the dark theme's #0E2A30 is a hole in the page.
 */
const MARKS: Record<SocialPlatform, React.ReactNode> = {
  tiktok: (
    <>
      <path d="M14.1 3.4v9.9a3.2 3.2 0 1 1-2.5-3.1" />
      <path d="M14.1 3.4c.4 2.2 1.9 3.6 4.3 3.9" />
    </>
  ),
  instagram: (
    <>
      <rect x="3.4" y="3.4" width="17.2" height="17.2" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="16.9" cy="7.1" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  facebook: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M14.8 8.2h-1.4c-.9 0-1.4.5-1.4 1.4V11h2.7l-.4 2.8h-2.3V21" />
      <path d="M9.3 13.8H12" />
    </>
  ),
  x: (
    <>
      <path d="M4.4 4.2 19.6 19.8" />
      <path d="M19.6 4.2 4.4 19.8" />
    </>
  ),
  threads: (
    <>
      <path d="M12 21c-5 0-7.8-3.2-7.8-9S7 3 12 3c3.5 0 5.9 1.5 7 4.3" />
      <path d="M9.2 14.4c.5 1.1 1.6 1.6 3 1.4 1.5-.2 2.4-1.2 2.5-2.9.2-2-1.2-3.3-3.4-3.4-1.3 0-2.3.4-2.8 1.2" />
      <path d="M14.7 12.9c1.8.2 3 1 3.2 2.3" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M20.5 11.8a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.4-4.2A8.5 8.5 0 1 1 20.5 11.8Z" />
      <path d="M9 9.2c.2-.4.4-.5.7-.5h.5c.2 0 .4 0 .6.5l.7 1.6c.1.2 0 .4-.1.6l-.4.5c-.2.2-.2.4-.1.6a6 6 0 0 0 2.6 2.3c.3.1.5 0 .6-.1l.5-.6c.2-.2.4-.2.6-.1l1.6.8c.3.1.4.3.4.5v.5c0 .4-.2.8-.6 1-.4.3-1 .5-1.6.4-1.8-.2-3.5-1.3-4.8-2.8-1-1.1-1.7-2.5-1.9-3.9-.1-.6 0-1.1.3-1.5Z" />
    </>
  ),
};

/**
 * One platform's mark, on its own.
 *
 * Exported because the edit form puts the same glyph beside the field for
 * that account — the row and the form must not end up with two different
 * drawings of Instagram.
 */
export function SocialMark({
  platform,
  className = "size-5",
}: {
  platform: SocialPlatform;
  className?: string;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={`shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {MARKS[platform]}
    </svg>
  );
}

export function SocialRow({ links }: { links: SocialLinks | null }) {
  // Fixed order, not object order: whatever the server happens to return
  // first should not reshuffle somebody's profile between loads.
  const shown = SOCIAL_PLATFORMS.flatMap((platform) => {
    const value = links?.[platform];
    if (!value) return [];
    const url = socialUrl(platform, value);
    return url ? [{ platform, url }] : [];
  });

  if (!shown.length) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {shown.map(({ platform, url }) => (
        <a
          key={platform}
          href={url}
          target="_blank"
          // `noopener` is the security half — the opened page gets no handle
          // on this one through `window.opener`.
          rel="noopener noreferrer nofollow"
          aria-label={platform}
          className="grid size-10 place-items-center rounded-full bg-surface ring-1 ring-line transition hover:bg-raised hover:ring-line-strong"
          style={
            SOCIAL_COLORS[platform] === "#000000"
              ? undefined
              : { color: SOCIAL_COLORS[platform] }
          }
        >
          <SocialMark
            platform={platform}
            className={`size-5 ${SOCIAL_COLORS[platform] === "#000000" ? "text-ink" : ""}`}
          />
        </a>
      ))}
    </div>
  );
}
