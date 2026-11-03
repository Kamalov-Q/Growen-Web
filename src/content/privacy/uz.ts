import type { LegalDocument } from "../types";

/**
 * Maslahat emas, kodning o'zi.
 *
 * Har bir band serverdagi haqiqiy xatti-harakatdan olingan: saqlash
 * muddatlari `pruneRead(60)`, `DISPATCHED_RETENTION_MS` va
 * `VIDEO_RETENTION_DAYS = 30` dan; o'chirish tartibi esa
 * `deleteOwnAccount` dan. Andozadan ko'chirilgan siyosat — tekshiruvda
 * yiqiladigan siyosat.
 */
export const privacyUz: LegalDocument = {
  title: "Maxfiylik siyosati",
  summary:
    "Growen City qanday ma'lumot to'playdi, nima uchun, qancha saqlaydi va uni qanday o'chirish mumkin.",
  sections: [
    {
      id: "operator",
      heading: "Operator haqida",
      blocks: [
        {
          kind: "p",
          text: "Shaxsga doir ma'lumotlarni qayta ishlovchi operator — quyidagi yuridik shaxs. Maxfiylik bo'yicha har qanday savol yoki so'rovni shu manzillarga yo'llashingiz mumkin.",
        },
        {
          kind: "table",
          head: ["Ma'lumot", "Qiymat"],
          rows: [
            ["Tashkilot", "«AGROMIND AL» MChJ"],
            ["STIR (INN)", "312488501"],
            ["Manzil", "Toshkent shahri, O'zbekiston"],
            ["Telefon", "+998 95 555 52 29"],
            ["Email", "agromind5229@gmail.com"],
          ],
        },
      ],
    },
    {
      id: "intro",
      heading: "Qisqacha",
      blocks: [
        {
          kind: "p",
          text: "Growen City — O'zbekistondagi ko'chmas mulk e'lonlari ilovasi. Ro'yxatdan o'tish telefon raqami orqali amalga oshiriladi, e'lonlar esa ochiq: ularni ilovadagi har bir foydalanuvchi ko'radi.",
        },
        {
          kind: "note",
          text: "Hisobingizni istalgan vaqtda ilovaning o'zidan o'chirishingiz mumkin: Profil → Sozlamalar → Hisobni o'chirish. Nima o'chirilishi va nima saqlanib qolishi quyida batafsil yozilgan.",
        },
      ],
    },
    {
      id: "collect",
      heading: "Qanday ma'lumot to'playmiz",
      blocks: [
        {
          kind: "p",
          text: "Faqat ilovaning ishlashi uchun zarur bo'lgan ma'lumot. Hech qanday reklama identifikatori yoki uchinchi tomon kuzatuv vositasi ishlatilmaydi.",
        },
        {
          kind: "ul",
          items: [
            "Telefon raqami — kirish uchun yagona majburiy ma'lumot. SMS kodi orqali tasdiqlanadi.",
            "Profil: ism, familiya, rasm. Ixtiyoriy: elektron pochta, tug'ilgan sana, jins, manzil, o'zingiz haqingizda, ijtimoiy tarmoq havolalari.",
            "E'lonlar: matn, rasmlar, video, narx, bog'lanish uchun telefon raqami va joylashuv — xaritadagi nuqta yoki siz chizgan chegara.",
            "Yozishmalar: xabarlar va ularga biriktirilgan fayllar.",
            "Faollik: izohlar, sharhlar, baholar, saqlangan e'lonlar, obunalar, narx takliflari.",
            "Qurilma: push-bildirishnoma uchun token va platforma (iOS yoki Android).",
            "To'lovlar: hisobni to'ldirish va tarif uchun to'lovlar tarixi.",
            "Tasdiqlash (ixtiyoriy): pasport nusxasi va selfi — faqat sotuvchi maqomini tasdiqlash uchun.",
          ],
        },
        {
          kind: "note",
          text: "Pasport nusxasi va selfi — alohida himoyaga muhtoj ma'lumot. Ular faqat tasdiqlash uchun ishlatiladi, boshqa foydalanuvchilarga hech qachon ko'rsatilmaydi va hisob o'chirilganda darhol o'chiriladi.",
        },
      ],
    },
    {
      id: "why",
      heading: "Nima uchun ishlatamiz",
      blocks: [
        {
          kind: "ul",
          items: [
            "Hisobingizga kirish va uni himoyalash uchun — telefon raqami va SMS kodi.",
            "E'lonlaringizni ko'rsatish va qidiruvda topilishi uchun — e'lon matni, rasmlari va joylashuvi.",
            "Xaridor va sotuvchini bog'lash uchun — yozishmalar va narx takliflari.",
            "Sizga tegishli voqealar haqida xabar berish uchun — push-bildirishnomalar.",
            "To'lovlarni amalga oshirish va hisobot uchun — to'lov tarixi.",
            "Qoidabuzarlik va firibgarlikka qarshi kurash uchun — shikoyatlar va bloklash.",
          ],
        },
      ],
    },
    {
      id: "share",
      heading: "Kim bilan bo'lishamiz",
      blocks: [
        {
          kind: "p",
          text: "Ma'lumotingizni sotmaymiz. Quyidagi xizmatlar ilovaning ishlashi uchun zarur va faqat o'z vazifasi uchun kerakli ma'lumotni oladi:",
        },
        {
          kind: "table",
          head: ["Xizmat", "Nima uchun"],
          rows: [
            ["Eskiz", "Kirish uchun SMS kodlarini yuborish"],
            ["Bunny.net", "Rasm va videolarni saqlash hamda yetkazish"],
            ["Expo", "Push-bildirishnomalarni yetkazish"],
            ["Payme, Paynet, Click", "To'lovlarni qabul qilish"],
            ["DigitalOcean", "Server va ma'lumotlar bazasi"],
            ["Vercel", "Ushbu veb-sayt"],
          ],
        },
        {
          kind: "p",
          text: "Bundan tashqari, qonun talab qilgan hollarda vakolatli organlarga ma'lumot berishimiz mumkin.",
        },
      ],
    },
    {
      id: "public",
      heading: "Boshqalar nimani ko'radi",
      blocks: [
        {
          kind: "p",
          text: "Bu bandni e'lon joylashdan oldin o'qing. E'lon — ommaviy hujjat.",
        },
        {
          kind: "ul",
          items: [
            "Ko'rinadi: e'lon matni, rasmlari, narxi, joylashuvi, siz ko'rsatgan bog'lanish raqami, ismingiz va profil rasmingiz.",
            "Ko'rinmaydi: elektron pochtangiz, tug'ilgan sanangiz, kirish uchun ishlatadigan telefon raqamingiz (agar uni e'londa ko'rsatmagan bo'lsangiz), pasport nusxangiz, hamyon balansingiz va yozishmalaringiz.",
          ],
        },
      ],
    },
    {
      id: "retention",
      heading: "Qancha saqlaymiz",
      blocks: [
        {
          kind: "table",
          head: ["Ma'lumot", "Muddat"],
          rows: [
            ["SMS kodi", "10 daqiqa, shifrlangan holda"],
            ["O'qilgan bildirishnomalar", "60 kun"],
            ["O'chirilgan videolarning fayllari", "30 kun"],
            ["Tizim hodisalari jurnali", "24 soat"],
            ["E'lonlar, yozishmalar, izohlar", "Hisob o'chirilgunga qadar — quyiga qarang"],
            ["To'lov yozuvlari", "Buxgalteriya talab qilgan muddat davomida"],
          ],
        },
      ],
    },
    {
      id: "delete",
      heading: "Hisobni o'chirish",
      blocks: [
        {
          kind: "p",
          text: "Ilovada: Profil → Sozlamalar → Hisobni o'chirish. Ilovaga kira olmasangiz, shu saytdagi «Hisobni o'chirish» sahifasidan foydalaning.",
        },
        { kind: "p", text: "O'chirish tugmasini bosganingizda darhol:" },
        {
          kind: "ul",
          items: [
            "Ismingiz, familiyangiz, rasmingiz, telefon raqamingiz, elektron pochtangiz, tug'ilgan sanangiz, jinsingiz, manzilingiz va o'zingiz haqingizdagi matn o'chiriladi.",
            "Pasport nusxangiz va selfingiz o'chiriladi.",
            "Push-bildirishnoma tokenlari, saqlangan e'lonlar, bloklangan foydalanuvchilar va obunalar o'chiriladi.",
            "Faol e'lonlaringiz arxivga o'tadi va qidiruvdan hamda xaritadan yo'qoladi.",
            "Videolaringiz olib tashlanadi; fayllari 30 kun ichida butunlay o'chiriladi.",
            "Barcha seanslar yopiladi.",
          ],
        },
        {
          kind: "note",
          text: "Saqlanib qoladi: siz yozgan xabarlar, izohlar va sharhlar, shuningdek arxivlangan e'lonlaringiz. Ular endi ismingiz yoki telefon raqamingiz bilan bog'lanmaydi. Buning sababi — suhbat ikki tomonlama: faqat bir tomonning xabarlarini o'chirish ikkinchi tomonning yozishmasini tushunarsiz qilib qo'yadi.",
        },
      ],
    },
    {
      id: "rights",
      heading: "Sizning huquqlaringiz",
      blocks: [
        {
          kind: "ul",
          items: [
            "Profil ma'lumotlaringizni istalgan vaqtda ilovada ko'rish va o'zgartirish.",
            "Hisobni o'chirish — yuqoridagi tartibda.",
            "Bizda qanday ma'lumot borligini so'rash.",
            "Shikoyat bildirish yoki savol berish.",
          ],
        },
      ],
    },
    {
      id: "children",
      heading: "Yosh chegarasi",
      blocks: [
        {
          kind: "p",
          text: "Ilova 18 yoshga to'lmagan shaxslar uchun mo'ljallanmagan. Agar bolangiz bizga ma'lumot bergan bo'lsa, biz bilan bog'laning — hisobni o'chiramiz.",
        },
      ],
    },
    {
      id: "changes",
      heading: "O'zgarishlar",
      blocks: [
        {
          kind: "p",
          text: "Siyosat o'zgarsa, yangilangan sana shu sahifaning yuqorisida ko'rsatiladi. Muhim o'zgarishlar haqida ilovada xabar beramiz.",
        },
      ],
    },
  ],
};
