import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";

/**
 * Dates, as the two screens that show them need them.
 *
 * Lifted out of SessionsList, which wrote both of these for itself, once
 * the activity lists needed the same thing. Two copies of "how long ago"
 * is how one of them ends up saying "yesterday" where the other says
 * "26 hours".
 *
 * dd.MM.yyyy is how both Uzbek and Russian write a date anyway, and it is
 * built by hand rather than by `toLocaleString`: the format then does not
 * depend on which locale data the browser happens to ship, which is not a
 * thing to leave to chance on a security screen.
 */
const pad = (n: number) => String(n).padStart(2, "0");

export function absoluteTime(date: Date): string {
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function absoluteDate(date: Date): string {
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

/**
 * "5 daqiqa oldin" beats "02.11.2026 23:45" for the question these screens
 * answer — what happened lately — and the exact timestamp stays one hover
 * away in `title`.
 */
export function relativeTime(iso: string, lang: Lang): string {
  const then = new Date(iso);
  const minutes = Math.floor((Date.now() - then.getTime()) / 60000);

  if (minutes < 1) return t(lang, "time.now");
  if (minutes < 60) return t(lang, "time.minutes", { n: minutes });
  if (minutes < 60 * 24) {
    return t(lang, "time.hours", { n: Math.floor(minutes / 60) });
  }
  if (minutes < 60 * 48) return t(lang, "time.yesterday");
  return absoluteTime(then);
}
