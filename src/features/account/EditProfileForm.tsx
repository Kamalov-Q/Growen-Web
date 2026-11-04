"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Lang } from "@/src/i18n/config";
import { t, type UiKey } from "@/src/i18n/dictionary";
import { Avatar } from "@/src/components/ui/Avatar";
import { Button } from "@/src/components/ui/Button";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { Field } from "@/src/components/ui/Field";
import { ApiError, patchSessionUser } from "@/src/lib/api";
import { downscaleImage } from "@/src/lib/image";
import {
  AVATAR_MAX_BYTES,
  getProfile,
  removeAvatar,
  updateProfile,
  uploadAvatar,
  type Profile,
  type UpdateProfileInput,
} from "./api";
import {
  MAX_AGE,
  MIN_AGE,
  ageFrom,
  fromIsoDate,
  maskBirthDate,
  toIsoDate,
} from "./birth-date";
import { SocialMark } from "./SocialRow";
import {
  SOCIAL_PLACEHOLDERS,
  SOCIAL_PLATFORMS,
  normalizeSocial,
  type SocialLinks,
} from "./social";

/**
 * Editing your own profile — the app's `/profile/edit`, on the web.
 *
 * The SAME fields in the same order with the same rules as the app's form,
 * because they write to the same `PATCH /profile` and a person who filled
 * one in should recognise the other. Name and surname are required at 2–64
 * characters (the server's own bound); the rest is optional and is exactly
 * what the membership pill counts — fill it in and "Mehmon" becomes
 * "GrowenCity a'zosi".
 *
 * Phone and email are shown but not editable: each is owned by the sign-in
 * method that verified it, and the API refuses them here.
 */

/** Long edge an avatar is downscaled to before upload, as in the app. */
const AVATAR_EDGE = 1024;

export function EditProfileForm({ lang }: { lang: Lang }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    getProfile()
      .then((p) => alive && setProfile(p))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  if (failed) {
    return (
      <p
        role="alert"
        className="rounded-card bg-surface p-6 text-[15px] text-danger ring-1 ring-line"
      >
        {t(lang, "home.loadError")}
      </p>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <div className="mx-auto size-24 animate-pulse rounded-full bg-muted-bg" />
        <div className="h-12 animate-pulse rounded-control bg-muted-bg" />
        <div className="h-12 animate-pulse rounded-control bg-muted-bg" />
        <div className="h-28 animate-pulse rounded-control bg-muted-bg" />
      </div>
    );
  }

  /**
   * The form mounts already knowing the answers.
   *
   * Seeding fields from an effect after the request lands is how boxes end
   * up empty for a moment and how a save fired in that moment clears what
   * was stored. Mounting after the data arrives makes the stored values the
   * initial state, and there is nothing to seed.
   */
  return <Form lang={lang} profile={profile} onProfile={setProfile} />;
}

