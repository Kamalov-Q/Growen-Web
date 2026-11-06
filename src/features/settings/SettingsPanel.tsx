"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Lang } from "@/src/i18n/config";
import { LANGS } from "@/src/i18n/config";
import { t, type UiKey } from "@/src/i18n/dictionary";
import { tDeleteAccount } from "@/src/i18n/strings/deleteAccount";
import { tSessions } from "@/src/i18n/strings/sessions";
import { tVerify } from "@/src/i18n/strings/verify";
import { useSession } from "@/src/features/auth/session";
import { useTheme, type ThemeChoice } from "@/src/features/theme/theme";
import { Icon, type IconName } from "@/src/components/ui/Icon";
import { APP_VERSION } from "@/src/lib/site";
import { usePrefs, type Currency } from "./prefs";

const LANG_LABEL: Record<Lang, string> = { uz: "O'zbekcha", ru: "Русский" };

/**
 * `ssr: false`, for two separate reasons: MapLibre touches `window` at
 * import time so it cannot server-render at all, and it is the largest
 * dependency on the site — a settings page that only ever changes a theme
 * should not pay for it. The placeholder is the height of the ask-first
 * row, so nothing jumps when the real card arrives.
 */
const LocationCard = dynamic(
  () => import("./LocationCard").then((m) => m.LocationCard),
  {
    ssr: false,
    loading: () => (
      <div className="h-11 animate-pulse rounded-control bg-muted-bg" />
    ),
  },
);

/**
 * The settings screen, section for section as the app has it.
 *
 * ── The order is the app's, and it is not arbitrary ───────────────────────
 *
 * mobile/app/settings.tsx opens with the things you came here to DO —
 * verification, activity, support, the devices you are signed in on — and
 * keeps the preferences (appearance, language, currency) below them, because
 * people open settings with a problem far more often than with a wish to
 * change the theme. The two screens now read in the same order, so somebody
 * who uses both is not hunting for the same row in a different place.
 *
 * ── Why lists and not segmented buttons ───────────────────────────────────
 *
 * The three preferences used to be rows of equal buttons. The app presents
 * them as `OptionList`: a full-width row each, icon on the left, a tick on
 * the chosen one. That is better here too, and not only for consistency — a
 * segmented control makes every option compete for one strip of width, so
 * "E'londagidek" had to shrink and wrap to fit beside "USD $", and the
 * selection was carried by colour alone. A list gives each option a whole
 * line and marks the chosen one in a way that survives greyscale.
 *
 * ── The app's rows that web has not built ─────────────────────────────────
 *
 * Verification, activity and saved places are listed rather than hidden,
 * with their icon and a plain "in the app". Hiding them was the earlier
 * choice and it was the wrong one: somebody who uses both finds rows missing
 * and cannot tell whether the feature was removed, whether the web forgot
 * it, or whether they are looking in the wrong place. They are signposts,
 * not disabled controls — `Row` renders them as text, never as a link that
 * goes nowhere.
 */
