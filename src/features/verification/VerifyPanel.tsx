"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { tVerify, type VerifyKey } from "@/src/i18n/strings/verify";
import { Button } from "@/src/components/ui/Button";
import { VerifiedSeal } from "@/src/components/ui/Seal";
import { useSession } from "@/src/features/auth/session";
import { ApiError } from "@/src/lib/api";
import { downscaleImage } from "@/src/lib/image";
import {
  DOCUMENT_EDGE,
  DOCUMENT_MAX_BYTES,
  getVerification,
  submitVerification,
  uploadDocument,
  type VerificationState,
} from "./api";

/**
 * Applying for the verified badge — the app's `verify-profile` screen, on
 * the web.
 *
 * Three photographs: both sides of a passport, and the applicant holding
 * it. The third is the one that matters — the first two prove a document
 * exists, only the selfie ties it to the person asking.
 *
 * One page with four faces: the form, waiting, the badge, and a refusal
 * with a way back to the form. Which one shows is decided by
 * `GET /verification/me` and nothing else, so a decision made while the tab
 * was closed is simply what loads next time.
 *
 * ── What this screen deliberately cannot show ─────────────────────────────
 *
 * The documents already sent. The API never returns them — `mine()` answers
 * with a status, a date and a rejection reason — and that is the right
 * shape: these are passport scans, and an endpoint that hands them back to
 * whoever holds the session is an endpoint worth attacking. So the previews
 * here only ever show what was picked in THIS browser, in this sitting.
 */

const SLOTS = [
  { key: "passportFrontUrl", label: "verify.passportFront" },
  { key: "passportBackUrl", label: "verify.passportBack" },
  { key: "selfieUrl", label: "verify.selfie" },
] as const satisfies readonly { key: string; label: VerifyKey }[];

type SlotKey = (typeof SLOTS)[number]["key"];

/** One slot's local preview and, once uploaded, the URL to send. */
interface Slot {
  /** An object URL for the picked file. Revoked when it is replaced. */
  preview: string;
  url: string | null;
}

