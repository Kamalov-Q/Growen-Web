import type { Lang } from "./config";

/**
 * The handful of words the CHROME needs — navigation, labels, the footer.
 *
 * Deliberately tiny and deliberately not a library. The documents carry
 * their own prose (see src/content); this is only what wraps them. Keyed by
 * a dotted string with a union type, so a missing key is a compile error
 * rather than a blank space on the page.
 */
const UI = {
  "settings.title": { uz: "Sozlamalar", ru: "Настройки" },
  /* The page is no longer only preferences — it opens with the account
     rows, as the app's does — so the lead no longer describes three
     settings. What IS only true of the browser is said at the foot of the
     page, where it belongs: see settings.browserNote. */
  "settings.lead": {
    uz: "Hisobingiz, ko'rinish va hujjatlar — barchasi shu yerda.",
    ru: "Аккаунт, оформление и документы — всё в одном месте.",
  },
  "settings.appearance": { uz: "Ko'rinish", ru: "Оформление" },
  "settings.themeSystem": { uz: "Tizim", ru: "Система" },
  "settings.themeLight": { uz: "Kunduzgi", ru: "Светлая" },
  "settings.themeDark": { uz: "Tungi", ru: "Тёмная" },
  "settings.currency": { uz: "Valyuta", ru: "Валюта" },
  "settings.currencyAuto": { uz: "E'londagidek", ru: "Как в объявлении" },
  "settings.currencyAutoNote": {
    uz: "Har bir e'lon sotuvchi kiritgan valyutada ko'rsatiladi.",
    ru: "Каждое объявление показывается в валюте продавца.",
  },
  "settings.rateLine": {
    uz: "Kurs: 1 $ = {{rate}} so'm · {{date}}",
    ru: "Курс: 1 $ = {{rate}} сум · {{date}}",
  },
  "settings.language": { uz: "Til", ru: "Язык" },
  "settings.account": { uz: "Hisob", ru: "Аккаунт" },
  "settings.aboutSection": { uz: "Ma'lumot", ru: "Информация" },
  "mine.title": { uz: "E'lonlarim", ru: "Мои объявления" },
  "mine.lead": {
    uz: "Siz joylagan e'lonlar — faol, arxivlangan va sotilganlar.",
    ru: "Ваши объявления — активные, архивные и проданные.",
  },
  "mine.empty": { uz: "Hali e'lon joylamagansiz", ru: "Вы ещё не разместили объявлений" },
  "saved.add": { uz: "Saqlash", ru: "Сохранить" },
  "saved.remove": { uz: "Saqlanganlardan olib tashlash", ru: "Убрать из избранного" },
  "saved.title": { uz: "Saqlanganlar", ru: "Избранное" },
  "saved.lead": {
    uz: "Yoqtirgan e'lonlaringiz shu yerda to'planadi.",
    ru: "Здесь собираются объявления, которые вы сохранили.",
  },
  "saved.empty": { uz: "Saqlangan e'lonlar yo'q", ru: "Нет сохранённых объявлений" },
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
  /* Said plainly, where the app's pay button is. The web does not take
     money yet, and a button that looks like it does is worse than a
     sentence that says where to go. */
  "wallet.payInApp": {
    uz: "To'ldirish hozircha mobil ilovada",
    ru: "Пополнение пока доступно в мобильном приложении",
  },
  "wallet.payInAppHint": {
    uz: "Summani va usulni shu yerda tanlab, to'lovni ilovada yakunlang — hisob raqamingiz o'sha-o'sha.",
    ru: "Выберите сумму и способ здесь, а оплату завершите в приложении — номер счёта тот же.",
  },
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
  "wallet.soon": { uz: "Tez orada", ru: "Скоро" },
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
  "wallet.balanceAfter": { uz: "Qoldiq: {{amount}}", ru: "Остаток: {{amount}}" },
  "validation.range": {
    uz: "{{min}} dan {{max}} gacha bo'lsin",
    ru: "Должно быть от {{min}} до {{max}}",
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
  "wallet.empty": { uz: "Amaliyotlar yo'q", ru: "Операций нет" },
  "profile.linkMine": { uz: "E'lonlarim", ru: "Мои объявления" },
  "profile.linkSaved": { uz: "Saqlanganlar", ru: "Избранное" },
  "profile.linkWallet": { uz: "Hamyon", ru: "Кошелёк" },
  "profile.statListings": { uz: "E'lonlar", ru: "Объявления" },
  "profile.statActive": { uz: "Faol", ru: "Активные" },
  "profile.statSaved": { uz: "Saqlangan", ru: "Избранное" },
  "profile.title": { uz: "Profil", ru: "Профиль" },
  "profile.lead": {
    uz: "Hisobingiz ma'lumotlari va e'lonlaringiz.",
    ru: "Данные аккаунта и ваши объявления.",
  },
  "profile.verified": { uz: "Tasdiqlangan rieltor", ru: "Проверенный риелтор" },
  "profile.noName": { uz: "Ism kiritilmagan", ru: "Имя не указано" },
  "profile.phone": { uz: "Telefon", ru: "Телефон" },
  /* The app's wording, with the month spelled out by the formatter — "since
     March 2024" says what "2024-03-11" makes the reader work out. */
  "profile.memberSince": { uz: "{{date}} dan beri", ru: "На сайте с {{date}}" },
  "profile.linkAdd": { uz: "Yangi e'lon joylash", ru: "Разместить объявление" },
  /* Two badges, and they must not be confused: the SEAL is a passport
     check, this pill is a filled-in form. See components/ui/Seal.tsx. */
  /* ── The edit form, and the prompt that leads to it ─────────────────
     Every string here is the app's own (mobile/src/i18n/locales), because
     the two forms ask for the same things and a person who filled one in
     should recognise the other. */
  "profile.edit": { uz: "Profilni tahrirlash", ru: "Редактировать профиль" },
  "profile.editLead": {
    uz: "Bu ma'lumotlar profilingizda va e'lonlaringiz yonida ko'rinadi.",
    ru: "Эти данные видны в вашем профиле и рядом с объявлениями.",
  },
  "profile.changePhoto": { uz: "Rasm tanlash", ru: "Выбрать фото" },
  "profile.removePhoto": { uz: "Rasmni o'chirish", ru: "Удалить фото" },
  "profile.removePhotoConfirm": {
    uz: "Profil rasmini o'chirmoqchimisiz?",
    ru: "Удалить фото профиля?",
  },
  "profile.photoTooBig": {
    uz: "Rasm 5 MB dan katta bo'lmasin",
    ru: "Фото должно быть не больше 5 МБ",
  },
  "profile.contactHint": {
    uz: "Raqam SMS-kod bilan tasdiqlangan va bu yerda o'zgartirilmaydi.",
    ru: "Номер подтверждён SMS-кодом и здесь не редактируется.",
  },
  "auth.surname": { uz: "Familiya", ru: "Фамилия" },
  "auth.namePlaceholder": { uz: "Ismingiz", ru: "Ваше имя" },
  "auth.surnamePlaceholder": { uz: "Familiyangiz", ru: "Ваша фамилия" },
  "profileInfo.birthDate": { uz: "Tug'ilgan sana", ru: "Дата рождения" },
  "profileInfo.birthDatePlaceholder": {
    uz: "KK.OO.YYYY",
    ru: "ДД.ММ.ГГГГ",
  },
  "profileInfo.birthDateInvalid": {
    uz: "Sanani KK.OO.YYYY ko'rinishida kiriting",
    ru: "Введите дату в формате ДД.ММ.ГГГГ",
  },
  "profileInfo.ageRange": {
    uz: "Yosh {{min}} va {{max}} orasida bo'lsin",
    ru: "Возраст должен быть от {{min}} до {{max}}",
  },
  "profileInfo.gender": { uz: "Jins", ru: "Пол" },
  "profileInfo.genderMale": { uz: "Erkak", ru: "Мужской" },
  "profileInfo.genderFemale": { uz: "Ayol", ru: "Женский" },
  "profileInfo.bio": { uz: "O'zingiz haqingizda", ru: "О себе" },
  "profileInfo.bioPlaceholder": {
    uz: "Bir-ikki gap — nima bilan shug'ullanasiz, qaysi hududda ishlaysiz",
    ru: "Пара фраз — чем занимаетесь, в каком районе работаете",
  },
  "profileInfo.socials": { uz: "Ijtimoiy tarmoqlar", ru: "Социальные сети" },
  "profileInfo.socialsHint": {
    uz: "Foydalanuvchi nomi yoki to'liq havola",
    ru: "Имя пользователя или полная ссылка",
  },
  "profileInfo.privacy": {
    uz: "Yosh, jins va manzilni boshqa foydalanuvchilar ko'rmaydi",
    ru: "Возраст, пол и адрес не видны другим пользователям",
  },
  "validation.minChars": {
    uz: "Kamida {{count}} ta belgi",
    ru: "Минимум {{count}} символа",
  },
  "validation.maxChars": {
    uz: "Ko'pi bilan {{count}} ta belgi",
    ru: "Максимум {{count}} символов",
  },
  "common.save": { uz: "Saqlash", ru: "Сохранить" },
  "common.delete": { uz: "O'chirish", ru: "Удалить" },
  /* The standing invitation on a profile that is still mostly empty. It is
     "incomplete", never "unverified": the seal is a passport check and must
     not share language with a form anybody can fill in. */
  "completeProfile.bannerTitle": {
    uz: "Profilingiz to'liq emas",
    ru: "Профиль заполнен не полностью",
  },
  "completeProfile.bannerText": {
    uz: "Ma'lumotlarni to'ldiring — GrowenCity a'zosi bo'ling",
    ru: "Заполните данные — станьте участником GrowenCity",
  },
  "completeProfile.bannerMissing": {
    uz: "Qolgani: {{fields}}",
    ru: "Осталось: {{fields}}",
  },
  "completeProfile.fieldSurname": { uz: "familiya", ru: "фамилия" },
  "completeProfile.fieldGender": { uz: "jins", ru: "пол" },
  "completeProfile.fieldBirthDate": {
    uz: "tug'ilgan sana",
    ru: "дата рождения",
  },
  "completeProfile.fieldBio": { uz: "o'zingiz haqingizda", ru: "о себе" },
  "membership.member": { uz: "GrowenCity a'zosi", ru: "Участник GrowenCity" },
  "membership.guest": { uz: "Mehmon", ru: "Гость" },
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
  "verify.sent": { uz: "Arizangiz qabul qilindi", ru: "Заявка принята" },
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
  "profile.links": { uz: "Bo'limlar", ru: "Разделы" },
  "profile.onlyInApp": {
    uz: "E'lonlarim, saqlanganlar va hamyon hozircha mobil ilovada.",
    ru: "Мои объявления, избранное и кошелёк пока в мобильном приложении.",
  },
  "nav.settings": { uz: "Sozlamalar", ru: "Настройки" },
  "theme.switch": { uz: "Mavzuni almashtirish", ru: "Сменить тему" },
  "theme.toDark": { uz: "Tungi rejim", ru: "Тёмная тема" },
  "theme.toLight": { uz: "Kunduzgi rejim", ru: "Светлая тема" },
  "view.grid": { uz: "Katak", ru: "Плитка" },
  "view.list": { uz: "Ro'yxat", ru: "Список" },
  "map.searchPlaceholder": { uz: "Tuman, bekat yoki manzil", ru: "Район, станция или адрес" },
  "map.searchEmpty": { uz: "Hech narsa topilmadi", ru: "Ничего не найдено" },
  "map.searchFailed": { uz: "Qidiruv ishlamadi", ru: "Поиск не удался" },
  /* The settings card — the app's words (mobile locale `location`). */
  "location.title": { uz: "Joylashuv", ru: "Местоположение" },
  "location.myLocation": {
    uz: "Mening joylashuvim",
    ru: "Моё местоположение",
  },
  "location.previewHint": {
    uz: "Joylashuvingizni xaritada ko'rsatamiz",
    ru: "Покажем ваше местоположение на карте",
  },
  "location.show": {
    uz: "Xaritada ko'rsatish",
    ru: "Показать на карте",
  },
  "location.tapToOpen": {
    uz: "To'liq xarita uchun bosing",
    ru: "Нажмите, чтобы открыть карту",
  },
  "map.locate": { uz: "Men qayerdaman", ru: "Где я" },
  "map.noGeo": { uz: "Brauzer joylashuvni qo'llab-quvvatlamaydi", ru: "Браузер не поддерживает геолокацию" },
  "map.geoDenied": { uz: "Joylashuvga ruxsat berilmadi", ru: "Доступ к геолокации запрещён" },
  "map.geoFailed": { uz: "Joylashuvni aniqlab bo'lmadi", ru: "Не удалось определить местоположение" },
  "map.full": { uz: "Butun ekran", ru: "На весь экран" },
  "map.exitFull": { uz: "Yopish", ru: "Закрыть" },
  "map.fullFailed": { uz: "Butun ekran ochilmadi", ru: "Полный экран недоступен" },
  "view.map": { uz: "Xaritada", ru: "На карте" },
  /* The map card's two buttons — the app's own words (its
     ListingPreviewSheet). "Batafsil" opens the listing; the number sits
     behind a sign-in, which the app does not need to do. */
  "map.details": { uz: "Batafsil", ru: "Подробнее" },
  "map.call": { uz: "Qo'ng'iroq", ru: "Позвонить" },
  "filters.close": { uz: "Yopish", ru: "Закрыть" },
  "filters.purposeTitle": { uz: "Maqsad", ru: "Цель" },
  "filters.categoryTitle": { uz: "Ko'chmas mulk turi", ru: "Тип недвижимости" },
  "filters.addressTitle": { uz: "Manzil", ru: "Адрес" },
  "filters.price": { uz: "Narx", ru: "Цена" },
  "filters.priceMin": { uz: "dan", ru: "от" },
  "filters.priceMax": { uz: "gacha", ru: "до" },
  "filters.apply": { uz: "Qo'llash", ru: "Применить" },
  "filters.reset": { uz: "Tozalash", ru: "Сбросить" },
  "filters.open": { uz: "Filtrlar", ru: "Фильтры" },
  "filters.sortBy": { uz: "Saralash", ru: "Сортировка" },
  "nav.language": { uz: "Til", ru: "Язык" },
  "create.locationMode": { uz: "Joylashuv turi", ru: "Способ указания" },
  "create.modePin": { uz: "Nuqta", ru: "Точка" },
  "create.modePolygon": { uz: "Chegara", ru: "Контур" },
  "create.pinSet": { uz: "Nuqta belgilandi — surib ko'chiring", ru: "Точка поставлена — перетащите" },
  "create.drawHint": {
    uz: "Chegarani chizish uchun xaritaga kamida 3 marta bosing",
    ru: "Нажмите на карту минимум 3 раза, чтобы обвести контур",
  },
  "create.drawDone": { uz: "{{n}} nuqta — surib tuzating", ru: "{{n}} точек — перетащите, чтобы поправить" },
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
  "create.phTitle": { uz: "3 xonali kvartira, Chilonzor", ru: "3-комнатная квартира, Чиланзар" },
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
  "create.yes": { uz: "Ha", ru: "Да" },
  "create.no": { uz: "Yo'q", ru: "Нет" },
  "create.locateMe": { uz: "Men qayerdaman", ru: "Где я" },
  "create.titleHint": {
    uz: "Bo'sh qoldirsangiz, turi va manzilidan tuziladi.",
    ru: "Если оставить пустым, составим из типа и адреса.",
  },
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
  "add.title": { uz: "E'lon joylash", ru: "Разместить объявление" },
  "add.lead": {
    uz: "E'lon joylash hozircha mobil ilovada: rasmlar, xaritada chegara chizish va narx takliflari o'sha yerda to'liq ishlaydi.",
    ru: "Размещение объявлений пока доступно в мобильном приложении: фотографии, контур на карте и ценовые предложения работают там полностью.",
  },
  "nav.post": { uz: "E'lon joylash", ru: "Разместить" },

  /* The bottom bar on a phone. Labels are taken verbatim from the app's own
     dictionary (mobile/src/i18n/locales/*.ts, `tabs`) rather than retranslated,
     so somebody who uses both does not meet two words for one place. */
  "tabs.home": { uz: "Asosiy", ru: "Главная" },
  "tabs.saved": { uz: "Saqlangan", ru: "Избранное" },
  "tabs.add": { uz: "Qo'shish", ru: "Добавить" },
  "tabs.myListings": { uz: "E'lonlarim", ru: "Мои объявления" },
  "tabs.profile": { uz: "Profil", ru: "Профиль" },
  "tabs.nav": { uz: "Asosiy menyu", ru: "Основная навигация" },
  "gallery.prev": { uz: "Oldingi rasm", ru: "Предыдущее фото" },
  "gallery.next": { uz: "Keyingi rasm", ru: "Следующее фото" },
  "map.satellite": { uz: "Sun'il yo'ldosh", ru: "Спутник" },
  "map.street": { uz: "Xarita", ru: "Карта" },
  "map.recenter": { uz: "Markazga", ru: "К центру" },
  "map.openIn": { uz: "Xaritada ochish:", ru: "Открыть на карте:" },

  /* Rows the app has and the web has not built. Wording taken from the
     app's own screen (mobile/app/settings.tsx) so the two agree. */
  /* ── The settings screen, section for section as the app has it ─────
     Hints included: the app gives the rows that MATTER a second line that
     says where you stand ("Есть вопрос? Напишите нам"), and a column of
     bare labels is a worse answer to "why would I tap this". */
  /* ── Your activity ───────────────────────────────────────────────────
     The app's hub and its six lists, word for word (mobile/app/activity).
     The endpoints are the same `/me/...` ones, so a comment written on the
     phone is the same row here. */
  "activity.title": { uz: "Mening faoliyatim", ru: "Моя активность" },
  "activity.intro": {
    uz: "Saqlaganlaringiz, yoqtirishlaringiz, izoh va sharhlaringiz",
    ru: "Сохранённое, отметки «нравится», комментарии и отзывы",
  },
  "activity.saved": { uz: "Saqlanganlar", ru: "Сохранённое" },
  "activity.savedHint": {
    uz: "Belgilab qo'ygan e'lonlaringiz",
    ru: "Отмеченные вами объявления",
  },
  "activity.likes": { uz: "Yoqtirishlarim", ru: "Мои отметки" },
  "activity.likesHint": {
    uz: "Siz yoqtirgan izohlar",
    ru: "Комментарии, которые вам понравились",
  },
  "activity.comments": { uz: "Izohlarim", ru: "Мои комментарии" },
  "activity.commentsHint": {
    uz: "Siz yozgan izoh va javoblar",
    ru: "Ваши комментарии и ответы",
  },
  "activity.reviews": { uz: "Sharhlarim", ru: "Мои отзывы" },
  "activity.reviewsHint": {
    uz: "Siz qoldirgan baholar",
    ru: "Оставленные вами оценки",
  },
  "activity.photoOnly": { uz: "Rasm", ru: "Фото" },
  "activity.commentsEmpty": {
    uz: "Hali izoh yozmagansiz",
    ru: "Вы пока не комментировали",
  },
  "activity.commentsEmptyHint": {
    uz: "E'lon ostida savol bering — u shu yerda ko'rinadi.",
    ru: "Задайте вопрос под объявлением — он появится здесь.",
  },
  "activity.likesEmpty": {
    uz: "Hali hech narsa yoqtirmagansiz",
    ru: "Вы пока ничего не отмечали",
  },
  "activity.likesEmptyHint": {
    uz: "Izohga yurakcha bosing — u shu yerda saqlanadi.",
    ru: "Поставьте сердечко комментарию — он сохранится здесь.",
  },
  "activity.reviewsEmpty": {
    uz: "Hali sharh qoldirmagansiz",
    ru: "Вы пока не оставляли отзывов",
  },
  "activity.reviewsEmptyHint": {
    uz: "Ko'rgan joyingizni baholang — u shu yerda ko'rinadi.",
    ru: "Оцените объект, который смотрели — он появится здесь.",
  },
  /* Web-only: the app pages by scrolling, a page with a footer pages by
     asking. The number is what is left, so the button says what it buys. */
  "activity.more": { uz: "Yana {{n}} ta", ru: "Ещё {{n}}" },
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
  "blocks.title": {
    uz: "Bloklangan foydalanuvchilar",
    ru: "Заблокированные",
  },
  "blocks.hint": {
    uz: "Ular sizga yoza olmaydi",
    ru: "Они не смогут вам писать",
  },
  "blocks.unblock": { uz: "Blokdan chiqarish", ru: "Разблокировать" },
  "blocks.unblockConfirm": {
    uz: "U sizga yana xabar yoza oladi.",
    ru: "Он снова сможет вам писать.",
  },
  "blocks.emptyTitle": {
    uz: "Bloklangan foydalanuvchilar yo'q",
    ru: "Заблокированных нет",
  },
  "blocks.emptyHint": {
    uz: "Kimnidir bloklasangiz, u shu yerda ko'rinadi.",
    ru: "Если вы кого-то заблокируете, он появится здесь.",
  },
  "settings.verificationHint": {
    uz: "Ko'k belgi oling va ishonchni oshiring",
    ru: "Получите синий значок и больше доверия",
  },
  "settings.activityHint": {
    uz: "Saqlaganlaringiz, yoqtirishlaringiz, izoh va sharhlaringiz",
    ru: "Сохранённое, отметки «нравится», комментарии и отзывы",
  },
  "settings.placesHint": {
    uz: "Tez-tez qidiradigan hududlaringiz",
    ru: "Районы, которые вы ищете чаще всего",
  },
  "settings.supportHint": {
    uz: "Savolingiz bormi? Bizga yozing",
    ru: "Есть вопрос? Напишите нам",
  },
  "settings.sessionsHint": {
    uz: "Hisobingizga kirgan qurilmalar",
    ru: "Устройства, на которых выполнен вход",
  },
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
  "settings.deletionHint": {
    uz: "Bu amalni ortga qaytarib bo'lmaydi. O'chirilgan ma'lumotlar tiklanmaydi.",
    ru: "Это действие необратимо. Удалённые данные восстановить невозможно.",
  },
  "settings.version": { uz: "Versiya {{version}}", ru: "Версия {{version}}" },
  "settings.browserNote": {
    uz: "Ko'rinish, valyuta va til shu brauzerda saqlanadi — ilovadagi sozlamalar alohida.",
    ru: "Тема, валюта и язык сохраняются в этом браузере — настройки в приложении отдельные.",
  },
  "settings.inAppSection": { uz: "Mobil ilovada", ru: "В приложении" },
  "settings.inApp": { uz: "Ilovada", ru: "В приложении" },
  /* NOT the same claim as "Ilovada", and the difference is the point:
     "in the app" says go and use it there, "soon" says it exists nowhere
     yet. Marking an unbuilt feature as app-only sends somebody to hunt
     through the app for a screen that is not in it. */
  "settings.soon": { uz: "Tez orada", ru: "Скоро" },
  "settings.verification": { uz: "Tasdiqlash", ru: "Верификация" },
  "settings.activity": { uz: "Faollik", ru: "Активность" },
  "settings.places": { uz: "Saqlangan joylar", ru: "Сохранённые места" },
  "deletion.howTitle": {
    uz: "Hisobni o'chirishning ikki yo'li",
    ru: "Два способа удалить аккаунт",
  },
  "deletion.inApp": { uz: "Ilovadan", ru: "В приложении" },
  "deletion.inAppHint": {
    uz: "Profil → Sozlamalar → Hisobni o'chirish. Darhol bajariladi.",
    ru: "Профиль → Настройки → Удалить аккаунт. Выполняется сразу.",
  },
  "deletion.byMail": { uz: "Yozma so'rov", ru: "Письменный запрос" },
  "deletion.byMailHint": {
    uz: "Ilovaga kira olmasangiz. 30 kun ichida bajaramiz.",
    ru: "Если нет доступа к приложению. Выполним в течение 30 дней.",
  },
  "legal.contents": { uz: "Bo'limlar", ru: "Содержание" },
  "nav.legal": { uz: "Hujjatlar", ru: "Документы" },
  "nav.privacy": { uz: "Maxfiylik siyosati", ru: "Конфиденциальность" },
  /* "Public offer", not "terms of use".
     One document with two names was the state of this for a while: the app
     called it an offer on its login screen, the web called it terms of use
     in the footer, and the document's own title agreed with neither sign-in
     checkbox. In Uzbek and Russian practice a public offer is the form with
     legal weight, so that is the name everywhere now.
     The PATH stays /terms. It is in a shipped app build, in the nginx
     redirects from the old /legal URLs, and in the store listings — a URL
     is an address, not a label. */
  "nav.terms": {
    uz: "Ommaviy oferta shartlari",
    ru: "Условия публичной оферты",
  },
  "nav.deletion": { uz: "Hisobni o'chirish", ru: "Удаление аккаунта" },
  "nav.support": { uz: "Yordam", ru: "Поддержка" },
  "footer.updated": { uz: "Yangilangan:", ru: "Обновлено:" },
  "home.tagline": {
    uz: "O'zbekistonda uy-joy sotib olish, sotish va ijaraga berish.",
    ru: "Покупка, продажа и аренда жилья в Узбекистане.",
  },
  "home.download": { uz: "Ilovani yuklab olish", ru: "Скачать приложение" },
  "home.legalTitle": { uz: "Hujjatlar", ru: "Документы" },
  "support.title": { uz: "Yordam", ru: "Поддержка" },
  "support.lead": {
    uz: "Savolingiz bo'lsa yoki muammoga duch kelsangiz, bizga yozing. Odatda bir ish kuni ichida javob beramiz.",
    ru: "Если у вас есть вопрос или возникла проблема — напишите нам. Обычно отвечаем в течение одного рабочего дня.",
  },
  "support.email": { uz: "Elektron pochta", ru: "Электронная почта" },
  "support.telegram": { uz: "Telegram orqali", ru: "Через Telegram" },
  "support.phone": { uz: "Telefon", ru: "Телефон" },
  "support.phoneHint": {
    uz: "Ish kunlari, 9:00 — 18:00",
    ru: "В рабочие дни, 9:00 — 18:00",
  },
  "support.inApp": { uz: "Ilova orqali", ru: "Через приложение" },
  "support.inAppHint": {
    uz: "Ilovadagi Profil → Yordam bo'limi eng tez yo'l: suhbat hisobingizga bog'langan bo'ladi.",
    ru: "Раздел Профиль → Поддержка в приложении — самый быстрый путь: переписка привязана к вашему аккаунту.",
  },
  // ---- listings
  "listing.perMonth": { uz: "/oy", ru: "/мес" },
  "listing.rooms": { uz: "{{n}} xona", ru: "{{n}} комн." },
  "listing.untitled": { uz: "Nomsiz e'lon", ru: "Без названия" },
  "listing.sold": { uz: "Sotilgan", ru: "Продано" },
  "listing.soldFor": { uz: "{{price}}ga sotilgan", ru: "Продано за {{price}}" },
  "home.searchAction": { uz: "Qidirish", ru: "Найти" },
  "home.search": { uz: "Qidirish", ru: "Поиск" },
  "home.searchPlaceholder": {
    uz: "Tuman, manzil yoki e'lon nomi",
    ru: "Район, адрес или название",
  },
  "home.viewList": { uz: "Ro'yxat", ru: "Список" },
  "home.viewGrid": { uz: "Katak", ru: "Плитка" },
  "home.viewMap": { uz: "Xarita", ru: "Карта" },
  "home.purposeSale": { uz: "Sotuv", ru: "Продажа" },
  "home.purposeRent": { uz: "Ijara", ru: "Аренда" },
  "home.purposeDaily": { uz: "Kunlik", ru: "Посуточно" },
  "home.topTitle": { uz: "Tavsiya etilgan", ru: "Рекомендуемые" },
  "home.foundLabel": { uz: "e'lon topildi", ru: "объявлений найдено" },
  "home.found": { uz: "{{n}} ta e'lon", ru: "{{n}} объявлений" },
  "home.empty": { uz: "E'lonlar topilmadi", ru: "Объявления не найдены" },
  "home.emptyHint": {
    uz: "Qidiruvni o'zgartirib ko'ring.",
    ru: "Попробуйте изменить запрос.",
  },
  "home.mapLoading": { uz: "Xarita yuklanmoqda…", ru: "Карта загружается…" },
  "home.loadError": {
    uz: "E'lonlarni yuklab bo'lmadi",
    ru: "Не удалось загрузить объявления",
  },
  // ---- enum labels
  // The exact wording the mobile app uses (mobile/src/i18n/locales/*.ts), so
  // the same flat does not describe itself differently on the phone and on
  // the web. Without these the page printed the database enum — "NEW",
  // "NEEDS_REPAIR", "OWNER" — at a reader.
  "enum.building.NEW": { uz: "Yangi bino", ru: "Новостройка" },
  "enum.building.SECONDARY": { uz: "Ikkilamchi", ru: "Вторичка" },
  "enum.repair.NEEDS_REPAIR": { uz: "Remont talab", ru: "Требует ремонта" },
  "enum.repair.AVERAGE": { uz: "O'rtacha", ru: "Средний" },
  "enum.repair.COSMETIC": { uz: "Kosmetik", ru: "Косметический" },
  "enum.repair.EURO": { uz: "Yevroremont", ru: "Евроремонт" },
  "enum.repair.DESIGNER": { uz: "Dizaynerlik", ru: "Дизайнерский" },
  "enum.repair.CAPITAL": { uz: "Kapital ta'mir", ru: "Капитальный" },
  "enum.seller.OWNER": { uz: "Mulkdor", ru: "Собственник" },
  "enum.seller.REALTOR": { uz: "Rieltor", ru: "Риелтор" },
  // ---- filters
  "filters.all": { uz: "Barchasi", ru: "Все" },
  "filters.newest": { uz: "Yangi", ru: "Новые" },
  "filters.priceAsc": { uz: "Avval arzon", ru: "Сначала дешёвые" },
  "filters.priceDesc": { uz: "Avval qimmat", ru: "Сначала дорогие" },
  "detail.similar": { uz: "O'xshash e'lonlar", ru: "Похожие объявления" },
  // ---- listing detail
  "detail.back": { uz: "E'lonlarga qaytish", ru: "К объявлениям" },
  "detail.about": { uz: "Tavsif", ru: "Описание" },
  "detail.specs": { uz: "Xususiyatlar", ru: "Характеристики" },
  "detail.location": { uz: "Joylashuv", ru: "Расположение" },
  "detail.showPhone": { uz: "Raqamni ko'rsatish", ru: "Показать номер" },
  "detail.phoneFailed": { uz: "Qayta urinish", ru: "Повторить" },
  "detail.seller": { uz: "Sotuvchi", ru: "Продавец" },
  "detail.call": { uz: "Bog'lanish", ru: "Связаться" },
  "detail.verified": { uz: "Tasdiqlangan", ru: "Проверенный" },
  "detail.rooms": { uz: "Xonalar", ru: "Комнат" },
  "detail.area": { uz: "Maydon", ru: "Площадь" },
  "detail.floor": { uz: "Qavat", ru: "Этаж" },
  "detail.building": { uz: "Bino turi", ru: "Тип здания" },
  "detail.repair": { uz: "Ta'mir", ru: "Ремонт" },
  "detail.sellerType": { uz: "Kim joylagan", ru: "Кто разместил" },
  "detail.views": { uz: "{{n}} marta ko'rilgan", ru: "{{n}} просмотров" },
  "detail.soldNotice": {
    uz: "Bu e'lon sotilgan. Narx va ma'lumotlar tarix uchun qoldirilgan.",
    ru: "Это объявление продано. Цена и данные оставлены для истории.",
  },
  "detail.archivedNotice": {
    uz: "Bu e'lon arxivga olingan va qidiruvda ko'rinmaydi.",
    ru: "Это объявление в архиве и не отображается в поиске.",
  },
  "detail.openInApp": { uz: "Ilovada ochish", ru: "Открыть в приложении" },
  // ---- sessions
  "sessions.title": { uz: "Faol seanslar", ru: "Активные сеансы" },
  "sessions.lead": {
    uz: "Hisobingizga kirilgan qurilmalar. Notanish qurilmani ko'rsangiz, uni yakunlang.",
    ru: "Устройства, с которых выполнен вход. Если видите незнакомое — завершите сеанс.",
  },
  "sessions.thisDevice": { uz: "Shu qurilma", ru: "Это устройство" },
  "sessions.otherDevice": { uz: "Boshqa qurilma", ru: "Другое устройство" },
  "sessions.lastSeen": { uz: "Oxirgi faollik: {{when}}", ru: "Последняя активность: {{when}}" },
  "sessions.end": { uz: "Yakunlash", ru: "Завершить" },
  "sessions.current": { uz: "Shu qurilma", ru: "Это устройство" },
  "sessions.started": { uz: "Kirilgan: {{when}}", ru: "Вход: {{when}}" },
  "sessions.active": { uz: "{{n}} ta faol seans", ru: "Активных сеансов: {{n}}" },
  "sessions.empty": { uz: "Faol seanslar yo'q", ru: "Нет активных сеансов" },
  "sessions.endOthersTitle": {
    uz: "Boshqa qurilmalardan chiqilsinmi?",
    ru: "Выйти на других устройствах?",
  },
  "sessions.endOthersBody": {
    uz: "Shu qurilmadan tashqari barcha seanslar yakunlanadi. Qaytadan kirish uchun SMS kod kerak bo'ladi.",
    ru: "Все сеансы, кроме текущего, будут завершены. Для входа снова понадобится SMS-код.",
  },
  "time.now": { uz: "hozir", ru: "только что" },
  "time.minutes": { uz: "{{n}} daqiqa oldin", ru: "{{n}} мин назад" },
  "time.hours": { uz: "{{n}} soat oldin", ru: "{{n}} ч назад" },
  "time.yesterday": { uz: "kecha", ru: "вчера" },
  "sessions.endOthers": {
    uz: "Boshqa barcha qurilmalardan chiqish",
    ru: "Выйти на всех других устройствах",
  },
  // ---- auth
  "auth.title": { uz: "Kirish", ru: "Вход" },
  "auth.lead": {
    uz: "Telefon raqamingizni kiriting — SMS orqali kod yuboramiz.",
    ru: "Введите номер телефона — мы отправим код по SMS.",
  },
  "auth.phone": { uz: "Telefon raqam", ru: "Номер телефона" },
  "auth.continue": { uz: "Davom etish", ru: "Продолжить" },
  "auth.phoneInvalid": {
    uz: "Raqamni tekshiring",
    ru: "Проверьте номер",
  },
  "auth.codeTitle": { uz: "Kodni kiriting", ru: "Введите код" },
  "auth.codeLead": {
    uz: "{{phone}} raqamiga yuborilgan 6 xonali kodni kiriting.",
    ru: "Введите 6-значный код, отправленный на {{phone}}.",
  },
  "auth.code": { uz: "SMS kod", ru: "Код из SMS" },
  "auth.codeInvalid": { uz: "6 xonali kod kiriting", ru: "Введите 6 цифр" },
  "auth.verify": { uz: "Tasdiqlash", ru: "Подтвердить" },
  "auth.resend": { uz: "Kodni qayta yuborish", ru: "Отправить код снова" },
  "auth.resendIn": {
    uz: "Qayta yuborish — {{seconds}} s",
    ru: "Отправить снова — {{seconds}} с",
  },
  "auth.changeNumber": { uz: "Raqamni o'zgartirish", ru: "Изменить номер" },
  "auth.signOutConfirm": { uz: "Hisobdan chiqasizmi?", ru: "Выйти из аккаунта?" },
  "auth.signOutBody": {
    uz: "Keyingi safar telefon raqamingiz va SMS kod orqali qayta kirasiz.",
    ru: "В следующий раз вход будет по номеру телефона и коду из SMS.",
  },
  "common.cancel": { uz: "Bekor qilish", ru: "Отмена" },
  "common.retry": { uz: "Qayta urinish", ru: "Повторить" },
  "common.empty": { uz: "Hozircha bo'sh", ru: "Пока пусто" },
  "auth.signOut": { uz: "Chiqish", ru: "Выйти" },
  "auth.signIn": { uz: "Kirish", ru: "Войти" },
  "auth.nameTitle": { uz: "Ismingiz", ru: "Ваше имя" },
  "auth.nameLead": {
    uz: "E'lonlaringizda va yozishmalarda shu ism ko'rinadi.",
    ru: "Это имя будет видно в ваших объявлениях и переписке.",
  },
  "auth.name": { uz: "Ism", ru: "Имя" },
  "auth.save": { uz: "Saqlash", ru: "Сохранить" },
  "auth.acceptPrefix": { uz: "Men", ru: "Я принимаю" },
  /* The sign-in checkbox says it mid-sentence, so it is lower-case where
     nav.terms is a heading. Same document, same name, different position in
     a sentence — which is the only reason this is a separate key. */
  "auth.acceptOffer": {
    uz: "ommaviy oferta shartlari",
    ru: "условия публичной оферты",
  },
  "auth.acceptMiddle": { uz: "va", ru: "и" },
  "auth.acceptSuffix": {
    uz: "bilan tanishdim va roziman",
    ru: "",
  },
  "auth.mustAccept": {
    uz: "Davom etish uchun shartlarga rozilik bildiring",
    ru: "Чтобы продолжить, примите условия",
  },
  "auth.legalNote": {
    uz: "Davom etish orqali siz quyidagilarga rozilik bildirasiz:",
    ru: "Продолжая, вы соглашаетесь с",
  },
  "auth.and": { uz: "va", ru: "и" },
  "auth.brandLead": {
    uz: "Hisobingizga kiring yoki yangisini oching — telefon raqami yetarli.",
    ru: "Войдите в аккаунт или создайте новый — достаточно номера телефона.",
  },
  "auth.genericError": {
    uz: "Nimadir xato ketdi. Qaytadan urinib ko'ring.",
    ru: "Что-то пошло не так. Попробуйте ещё раз.",
  },
  "support.privacyNote": {
    uz: "Ma'lumotlaringiz haqidagi so'rovlar uchun:",
    ru: "По вопросам о ваших данных:",
  },
} as const satisfies Record<string, Record<Lang, string>>;

export type UiKey = keyof typeof UI;

export type TParams = Record<string, string | number>;

/**
 * `{{name}}` interpolation, same placeholder syntax the mobile app uses, so
 * a string can be copied between the two without rewriting it.
 */
export function t(lang: Lang, key: UiKey, params?: TParams): string {
  const template = UI[key][lang];
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

/**
 * A database enum as a readable label.
 *
 * Returns the raw value when there is no translation — a server that adds a
 * repair grade should make the page show its NAME, not a blank cell, and the
 * missing word is then obvious to whoever next looks at the page. A
 * `TranslationKey` cast is used because the key is assembled at runtime;
 * `enumKey` is the only place in the app that does this, and it guards the
 * lookup rather than trusting it.
 */
export function enumLabel(
  lang: Lang,
  group: "building" | "repair" | "seller",
  value: string | null,
): string | null {
  if (!value) return null;
  const key = `enum.${group}.${value}` as UiKey;
  return key in UI ? t(lang, key) : value;
}