export function SettingsPanel({ lang }: { lang: Lang }) {
  const { choice, setChoice } = useTheme();
  const { currency, setCurrency, rate, rateUpdatedAt } = usePrefs();
  const { user } = useSession();
  const path = usePathname() ?? `/${lang}`;
  // Everything after the language segment, so switching language stays here.
  const rest = path.replace(/^\/[a-z]{2}/, "") || "";
  const locale = lang === "ru" ? "ru-RU" : "uz-UZ";

  // The same glyphs the app uses for these rows, so the two screens read as
  // one product. See mobile/app/settings.tsx.
  const themes: { id: ThemeChoice; key: UiKey; icon: IconName }[] = [
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
        <p className="max-w-2xl text-[15px] leading-7 text-muted">
          {t(lang, "settings.lead")}
        </p>
      </header>

      {/* ── What you came here to do ─────────────────────────────────────
          Signed out there is nothing in this half: every row here needs an
          account, and offering them to a visitor who has none is three
          detours to the same login page. */}
      {user ? (
        <>
          {/* First, as in the app: the badge is the thing on this screen
              that changes how other people see you, and it is why most
              people open settings from a profile at all. */}
          <Card>
            {/* A real page now, not a signpost: the three photographs go to
                the same endpoint the app posts to, and the same moderators
                read them. See features/verification. */}
            <Row
              href={`/${lang}/verify`}
              icon="verify"
              label={tVerify(lang, "verify.title")}
              hint={t(lang, "settings.verificationHint")}
            />
            {/* A real page now, like verification: the same `/me/...`
                endpoints the app reads, so a comment written on the phone
                is the same row here. See features/activity. */}
            <Row
              href={`/${lang}/activity`}
              icon="activity"
              label={t(lang, "activity.title")}
              hint={t(lang, "settings.activityHint")}
            />
            {/* Saved places are not in the app either — see the note on
                settings.soon. */}
            <Row
              icon="places"
              label={t(lang, "settings.places")}
              hint={t(lang, "settings.placesHint")}
              note={t(lang, "settings.soon")}
              tone="soon"
            />
          </Card>

          {/* Straight after, as in the app: when somebody opens settings
              with a problem, this is what they were looking for. */}
          <Card>
            <Row
              href={`/${lang}/support`}
              icon="support"
              label={t(lang, "nav.support")}
              hint={t(lang, "settings.supportHint")}
            />
            <Row
              href={`/${lang}/account/sessions`}
              icon="sessions"
              label={tSessions(lang, "sessions.title")}
              hint={t(lang, "settings.sessionsHint")}
            />
          </Card>

          <Card title={t(lang, "settings.account")}>
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
          </Card>
        </>
      ) : (
        <Card title={t(lang, "settings.account")}>
          <Row
            href={`/${lang}/login`}
            icon="person"
            label={t(lang, "auth.signIn")}
          />
        </Card>
      )}

      {/* Where the app puts it: after the account rows and before the
          preferences. It asks before it locates — see LocationCard. */}
      <Card title={t(lang, "location.title")}>
        <LocationCard lang={lang} />
      </Card>

      {/* ── How the site behaves ─────────────────────────────────────────
          Below the account rows, exactly as in the app. */}
      <Card title={t(lang, "settings.appearance")}>
        <Options
          options={themes.map((x) => ({
            id: x.id,
            label: t(lang, x.key),
            icon: x.icon,
          }))}
          value={choice}
          onChange={(v) => setChoice(v as ThemeChoice)}
        />
      </Card>

      <Card title={t(lang, "settings.language")}>
        <div className="flex flex-col">
          {LANGS.map((code, index) => (
            /* A plain <a>, like LangMenu's — `[lang]` belongs to the root
               layout, and a client navigation across it drops the theme
               attribute off <html> and repaints mid-rebuild. A document
               load runs theme-init.js before the first paint instead. */
            <a
              key={code}
              href={`/${code}${rest}`}
              hrefLang={code}
              aria-current={code === lang ? "true" : undefined}
              className={`flex items-center gap-3 px-1 py-3 text-[15px] transition hover:text-brand ${
                index === 0 ? "" : "border-t border-line"
              } ${code === lang ? "font-semibold text-ink" : "text-ink-soft"}`}
            >
              <Icon
                name="language"
                className={`size-[18px] ${
                  code === lang ? "text-brand" : "text-muted"
                }`}
              />
              <span className="min-w-0 flex-1 truncate">
                {LANG_LABEL[code]}
              </span>
              {code === lang ? <Tick /> : null}
            </a>
          ))}
        </div>
      </Card>

      <Card
        title={t(lang, "settings.currency")}
        note={
          /* The rate every converted price on screen is computed from. The
             site silently rewrites prices — a listing quoted in so'm is
             shown in dollars to anybody set to USD — and a converted price
             with no provenance is a number the reader cannot argue with. */
          currency !== "AUTO" && rate
            ? t(lang, "settings.rateLine", {
                rate: Math.round(rate).toLocaleString(locale),
                date: rateUpdatedAt
                  ? new Date(rateUpdatedAt).toLocaleDateString(locale)
                  : "",
              })
            : t(lang, "settings.currencyAutoNote")
        }
      >
        <Options
          options={currencies}
          value={currency}
          onChange={(v) => setCurrency(v as Currency)}
        />
      </Card>

      {/* ── The documents, and the way out ──────────────────────────────── */}
      <Card title={t(lang, "nav.legal")}>
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
        {/* The published POLICY — what is deleted, how long it takes, who
            to write to. A document, which is why it sits with the other
            two; the button that performs it is below. */}
        <Row
          href={`/${lang}/account-deletion`}
          icon="terms"
          label={t(lang, "nav.deletion")}
        />
      </Card>

      {/* Last, as in the app. Apple requires the path to account deletion
          to be reachable from inside the product, and settings is the first
          place a reviewer looks for it. */}
      <Card>
        <Row
          href={`/${lang}/account/delete`}
          icon="trash"
          label={tDeleteAccount(lang, "deleteAccount.action")}
          hint={t(lang, "settings.deletionHint")}
          danger
        />
      </Card>

      {/* The app signs off with its version; this is the web's, plus the
          one thing that is true here and not there — these preferences
          belong to this browser, so they do not follow you to the phone. */}
      <div className="flex flex-col gap-1 text-center text-[13px] text-faint">
        <p>{t(lang, "settings.version", { version: APP_VERSION })}</p>
        <p>{t(lang, "settings.browserNote")}</p>
      </div>
    </div>
  );
}

