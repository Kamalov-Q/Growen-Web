import Link from "next/link";

/**
 * Inside [lang] so it inherits the layout — a 404 outside it would render
 * without html/body and crash the build.
 *
 * Bilingual in one page rather than per-language: a 404 is often reached
 * with no valid language segment at all, so there is nothing to pick from.
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-20">
      <h1 className="text-3xl font-bold tracking-tight text-ink">404</h1>
      <p className="text-[15px] leading-7 text-muted">
        Sahifa topilmadi. · Страница не найдена.
      </p>
      <Link href="/uz" className="text-brand underline-offset-4 hover:underline">
        Bosh sahifa · На главную
      </Link>
    </main>
  );
}
