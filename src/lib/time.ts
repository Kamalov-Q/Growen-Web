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

/**
 * "noyabr 2026" / "ноября 2026" — the month somebody joined.
 *
 * Written out here rather than left to `toLocaleDateString`, for two
 * separate reasons:
 *
 * The browser may not have the data. Node with full ICU answers "noyabr,
 * 2026" for `uz-UZ`, but a Chrome build without Uzbek month names falls
 * back to the root locale and prints "2026 M11" — which is what this line
 * actually showed on the profile. A twelve-word table cannot do that.
 *
 * And Russian needs the GENITIVE. `{ month: "long" }` gives the nominative
 * "ноябрь", so "На сайте с" came out as "с ноябрь 2026" instead of
 * "с ноября 2026". The declension is in the table.
 */
const MONTHS: Record<Lang, readonly string[]> = {
  uz: [
    "yanvar",
    "fevral",
    "mart",
    "aprel",
    "may",
    "iyun",
    "iyul",
    "avgust",
    "sentabr",
    "oktabr",
    "noyabr",
    "dekabr",
  ],
  ru: [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
  ],
};

export function monthYear(iso: string, lang: Lang): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  // `?? ""` rather than a non-null assertion: this project compiles with
  // `noUncheckedIndexedAccess`, and an out-of-range month is a blank line
  // rather than a crash on somebody's profile.
  const month = MONTHS[lang][date.getMonth()] ?? "";
  return `${month} ${date.getFullYear()}`;
}
