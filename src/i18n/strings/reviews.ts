import type { Lang } from "../config";
import { fill, type Entry, type TParams } from "./runtime";

/**
 * Seller reviews — the `reviews.` strings, and only those.
 *
 * Split out of `dictionary.ts` so they travel in the chunk of the screens
 * that use them instead of in the one every page downloads. See
 * `./wallet.ts` for the reasoning in full; the keys keep their `reviews.`
 * prefix so nothing had to be renamed.
 */
const REVIEWS = {
  "reviews.title": { uz: "Sharhlar", ru: "Отзывы" },
  "reviews.count": { uz: "{{count}} ta sharh", ru: "{{count}} отзывов" },
  "reviews.you": { uz: "Siz", ru: "Вы" },
  "reviews.edited": { uz: "tahrirlangan", ru: "изменён" },
  "reviews.write": { uz: "Sharh qoldirish", ru: "Оставить отзыв" },
  "reviews.editMine": { uz: "Sharhimni tahrirlash", ru: "Изменить мой отзыв" },
  "reviews.writeSubtitle": {
    uz: "Bahoyingiz boshqalarga tanlashda yordam beradi",
    ru: "Ваша оценка поможет другим с выбором",
  },
  "reviews.tapToRate": {
    uz: "Baholash uchun yulduzcha bosing",
    ru: "Нажмите на звёзды, чтобы оценить",
  },
  "reviews.commentPlaceholder": {
    uz: "Nima yoqdi yoki yoqmadi? (ixtiyoriy)",
    ru: "Что понравилось или нет? (необязательно)",
  },
  "reviews.submit": { uz: "Yuborish", ru: "Отправить" },
  "reviews.saveEdit": { uz: "Saqlash", ru: "Сохранить" },
  "reviews.deleteTitle": { uz: "Sharh o'chirilsinmi?", ru: "Удалить отзыв?" },
  "reviews.deleteMessage": {
    uz: "Sharhingiz va bahoyingiz olib tashlanadi.",
    ru: "Ваш отзыв и оценка будут удалены.",
  },
  "reviews.emptyTitle": { uz: "Hali sharhlar yo'q", ru: "Отзывов пока нет" },
  "reviews.emptyHint": {
    uz: "Birinchi bo'lib fikringizni qoldiring.",
    ru: "Оставьте первый отзыв.",
  },
  "reviews.emptyOwner": {
    uz: "E'loningiz haqida sharhlar shu yerda ko'rinadi.",
    ru: "Отзывы о вашем объявлении появятся здесь.",
  },
  "reviews.barLabel": {
    uz: "{{star}} yulduz: {{count}} ta",
    ru: "{{star}} звёзд: {{count}}",
  },
  "reviews.ownListing": {
    uz: "O'z e'loningizni baholay olmaysiz",
    ru: "Нельзя оценивать собственное объявление",
  },
} as const satisfies Record<string, Entry>;

export type ReviewsKey = keyof typeof REVIEWS;

/** `t`, for this namespace. Same signature, same `{{placeholder}}` rules. */
export function tReviews(
  lang: Lang,
  key: ReviewsKey,
  params?: TParams,
): string {
  return fill(REVIEWS[key][lang], params);
}
