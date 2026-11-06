import type { Lang } from "../config";
import { fill, type Entry, type TParams } from "./runtime";

/**
 * Price offers — the `bids.` strings, and only those.
 *
 * Split out of `dictionary.ts` so they travel in the chunk of the screens
 * that use them instead of in the one every page downloads. See
 * `./wallet.ts` for the reasoning in full; the keys keep their `bids.`
 * prefix so nothing had to be renamed.
 */
const BIDS = {
  "bids.myTitle": { uz: "Narx takliflari", ru: "Предложения цены" },
  "bids.myHint": {
    uz: "Siz yuborgan va sizga kelgan takliflar",
    ru: "Ваши предложения и предложения вам",
  },
  "bids.myEmpty": { uz: "Hali taklif yo'q", ru: "Предложений пока нет" },
  "bids.myEmptyHint": {
    uz: "E'londa «Narx taklif qilish» tugmasini bosib savdoni boshlang.",
    ru: "Откройте объявление и нажмите «Предложить цену», чтобы начать торг.",
  },
  "bids.rowYou": { uz: "Siz taklif qildingiz", ru: "Ваше предложение" },
  "bids.rowThem": { uz: "Sizga taklif qilindi", ru: "Предложение вам" },
  "bids.statusPending": { uz: "Kutilmoqda", ru: "Ожидает ответа" },
  "bids.statusAccepted": { uz: "Qabul qilindi", ru: "Принято" },
  "bids.statusDeclined": { uz: "Rad etildi", ru: "Отклонено" },
  "bids.statusCountered": {
    uz: "Qarshi taklif berildi",
    ru: "Отправлено встречное",
  },
  "bids.statusWithdrawn": { uz: "Qaytarib olindi", ru: "Отозвано" },
  "bids.statusExpired": { uz: "Muddati tugadi", ru: "Срок истёк" },
} as const satisfies Record<string, Entry>;

export type BidsKey = keyof typeof BIDS;

/** `t`, for this namespace. Same signature, same `{{placeholder}}` rules. */
export function tBids(lang: Lang, key: BidsKey, params?: TParams): string {
  return fill(BIDS[key][lang], params);
}
