import type { Lang } from "../config";
import { fill, type Entry, type TParams } from "./runtime";

/**
 * Identity verification — the `verify.` strings, and only those.
 *
 * Split out of `dictionary.ts` so they travel in the chunk of the screens
 * that use them instead of in the one every page downloads. See
 * `./wallet.ts` for the reasoning in full; the keys keep their `verify.`
 * prefix so nothing had to be renamed.
 */
const VERIFY = {
  /* ── Applying for the badge ──────────────────────────────────────────
     Word for word from the app (mobile/app/verify-profile.tsx and its
     locales): the same three photographs go to the same moderators, so a
     person who started on the phone and finished here must not be told two
     different things about what is wanted or what happens next. */
  "verify.title": { uz: "Profilni tasdiqlash", ru: "Подтверждение профиля" },
  "verify.heading": {
    uz: "Shaxsingizni tasdiqlaymiz",
    ru: "Подтвердим вашу личность",
  },
  "verify.intro": {
    uz: "Ko'k belgi e'lonlaringiz va hikoyalaringiz yonida turadi. U xaridorga bitta narsani aytadi: ro'yxatdan o'tgan odam bilan gaplashyapsiz.",
    ru: "Синий значок стоит рядом с вашими объявлениями и историями. Он говорит покупателю одно: перед ним реальный человек.",
  },
  "verify.passportFront": {
    uz: "Pasportning asosiy sahifasi",
    ru: "Главная страница паспорта",
  },
  "verify.passportBack": {
    uz: "Pasportning orqa sahifasi",
    ru: "Оборотная страница паспорта",
  },
  "verify.selfie": {
    uz: "Pasport bilan birga selfi",
    ru: "Селфи вместе с паспортом",
  },
  "verify.ruleLight": {
    uz: "Hujjat to'liq kadrga sig'sin, raqamlari o'qilsin",
    ru: "Документ целиком в кадре, цифры читаются",
  },
  "verify.ruleFace": {
    uz: "Selfida yuzingiz ham, hujjat ham aniq ko'rinsin",
    ru: "На селфи видно и лицо, и документ",
  },
  "verify.ruleBlurry": {
    uz: "Xira, qorong'i yoki qirqilgan rasm qaytariladi",
    ru: "Размытые, тёмные и обрезанные фото вернём",
  },
  "verify.privacy": {
    uz: "Hujjatlaringizni faqat moderatorlar ko'radi, boshqa foydalanuvchilarga hech qachon ko'rsatilmaydi",
    ru: "Ваши документы видят только модераторы и никогда — другие пользователи",
  },
  "verify.timeline": {
    uz: "Odatda 1-3 ish kunida javob beramiz",
    ru: "Обычно отвечаем за 1–3 рабочих дня",
  },
  "verify.submit": { uz: "Tekshiruvga yuborish", ru: "Отправить на проверку" },
  "verify.sentAt": { uz: "Yuborilgan:", ru: "Отправлено:" },
  "verify.pendingTitle": { uz: "Tekshiruvda", ru: "На проверке" },
  "verify.pendingBody": {
    uz: "Moderator hujjatlaringizni ko'rib chiqmoqda. Javob shu yerda va Yordam markazida paydo bo'ladi.",
    ru: "Модератор смотрит ваши документы. Ответ появится здесь и в Поддержке.",
  },
  "verify.verifiedTitle": {
    uz: "Shaxsingiz tasdiqlandi",
    ru: "Личность подтверждена",
  },
  "verify.verifiedBody": {
    uz: "Ismingiz yonida endi ko'k belgi turadi — e'lonlaringiz va hikoyalaringizda ham ko'rinadi.",
    ru: "Рядом с именем теперь синий значок — он виден и в объявлениях, и в историях.",
  },
  "verify.rejectedTitle": { uz: "Ariza qaytarildi", ru: "Заявка возвращена" },
  "verify.rejectedBody": {
    uz: "Moderator hujjatlarni qabul qilmadi.",
    ru: "Модератор не принял документы.",
  },
  "verify.tryAgain": { uz: "Qaytadan yuborish", ru: "Отправить заново" },
  /* Web-only: the app opens a photo library, a browser opens a file
     dialog, and the picker is the one part of this that cannot be the
     app's. */
  "verify.pick": { uz: "Rasm tanlash", ru: "Выбрать фото" },
  "verify.replace": { uz: "Almashtirish", ru: "Заменить" },
  "verify.tooBig": {
    uz: "Rasm 10 MB dan katta bo'lmasin",
    ru: "Фото должно быть не больше 10 МБ",
  },
  "verify.needPhone": {
    uz: "Avval telefon raqamingizni tasdiqlang — pasport shunga solishtiriladi.",
    ru: "Сначала подтвердите номер телефона — паспорт сверяется с ним.",
  },
  "verify.badge": { uz: "Tasdiqlangan", ru: "Подтверждён" },
} as const satisfies Record<string, Entry>;

export type VerifyKey = keyof typeof VERIFY;

/** `t`, for this namespace. Same signature, same `{{placeholder}}` rules. */
export function tVerify(lang: Lang, key: VerifyKey, params?: TParams): string {
  return fill(VERIFY[key][lang], params);
}
