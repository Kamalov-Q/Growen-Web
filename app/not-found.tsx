import Link from "next/link";
import "./globals.css";
import { DEFAULT_LANG } from "@/src/i18n/config";

/**
 * The 404 for paths that match no route at all — `/uz/home`, a typo, a dead
 * inbound link.
 *
 * The ROOT one, which is the part that was missing. `app/[lang]/not-found`
 * only catches `notFound()` called from inside that segment; an unmatched
 * URL never enters the segment, so Next fell back to its own unstyled page
 * and the site visibly ended.
 *
 * Bilingual in one page rather than per language: a 404 is often reached
 * with no valid language segment, so there is nothing to pick a language
 * from. Both languages, one short line each.
 *
 * No header: this file sits above `[lang]`, which owns the html/body and the
 * chrome, so it renders on its own.
 */
export default function NotFound() {
  return (
    <html lang="uz">
      <body className="bg-page text-ink antialiased">
        <main className="grid min-h-dvh place-items-center px-6 text-center">
          <div className="flex flex-col items-center gap-5">
            <span
              aria-hidden
              className="grid size-14 place-items-center rounded-[1rem] bg-brand text-2xl font-bold text-brand-ink"
            >
              G
            </span>

            <p className="nums text-5xl font-bold tracking-tight">404</p>

            <p className="max-w-sm text-[15px] leading-7 text-muted">
              Sahifa topilmadi.
              <br />
              Страница не найдена.
            </p>

            <Link
              href={`/${DEFAULT_LANG}`}
              className="rounded-control bg-brand px-5 py-3 text-[15px] font-bold text-brand-ink transition hover:bg-brand-hover"
            >
              Bosh sahifa · На главную
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
