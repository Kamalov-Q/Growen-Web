/**
 * The accounts a profile can advertise.
 *
 * A port of mobile/src/features/users/lib/social.ts — same six platforms in
 * the same order, same canonicalisation, same colours. Ported rather than
 * invented because the two clients read the SAME stored values: a handle
 * saved in the app as `growen.uz` has to open the same page here, including
 * the shapes people typed before handles were canonicalised (`@name`, a
 * full link, a link with the scheme rubbed off).
 */
export const SOCIAL_PLATFORMS = [
  "tiktok",
  "instagram",
  "facebook",
  "x",
  "threads",
  "whatsapp",
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];
export type SocialLinks = Partial<Record<SocialPlatform, string>>;

/** Each platform's own colour. Black marks follow the text colour instead. */
export const SOCIAL_COLORS = {
  tiktok: "#000000",
  instagram: "#E1306C",
  facebook: "#1877F2",
  x: "#000000",
  threads: "#000000",
  whatsapp: "#25D366",
} as const satisfies Record<SocialPlatform, string>;

/** What the field asks for, so nobody has to guess whether to paste a URL. */
export const SOCIAL_PLACEHOLDERS = {
  tiktok: "@username",
  instagram: "@username",
  facebook: "username",
  x: "@username",
  threads: "@username",
  whatsapp: "+998901234567",
} as const satisfies Record<SocialPlatform, string>;

const BASE = {
  tiktok: "https://tiktok.com/@",
  instagram: "https://instagram.com/",
  facebook: "https://facebook.com/",
  x: "https://x.com/",
  threads: "https://threads.net/@",
  whatsapp: "https://wa.me/",
} as const satisfies Record<SocialPlatform, string>;

/** The hosts each platform is known by, for recognising a pasted link. */
const HOSTS = {
  tiktok: /^(www\.)?tiktok\.com$/i,
  instagram: /^(www\.)?instagram\.com$/i,
  facebook: /^(www\.)?(facebook\.com|fb\.com|fb\.me)$/i,
  x: /^(www\.)?(x\.com|twitter\.com)$/i,
  threads: /^(www\.)?(threads\.net|threads\.com)$/i,
  whatsapp: /^(www\.|api\.)?(wa\.me|whatsapp\.com)$/i,
} as const satisfies Record<SocialPlatform, RegExp>;

const UZ_DIALING_CODE = "998";
const UZ_LOCAL_DIGITS = 9;

/** One account, written the one way: no @, no host, no query. */
export function normalizeSocial(platform: SocialPlatform, raw: string): string {
  let value = raw.trim();
  if (!value) return "";

  const asUrl = /^(?:https?:\/\/)?([a-z0-9.-]+\.[a-z]{2,})\/(.*)$/i.exec(value);
  if (asUrl && HOSTS[platform].test(asUrl[1] ?? "")) {
    // wa.me puts the number in the path, api.whatsapp.com in the query.
    const phone = /[?&]phone=(\d+)/i.exec(value);
    value = phone?.[1] ?? asUrl[2] ?? "";
  }

  value = (value.split(/[?#]/)[0] ?? "").replace(/\/+$/, "");

  if (platform === "whatsapp") {
    const digits = value.replace(/\D/g, "");
    // A bare local number is unreachable without the country code.
    return digits.length === UZ_LOCAL_DIGITS
      ? `${UZ_DIALING_CODE}${digits}`
      : digits;
  }

  return value.replace(/^@+/, "");
}

/** The URL to open for one entry, or null when there is nothing to open. */
export function socialUrl(
  platform: SocialPlatform,
  value: string,
): string | null {
  const handle = normalizeSocial(platform, value);
  if (!handle) return null;
  return `${BASE[platform]}${handle}`;
}
