"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/src/components/ui/Button";
import { Checkbox } from "@/src/components/ui/Checkbox";
import { Field } from "@/src/components/ui/Field";
import Link from "next/link";
import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { ApiError } from "@/src/lib/api";
import { formatUzPhoneInput, isUzMobile, normalizePhone, prettyPhone } from "@/src/lib/phone";
import { requestOtp, verifyOtp } from "./api";

/**
 * The same heading block on every step.
 *
 * Each step used to supply its own, with slightly different sizes and
 * spacing, so moving from the number to the code made the whole card shift.
 * One component means the three screens read as one flow.
 */
function Head({ title, lead }: { title: string; lead: string }) {
  return (
    <header className="flex flex-col items-center gap-3 text-center">
      <span
        aria-hidden
        className="grid size-12 place-items-center rounded-[0.9rem] bg-brand text-xl font-bold text-brand-ink"
      >
        G
      </span>
      <h1 className="text-[1.6rem] font-bold leading-tight tracking-tight text-ink">
        {title}
      </h1>
      <p className="text-[15px] leading-6 text-muted">{lead}</p>
    </header>
  );
}

/**
 * Sign-in, in the two steps the mobile app uses: a number, then the six
 * digits that arrive by SMS.
 *
 * One component rather than two routes. On a phone these are two screens
 * because there is no room for both; in a browser the step is a panel that
 * swaps, which keeps the typed number in memory when somebody goes back to
 * correct a digit. Routing it would mean either losing that or putting a
 * phone number in the URL.
 */

const RESEND_SECONDS = 60;

type Step = "phone" | "code";