function Card({
  title,
  note,
  children,
}: {
  /** Omitted where the rows say what they are — the app does the same for
   *  its single-row sections. */
  title?: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-card bg-surface p-5 shadow-card ring-1 ring-line">
      {title ? (
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted">
          {title}
        </h2>
      ) : null}
      <div className="flex flex-col">{children}</div>
      {note ? <p className="text-[13px] leading-5 text-faint">{note}</p> : null}
    </section>
  );
}

function Tick() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-[18px] shrink-0 text-brand"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

/**
 * One choice per line, with a tick on the chosen one — the app's
 * `OptionList`.
 *
 * `radiogroup`, not a row of buttons: these ARE radios, and saying so is
 * what gives a keyboard and a screen reader the behaviour they expect.
 */
function Options({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string; icon?: IconName }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div role="radiogroup" className="flex flex-col">
      {options.map((o, index) => {
        const selected = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.id)}
            className={`flex items-center gap-3 px-1 py-3 text-start text-[15px] transition hover:text-brand ${
              index === 0 ? "" : "border-t border-line"
            } ${selected ? "font-semibold text-ink" : "text-ink-soft"}`}
          >
            {o.icon ? (
              <Icon
                name={o.icon}
                className={`size-[18px] ${
                  selected ? "text-brand" : "text-muted"
                }`}
              />
            ) : null}
            <span className="min-w-0 flex-1 truncate">{o.label}</span>
            {selected ? <Tick /> : null}
          </button>
        );
      })}
    </div>
  );
}

function Row({
  href,
  icon,
  label,
  hint,
  danger = false,
  note,
  tone = "muted",
}: {
  /** Absent means there is nowhere to go — see `note`. */
  href?: string;
  icon: IconName;
  label: string;
  /** The second line: what the row is for, or where you stand. */
  hint?: string;
  danger?: boolean;
  /** Shown in place of the chevron. Marks a row that leads nowhere yet. */
  note?: string;
  /**
   * How to read that chip. "muted" is "it lives in the app"; "soon" is
   * "nobody has it yet", and it carries the emblem's gold so the two are
   * not one grey badge saying two different things.
   */
  tone?: "muted" | "soon";
}) {
  const body = (
    <>
      <span
        className={`grid size-9 shrink-0 place-items-center rounded-control ${
          danger ? "bg-danger/10 text-danger" : "bg-brand-soft text-brand"
        }`}
      >
        <Icon name={icon} className="size-[18px]" />
      </span>

      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-semibold">{label}</span>
        {hint ? (
          <span className="text-[13px] font-normal leading-5 text-muted">
            {hint}
          </span>
        ) : null}
      </span>

      {note ? (
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
            tone === "soon"
              ? "bg-gold/15 text-gold ring-1 ring-gold/30"
              : "bg-muted-bg text-faint"
          }`}
        >
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
    "flex items-center gap-3 border-b border-line py-3 text-[15px] last:border-0";

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
