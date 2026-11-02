import type { Lang } from "@/src/i18n/config";
import { Footer, Header } from "./Chrome";
import { MobileTabBar } from "./MobileTabBar";

/**
 * The shell every page shares.
 *
 * `width` exists because two different things live on this site and they want
 * different measures: a grid of listing cards wants the room (6xl), and prose
 * — a privacy policy, a listing description — is unreadable past about 70
 * characters a line, so it gets 3xl. One container for both would make one of
 * them wrong.
 */
export function Page({
  lang,
  path,
  title,
  lead,
  width = "prose",
  children,
}: {
  lang: Lang;
  path: string;
  /** Empty when the page brings its own heading. */
  title: string;
  lead?: string;
  width?: "prose" | "wide";
  children: React.ReactNode;
}) {
  // 1400px, not 6xl (1152): five cards a row need the room, and a
  // marketplace that letterboxes itself on a desktop looks unfinished.
  const measure = width === "wide" ? "max-w-[1400px]" : "max-w-3xl";

  return (
    <div className="flex min-h-dvh flex-col">
      <Header lang={lang} path={path} />

      <main id="main" className={`mx-auto w-full flex-1 px-4 ${title ? "py-10" : "py-6"} ${measure}`}>
        {title ? (
          <h1 className="text-[1.75rem] font-bold leading-tight tracking-tight text-ink sm:text-4xl">
            {title}
          </h1>
        ) : null}
        {lead ? (
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-muted">
            {lead}
          </p>
        ) : null}
        <div className={title || lead ? "mt-8" : ""}>{children}</div>
      </main>

      <Footer lang={lang} />

      {/* The bar is `fixed`, so it is out of flow and would otherwise sit on
          top of the last of the footer. This reserves exactly its height
          plus the home-indicator inset, and only while the bar is on
          screen. */}
      <div
        aria-hidden
        className="h-[calc(58px+env(safe-area-inset-bottom))] md:hidden"
      />
      <MobileTabBar lang={lang} />
    </div>
  );
}
