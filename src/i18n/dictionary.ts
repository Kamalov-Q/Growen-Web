import type { Lang } from "./config";
import { fill, type Entry, type TParams } from "./strings/runtime";

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
  "validation.range": {
    uz: "{{min}} dan {{max}} gacha bo'lsin",
    ru: "Должно быть от {{min}} до {{max}}",
  },
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
  "profile.links": { uz: "Bo'limlar", ru: "Разделы" },
  "nav.settings": { uz: "Sozlamalar", ru: "Настройки" },
  "theme.switch": { uz: "Mavzuni almashtirish", ru: "Сменить тему" },
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
  "map.satellite": { uz: "Sun'iy yo'ldosh", ru: "Спутник" },
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
  "settings.deletionHint": {
    uz: "Bu amalni ortga qaytarib bo'lmaydi. O'chirilgan ma'lumotlar tiklanmaydi.",
    ru: "Это действие необратимо. Удалённые данные восстановить невозможно.",
  },
  "settings.version": { uz: "Versiya {{version}}", ru: "Версия {{version}}" },
  "settings.browserNote": {
    uz: "Ko'rinish, valyuta va til shu brauzerda saqlanadi — ilovadagi sozlamalar alohida.",
    ru: "Тема, валюта и язык сохраняются в этом браузере — настройки в приложении отдельные.",
  },
  /* NOT the same claim as "Ilovada", and the difference is the point:
     "in the app" says go and use it there, "soon" says it exists nowhere
     yet. Marking an unbuilt feature as app-only sends somebody to hunt
     through the app for a screen that is not in it. */
  "settings.soon": { uz: "Tez orada", ru: "Скоро" },
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
  "home.searchAction": { uz: "Qidirish", ru: "Найти" },
  "home.search": { uz: "Qidirish", ru: "Поиск" },
  "home.searchPlaceholder": {
    uz: "Tuman, manzil yoki e'lon nomi",
    ru: "Район, адрес или название",
  },
  "home.purposeSale": { uz: "Sotuv", ru: "Продажа" },
  "home.purposeRent": { uz: "Ijara", ru: "Аренда" },
  "home.purposeDaily": { uz: "Kunlik", ru: "Посуточно" },
  "home.topTitle": { uz: "Tavsiya etilgan", ru: "Рекомендуемые" },
  "home.foundLabel": { uz: "e'lon topildi", ru: "объявлений найдено" },
  "home.empty": { uz: "E'lonlar topilmadi", ru: "Объявления не найдены" },
  "home.emptyHint": {
    uz: "Qidiruvni o'zgartirib ko'ring.",
    ru: "Попробуйте изменить запрос.",
  },
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
  /* ── What people say about a listing ─────────────────────────────────
     Reviews, comments and the report sheet, in the app's own words
     (mobile/src/i18n/locales). Same endpoints, so a comment written on the
     phone is the same comment here. */
  "userProfile.message": { uz: "Yozish", ru: "Написать" },
  "userProfile.messageInApp": {
    uz: "Yozishmalar mobil ilovada",
    ru: "Переписка — в мобильном приложении",
  },
  "userProfile.sortNewest": { uz: "Eng yangi", ru: "Сначала новые" },
  "userProfile.title": { uz: "Profil", ru: "Профиль" },
  "userProfile.ads": { uz: "E'lonlari", ru: "Объявления" },
  "userProfile.noAds": {
    uz: "Bu foydalanuvchida hozircha faol e'lon yo'q.",
    ru: "У этого пользователя пока нет активных объявлений.",
  },
  "detail.share": { uz: "Ulashish", ru: "Поделиться" },
  "detail.linkCopied": { uz: "Havola nusxalandi", ru: "Ссылка скопирована" },
  "detail.shareFailed": {
    uz: "Havolani nusxalab bo'lmadi",
    ru: "Не удалось скопировать ссылку",
  },

  "report.action": { uz: "Shikoyat qilish", ru: "Пожаловаться" },
  "report.subtitle": {
    uz: "Nima uchun bu e'lon haqida xabar bermoqchisiz?",
    ru: "Почему вы хотите пожаловаться на это объявление?",
  },
  "report.FRAUD": { uz: "Firibgarlik", ru: "Мошенничество" },
  "report.WRONG_INFO": {
    uz: "Ma'lumotlar noto'g'ri",
    ru: "Неверная информация",
  },
  "report.ALREADY_SOLD": {
    uz: "Allaqachon sotilgan yoki band",
    ru: "Уже продано или занято",
  },
  "report.WRONG_PRICE": { uz: "Narx noto'g'ri", ru: "Неверная цена" },
  "report.DUPLICATE": { uz: "Takroriy e'lon", ru: "Повторное объявление" },
  "report.INAPPROPRIATE": {
    uz: "Nomaqbul kontent",
    ru: "Неприемлемый контент",
  },
  "report.OTHER": { uz: "Boshqa sabab", ru: "Другая причина" },
  "report.otherPlaceholder": {
    uz: "Sababni yozing…",
    ru: "Опишите причину…",
  },
  "report.submit": { uz: "Yuborish", ru: "Отправить" },
  "report.sent": {
    uz: "Shikoyat yuborildi. Rahmat!",
    ru: "Жалоба отправлена. Спасибо!",
  },
  "report.already": {
    uz: "Siz bu e'lon haqida allaqachon xabar bergansiz",
    ru: "Вы уже пожаловались на это объявление",
  },
  "detail.showPhone": { uz: "Raqamni ko'rsatish", ru: "Показать номер" },
  "detail.phoneFailed": { uz: "Qayta urinish", ru: "Повторить" },
  "detail.seller": { uz: "Sotuvchi", ru: "Продавец" },
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
  "time.now": { uz: "hozir", ru: "только что" },
  "time.minutes": { uz: "{{n}} daqiqa oldin", ru: "{{n}} мин назад" },
  "time.hours": { uz: "{{n}} soat oldin", ru: "{{n}} ч назад" },
  "time.yesterday": { uz: "kecha", ru: "вчера" },
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
  "common.loading": { uz: "Yuklanmoqda…", ru: "Загрузка…" },
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
  "auth.genericError": {
    uz: "Nimadir xato ketdi. Qaytadan urinib ko'ring.",
    ru: "Что-то пошло не так. Попробуйте ещё раз.",
  },
  "support.privacyNote": {
    uz: "Ma'lumotlaringiz haqidagi so'rovlar uchun:",
    ru: "По вопросам о ваших данных:",
  },
} as const satisfies Record<string, Entry>;

export type UiKey = keyof typeof UI;

export type { TParams };

/**
 * `{{name}}` interpolation, same placeholder syntax the mobile app uses, so
 * a string can be copied between the two without rewriting it.
 */
export function t(lang: Lang, key: UiKey, params?: TParams): string {
  return fill(UI[key][lang], params);
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
