"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Lang } from "@/src/i18n/config";
import { LANGS } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { useSession } from "@/src/features/auth/session";
import { useTheme, type ThemeChoice } from "@/src/features/theme/theme";
import { usePrefs, type Currency } from "./prefs";

const LANG_LABEL: Record<Lang, string> = { uz: "O'zbekcha", ru: "Русский" };

/**
 * The settings screen, matching the app's: appearance, currency, language,
 * then the account and legal rows.
 *
 * Every control here does something. The app's screen also has rows for
 * verification, saved places and activity, which are app features with no
 * web counterpart yet — they are left OUT rather than shown disabled,
 * because a setting that cannot be changed is worse than one that is not
 * offered.
 */
export function SettingsPanel({ lang }: { lang: Lang }) {
  const { choice, setChoice } = useTheme();
  const { currency, setCurrency, rate, rateUpdatedAt } = usePrefs();
  const { user } = useSession();
  const path = usePathname() ?? `/${lang}`;
  // Everything after the language segment, so switching language stays here.
  const rest = path.replace(/^\/[a-z]{2}/, "") || "";

  const themes: { id: ThemeChoice; key: Parameters<typeof t>[1] }[] = [
    { id: "system", key: "settings.themeSystem" },
    { id: "light", key: "settings.themeLight" },
    { id: "dark", key: "settings.themeDark" },
  ];

  const currencies: { id: Currency; label: string }[] = [
    { id: "AUTO", label: t(lang, "settings.currencyAuto") },
    { id: "USD", label: "USD $" },
    { id: "UZS", label: "UZS so'm" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-[1.75rem] font-bold leading-tight tracking-tight text-ink">
          {t(lang, "settings.title")}
        </h1>
        <p className="text-[15px] leading-7 text-muted">
          {t(lang, "settings.lead")}
        </p>
      </header>

      <Card title={t(lang, "settings.appearance")}>
        <Segmented
          options={themes.map((x) => ({ id: x.id, label: t(lang, x.key) }))}
          value={choice}
          onChange={(v) => setChoice(v as ThemeChoice)}
        />
      </Card>

      <Card
        title={t(lang, "settings.currency")}
        note={
          currency !== "AUTO" && rate
            ? t(lang, "settings.rateLine", {
                rate: Math.round(rate).toLocaleString(
                  lang === "ru" ? "ru-RU" : "uz-UZ",
                ),
                date: rateUpdatedAt
                  ? new Date(rateUpdatedAt).toLocaleDateString(
                      lang === "ru" ? "ru-RU" : "uz-UZ",
                    )
                  : "",
              })
            : t(lang, "settings.currencyAutoNote")
        }
      >
        <Segmented
          options={currencies}
          value={currency}
          onChange={(v) => setCurrency(v as Currency)}
        />
      </Card>

      <Card title={t(lang, "settings.language")}>
        <div className="grid grid-cols-2 gap-1 rounded-control bg-muted-bg p-1">
          {LANGS.map((code) => (
            <Link
              key={code}
              href={`/${code}${rest}`}
              hrefLang={code}
              aria-current={code === lang ? "true" : undefined}
              className={`rounded-[0.5rem] px-3 py-2.5 text-center text-[14px] font-semibold transition ${
                code === lang
                  ? "bg-brand text-brand-ink shadow-card"
                  : "text-muted hover:text-ink"
              }`}
            >
              {LANG_LABEL[code]}
            </Link>
          ))}
        </div>
      </Card>

      <Card title={t(lang, "settings.account")}>
        <nav className="flex flex-col">
          {user ? (
            <>
              <Row href={`/${lang}/profile`} label={t(lang, "profile.title")} />
              <Row
                href={`/${lang}/account/sessions`}
                label={t(lang, "sessions.title")}
              />
            </>
          ) : (
            <Row href={`/${lang}/login`} label={t(lang, "auth.signIn")} />
          )}
          <Row
            href={`/${lang}/account-deletion`}
            label={t(lang, "nav.deletion")}
            danger
          />
        </nav>
      </Card>

      <Card title={t(lang, "settings.aboutSection")}>
        <nav className="flex flex-col">
          <Row href={`/${lang}/support`} label={t(lang, "nav.support")} />
          <Row href={`/${lang}/terms`} label={t(lang, "nav.terms")} />
          <Row href={`/${lang}/privacy`} label={t(lang, "nav.privacy")} />
        </nav>
      </Card>
    </div>
  );
}

function Card({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-card bg-surface p-5 shadow-card ring-1 ring-line">
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted">
        {title}
      </h2>
      {children}
      {note ? <p className="text-[13px] leading-5 text-faint">{note}</p> : null}
    </section>
  );
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div
      className="grid gap-1 rounded-control bg-muted-bg p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
    >
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          aria-pressed={value === o.id}
          className={`rounded-[0.5rem] px-3 py-2.5 text-[14px] font-semibold transition ${
            value === o.id
              ? "bg-brand text-brand-ink shadow-card"
              : "text-muted hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Row({
  href,
  label,
  danger = false,
}: {
  href: string;
  label: string;
  danger?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between gap-3 border-b border-line py-3 text-[15px] transition last:border-0 hover:text-brand ${
        danger ? "text-danger" : "text-ink"
      }`}
    >
      {label}
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="size-4 shrink-0 text-faint rtl:rotate-180"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m9 6 6 6-6 6" />
      </svg>
    </Link>
  );
}