export function VerifyPanel({ lang }: { lang: Lang }) {
  const { user } = useSession();
  const [state, setState] = useState<VerificationState | null>(null);
  const [failed, setFailed] = useState(false);

  const [slots, setSlots] = useState<Partial<Record<SlotKey, Slot>>>({});
  const [uploading, setUploading] = useState<SlotKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  /** Set when a rejected applicant asks to try again. */
  const [reapplying, setReapplying] = useState(false);

  // Object URLs are freed by hand — a browser keeps the blob alive until
  // it is told not to, and three passport photos is several megabytes to
  // leave behind on every pick.
  const previews = useRef<string[]>([]);
  useEffect(
    () => () => {
      for (const url of previews.current) URL.revokeObjectURL(url);
    },
    [],
  );

  useEffect(() => {
    let alive = true;
    getVerification()
      .then((s) => alive && setState(s))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  async function pick(key: SlotKey, file: File) {
    setError(null);
    setUploading(key);

    // Shown straight away, uploaded behind it: a document photo is several
    // megabytes and waiting for the round trip to see what you picked makes
    // the slot feel broken.
    const preview = URL.createObjectURL(file);
    previews.current.push(preview);
    setSlots((s) => {
      const old = s[key];
      if (old) URL.revokeObjectURL(old.preview);
      return { ...s, [key]: { preview, url: null } };
    });

    try {
      const sized = await downscaleImage(file, DOCUMENT_EDGE, 0.9);
      if (sized.size > DOCUMENT_MAX_BYTES) {
        setSlots((s) => ({ ...s, [key]: undefined }));
        setError(tVerify(lang, "verify.tooBig"));
        return;
      }
      const url = await uploadDocument(sized);
      setSlots((s) => ({ ...s, [key]: { preview, url } }));
    } catch (err) {
      setSlots((s) => ({ ...s, [key]: undefined }));
      setError(
        err instanceof ApiError ? err.message : t(lang, "auth.genericError"),
      );
    } finally {
      setUploading(null);
    }
  }

  async function onSubmit() {
    const front = slots.passportFrontUrl?.url;
    const back = slots.passportBackUrl?.url;
    const selfie = slots.selfieUrl?.url;
    if (!front || !back || !selfie) return;

    // A number is the thing the passport is matched against, and the server
    // refuses without one (PhoneRequiredGuard). Saying so here turns that
    // 403 into a sentence somebody can act on.
    if (!user?.phoneNumber) {
      setError(tVerify(lang, "verify.needPhone"));
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await submitVerification({
        passportFrontUrl: front,
        passportBackUrl: back,
        selfieUrl: selfie,
      });
      // Re-read rather than assume: the server decides what state the
      // account is now in, and it is one request against three photographs
      // already sent.
      setState(await getVerification());
      setSlots({});
      setReapplying(false);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : t(lang, "auth.genericError"),
      );
    } finally {
      setSubmitting(false);
    }
  }

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

  if (!state) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <div className="h-24 animate-pulse rounded-card bg-muted-bg" />
        <div className="h-20 animate-pulse rounded-card bg-muted-bg" />
        <div className="h-20 animate-pulse rounded-card bg-muted-bg" />
      </div>
    );
  }

  const status = state.isVerified ? "APPROVED" : state.request?.status;
  const locale = lang === "ru" ? "ru-RU" : "uz-UZ";

  // ---- already carrying the badge ----------------------------------------
  if (state.isVerified) {
    return (
      <Verdict
        tone="success"
        title={tVerify(lang, "verify.verifiedTitle")}
        body={tVerify(lang, "verify.verifiedBody")}
      />
    );
  }

  // ---- waiting on a moderator --------------------------------------------
  if (status === "PENDING") {
    return (
      <Verdict
        tone="neutral"
        title={tVerify(lang, "verify.pendingTitle")}
        body={tVerify(lang, "verify.pendingBody")}
        footnote={
          state.request
            ? `${tVerify(lang, "verify.sentAt")} ${new Date(
                state.request.createdAt,
              ).toLocaleDateString(locale)}`
            : undefined
        }
      />
    );
  }

  // ---- turned down, and not yet trying again -----------------------------
  if (status === "REJECTED" && !reapplying) {
    return (
      <div className="flex flex-col gap-4">
        <Verdict
          tone="danger"
          title={tVerify(lang, "verify.rejectedTitle")}
          /* The moderator's own words when there are any. They also arrived
             in support, which is where any argument about them belongs. */
          body={state.request?.rejectionReason ?? tVerify(lang, "verify.rejectedBody")}
        />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            onClick={() => setReapplying(true)}
            className="sm:flex-1"
          >
            {tVerify(lang, "verify.tryAgain")}
          </Button>
          <Link
            href={`/${lang}/support`}
            className="inline-flex h-12 w-full items-center justify-center rounded-control text-[15px] font-bold text-ink ring-1 ring-line transition hover:bg-muted-bg sm:flex-1"
          >
            {t(lang, "nav.support")}
          </Link>
        </div>
      </div>
    );
  }

  const ready = SLOTS.every((s) => slots[s.key]?.url);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col items-center gap-2 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-brand-soft">
          <VerifiedSeal className="size-9" />
        </span>
        <h2 className="text-[1.25rem] font-bold tracking-tight text-ink">
          {tVerify(lang, "verify.heading")}
        </h2>
        <p className="max-w-prose text-[14px] leading-6 text-muted">
          {tVerify(lang, "verify.intro")}
        </p>
      </header>

      <div className="flex flex-col gap-3">
        {SLOTS.map((slot) => (
          <DocumentSlot
            key={slot.key}
            lang={lang}
            label={tVerify(lang, slot.label)}
            slot={slots[slot.key]}
            busy={uploading === slot.key}
            onPick={(file) => void pick(slot.key, file)}
          />
        ))}
      </div>

      <ul className="flex flex-col gap-1.5">
        <Rule ok lang={lang} labelKey="verify.ruleLight" />
        <Rule ok lang={lang} labelKey="verify.ruleFace" />
        <Rule ok={false} lang={lang} labelKey="verify.ruleBlurry" />
      </ul>

      <div className="flex flex-col gap-1.5 text-[13px] leading-5 text-faint">
        <p className="flex items-start gap-2">
          <Lock />
          {tVerify(lang, "verify.privacy")}
        </p>
        <p className="flex items-start gap-2">
          <Clock />
          {tVerify(lang, "verify.timeline")}
        </p>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-control bg-surface p-3.5 text-[14px] font-medium text-danger ring-1 ring-danger/40"
        >
          {error}
        </p>
      ) : null}

      <Button
        type="button"
        onClick={() => void onSubmit()}
        disabled={!ready || uploading !== null}
        loading={submitting}
      >
        {tVerify(lang, "verify.submit")}
      </Button>
    </div>
  );
}

