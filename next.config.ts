import type { NextConfig } from "next";

const config: NextConfig = {
  /**
   * There is a package-lock.json one level up (the qayoda monorepo root) as
   * well as this project's own, so Turbopack picked the parent as the
   * workspace root and warned about it. Saying so explicitly stops it
   * guessing — and stops it watching the whole monorepo, which is slower.
   */
  turbopack: { root: __dirname },

  // Fail the build on a type error rather than shipping one. It defaults to
  // doing this; stated explicitly so nobody "temporarily" turns it off and
  // leaves it off. (Next 16 dropped the `eslint` key — linting is its own
  // step now, see the `lint` script.)
  typescript: { ignoreBuildErrors: false },

  // Strip the framework's fingerprint from responses. It tells an attacker
  // which version to look up advisories for and tells a visitor nothing.
  poweredByHeader: false,

  // Trailing-slash consistency matters for SEO: /uz/privacy and
  // /uz/privacy/ must not both be reachable or Google sees duplicates.
  trailingSlash: false,

  images: {
    /**
     * next/image refuses any host not named here, and it is right to: the
     * optimizer fetches whatever URL it is given and re-serves it from your
     * domain, so an open list turns this site into an image proxy for the
     * whole internet.
     *
     * Named hosts, not `**.b-cdn.net`. Anyone can create a b-cdn.net pull
     * zone, so the wildcard would allow every Bunny customer's images
     * through your optimizer and your bandwidth bill.
     *
     * `NEXT_PUBLIC_IMAGE_HOSTS` extends the list without a code change, for
     * when the CDN zone is renamed or a second one appears.
     */
    /**
     * Trimmed from the defaults, which run to 3840px.
     *
     * Nothing on this site is displayed wider than a full-bleed photo on a
     * large screen. Leaving the default ladder in place means the optimizer
     * is asked for sizes no layout ever requests, and on Vercel each one is
     * a billed optimization.
     */
    deviceSizes: [640, 828, 1080, 1440, 1920],
    imageSizes: [128, 256, 384],
    // Modern formats first; browsers that cannot take them fall back.
    formats: ["image/avif", "image/webp"],

    remotePatterns: [
      // Listing photos.
      { protocol: "https", hostname: "growencity.b-cdn.net" },
      // The older zone, still referenced by rows created before the rename.
      { protocol: "https", hostname: "qayoda.b-cdn.net" },
      // Bunny Stream's thumbnails, for listings that carry a walkthrough.
      { protocol: "https", hostname: "vz-*.b-cdn.net" },
      // Seeded demo listings point here.
      { protocol: "https", hostname: "images.unsplash.com" },
      ...(process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? "")
        .split(",")
        .map((h) => h.trim())
        .filter(Boolean)
        .map((hostname) => ({ protocol: "https" as const, hostname })),
    ],
  },

  async redirects() {
    return [
      // Bare paths go to the default language. Done here rather than in
      // middleware on purpose — a redirect in next.config is handled by the
      // CDN edge with no JavaScript executed, while middleware spins up a
      // function on every request to those paths. The cost of that choice is
      // no Accept-Language detection; the language switcher is one click and
      // Uzbek is the right default for this market.
      { source: "/", destination: "/uz", permanent: false },
      { source: "/privacy", destination: "/uz/privacy", permanent: false },
      { source: "/terms", destination: "/uz/terms", permanent: false },
      {
        source: "/account-deletion",
        destination: "/uz/account-deletion",
        permanent: false,
      },
      { source: "/support", destination: "/uz/support", permanent: false },
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Clickjacking: nothing here is meant to be framed.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // No page here needs a camera, a microphone or a location.
          {
            key: "Permissions-Policy",
            // `geolocation=(self)`, not `()`. The map's "where am I" button
            // calls `navigator.geolocation`, and `()` denies it to this
            // origin as well as to embeds — the browser refuses before the
            // permission prompt, so the button fails with no way for the
            // person to allow it. `self` keeps third-party frames blocked
            // and lets our own page ask.
            value:
              "camera=(), microphone=(), geolocation=(self), browsing-topics=()",
          },
        ],
      },
    ];
  },
};

export default config;