export function SignInForm({ lang }: { lang: Lang }) {
  const router = useRouter();
  const params = useSearchParams();

  /**
   * Where to go after signing in.
   *
   * Only a path on THIS site is accepted. `next` arrives from the URL, so
   * it is attacker-controlled: without the check, a link to
   * `…/login?next=https://evil.example` would hand someone a sign-in page
   * on the real domain that drops them on another site afterwards, which is
   * the classic open-redirect phishing setup.
   *
   * A leading `//` is rejected along with a scheme — `//evil.example` is a
   * protocol-relative URL, not a local path, and `startsWith("/")` alone
   * would wave it through.
   */
  const next = (() => {
    const raw = params.get("next");
    if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
    return raw;
  })();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [needsName, setNeedsName] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  /**
   * Consent is explicit, and it gates the FIRST step.
   *
   * It was a line of small print under the card saying "by continuing you
   * agree" — which is a claim about what somebody did, not a record that
   * they did it. A ticked box before the number is sent is the difference
   * between asserting consent and having it, and the first step is the
   * right place: that is where the account is created.
   */
  const [accepted, setAccepted] = useState(false);

  const codeRef = useRef<HTMLInputElement>(null);

  // Tick the resend cooldown down. Cleared on unmount so a navigation away
  // mid-countdown does not leave an interval running.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  useEffect(() => {
    if (step === "code") codeRef.current?.focus();
  }, [step]);

  const fail = (e: unknown) => {
    // The server's message is already localised and specific ("too many
    // attempts", "code expired"). Preferring it to a generic string is the
    // difference between a user who knows to wait and one who keeps trying.
    setError(
      e instanceof ApiError ? e.message : t(lang, "auth.genericError"),
    );
  };

  async function submitPhone(e: React.FormEvent) {
    e.preventDefault();
    if (!isUzMobile(phone)) return setError(t(lang, "auth.phoneInvalid"));
    // Checked here as well as in the disabled state: the button is only one
    // way to submit a form, and Enter in the field is another.
    if (!accepted) return setError(t(lang, "auth.mustAccept"));

    setBusy(true);
    setError(null);
    try {
      await requestOtp(normalizePhone(phone), lang);
      setStep("code");
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) return setError(t(lang, "auth.codeInvalid"));

    setBusy(true);
    setError(null);
    try {
      const session = await verifyOtp(
        normalizePhone(phone),
        code,
        lang,
        needsName ? name.trim() : undefined,
      );

      // A brand-new account with no name is asked for one — and ONLY that
      // account. A returning user already has a name and should not be made
      // to scroll past a field that will be thrown away.
      if (session.isNew && !session.user.name && !needsName) {
        setNeedsName(true);
        return;
      }

      router.replace(next ?? `/${lang}`);
      router.refresh();
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (cooldown > 0 || busy) return;
    setBusy(true);
    setError(null);
    try {
      await requestOtp(normalizePhone(phone), lang);
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }

  if (needsName) {
    return (
      <form onSubmit={submitCode} className="flex flex-col gap-5">
        <Head
          title={t(lang, "auth.nameTitle")}
          lead={t(lang, "auth.nameLead")}
        />

        <Field
          label={t(lang, "auth.name")}
          name="name"
          autoComplete="given-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error ?? undefined}
          autoFocus
        />

        <Button type="submit" loading={busy} disabled={name.trim().length < 2}>
          {t(lang, "auth.save")}
        </Button>
      </form>
    );
  }

  if (step === "code") {
    return (
      <form onSubmit={submitCode} className="flex flex-col gap-5">
        <Head
          title={t(lang, "auth.codeTitle")}
          lead={t(lang, "auth.codeLead", {
            phone: prettyPhone(normalizePhone(phone)),
          })}
        />

        <Field
          ref={codeRef}
          label={t(lang, "auth.code")}
          name="one-time-code"
          // `inputMode` gives a phone a number pad; `autoComplete` lets iOS
          // and Android offer the code straight from the SMS.
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          error={error ?? undefined}
          // Wide, spaced digits: a six-figure code typed into a normal text
          // field is hard to check against the SMS at a glance.
          className="text-center text-[22px] font-semibold tracking-[0.5em]"
        />

        <Button type="submit" loading={busy} disabled={code.length !== 6}>
          {t(lang, "auth.verify")}
        </Button>

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => {
              setStep("phone");
              setCode("");
              setError(null);
            }}
            className="text-muted underline-offset-4 hover:text-ink hover:underline"
          >
            {t(lang, "auth.changeNumber")}
          </button>

          <button
            type="button"
            onClick={resend}
            disabled={cooldown > 0 || busy}
            className="text-brand underline-offset-4 hover:underline disabled:text-muted disabled:no-underline"
          >
            {cooldown > 0
              ? t(lang, "auth.resendIn", { seconds: cooldown })
              : t(lang, "auth.resend")}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={submitPhone} className="flex flex-col gap-5">
      <Head title={t(lang, "auth.title")} lead={t(lang, "auth.lead")} />

      <Field
        label={t(lang, "auth.phone")}
        name="tel"
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        prefix="+998"
        placeholder="90 123 45 67"
        value={phone}
        // The same as-you-type mask the app uses: digits only, country code
        // stripped if pasted, grouped so it can be checked against the SMS.
        onChange={(e) => setPhone(formatUzPhoneInput(e.target.value))}
        error={error ?? undefined}
        autoFocus
      />

      {/* `auth.acceptOffer`, not `nav.terms`.
          The same document, but the app's login screen calls it "Ommaviy
          oferta shartlari" and this one called it "Foydalanish shartlari".
          Somebody who signs in on both should be agreeing to a thing with
          one name — and "public offer" is the one with legal weight here.

          The page it opens is still titled "Foydalanish shartlari", which
          is the remaining half of the same mismatch and a wording decision
          rather than a code one. */}
      <Checkbox id="accept-terms" checked={accepted} onChange={setAccepted}>
        {t(lang, "auth.acceptPrefix")}{" "}
        <Link
          href={`/${lang}/terms`}
          target="_blank"
          className="font-medium text-brand underline-offset-2 hover:underline"
        >
          {t(lang, "auth.acceptOffer")}
        </Link>{" "}
        {t(lang, "auth.acceptMiddle")}{" "}
        <Link
          href={`/${lang}/privacy`}
          target="_blank"
          className="font-medium text-brand underline-offset-2 hover:underline"
        >
          {t(lang, "nav.privacy")}
        </Link>
        {t(lang, "auth.acceptSuffix") ? ` ${t(lang, "auth.acceptSuffix")}` : ""}
      </Checkbox>

      <Button
        type="submit"
        loading={busy}
        disabled={!isUzMobile(phone) || !accepted}
      >
        {t(lang, "auth.continue")}
      </Button>
    </form>
  );
}
