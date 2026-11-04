import type { UiKey } from "@/src/i18n/dictionary";
import type { Profile } from "./api";

/**
 * How much of a profile is filled in.
 *
 * A port of mobile/src/features/profile/lib/completeness.ts, and it must
 * stay a port: the membership pill it feeds is shown in both clients, and
 * two different definitions of "complete" would mean the app calls somebody
 * a member and the site calls the same person a guest.
 *
 * NAMING — this is "complete your profile", NOT "get verified".
 * `isVerifiedRealtor` means a passport, both sides, and a selfie holding
 * it, reviewed by a human. Calling a self-serve form "verification" would
 * put two different badges behind one word and the cheap one would quietly
 * devalue the one that cost somebody a document check.
 *
 * `name` and `phoneNumber` are not counted — an account cannot exist
 * without a phone and the name is taken at sign-up, so counting them would
 * start everybody at 40% for things they could not have skipped. The avatar
 * is not counted either: it is the most useful thing on a profile, but
 * plenty of people will never upload one, and a badge a photograph alone
 * can block is a badge most accounts never reach.
 */
export interface Completeness {
  /** 0–1, for the progress bar. */
  ratio: number;
  complete: boolean;
  missing: {
    surname: boolean;
    gender: boolean;
    birthDate: boolean;
    bio: boolean;
  };
}

export function completeness(profile: Profile | null): Completeness {
  const missing = {
    surname: !profile?.surname?.trim(),
    gender: !profile?.gender,
    birthDate: !profile?.birthDate,
    bio: !profile?.bio?.trim(),
  };

  const fields = Object.values(missing);
  const filled = fields.filter((isMissing) => !isMissing).length;

  return {
    ratio: fields.length ? filled / fields.length : 1,
    complete: filled === fields.length,
    missing,
  };
}

/**
 * The missing fields, NAMED.
 *
 * "Your profile is incomplete" leaves the reader to open the form and
 * compare it against their own memory. Listing them turns the prompt into a
 * to-do list two items long — and usually shows that what stands between
 * somebody and the badge is one sentence about themselves.
 */
const LABELS = {
  surname: "completeProfile.fieldSurname",
  gender: "completeProfile.fieldGender",
  birthDate: "completeProfile.fieldBirthDate",
  bio: "completeProfile.fieldBio",
} as const satisfies Record<keyof Completeness["missing"], UiKey>;

export function missingLabels(state: Completeness): UiKey[] {
  return (Object.keys(LABELS) as (keyof Completeness["missing"])[])
    .filter((field) => state.missing[field])
    .map((field) => LABELS[field]);
}
