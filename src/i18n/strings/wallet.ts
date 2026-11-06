import type { Lang } from "../config";
import { fill, type Entry, type TParams } from "./runtime";

/**
 * The wallet's words — balance, top-up, the ledger, every provider screen.
 *
 * ── Why this is its own module ────────────────────────────────────────────
 *
 * It used to live in `dictionary.ts` with everything else, and that one
 * module is imported by 57 client components, so the bundler had no choice
 * but to put all 544 strings — in BOTH languages — into the chunk every
 * page downloads. The home page references 49 of them. Wallet alone is the
 * largest namespace in the file: 83 keys, 16% of it, and it is needed on
 * four routes out of thirty.
 *
 * Moved out, it rides in the chunk group of the components that actually
 * use it. The keys keep their `wallet.` prefix so nothing has to be renamed
 * and a grep for a string still finds its one definition; only the function
 * that reads them changes, from `t` to `tw`.
 */
const WALLET = {
  "wallet.title": { uz: "Hamyon", ru: "Кошелёк" },
  "wallet.lead": {
    uz: "Balans va to'lovlar tarixi. To'ldirish mobil ilovada.",
    ru: "Баланс и история платежей. Пополнение — в мобильном приложении.",
  },
  "wallet.balance": { uz: "Balans", ru: "Баланс" },
  /* The card's own words, taken from the app so the plate reads the same in
     both places — see src/features/account/VirtualCard.tsx. */
  /* ── Topping up, as the app's wallet screen has it ───────────────────
     The screen is the app's; the PAYMENT is not here yet, which the notice
     at the foot says in so many words rather than by a button that does
     nothing. */
  "wallet.topupTitle": { uz: "Balansni to'ldirish", ru: "Пополнение баланса" },
  "wallet.historyTitle": { uz: "To'lov tarixi", ru: "История платежей" },
  "wallet.enterAmount": { uz: "Summani kiriting", ru: "Введите сумму" },
  "wallet.paymentMethods": { uz: "To'lov usullari", ru: "Способы оплаты" },
  "wallet.paymeSubtitle": {
    uz: "Uzcard va Humo orqali tezkor to'lov",
    ru: "Оплата через Uzcard и Humo",
  },
  "wallet.clickSubtitle": {
    uz: "Barcha bank kartalari bilan to'lash",
    ru: "Оплата любыми банковскими картами",
  },
  "wallet.paynetSubtitle": {
    uz: "Naqd pul va terminallar orqali",
    ru: "Наличными и через терминалы",
  },
  "wallet.badgeInstant": { uz: "Tezkor", ru: "Мгновенно" },
  "wallet.badgeZeroFee": { uz: "0% komissiya", ru: "0% комиссия" },
  "wallet.badgeCash": { uz: "Naqd pul", ru: "Наличные" },
  "wallet.noHistory": {
    uz: "Sizda hali to'lov tarixi yo'q",
    ru: "У вас пока нет истории платежей",
  },
  "wallet.accountNo": { uz: "Hisob raqami", ru: "Номер счёта" },
  /* Paying, and coming back from it. The app's words (its wallet locale). */
  "wallet.pay": { uz: "To'lash", ru: "Оплатить" },
  "wallet.paymentCancelled": {
    uz: "To'lov bekor qilindi",
    ru: "Платёж отменён",
  },
  "wallet.resultChecking": {
    uz: "To'lov tekshirilmoqda…",
    ru: "Проверяем платёж…",
  },
  "wallet.resultCheckingBody": {
    uz: "To'lov tizimi tasdiqlashini kutyapmiz. Bu odatda bir necha soniya oladi.",
    ru: "Ждём подтверждения от платёжной системы. Обычно это занимает несколько секунд.",
  },
  "wallet.resultPaid": { uz: "To'lov qabul qilindi", ru: "Платёж получен" },
  "wallet.resultPaidBody": {
    uz: "{{amount}} UZS balansingizga qo'shildi.",
    ru: "{{amount}} UZS зачислено на ваш баланс.",
  },
  "wallet.resultPaidBodyNoAmount": {
    uz: "Mablag' balansingizga qo'shildi.",
    ru: "Средства зачислены на ваш баланс.",
  },
  "wallet.resultCancelledBody": {
    uz: "Hisobingizdan pul yechilmadi. Qaytadan urinib ko'rishingiz mumkin.",
    ru: "Деньги не были списаны. Вы можете попробовать ещё раз.",
  },
  "wallet.resultPending": {
    uz: "To'lov hali tasdiqlanmadi",
    ru: "Платёж ещё не подтверждён",
  },
  "wallet.resultPendingBody": {
    uz: "Agar to'lagan bo'lsangiz, mablag' tez orada balansga tushadi — holatini to'lov tarixida ko'ring.",
    ru: "Если вы оплатили, средства скоро поступят на баланс — статус можно посмотреть в истории платежей.",
  },
  "wallet.resultBackToWallet": {
    uz: "Hamyonga qaytish",
    ru: "Вернуться в кошелёк",
  },
  "wallet.needPhone": {
    uz: "To'lov uchun avval telefon raqamingizni tasdiqlang.",
    ru: "Для оплаты сначала подтвердите номер телефона.",
  },
  /* Paynet is push-model — the payer types an account number into a
     terminal — and the web has not built that walk-through yet, so the row
     stays visible and says so rather than being quietly dropped. */
  /* Paynet has no checkout to come back from, so the page says what will
     happen instead of pretending to wait for it. */
  "wallet.paynetOpened": {
    uz: "Paynet ochildi",
    ru: "Paynet открыт",
  },
  "wallet.paynetOpenedHint": {
    uz: "To'lovni Paynetda yakunlang. Mablag' tasdiqlangach balansga tushadi — darhol emas.",
    ru: "Завершите оплату в Paynet. Средства поступят на баланс после подтверждения — не мгновенно.",
  },
  "wallet.paynetAccountHint": {
    uz: "Terminalda shu hisob raqamini kiriting",
    ru: "В терминале введите этот номер счёта",
  },
  "wallet.soon": { uz: "Tez orada", ru: "Скоро" },
  /* The ledger, and one line of it in full — the app's transaction detail
     screen, field for field. */
  "wallet.transactions": { uz: "Tranzaksiyalar", ru: "История транзакций" },
  "wallet.txDetailsTitle": {
    uz: "Operatsiya tafsilotlari",
    ru: "Детали операции",
  },
  "wallet.txLoadError": {
    uz: "To'lov ma'lumotlarini yuklab bo'lmadi",
    ru: "Не удалось загрузить данные платежа",
  },
  "wallet.sectionOperation": { uz: "Operatsiya", ru: "Операция" },
  "wallet.sectionPayment": { uz: "To'lov", ru: "Платёж" },
  "wallet.statusPaid": { uz: "To'langan", ru: "Оплачено" },
  "wallet.statusPending": { uz: "Kutilmoqda", ru: "В обработке" },
  "wallet.statusCancelled": { uz: "Bekor qilingan", ru: "Отменено" },
  "wallet.statusCompleted": { uz: "Bajarildi", ru: "Выполнено" },
  "wallet.fieldType": { uz: "Turi", ru: "Тип" },
  "wallet.fieldDate": { uz: "Sana va vaqt", ru: "Дата и время" },
  "wallet.fieldAmount": { uz: "Summa", ru: "Сумма" },
  "wallet.fieldBonus": { uz: "Bonus", ru: "Бонус" },
  "wallet.fieldBalanceAfter": {
    uz: "Operatsiyadan keyingi balans",
    ru: "Баланс после операции",
  },
  "wallet.fieldNote": { uz: "Izoh", ru: "Комментарий" },
  "wallet.fieldProvider": { uz: "To'lov tizimi", ru: "Платёжная система" },
  "wallet.fieldStatus": { uz: "Holati", ru: "Статус" },
  "wallet.fieldOrderNo": { uz: "Buyurtma raqami", ru: "Номер заказа" },
  "wallet.fieldProviderTxn": {
    uz: "To'lov tizimidagi ID",
    ru: "ID в платёжной системе",
  },
  "wallet.fieldPaymentId": { uz: "To'lov ID", ru: "ID платежа" },
  "wallet.fieldTransactionId": { uz: "Operatsiya ID", ru: "ID операции" },
  "wallet.fieldCreatedAt": { uz: "Yaratilgan", ru: "Создан" },
  "wallet.fieldPaidAt": { uz: "To'langan vaqti", ru: "Оплачен" },
  "wallet.fieldCancelledAt": { uz: "Bekor qilingan vaqti", ru: "Отменён" },
  "wallet.fieldCancelReason": {
    uz: "Bekor qilish sababi",
    ru: "Причина отмены",
  },
  "wallet.fieldReceipt": { uz: "Fiskal chek", ru: "Фискальный чек" },
  "wallet.receiptSent": { uz: "Yuborilgan", ru: "Отправлен" },
  "wallet.receiptPending": { uz: "Yuborilmoqda", ru: "Отправляется" },
  "wallet.receiptByProvider": {
    uz: "To'lov tizimi yuboradi",
    ru: "Отправляет платёжная система",
  },
  "wallet.receiptFailed": { uz: "Xatolik", ru: "Ошибка" },
  "wallet.receiptNone": { uz: "Yo'q", ru: "Нет" },
  "wallet.copy": { uz: "Nusxalash", ru: "Копировать" },
  "wallet.openListing": { uz: "E'lonni ochish", ru: "Открыть объявление" },
  /* Web-only: a phone has nowhere to put a file, a browser does. The whole
     ledger as a spreadsheet — which is what somebody reconciling an
     accounting entry actually wants. */
  "wallet.download": { uz: "Yuklab olish (CSV)", ru: "Скачать (CSV)" },
  "wallet.downloading": { uz: "Tayyorlanmoqda…", ru: "Готовим…" },
  "wallet.loadMore": { uz: "Yana {{n}} ta", ru: "Ещё {{n}}" },
  "wallet.refresh": { uz: "Yangilash", ru: "Обновить" },
  "wallet.topupTx": { uz: "Hisobni to'ldirish", ru: "Пополнение баланса" },
  "wallet.bonusTx": { uz: "To'ldirish bonusi", ru: "Бонус за пополнение" },
  "wallet.listingPostTx": {
    uz: "E'lon joylashtirish",
    ru: "Публикация объявления",
  },
  "wallet.listingPromoteTx": {
    uz: "E'lonni ko'tarish",
    ru: "Продвижение объявления",
  },
  "wallet.videoPostTx": { uz: "Video joylashtirish", ru: "Публикация видео" },
  "wallet.refundTx": { uz: "Mablag'ni qaytarish", ru: "Возврат средств" },
  "wallet.adminAdjustTx": {
    uz: "Admin tomonidan o'zgartirish",
    ru: "Корректировка администратора",
  },
  "wallet.balanceAfter": {
    uz: "Qoldiq: {{amount}}",
    ru: "Остаток: {{amount}}",
  },
  "wallet.currentBalance": { uz: "Joriy balans", ru: "Текущий баланс" },
  "wallet.currentBalanceUsd": {
    uz: "Joriy balans (USD)",
    ru: "Текущий баланс (USD)",
  },
  "wallet.toUsd": { uz: "USD ga", ru: "В USD" },
  "wallet.toUzs": { uz: "UZS ga", ru: "В UZS" },
  "wallet.topup": { uz: "To'ldirish", ru: "Пополнить" },
  "wallet.flipHint": {
    uz: "Bosib almashtiring (USD / UZS)",
    ru: "Нажмите для переключения (USD / UZS)",
  },
  "wallet.history": { uz: "Tarix", ru: "История" },
} as const satisfies Record<string, Entry>;

export type WalletKey = keyof typeof WALLET;

/** `t`, for this namespace. Same signature, same `{{placeholder}}` rules. */
export function tw(lang: Lang, key: WalletKey, params?: TParams): string {
  return fill(WALLET[key][lang], params);
}
