import type { Lang } from "../config";
import { fill, type Entry, type TParams } from "./runtime";

/**
 * Notifications — the `notifications.` strings, and only those.
 *
 * Split out of `dictionary.ts` so they travel in the chunk of the screens
 * that use them instead of in the one every page downloads. See
 * `./wallet.ts` for the reasoning in full; the keys keep their `notifications.`
 * prefix so nothing had to be renamed.
 */
const NOTIFICATIONS = {
  "notifications.title": { uz: "Bildirishnomalar", ru: "Уведомления" },
  "notifications.empty": {
    uz: "Hozircha bildirishnoma yo'q",
    ru: "Уведомлений пока нет",
  },
  "notifications.emptyHint": {
    uz: "Yangiliklar va javoblar shu yerda ko'rinadi.",
    ru: "Новости и ответы появятся здесь.",
  },
  "notifications.videoReady": {
    uz: "Videongiz joylashtirildi",
    ru: "Ваше видео опубликовано",
  },
  "notifications.videoFailed": {
    uz: "Video joylashtirilmadi",
    ru: "Видео не опубликовано",
  },
  "notifications.videoAwaitingPayment": {
    uz: "Video to'lov kutmoqda",
    ru: "Видео ожидает оплаты",
  },
  "notifications.videoLike": {
    uz: "videongizni yoqtirdi",
    ru: "оценил ваше видео",
  },
  "notifications.videoComment": {
    uz: "videongizga izoh qoldirdi",
    ru: "прокомментировал ваше видео",
  },
  "notifications.commentReply": {
    uz: "izohingizga javob berdi",
    ru: "ответил на ваш комментарий",
  },
  "notifications.newFollower": {
    uz: "sizga obuna bo'ldi",
    ru: "подписался на вас",
  },
  "notifications.followedUserPosted": {
    uz: "yangi video joyladi",
    ru: "опубликовал новое видео",
  },
  "notifications.listingComment": {
    uz: "e'loningizga izoh qoldirdi",
    ru: "оставил комментарий к вашему объявлению",
  },
  "notifications.listingCommentReply": {
    uz: "izohingizga javob berdi",
    ru: "ответил на ваш комментарий",
  },
  "notifications.listingReview": {
    uz: "e'loningizni baholadi",
    ru: "оценил ваше объявление",
  },
  "notifications.priceBidReceived": {
    uz: "e'loningizga narx taklif qildi",
    ru: "предложил цену за ваше объявление",
  },
  "notifications.priceBidCountered": {
    uz: "qarshi taklif yubordi",
    ru: "отправил встречное предложение",
  },
  "notifications.priceBidAccepted": {
    uz: "narx taklifingizni qabul qildi",
    ru: "принял ваше предложение цены",
  },
  "notifications.priceBidDeclined": {
    uz: "narx taklifingizni rad etdi",
    ru: "отклонил ваше предложение цены",
  },
  "notifications.priceBidExpired": {
    uz: "Narx taklifingiz muddati tugadi",
    ru: "Срок вашего предложения цены истёк",
  },
  "notifications.chatMessage": {
    uz: "sizga xabar yubordi",
    ru: "отправил вам сообщение",
  },
  "notifications.topupSucceeded": {
    uz: "Hisobingiz to'ldirildi",
    ru: "Баланс пополнен",
  },
  "notifications.topupFailed": {
    uz: "To'lov amalga oshmadi",
    ru: "Платёж не прошёл",
  },
  "notifications.tariffPaid": {
    uz: "Tarif uchun to'lov qabul qilindi",
    ru: "Оплата тарифа принята",
  },
  "notifications.tariffExpiring": {
    uz: "Tarifingiz tugayapti",
    ru: "Срок тарифа заканчивается",
  },
} as const satisfies Record<string, Entry>;

export type NotificationsKey = keyof typeof NOTIFICATIONS;

/** `t`, for this namespace. Same signature, same `{{placeholder}}` rules. */
export function tNotifications(
  lang: Lang,
  key: NotificationsKey,
  params?: TParams,
): string {
  return fill(NOTIFICATIONS[key][lang], params);
}
