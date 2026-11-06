import type { Lang } from "../config";
import { fill, type Entry, type TParams } from "./runtime";

/**
 * Deleting your account — the `deleteAccount.` strings, and only those.
 *
 * Split out of `dictionary.ts` so they travel in the chunk of the screens
 * that use them instead of in the one every page downloads. See
 * `./wallet.ts` for the reasoning in full; the keys keep their `deleteAccount.`
 * prefix so nothing had to be renamed.
 */
const DELETE_ACCOUNT = {
  /* ── Deleting your account ───────────────────────────────────────────
     A PAGE, not a dialog, and the app's reasoning holds here: both stores
     require the path to exist and be reachable without support, and a
     two-line confirm cannot say which records survive and which do not.
     Strings are the app's own (mobile/app/delete-account.tsx). */
  "deleteAccount.title": { uz: "Akkauntni o'chirish", ru: "Удаление аккаунта" },
  "deleteAccount.intro": {
    uz: "Bu amalni ortga qaytarib bo'lmaydi. O'chirilgan ma'lumotlar tiklanmaydi.",
    ru: "Это действие необратимо. Удалённые данные восстановить невозможно.",
  },
  "deleteAccount.balanceWarning": {
    uz: "Hamyoningizda {{balance}} bor. Akkaunt o'chirilgandan keyin bu mablag' qaytarilmaydi — avval sarflashni tavsiya qilamiz.",
    ru: "На вашем кошельке {{balance}}. После удаления аккаунта эти средства не возвращаются — рекомендуем сначала их израсходовать.",
  },
  "deleteAccount.removedTitle": { uz: "Nima o'chiriladi", ru: "Что удаляется" },
  "deleteAccount.goesProfile": {
    uz: "Ismingiz, rasmingiz va profilingizdagi barcha ma'lumotlar",
    ru: "Ваше имя, фотография и все данные профиля",
  },
  "deleteAccount.goesListings": {
    uz: "Barcha e'lonlaringiz — ular xaritadan va qidiruvdan yo'qoladi",
    ru: "Все ваши объявления — они исчезнут с карты и из поиска",
  },
  "deleteAccount.goesVideos": {
    uz: "Yuklagan videolaringiz",
    ru: "Загруженные вами видео",
  },
  "deleteAccount.goesContacts": {
    uz: "Telefon raqamingiz va Telegram bog'lanishi",
    ru: "Номер телефона и привязка к Telegram",
  },
  "deleteAccount.goesPush": {
    uz: "Bildirishnomalar uchun qurilma ro'yxati",
    ru: "Список устройств для уведомлений",
  },
  "deleteAccount.keptTitle": {
    uz: "Nima saqlanib qoladi",
    ru: "Что сохраняется",
  },
  "deleteAccount.staysMessages": {
    uz: "Yozishmalaringiz suhbatdoshingizda qoladi, lekin sizning ismingiz ko'rinmaydi",
    ru: "Переписка останется у собеседника, но ваше имя в ней отображаться не будет",
  },
  "deleteAccount.staysPayments": {
    uz: "To'lov yozuvlari — qonun talabiga ko'ra, shaxsingizga bog'lanmagan holda",
    ru: "Записи о платежах — по требованию закона, без привязки к вашей личности",
  },
  "deleteAccount.reasonTitle": {
    uz: "Sabab (ixtiyoriy)",
    ru: "Причина (необязательно)",
  },
  "deleteAccount.reasonPlaceholder": {
    uz: "Nima uchun ketyapsiz? Bu bizga yordam beradi.",
    ru: "Почему вы уходите? Это поможет нам стать лучше.",
  },
  "deleteAccount.action": { uz: "Akkauntni o'chirish", ru: "Удалить аккаунт" },
  "deleteAccount.confirmTitle": {
    uz: "Akkaunt o'chirilsinmi?",
    ru: "Удалить аккаунт?",
  },
  "deleteAccount.confirmMessage": {
    uz: "Bu amalni ortga qaytarib bo'lmaydi. Akkauntingiz va e'lonlaringiz darhol o'chiriladi.",
    ru: "Это действие необратимо. Ваш аккаунт и объявления будут удалены немедленно.",
  },
  "deleteAccount.footnote": {
    uz: "Savollar bo'lsa: +998 95 555 52 29 yoki agromind5229@gmail.com",
    ru: "Вопросы: +998 95 555 52 29 или agromind5229@gmail.com",
  },
  /* The published policy, which is a different thing from the button: one
     explains the process to anybody (a store reviewer included), the other
     performs it for the person signed in. */
  "deleteAccount.policy": {
    uz: "O'chirish qoidalari",
    ru: "Правила удаления",
  },
} as const satisfies Record<string, Entry>;

export type DeleteAccountKey = keyof typeof DELETE_ACCOUNT;

/** `t`, for this namespace. Same signature, same `{{placeholder}}` rules. */
export function tDeleteAccount(
  lang: Lang,
  key: DeleteAccountKey,
  params?: TParams,
): string {
  return fill(DELETE_ACCOUNT[key][lang], params);
}