function Form({
  lang,
  profile,
  onProfile,
}: {
  lang: Lang;
  profile: Profile;
  onProfile: (p: Profile) => void;
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(profile.name ?? "");
  const [surname, setSurname] = useState(profile.surname ?? "");
  // Stored ISO, typed DD.MM.YYYY.
  const [birthDate, setBirthDate] = useState(fromIsoDate(profile.birthDate));
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "">(
    profile.gender ?? "",
  );
  const [bio, setBio] = useState(profile.bio ?? "");
  const [socials, setSocials] = useState<SocialLinks>(
    profile.socialLinks ?? {},
  );

  const [errors, setErrors] = useState<{
    name?: string;
    surname?: string;
    birthDate?: string;
  }>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  const fullName = [profile.name, profile.surname]
    .filter(Boolean)
    .join(" ")
    .trim();

  /** The app's rules, to the character: 2–64, and a real date in range. */
  function validate(): boolean {
    const next: typeof errors = {};
    const tooShort = t(lang, "validation.minChars", { count: 2 });
    const tooLong = t(lang, "validation.maxChars", { count: 64 });

    if (name.trim().length < 2) next.name = tooShort;
    else if (name.trim().length > 64) next.name = tooLong;

    // Optional — but a surname that IS given has the same bounds as a name,
    // because the server applies them to both.
    if (surname.trim()) {
      if (surname.trim().length < 2) next.surname = tooShort;
      else if (surname.trim().length > 64) next.surname = tooLong;
    }

    if (birthDate.trim()) {
      const iso = toIsoDate(birthDate);
      if (!iso) next.birthDate = t(lang, "profileInfo.birthDateInvalid");
      else {
        const age = ageFrom(iso);
        if (age === null || age < MIN_AGE || age > MAX_AGE) {
          next.birthDate = t(lang, "profileInfo.ageRange", {
            min: MIN_AGE,
            max: MAX_AGE,
          });
        }
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  /**
   * Only what was actually edited.
   *
   * Sending every field on every save turns an empty box into an explicit
   * null, which makes the form destructive — the app learned this the hard
   * way: a save fired before the form had its data wiped the gender and the
   * bio that were already stored. A PATCH already means "leave out what
   * should not change", so an untouched field is simply omitted. Clearing
   * still works, because an emptied box IS a change.
   */
  function buildPayload(): UpdateProfileInput {
    const payload: UpdateProfileInput = {};

    if (name.trim() !== (profile.name ?? "")) payload.name = name.trim();
    if (surname.trim() !== (profile.surname ?? "")) {
      // Emptied on purpose clears it; see UpdateProfileInput on why that is
      // null rather than "".
      payload.surname = surname.trim() || null;
    }
    // A birth date is never cleared — there is no "I was not born".
    if (birthDate.trim() && birthDate !== fromIsoDate(profile.birthDate)) {
      payload.birthDate = toIsoDate(birthDate) ?? undefined;
    }
    if (gender !== (profile.gender ?? "")) payload.gender = gender || null;
    if (bio.trim() !== (profile.bio ?? "")) payload.bio = bio.trim() || null;

    // Sent whole or not at all — the server replaces the set, which is what
    // makes removing one handle possible. Both sides are normalised first,
    // so re-saving a profile written before handles were canonicalised does
    // not look like an edit.
    const saved = profile.socialLinks ?? {};
    const cleaned: SocialLinks = {};
    for (const platform of SOCIAL_PLATFORMS) {
      const handle = normalizeSocial(platform, socials[platform] ?? "");
      if (handle) cleaned[platform] = handle;
    }
    const socialsChanged = SOCIAL_PLATFORMS.some(
      (platform) =>
        normalizeSocial(platform, saved[platform] ?? "") !==
        (cleaned[platform] ?? ""),
    );
    if (socialsChanged) payload.socialLinks = cleaned;

    return payload;
  }

  const back = () => router.push(`/${lang}/profile`);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    if (!validate()) return;

    const payload = buildPayload();
    // Nothing to say: a save that changed nothing should not cost a request.
    if (Object.keys(payload).length === 0) {
      back();
      return;
    }

    setSaving(true);
    try {
      const saved = await updateProfile(payload);
      onProfile(saved);
      // The header reads the SESSION, not the profile — without this the
      // avatar menu goes on showing the old name until a reload.
      patchSessionUser({ name: saved.name, surname: saved.surname });
      back();
    } catch (err) {
      setSaveError(
        err instanceof ApiError ? err.message : t(lang, "auth.genericError"),
      );
    } finally {
      setSaving(false);
    }
  }

  async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Cleared immediately, so choosing the SAME file again still fires a
    // change event and re-uploads it.
    e.target.value = "";
    if (!file) return;

    setAvatarError(null);
    setAvatarBusy(true);
    try {
      const sized = await downscaleImage(file, AVATAR_EDGE);
      if (sized.size > AVATAR_MAX_BYTES) {
        setAvatarError(t(lang, "profile.photoTooBig"));
        return;
      }
      const saved = await uploadAvatar(sized);
      onProfile(saved);
      patchSessionUser({ avatarUrl: saved.avatarThumbUrl ?? saved.avatarUrl });
    } catch {
      setAvatarError(t(lang, "auth.genericError"));
    } finally {
      setAvatarBusy(false);
    }
  }

  async function onRemoveAvatar() {
    setConfirmingRemove(false);
    setAvatarError(null);
    setAvatarBusy(true);
    try {
      const saved = await removeAvatar();
      onProfile(saved);
      patchSessionUser({ avatarUrl: null });
    } catch {
      setAvatarError(t(lang, "auth.genericError"));
    } finally {
      setAvatarBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-8" noValidate>
      {/* ---- the photo ------------------------------------------------- */}
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={avatarBusy}
          aria-label={t(lang, "profile.changePhoto")}
          className="relative rounded-full ring-1 ring-brand-line transition hover:ring-brand disabled:opacity-60"
        >
          <Avatar
            uri={profile.avatarThumbUrl ?? profile.avatarUrl}
            name={fullName}
            size={96}
          />
          {/* A camera badge, so the circle reads as something you can
              change rather than something you are being shown. */}
          <span className="absolute -bottom-0.5 -end-0.5 grid size-8 place-items-center rounded-full bg-brand text-brand-ink ring-2 ring-page">
            {avatarBusy ? (
              <span
                aria-hidden
                className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              />
            ) : (
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3.5 8.5h3.2l1.5-2.2h7.6l1.5 2.2h3.2v10H3.5Z" />
                <circle cx="12" cy="13" r="3.3" />
              </svg>
            )}
          </span>
        </button>

        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          onChange={onPickAvatar}
          className="hidden"
        />

        {profile.avatarThumbUrl || profile.avatarUrl ? (
          <button
            type="button"
            onClick={() => setConfirmingRemove(true)}
            disabled={avatarBusy}
            className="text-[14px] font-semibold text-danger transition hover:underline disabled:opacity-50"
          >
            {t(lang, "profile.removePhoto")}
          </button>
        ) : null}

        {avatarError ? (
          <p role="alert" className="text-[13px] font-medium text-danger">
            {avatarError}
          </p>
        ) : null}
      </div>

      {/* ---- who you are -----------------------------------------------
          Only the NAME is required. It is taken at sign-up and is what
          every listing and every chat shows; a surname is one of the
          optional answers the membership pill counts, so it is asked for,
          not demanded. */}
      <div className="flex flex-col gap-4">
        <Field
          label={`${t(lang, "auth.name")} *`}
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t(lang, "auth.namePlaceholder")}
          autoComplete="given-name"
          maxLength={64}
          error={errors.name}
        />
        <Field
          label={t(lang, "auth.surname")}
          name="surname"
          value={surname}
          onChange={(e) => setSurname(e.target.value)}
          placeholder={t(lang, "auth.surnamePlaceholder")}
          autoComplete="family-name"
          maxLength={64}
          error={errors.surname}
        />
        <Field
          label={t(lang, "profileInfo.birthDate")}
          name="birthDate"
          value={birthDate}
          // Masked as they type: the dots are the one part of a date format
          // nobody should have to remember to enter.
          onChange={(e) => setBirthDate(maskBirthDate(e.target.value))}
          placeholder={t(lang, "profileInfo.birthDatePlaceholder")}
          inputMode="numeric"
          maxLength={10}
          className="nums"
          error={errors.birthDate}
        />

        <fieldset className="flex flex-col gap-1.5">
          <legend className="text-[13px] font-semibold text-muted">
            {t(lang, "profileInfo.gender")}
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["MALE", "profileInfo.genderMale"],
                ["FEMALE", "profileInfo.genderFemale"],
              ] as const satisfies readonly (readonly ["MALE" | "FEMALE", UiKey])[]
            ).map(([value, key]) => (
              <button
                key={value}
                type="button"
                aria-pressed={gender === value}
                // Pressing the chosen one again clears it: this is optional,
                // and without this there is no way back to "would rather
                // not say".
                onClick={() => setGender(gender === value ? "" : value)}
                className={`h-12 rounded-control text-[15px] font-semibold transition ${
                  gender === value
                    ? "bg-brand-soft text-brand ring-1 ring-brand"
                    : "bg-surface text-ink ring-1 ring-line hover:bg-muted-bg"
                }`}
              >
                {t(lang, key)}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="bio"
            className="text-[13px] font-semibold text-muted"
          >
            {t(lang, "profileInfo.bio")}
          </label>
          <div className="rounded-control bg-surface px-3.5 ring-1 ring-line transition focus-within:ring-2 focus-within:ring-brand">
            <textarea
              id="bio"
              name="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t(lang, "profileInfo.bioPlaceholder")}
              rows={4}
              maxLength={500}
              className="w-full resize-y bg-transparent py-3 text-[15px] leading-6 text-ink outline-none placeholder:text-faint"
            />
          </div>
          <p className="nums self-end text-[12px] text-faint">
            {bio.length}/500
          </p>
        </div>
      </div>

      {/* ---- where else you are ---------------------------------------- */}
      <fieldset className="flex flex-col gap-3">
        <legend className="text-[13px] font-semibold uppercase tracking-wide text-muted">
          {t(lang, "profileInfo.socials")}
        </legend>
        <p className="text-[13px] text-faint">
          {t(lang, "profileInfo.socialsHint")}
        </p>
        {SOCIAL_PLATFORMS.map((platform) => (
          <label key={platform} className="flex items-center gap-3">
            <span className="text-muted">
              <SocialMark platform={platform} />
            </span>
            <span className="sr-only">{platform}</span>
            <span className="flex-1 rounded-control bg-surface px-3.5 ring-1 ring-line transition focus-within:ring-2 focus-within:ring-brand">
              <input
                value={socials[platform] ?? ""}
                onChange={(e) =>
                  setSocials({ ...socials, [platform]: e.target.value })
                }
                placeholder={SOCIAL_PLACEHOLDERS[platform]}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                inputMode={platform === "whatsapp" ? "tel" : "text"}
                maxLength={200}
                className="h-12 w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-faint"
              />
            </span>
          </label>
        ))}
      </fieldset>

      {/* ---- what the sign-in method owns ------------------------------ */}
      <div className="flex flex-col gap-1">
        <span className="text-[13px] font-semibold text-muted">
          {t(lang, "profile.phone")}
        </span>
        <span className="nums text-[15px] text-ink">
          {profile.phoneNumber ?? "—"}
        </span>
        <span className="text-[13px] text-faint">
          {t(lang, "profile.contactHint")}
        </span>
      </div>

      <p className="text-[13px] text-faint">{t(lang, "profileInfo.privacy")}</p>

      {saveError ? (
        <p
          role="alert"
          className="rounded-control bg-surface p-3.5 text-[14px] font-medium text-danger ring-1 ring-danger/40"
        >
          {saveError}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <Button
          type="button"
          variant="ghost"
          onClick={back}
          className="sm:flex-1"
        >
          {t(lang, "common.cancel")}
        </Button>
        <Button type="submit" loading={saving} className="sm:flex-1">
          {t(lang, "common.save")}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmingRemove}
        title={t(lang, "profile.removePhoto")}
        body={t(lang, "profile.removePhotoConfirm")}
        confirmLabel={t(lang, "common.delete")}
        cancelLabel={t(lang, "common.cancel")}
        danger
        onConfirm={() => void onRemoveAvatar()}
        onCancel={() => setConfirmingRemove(false)}
      />
    </form>
  );
}
