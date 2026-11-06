import type { Lang } from "../config";
import { fill, type Entry, type TParams } from "./runtime";

/**
 * Listing comments — the `comments.` strings, and only those.
 *
 * Split out of `dictionary.ts` so they travel in the chunk of the screens
 * that use them instead of in the one every page downloads. See
 * `./wallet.ts` for the reasoning in full; the keys keep their `comments.`
 * prefix so nothing had to be renamed.
 */
const COMMENTS = {
  "comments.title": { uz: "Izohlar", ru: "Комментарии" },
  "comments.placeholder": {
    uz: "Izoh yozing…",
    ru: "Напишите комментарий…",
  },
  "comments.send": { uz: "Yuborish", ru: "Отправить" },
  "comments.reply": { uz: "Javob berish", ru: "Ответить" },
  "comments.replyingTo": {
    uz: "{{name}} ga javob",
    ru: "Ответ {{name}}",
  },
  "comments.edited": { uz: "tahrirlangan", ru: "изменён" },
  "comments.like": { uz: "Yoqdi", ru: "Нравится" },
  "comments.showReplies": {
    uz: "Yana {{count}} ta javob",
    ru: "Ещё {{count}} ответов",
  },
  "comments.edit": { uz: "Tahrirlash", ru: "Изменить" },
  "comments.save": { uz: "Saqlash", ru: "Сохранить" },
  "comments.deleteTitle": {
    uz: "Izoh o'chirilsinmi?",
    ru: "Удалить комментарий?",
  },
  "comments.deleteMessage": {
    uz: "Izohingiz olib tashlanadi.",
    ru: "Ваш комментарий будет удалён.",
  },
  "comments.deleteThreadMessage": {
    uz: "Izoh va unga berilgan javoblar o'chiriladi.",
    ru: "Комментарий и ответы на него будут удалены.",
  },
  "comments.emptyTitle": {
    uz: "Hali izohlar yo'q",
    ru: "Комментариев пока нет",
  },
  "comments.emptyHint": {
    uz: "Birinchi bo'lib savol bering yoki fikr bildiring.",
    ru: "Задайте первый вопрос или оставьте мнение.",
  },
  "comments.signInToPost": {
    uz: "Izoh qoldirish uchun kiring",
    ru: "Войдите, чтобы комментировать",
  },
} as const satisfies Record<string, Entry>;

export type CommentsKey = keyof typeof COMMENTS;

/** `t`, for this namespace. Same signature, same `{{placeholder}}` rules. */
export function tComments(
  lang: Lang,
  key: CommentsKey,
  params?: TParams,
): string {
  return fill(COMMENTS[key][lang], params);
}
