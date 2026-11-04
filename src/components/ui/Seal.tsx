import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";

/**
 * The verified seal, and the two pills that sit under a name.
 *
 * A port of the app's VerifiedBadge / MembershipBadge pair, including the
 * reason they are two things rather than one:
 *
 *   the SEAL    earned by sending a passport, both sides, and a selfie
 *               holding it, reviewed by a person. A claim about identity.
 *   the PILL    earned by filling in the optional half of a profile.
 *               A claim about completeness, nothing more.
 *
 * The seal outranks the pill, so where both apply the seal sits beside the
 * name and the membership pill is skipped. Nothing here ever says
 * "tasdiqlangan" about a filled-in form; that word belongs to the document
 * check.
 */

/**
 * A scalloped disc: `lobes` rounded petals around the circle.
 *
 * Drawn rather than taken from an icon set because no set ships it, and
 * because a plain circle beside a name reads as a status dot, a bullet or a
 * close button depending on what else is on the row. Each petal is one
 * quadratic curve from the valley before it to the valley after, bulging
 * through a control point outside the disc — a quadratic only reaches about
 * halfway to its control, so the control sits further out than the crest.
 *
 * Computed once at module load: the geometry never changes, and the string
 * is identical on the server and in the browser, so it hydrates clean.
 */
function buildSeal(lobes: number, crest: number, valley: number): string {
  const cx = 12;
  const cy = 12;
  const step = (Math.PI * 2) / lobes;
  const control = valley + (crest - valley) * 2.1;

  const at = (radius: number, angle: number) => [
    (cx + radius * Math.cos(angle)).toFixed(2),
    (cy + radius * Math.sin(angle)).toFixed(2),
  ];

  const [sx, sy] = at(valley, -Math.PI / 2);
  const parts = [`M${sx} ${sy}`];

  for (let i = 0; i < lobes; i++) {
    const start = -Math.PI / 2 + i * step;
    const [qx, qy] = at(control, start + step / 2);
    const [x, y] = at(valley, start + step);
    parts.push(`Q${qx} ${qy} ${x} ${y}`);
  }

  return `${parts.join(" ")} Z`;
}

// Twelve lobes, cut deep: at the size this sits beside a name, a shallow
// scallop just reads as a slightly wobbly circle.
const SEAL = buildSeal(12, 11.7, 8.7);

export function VerifiedSeal({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={`shrink-0 text-brand ${className}`}
    >
      <path d={SEAL} fill="currentColor" />
      <path
        d="M7.7 12.3 10.6 15.1l5.8-6.1"
        stroke="#FFFFFF"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/**
 * The seal with its name beside it.
 *
 * The bare seal is right in a list, where it has one line to work in. On a
 * profile there is room to say what it MEANS — a silhouette everybody
 * half-recognises from other apps is weaker than two words, and this one
 * was earned with a passport.
 */
export function VerifiedPill({ lang }: { lang: Lang }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft py-1 pl-1.5 pr-2.5 text-[13px] font-bold text-brand ring-1 ring-brand-line">
      <VerifiedSeal className="size-[18px]" />
      {t(lang, "verify.badge")}
    </span>
  );
}

/**
 * Member, or guest.
 *
 * A member reads as brand; a guest reads as neutral and says so quietly.
 * Guests are not being told off — most accounts start here, and the pill is
 * what makes the difference legible enough to be worth closing.
 */
export function MembershipPill({
  lang,
  member,
}: {
  lang: Lang;
  member: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-bold ring-1 ${
        member
          ? "bg-brand-soft text-brand ring-brand-line"
          : "bg-raised text-muted ring-line"
      }`}
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="size-[14px]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {member ? (
          <>
            <circle cx="12" cy="8.5" r="4.8" />
            <path d="m8.6 12.6-2 8 5.4-3 5.4 3-2-8" />
          </>
        ) : (
          <>
            <circle cx="12" cy="8.3" r="3.7" />
            <path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" />
          </>
        )}
      </svg>
      {t(lang, member ? "membership.member" : "membership.guest")}
    </span>
  );
}
