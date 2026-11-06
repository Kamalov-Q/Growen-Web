import type { Lang } from "../config";
import { fill, type Entry, type TParams } from "./runtime";

/**
 * Signed-in devices — the `sessions.` strings, and only those.
 *
 * Split out of `dictionary.ts` so they travel in the chunk of the screens
 * that use them instead of in the one every page downloads. See
 * `./wallet.ts` for the reasoning in full; the keys keep their `sessions.`
 * prefix so nothing had to be renamed.
 */
const SESSIONS = {
  // ---- sessions
  "sessions.title": { uz: "Faol seanslar", ru: "Активные сеансы" },
  "sessions.lead": {
    uz: "Hisobingizga kirilgan qurilmalar. Notanish qurilmani ko'rsangiz, uni yakunlang.",
    ru: "Устройства, с которых выполнен вход. Если видите незнакомое — завершите сеанс.",
  },
  "sessions.thisDevice": { uz: "Shu qurilma", ru: "Это устройство" },
  "sessions.otherDevice": { uz: "Boshqa qurilma", ru: "Другое устройство" },
  "sessions.lastSeen": {
    uz: "Oxirgi faollik: {{when}}",
    ru: "Последняя активность: {{when}}",
  },
  "sessions.end": { uz: "Yakunlash", ru: "Завершить" },
  "sessions.current": { uz: "Shu qurilma", ru: "Это устройство" },
  "sessions.started": { uz: "Kirilgan: {{when}}", ru: "Вход: {{when}}" },
  "sessions.active": {
    uz: "{{n}} ta faol seans",
    ru: "Активных сеансов: {{n}}",
  },
  "sessions.empty": { uz: "Faol seanslar yo'q", ru: "Нет активных сеансов" },
  "sessions.endOthersTitle": {
    uz: "Boshqa qurilmalardan chiqilsinmi?",
    ru: "Выйти на других устройствах?",
  },
  "sessions.endOthersBody": {
    uz: "Shu qurilmadan tashqari barcha seanslar yakunlanadi. Qaytadan kirish uchun SMS kod kerak bo'ladi.",
    ru: "Все сеансы, кроме текущего, будут завершены. Для входа снова понадобится SMS-код.",
  },
  "sessions.endOthers": {
    uz: "Boshqa barcha qurilmalardan chiqish",
    ru: "Выйти на всех других устройствах",
  },
} as const satisfies Record<string, Entry>;

export type SessionsKey = keyof typeof SESSIONS;

/** `t`, for this namespace. Same signature, same `{{placeholder}}` rules. */
export function tSessions(
  lang: Lang,
  key: SessionsKey,
  params?: TParams,
): string {
  return fill(SESSIONS[key][lang], params);
}
