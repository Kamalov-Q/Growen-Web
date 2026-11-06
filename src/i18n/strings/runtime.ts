import type { Lang } from "../config";

/**
 * The two lines every namespace module shares.
 *
 * It exists so that `dictionary.ts` and each namespace can interpolate the
 * same way without importing each other — which is the entire point of
 * splitting them. Keep it this small: anything added here lands in every
 * chunk that holds any strings at all.
 */

/** One translated string, in every language the site has. */
export type Entry = Record<Lang, string>;

export type TParams = Record<string, string | number>;

/**
 * `{{name}}` interpolation, the same placeholder syntax the mobile app
 * uses, so a string can be copied between the two without rewriting it. An
 * unknown placeholder is left verbatim rather than blanked — a visible
 * `{{count}}` is a bug report; an empty gap is a mystery.
 */
export function fill(template: string, params?: TParams): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}
