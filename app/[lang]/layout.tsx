import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { HTML_LANG, LANGS, isLang, type Lang } from "@/src/i18n/config";
import { SITE_NAME, SITE_URL } from "@/src/lib/site";
import { ThemeProvider } from "@/src/features/theme/theme";
import { PrefsProvider } from "@/src/features/settings/prefs";
import { SavedProvider } from "@/src/features/account/saved-store";
import { SessionProvider } from "@/src/features/auth/session";

/**
 * Self-hosted by next/font: it downloads the file at build time and serves
 * it from our own origin, so there is no render-blocking request to a third
 * party and no layout shift while it arrives.
 *
 * Cyrillic is NOT optional here — half the site is Russian, and without the
 * subset every Russian page falls back to a system font mid-paragraph.
 */
const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
  variable: "--font-inter",
});

/** Every language, rendered at build time. This is what makes it static. */
export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#07191d" },
  ],
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};

  return {
    // Relative canonicals and OG images resolve against this. Without it
    // Next emits relative URLs that crawlers cannot follow.
    metadataBase: new URL(SITE_URL),
    title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
    applicationName: SITE_NAME,
    openGraph: {
      siteName: SITE_NAME,
      locale: HTML_LANG[lang],
      type: "website",
    },
    robots: { index: true, follow: true },
  };
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  // A bad segment must 404, not render an empty shell: /fr/privacy returning
  // 200 with no content is a page Google will index.
  if (!isLang(lang)) notFound();

  return (
    // `suppressHydrationWarning` on <html> only: the pre-paint script below
    // sets `data-theme` before React sees the document, so the server markup
    // and the client DOM differ on that one attribute by design. Scoped to
    // this element — it does not travel to children.
    <html
      lang={HTML_LANG[lang as Lang]}
      className={inter.variable}
      suppressHydrationWarning
    >
      <head>
        {/* Runs before the first paint so a visitor who chose dark never
            sees a white flash.

            An EXTERNAL file, not an inline tag. React 19 does not execute an
            inline script it renders on the client and logs an error saying
            so; a `src` script is a resource it hoists and runs properly.
            It is not `async` or `defer` on purpose — it must execute before
            the first paint, which is the whole point, and it is ~150 bytes
            served from the same origin.

            `public/theme-init.js` is GENERATED from the theme module by
            `scripts/gen-theme-init.mjs` so the storage key cannot drift. */}
        <script src="/theme-init.js" />
      </head>
      <body className="font-sans antialiased">
        {/* Keyboard and screen-reader users should not have to walk the
            header on every page. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-20 focus:rounded-lg focus:bg-brand focus:px-3 focus:py-2 focus:text-brand-ink"
        >
          {lang === "ru" ? "К содержанию" : "Asosiy qismga o'tish"}
        </a>
        {/* A client provider wrapping server children. This does NOT make
            them client components — the legal and listing pages stay
            statically rendered and indexable while the chrome knows who is
            signed in. */}
        <ThemeProvider>
          <PrefsProvider>
            <SessionProvider>
              <SavedProvider>{children}</SavedProvider>
            </SessionProvider>
          </PrefsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
