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
import { Toaster } from "@/src/components/ui/Toast";

/**
 * Self-hosted by next/font: it downloads the file at build time and serves
 * it from our own origin, so there is no render-blocking request to a third
 * party and no layout shift while it arrives.
 *
 * ── Two instances, one per script ─────────────────────────────────────────
 *
 * `subsets` does not decide which glyphs EXIST. next/font downloads all
 * seven of Inter's subsets at build time either way and declares each as
 * its own `@font-face` with a `unicode-range`; what `subsets` decides is
 * which of those files get a `<link rel="preload">` on every single page.
 * Asking for all three of latin, latin-ext and cyrillic put 152 KB of font
 * in front of every visitor, in both languages:
 *
 *     latin       48 KB   needed everywhere
 *     latin-ext   85 KB   needed nowhere — U+0100–02BA is Polish, Czech,
 *                         Hungarian. Uzbek's oʻ/gʻ is U+02BB, which is in
 *                         the plain latin subset, not this one.
 *     cyrillic    19 KB   needed on /ru, dead weight on /uz
 *
 * So: latin alone for Uzbek, latin plus cyrillic for Russian. An Uzbek page
 * now preloads 48 KB instead of 152 KB, a Russian one 67 KB.
 *
 * Nothing breaks when a glyph falls outside the preloaded set — a Russian
 * comment on an Uzbek listing, an accented name. The `@font-face` for that
 * range is still in the stylesheet, so the browser fetches that one file
 * when it first meets the character and `display: "swap"` paints the
 * fallback until it lands. That is already how greek, vietnamese and
 * cyrillic-ext behave here, and has been all along.
 *
 * Written out twice rather than built from a shared options object on
 * purpose: next/font is a compile-time transform and reads its arguments
 * out of the source, so a spread or a variable makes the build fail.
 */
const interLatin = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const interCyrillic = Inter({
  subsets: ["latin", "cyrillic"],
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

  // Which script this page is written in. Both instances define the same
  // `--font-inter`, and only one class is ever on the document.
  const font = lang === "ru" ? interCyrillic : interLatin;

  return (
    // `suppressHydrationWarning` on <html> only: the pre-paint script below
    // sets `data-theme` before React sees the document, so the server markup
    // and the client DOM differ on that one attribute by design. Scoped to
    // this element — it does not travel to children.
    <html
      lang={HTML_LANG[lang as Lang]}
      className={font.variable}
      suppressHydrationWarning
    >
      <head>
        {/* Runs before the first paint so a visitor who chose dark never
            sees a white flash.

            ── On the console warning this produces in dev ─────────────────

            React 19 logs "Encountered a script tag while rendering React
            component" for this line. The warning is right in general and
            wrong about this case, and both of the obvious ways to silence
            it have now been measured:

              inline (dangerouslySetInnerHTML)
                React 19 never executes an inline script it renders, so the
                tag was dead weight after the first server render. Already
                tried; that is why this is an external file.

              next/script strategy="beforeInteractive"
                Emits ONLY `<link rel="preload" href="/theme-init.js"
                as="script">` into the HTML — checked in the built output.
                The script then runs when the framework gets to it, which is
                after the first paint. That trades a dev-only warning for
                the exact flash this exists to prevent.

              async
                React hoists an async script and stops warning, but async
                means "whenever", and whenever is sometimes after paint.

            What React is actually warning about is a client NAVIGATION: a
            script tag rendered then would not execute. This one only has to
            run once, while the browser parses the first document, and it
            does. The warning does not appear in a production build.

            So it stays blocking, and this comment is here so the next
            person does not spend the afternoon rediscovering the above.

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

        {/* One for the whole app, outside the providers: it is a fixed
            overlay and belongs to no page in particular. */}
        <Toaster />
      </body>
    </html>
  );
}
