import type { Lang } from "../config";
import { fill, type Entry, type TParams } from "./runtime";

/**
 * Posting a listing — the `create.` strings, and only those.
 *
 * Split out of `dictionary.ts` so they travel in the chunk of the screens
 * that use them instead of in the one every page downloads. See
 * `./wallet.ts` for the reasoning in full; the keys keep their `create.`
 * prefix so nothing had to be renamed.
 */
const CREATE = {
  "create.modePin": { uz: "Nuqta", ru: "Точка" },
  "create.modePolygon": { uz: "Chegara", ru: "Контур" },
  "create.pinSet": {
    uz: "Nuqta belgilandi — surib ko'chiring",
    ru: "Точка поставлена — перетащите",
  },
  "create.drawHint": {
    uz: "Chegarani chizish uchun xaritaga kamida 3 marta bosing",
    ru: "Нажмите на карту минимум 3 раза, чтобы обвести контур",
  },
  "create.drawDone": {
    uz: "{{n}} nuqta — surib tuzating",
    ru: "{{n}} точек — перетащите, чтобы поправить",
  },
  "create.undo": { uz: "Oxirgisi", ru: "Отменить" },
  "create.clear": { uz: "Tozalash", ru: "Очистить" },
  "create.measured": { uz: "Taxminan {{n}} m²", ru: "Примерно {{n}} м²" },
  "create.needShape": {
    uz: "Xaritada joyni belgilang",
    ru: "Отметьте расположение на карте",
  },
  "create.needRing": {
    uz: "Chegara kamida 3 nuqtadan iborat bo'lishi kerak",
    ru: "Контур должен состоять минимум из 3 точек",
  },
  "create.sellerType": { uz: "Kim joylamoqda", ru: "Кто размещает" },
  "create.buildingType": { uz: "Bino turi", ru: "Тип здания" },
  "create.repairType": { uz: "Ta'mir", ru: "Ремонт" },
  "create.properties": { uz: "Qulayliklar", ru: "Удобства" },
  "create.areaHint": {
    uz: "Chegaradan o'lchandi — o'zgartirishingiz mumkin",
    ru: "Измерено по контуру — можно изменить",
  },
  "create.phPrice": { uz: "Masalan, 65 000", ru: "Например, 65 000" },
  "create.phTitle": {
    uz: "3 xonali kvartira, Chilonzor",
    ru: "3-комнатная квартира, Чиланзар",
  },
  "create.phAddress": { uz: "Tuman, ko'cha, uy", ru: "Район, улица, дом" },
  "create.phArea": { uz: "Masalan, 80", ru: "Например, 80" },
  "create.phRooms": { uz: "Masalan, 3", ru: "Например, 3" },
  "create.phFloor": { uz: "Masalan, 4", ru: "Например, 4" },
  "create.phTotalFloors": { uz: "Masalan, 9", ru: "Например, 9" },
  "create.phDescription": {
    uz: "Uy haqida qisqacha: holati, infratuzilma, nima yaqin…",
    ru: "Коротко об объекте: состояние, инфраструктура, что рядом…",
  },
  "create.phPhone": { uz: "90 123 45 67", ru: "90 123 45 67" },
  "create.hasFloors": { uz: "Qavatlari bor", ru: "Есть этажность" },
  "create.noFloors": { uz: "Qavatlari yo'q", ru: "Без этажности" },
  "create.floorsQuestion": { uz: "Qavatlar", ru: "Этажность" },
  "create.cost": { uz: "Narxi", ru: "Стоимость" },
  "create.free": { uz: "Bepul", ru: "Бесплатно" },
  "create.firstFreeHint": {
    uz: "Birinchi e'loningiz bepul — balansdan hech narsa yechilmaydi",
    ru: "Первое объявление бесплатно — с баланса ничего не спишется",
  },
  "create.balance": { uz: "Balansingiz", ru: "Ваш баланс" },
  // Veb'da to'ldirish yo'q (WalletPanel'ga qarang), shuning uchun bu yerda
  // tugma emas — qayerda to'ldirish mumkinligi aytiladi.
  "create.notEnough": {
    uz: "Balans yetarli emas — mobil ilovada to'ldiring",
    ru: "Недостаточно средств — пополните в мобильном приложении",
  },
  "create.title": { uz: "Yangi e'lon", ru: "Новое объявление" },
  "create.lead": {
    uz: "Asosiy ma'lumotlarni to'ldiring — keyin tahrirlashingiz mumkin.",
    ru: "Заполните основное — потом можно отредактировать.",
  },
  "create.basics": { uz: "Asosiy", ru: "Основное" },
  "create.photos": { uz: "Rasmlar", ru: "Фотографии" },
  "create.location": { uz: "Joylashuv", ru: "Расположение" },
  "create.details": { uz: "Qo'shimcha", ru: "Дополнительно" },
  "create.contact": { uz: "Aloqa", ru: "Контакты" },
  "create.pickPoint": {
    uz: "Joyni belgilash uchun xaritaga bosing",
    ru: "Нажмите на карту, чтобы отметить место",
  },
  "create.addPhotos": { uz: "Rasm qo'shish", ru: "Добавить фото" },
  "create.photoHint": {
    uz: "Birinchi rasm asosiy bo'ladi. 10 tagacha.",
    ru: "Первое фото станет главным. До 10 штук.",
  },
  "create.remove": { uz: "O'chirish", ru: "Удалить" },
  "create.titleField": { uz: "Sarlavha", ru: "Заголовок" },
  "create.description": { uz: "Tavsif", ru: "Описание" },
  "create.price": { uz: "Narx", ru: "Цена" },
  "create.rooms": { uz: "Xonalar", ru: "Комнаты" },
  "create.area": { uz: "Maydon, m²", ru: "Площадь, м²" },
  "create.floor": { uz: "Qavat", ru: "Этаж" },
  "create.totalFloors": { uz: "Jami qavat", ru: "Этажей всего" },
  "create.address": { uz: "Manzil", ru: "Адрес" },
  "create.phone": { uz: "Aloqa telefoni", ru: "Контактный телефон" },
  "create.submit": { uz: "E'lonni joylash", ru: "Разместить объявление" },
  "create.submitting": { uz: "Joylanmoqda…", ru: "Размещаем…" },
  "create.needCategory": { uz: "Turini tanlang", ru: "Выберите тип" },
  "create.needPrice": { uz: "Narxni kiriting", ru: "Укажите цену" },
  "create.failed": {
    uz: "E'lonni joylab bo'lmadi. Qayta urinib ko'ring.",
    ru: "Не удалось разместить объявление. Попробуйте ещё раз.",
  },
  "create.uploadFailed": {
    uz: "Ba'zi rasmlar yuklanmadi",
    ru: "Некоторые фото не загрузились",
  },
  "create.uploading": { uz: "Rasmlar yuklanmoqda…", ru: "Загрузка фото…" },
} as const satisfies Record<string, Entry>;

export type CreateKey = keyof typeof CREATE;

/** `t`, for this namespace. Same signature, same `{{placeholder}}` rules. */
export function tCreate(lang: Lang, key: CreateKey, params?: TParams): string {
  return fill(CREATE[key][lang], params);
}