/** One upload slot: empty and dashed, or the picture that filled it. */
function DocumentSlot({
  lang,
  label,
  slot,
  busy,
  onPick,
}: {
  lang: Lang;
  label: string;
  slot: Slot | undefined;
  busy: boolean;
  onPick: (file: File) => void;
}) {
  const input = useRef<HTMLInputElement>(null);

  return (
    <div
      /* Dashed while it is a thing to do, solid once it is done — the
         difference is visible down the whole list at a glance, which is the
         app's rule for these three rows. */
      /* A BORDER, not a ring. Tailwind's ring is a box-shadow and a
         box-shadow cannot be dashed, so `ring-dashed` would have quietly
         drawn a solid line and lost the distinction this row depends on.
         The border is always there, so filling a slot does not shift the
         layout by a pixel. */
      className={`flex items-center gap-3 rounded-card border p-2.5 transition ${
        slot?.url
          ? "border-solid border-brand bg-surface"
          : "border-dashed border-line bg-surface hover:border-line-strong"
      }`}
    >
      <span className="grid h-14 w-20 shrink-0 place-items-center overflow-hidden rounded-control bg-muted-bg">
        {slot ? (
          // A local object URL, never a remote one: next/image would want a
          // host allowlist for a blob that lives for a few seconds.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={slot.preview}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <Camera />
        )}
      </span>

      <span className="min-w-0 flex-1 text-[15px] font-semibold text-ink">
        {label}
      </span>

      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        className="shrink-0 rounded-control px-3 py-2 text-[13px] font-bold text-brand ring-1 ring-brand-line transition hover:bg-brand-soft disabled:opacity-60"
      >
        {busy ? (
          <span
            aria-hidden
            className="block size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        ) : (
          tVerify(lang, slot ? "verify.replace" : "verify.pick")
        )}
      </button>

      <input
        ref={input}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          // Cleared immediately, so picking the SAME file again still fires
          // a change event and re-uploads it.
          e.target.value = "";
          if (file) onPick(file);
        }}
        className="hidden"
      />
    </div>
  );
}

/** One do or don't under the slots. */
function Rule({
  ok,
  lang,
  labelKey,
}: {
  ok: boolean;
  lang: Lang;
  labelKey: VerifyKey;
}) {
  return (
    <li className="flex items-start gap-2 text-[13px] leading-5 text-muted">
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className={`mt-0.5 size-4 shrink-0 ${ok ? "text-brand" : "text-danger"}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {ok ? <path d="m5 12.5 4.5 4.5L19 7.5" /> : <path d="M6 6l12 12M18 6 6 18" />}
      </svg>
      {tVerify(lang, labelKey)}
    </li>
  );
}

/** The three answers an application can end at, in one shape. */
function Verdict({
  tone,
  title,
  body,
  footnote,
}: {
  tone: "success" | "danger" | "neutral";
  title: string;
  body: string;
  footnote?: string;
}) {
  const accent =
    tone === "success"
      ? "text-brand bg-brand-soft"
      : tone === "danger"
        ? "text-danger bg-danger/10"
        : "text-gold bg-gold/15";

  return (
    <section className="flex flex-col items-center gap-3 rounded-card bg-surface p-8 text-center shadow-card ring-1 ring-line">
      <span className={`grid size-16 place-items-center rounded-full ${accent}`}>
        {tone === "success" ? (
          <VerifiedSeal className="size-10" />
        ) : tone === "danger" ? (
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="size-9"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M8.5 8.5l7 7M15.5 8.5l-7 7" />
          </svg>
        ) : (
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="size-9"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5.5l3.5 2" />
          </svg>
        )}
      </span>
      <h2 className="text-[1.25rem] font-bold tracking-tight text-ink">
        {title}
      </h2>
      <p className="max-w-prose text-[14px] leading-6 text-muted">{body}</p>
      {footnote ? (
        <p className="nums text-[13px] text-faint">{footnote}</p>
      ) : null}
    </section>
  );
}

function Camera() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-6 text-faint"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.5 8.5h3.2l1.5-2.2h7.6l1.5 2.2h3.2v10H3.5Z" />
      <circle cx="12" cy="13" r="3.3" />
    </svg>
  );
}

function Lock() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="mt-0.5 size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.2" />
      <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" />
    </svg>
  );
}

function Clock() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="mt-0.5 size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.5l3.5 2" />
    </svg>
  );
}
