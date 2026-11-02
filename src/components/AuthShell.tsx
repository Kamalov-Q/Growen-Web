import type { Lang } from "@/src/i18n/config";
import { SITE_NAME } from "@/src/lib/site";
import { Header } from "./Chrome";

/**
 * The shell for sign-in and anything like it.
 *
 * A separate shell from `Page`, not a variant of it, because an auth screen
 * wants the opposite of what a listings page wants. `Page` is a wide
 * container with a header full of ways to go elsewhere; this is one narrow
 * card, centred, with the chrome stripped to a logo and a language switch.
 *
 * The form used to render inside the wide shell, which put a 384px box at
 * the left of a 1400px container with the whole middle of the screen empty
 * beneath it. Nothing was centred, nothing was contained, and the eye had
 * nowhere to go.
 *
 * `min-h` with `place-items-center` rather than a fixed top margin: the card
 * sits in the middle of whatever viewport it lands in, and still scrolls
 * normally on a short phone screen instead of being clipped.
 */
export function AuthShell({
  lang,
  path,
  children,
}: {
  lang: Lang;
  path: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-page">
      <Header lang={lang} path={path} minimal />

      <main
        id="main"
        className="grid flex-1 place-items-center px-4 py-10 sm:py-16"
      >
        <div className="w-full max-w-[26rem]">
          <div className="flex flex-col gap-6 rounded-card bg-surface p-6 shadow-lift ring-1 ring-line sm:p-8">
            {children}
          </div>

          <p className="mt-6 text-center text-[13px] text-faint">
            © {new Date().getFullYear()} {SITE_NAME}
          </p>
        </div>
      </main>
    </div>
  );
}
