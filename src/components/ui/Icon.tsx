/**
 * The app's icon set, as inline SVG.
 *
 * Mobile uses Ionicons; these are the same glyphs redrawn at the same 24px
 * grid so a row that reads "Tasdiqlash ⛉" in the app reads the same here.
 * Redrawn rather than installed, because pulling a whole icon font in to
 * render fifteen shapes is a megabyte of network for a few hundred bytes of
 * path data — and a font cannot inherit `currentColor` per-path the way
 * these do.
 *
 * Outline-only. Mobile fills an icon to mark the ACTIVE tab and leaves the
 * rest outlined (see mobile/app/(tabs)/_layout.tsx); nothing here is a tab,
 * so nothing here is ever filled. MobileTabBar draws its own pair.
 *
 * A server component: no state, no handlers, nothing to hydrate.
 */

export type IconName =
  // appearance
  | "contrast"
  | "sun"
  | "moon"
  // currency and language
  | "dollar"
  | "cash"
  | "language"
  // account
  | "person"
  | "settings"
  | "sessions"
  | "verify"
  | "activity"
  | "places"
  | "wallet"
  | "listings"
  | "heart"
  | "add"
  | "logout"
  | "trash"
  // information
  | "support"
  | "terms"
  | "privacy"
  | "info";

const PATHS: Record<IconName, React.ReactNode> = {
  contrast: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18a9 9 0 0 0 0-18Z" fill="currentColor" stroke="none" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
    </>
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />,
  dollar: (
    <>
      <path d="M12 3v18" />
      <path d="M16.5 7.5A3.5 3.5 0 0 0 13 5h-1.6a3.4 3.4 0 0 0 0 6.8h1.2a3.4 3.4 0 0 1 0 6.9H11a3.5 3.5 0 0 1-3.5-2.5" />
    </>
  ),
  cash: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="2.5" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M6 10v4M18 10v4" />
    </>
  ),
  language: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3.5 9.5h17M3.5 14.5h17" />
      <path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" />
    </>
  ),
  person: (
    <>
      <circle cx="12" cy="8.3" r="3.7" />
      <path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 14.4a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-3-1.2l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0-1.2-2.9h-.2a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-3l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 2.9-1.2v-.2a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 3 1.2l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1Z" />
    </>
  ),
  sessions: (
    <>
      <rect x="2.5" y="4" width="14" height="11" rx="2" />
      <path d="M6 19h7" />
      <rect x="18" y="9" width="3.5" height="11" rx="1.2" />
    </>
  ),
  verify: (
    <>
      <path d="M12 2.8 4.8 5.4v6c0 4.6 3 8.7 7.2 10 4.2-1.3 7.2-5.4 7.2-10v-6Z" />
      <path d="m9 12 2.2 2.2L15.4 10" />
    </>
  ),
  activity: <path d="M2.8 12h4l2.4-6.6 4.2 13.2L15.9 12h5.3" />,
  places: (
    <>
      <path d="M12 21.2s7-5.4 7-10.6a7 7 0 1 0-14 0c0 5.2 7 10.6 7 10.6Z" />
      <circle cx="12" cy="10.4" r="2.6" />
    </>
  ),
  wallet: (
    <>
      <rect x="2.8" y="5.8" width="18.4" height="12.4" rx="2.6" />
      <path d="M2.8 10h18.4" />
      <circle cx="17" cy="14" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  listings: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.4" />
      <path d="M7 9h10M7 13h10M7 17h6" />
    </>
  ),
  heart: (
    <path d="M12 20.3 4.6 13a4.6 4.6 0 0 1 6.5-6.5l.9.9.9-.9A4.6 4.6 0 0 1 19.4 13Z" />
  ),
  add: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8.2v7.6M8.2 12h7.6" />
    </>
  ),
  logout: (
    <>
      <path d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H15" />
      <path d="M10 8 6 12l4 4M6 12h10" />
    </>
  ),
  trash: (
    <>
      <path d="M4 6.5h16M9.5 6.5V4.8A1.3 1.3 0 0 1 10.8 3.5h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7" />
      <path d="M6.3 6.5 7.2 19a1.6 1.6 0 0 0 1.6 1.5h6.4a1.6 1.6 0 0 0 1.6-1.5l.9-12.5" />
    </>
  ),
  support: (
    <path d="M20.5 11.6a7.9 7.9 0 0 1-8.5 7.9 9 9 0 0 1-2.6-.4L4.2 21l1.4-4.2a7.4 7.4 0 0 1-1.6-4.6 7.9 7.9 0 0 1 8.5-7.7 7.9 7.9 0 0 1 8 7.1Z" />
  ),
  terms: (
    <>
      <path d="M13.5 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5Z" />
      <path d="M13.5 3v5.5H19M8.5 13h7M8.5 17h4.5" />
    </>
  ),
  privacy: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.2" />
      <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.8v.2" />
    </>
  ),
};

export function Icon({
  name,
  className = "size-5",
}: {
  name: IconName;
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
      {PATHS[name]}
    </svg>
  );
}
