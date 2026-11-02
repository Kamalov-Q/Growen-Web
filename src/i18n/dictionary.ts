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
  "settings.lead": {
    uz: "Ko'rinish, valyuta va til — barchasi shu brauzer uchun saqlanadi.",
    ru: "Тема, валюта и язык — всё сохраняется для этого браузера.",
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
  "profile.memberSince": { uz: "Ro'yxatdan o'tgan", ru: "Регистрация" },
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
  "map.locate": { uz: "Men qayerdaman", ru: "Где я" },
  "map.noGeo": { uz: "Brauzer joylashuvni qo'llab-quvvatlamaydi", ru: "Браузер не поддерживает геолокацию" },
  "map.geoDenied": { uz: "Joylashuvga ruxsat berilmadi", ru: "Доступ к геолокации запрещён" },
  "map.geoFailed": { uz: "Joylashuvni aniqlab bo'lmadi", ru: "Не удалось определить местоположение" },
  "map.full": { uz: "Butun ekran", ru: "На весь экран" },
  "map.exitFull": { uz: "Yopish", ru: "Закрыть" },
  "map.fullFailed": { uz: "Butun ekran ochilmadi", ru: "Полный экран недоступен" },
  "view.map": { uz: "Xaritada", ru: "На карте" },
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
  "settings.inAppSection": { uz: "Mobil ilovada", ru: "В приложении" },
  "settings.inApp": { uz: "Ilovada", ru: "В приложении" },
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
  "nav.terms": { uz: "Foydalanish shartlari", ru: "Условия использования" },
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
