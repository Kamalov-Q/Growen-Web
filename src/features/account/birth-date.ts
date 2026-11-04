/**
 * Birth dates between what a person types and what the API stores.
 *
 * A port of mobile/src/features/profile/lib/birth-date.ts. People here
 * write dates as DD.MM.YYYY; the server speaks ISO. Keeping the conversion
 * in one place is what stops the app and the site disagreeing about what
 * "23.04.1998" means.
 */

export const MIN_AGE = 14;
export const MAX_AGE = 110;

/** `23.04.1998` → `1998-04-23`, or null when it is not a real date. */
export function toIsoDate(typed: string): string | null {
  const m = /^(\d{2})[./-](\d{2})[./-](\d{4})$/.exec(typed.trim());
  if (!m) return null;

  const iso = `${m[3]}-${m[2]}-${m[1]}`;

  // Catches 31.02 and friends: Date happily rolls those forward, so the
  // only honest check is whether it round-trips to the same day.
  const parsed = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  if (parsed.toISOString().slice(0, 10) !== iso) return null;

  return iso;
}

/** `1998-04-23` → `23.04.1998`, for putting a stored date back in the box. */
export function fromIsoDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : "";
}

/** Whole years, the same arithmetic the server does. */
export function ageFrom(iso: string | null | undefined): number | null {
  if (!iso) return null;

  const born = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(born.getTime())) return null;

  const today = new Date();
  let age = today.getUTCFullYear() - born.getUTCFullYear();
  const months = today.getUTCMonth() - born.getUTCMonth();
  if (months < 0 || (months === 0 && today.getUTCDate() < born.getUTCDate())) {
    age -= 1;
  }

  return age;
}

/** Types the dots in as the digits go, so nobody has to find them. */
export function maskBirthDate(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)]
    .filter(Boolean)
    .join(".");
}
