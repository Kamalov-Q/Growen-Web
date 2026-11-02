"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Lang } from "@/src/i18n/config";
import { LANGS } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { useSession } from "@/src/features/auth/session";
import { useTheme, type ThemeChoice } from "@/src/features/theme/theme";
import { Icon, type IconName } from "@/src/components/ui/Icon";
import { usePrefs, type Currency } from "./prefs";

const LANG_LABEL: Record<Lang, string> = { uz: "O'zbekcha", ru: "Русский" };

/**
 * The settings screen, matching the app's: appearance, currency, language,
 * then the account and legal rows.
 *
 * The app's screen also carries verification, activity and saved places.
 * Those are app features with no web counterpart yet, and they are listed
 * here rather than hidden — with their icon, and saying plainly that they
 * live in the app.
 *
 * Hiding them was the earlier choice and it was the wrong one: somebody who
 * uses both finds four of the app's rows missing and cannot tell whether the
 * feature was removed, whether the web forgot it, or whether they are
 * looking in the wrong place. A greyed row with "in the app" answers that in
 * three words. It is not a disabled control — there is nothing to change
 * here — it is a signpost.
 */
export function SettingsPanel({ lang }: { lang: Lang }) {
  const { choice, setChoice } = useTheme();
  const { currency, setCurrency, rate, rateUpdatedAt } = usePrefs();
  const { user } = useSession();
  const path = usePathname() ?? `/${lang}`;
  // Everything after the language segment, so switching language stays here.
  const rest = path.replace(/^\/[a-z]{2}/, "") || "";

  // The same glyphs the app uses for these rows, so the two screens read as
  // one product. See mobile/app/settings.tsx.
  const themes: {
    id: ThemeChoice;
    key: Parameters<typeof t>[1];
    icon: IconName;
  }[] = [
    { id: "system", key: "settings.themeSystem", icon: "contrast" },
    { id: "light", key: "settings.themeLight", icon: "sun" },
    { id: "dark", key: "settings.themeDark", icon: "moon" },
  ];

  const currencies: { id: Currency; label: string; icon: IconName }[] = [
    { id: "AUTO", label: t(lang, "settings.currencyAuto"), icon: "contrast" },
    { id: "USD", label: "USD $", icon: "dollar" },
    { id: "UZS", label: "UZS so'm", icon: "cash" },
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
          options={themes.map((x) => ({
            id: x.id,
            label: t(lang, x.key),
            icon: x.icon,
          }))}
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
              <Row
                href={`/${lang}/profile`}
                icon="person"
                label={t(lang, "profile.title")}
              />
              <Row
                href={`/${lang}/listings/mine`}
                icon="listings"
                label={t(lang, "mine.title")}
              />
              <Row
                href={`/${lang}/saved`}
                icon="heart"
                label={t(lang, "saved.title")}
              />
              <Row
                href={`/${lang}/wallet`}
                icon="wallet"
                label={t(lang, "profile.linkWallet")}
              />
              <Row
                href={`/${lang}/account/sessions`}
                icon="sessions"
                label={t(lang, "sessions.title")}
              />
            </>
          ) : (
            <Row
              href={`/${lang}/login`}
              icon="person"
              label={t(lang, "auth.signIn")}
            />
          )}
          <Row
            href={`/${lang}/account-deletion`}
            icon="trash"
            label={t(lang, "nav.deletion")}
            danger
          />
        </nav>
      </Card>

      {/* The app's rows that web has not built. Listed rather than hidden,
          so somebody who uses both can see the feature exists and where to
          find it, instead of wondering whether it was removed. Signposts,
          not disabled controls — Row renders these as text, not as links
          that go nowhere. */}
      {user ? (
        <Card title={t(lang, "settings.inAppSection")}>
          <nav className="flex flex-col">
            <Row
              icon="verify"
              label={t(lang, "settings.verification")}
              note={t(lang, "settings.inApp")}
            />
            <Row
              icon="activity"
              label={t(lang, "settings.activity")}
              note={t(lang, "settings.inApp")}
            />
            <Row
              icon="places"
              label={t(lang, "settings.places")}
              note={t(lang, "settings.inApp")}
            />
          </nav>
        </Card>
      ) : null}

      <Card title={t(lang, "settings.aboutSection")}>
        <nav className="flex flex-col">
          <Row
            href={`/${lang}/support`}
            icon="support"
            label={t(lang, "nav.support")}
          />
          <Row
            href={`/${lang}/terms`}
            icon="terms"
            label={t(lang, "nav.terms")}
          />
          <Row
            href={`/${lang}/privacy`}
            icon="privacy"
            label={t(lang, "nav.privacy")}
          />
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
  options: { id: string; label: string; icon?: IconName }[];
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
          className={`flex flex-col items-center justify-center gap-1 rounded-[0.5rem] px-2 py-2.5 text-[13px] font-semibold transition sm:text-[14px] ${
            value === o.id
              ? "bg-brand text-brand-ink shadow-card"
              : "text-muted hover:text-ink"
          }`}
        >
          {o.icon ? <Icon name={o.icon} className="size-[18px]" /> : null}
          {/* `text-center` and `leading-tight`: "E'londagidek" and
              "Сначала дешевые" wrap on a narrow phone, and a wrapped label
              must not push the icon off-centre. */}
          <span className="text-center leading-tight">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

function Row({
  href,
  icon,
  label,
  danger = false,
  note,
}: {
  /** Absent means there is nowhere to go — see `note`. */
  href?: string;
  icon: IconName;
  label: string;
  danger?: boolean;
  /** Shown in place of the chevron. Marks a row that is app-only. */
  note?: string;
}) {
  const body = (
    <>
      <span
        className={`grid size-8 shrink-0 place-items-center rounded-control ${
          danger ? "bg-danger/10 text-danger" : "bg-brand-soft text-brand"
        }`}
      >
        <Icon name={icon} className="size-[18px]" />
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {note ? (
        <span className="shrink-0 rounded-full bg-muted-bg px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-faint">
          {note}
        </span>
      ) : (
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
      )}
    </>
  );

  const shared =
    "flex items-center gap-3 border-b border-line py-2.5 text-[15px] last:border-0";

  // No href: a <p>, not a disabled <a>. A link that goes nowhere is still
  // focusable, still announced as a link, and still disappointing to press.
  if (!href) {
    return <p className={`${shared} text-muted`}>{body}</p>;
  }

  return (
    <Link
      href={href}
      className={`${shared} transition hover:text-brand ${
        danger ? "text-danger" : "text-ink"
      }`}
    >
      {body}
    </Link>
  );
}
