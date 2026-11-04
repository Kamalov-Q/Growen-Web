import Image from "next/image";
import { resolveMediaUrl } from "@/src/lib/media";

/**
 * One circular avatar for every place a person appears.
 *
 * The header, the profile and the seller block each drew their own, and
 * each got the fallback wrong in its own way: the first two took the first
 * character of `name || phoneNumber`, so every account without a name
 * showed a "+" (the start of +998…) — which in a circle reads as an "add"
 * button — and the third showed a literal "?" and never rendered the photo
 * it had.
 *
 * The ladder here is the app's (mobile/src/components/ui/Avatar.tsx):
 * photo, else initials from the NAME, else a person glyph. A phone number
 * is never a source of initials; a digit or a plus sign says nothing about
 * who somebody is.
 *
 * A server component — no state, nothing to hydrate — so the seller block
 * on a statically rendered listing can use it too.
 */
export function Avatar({
  uri,
  name,
  size = 40,
  /** The circle's own colours. The default suits the chrome. */
  className = "bg-brand-soft text-brand",
}: {
  uri: string | null | undefined;
  name: string | null | undefined;
  size?: number;
  className?: string;
}) {
  const src = resolveMediaUrl(uri);
  // At most two letters: three initials in a 40px circle is a smudge.
  const initials = (name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full font-bold ${className}`}
      // Inline, not a Tailwind size utility: the size is a prop, and a class
      // name assembled at runtime is not in the source for Tailwind to find
      // at build time — `size-[104px]` would simply not exist in the CSS.
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.34),
      }}
    >
      {src ? (
        <Image
          src={src}
          alt=""
          width={size}
          height={size}
          // Already an avatar-sized file from the CDN; Next would generate
          // larger variants from a small source, which is an upscale and a
          // metered optimization for no gain.
          unoptimized
          className="size-full object-cover"
        />
      ) : initials ? (
        initials
      ) : (
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          style={{ width: Math.round(size * 0.56), height: Math.round(size * 0.56) }}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="8.3" r="3.7" />
          <path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" />
        </svg>
      )}
    </span>
  );
}
