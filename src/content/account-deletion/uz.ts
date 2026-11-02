import type { LegalDocument } from "../types";

/**
 * Google Play talab qiladigan sahifa.
 *
 * Play Console'dagi «Data deletion» havolasi shu yerga qaraydi: ilovani
 * qayta o'rnatmasdan, tizimga kirmasdan ochiladigan va hisobni qanday
 * o'chirishni aytadigan ommaviy sahifa bo'lishi shart.
 */
export const accountDeletionUz: LegalDocument = {
  title: "Hisobni o'chirish",
  summary:
    "Growen City hisobingizni qanday o'chirish mumkin, nima o'chiriladi va nima saqlanib qoladi.",
  sections: [
    {
      id: "in-app",
      heading: "Ilovadan o'chirish",
      blocks: [
        {
          kind: "p",
          text: "Eng tez yo'l — ilovaning o'zidan. Hisobingiz va quyida sanab o'tilgan ma'lumotlar darhol o'chiriladi.",
        },
        {
          kind: "ul",
          items: [
            "Growen City ilovasini oching va hisobingizga kiring.",
            "Pastdagi «Profil» bo'limiga o'ting.",
            "Yuqoridagi sozlamalar belgisini bosing.",
            "«Hisobni o'chirish» bandini tanlang.",
            "Sababni yozing (ixtiyoriy) va tasdiqlang.",
          ],
        },
      ],
    },
    {
      id: "by-request",
      heading: "Ilovaga kira olmasangiz",
      blocks: [
        {
          kind: "p",
          text: "Telefon raqamingizni yo'qotgan bo'lsangiz yoki ilovaga kira olmasangiz, bizga yozing. So'rovni oladigan manzil shu sahifaning oxirida.",
        },
        {
          kind: "p",
          text: "Xatda hisobingiz bog'langan telefon raqamini ko'rsating. Biz so'rovni 30 kun ichida bajaramiz va natijani sizga xabar qilamiz. Egaligini tasdiqlash uchun qo'shimcha savol berishimiz mumkin — bu boshqa birov sizning hisobingizni o'chirib yuborishining oldini oladi.",
        },
      ],
    },
    {
      id: "deleted",
      heading: "Nima darhol o'chiriladi",
      blocks: [
        {
          kind: "ul",
          items: [
            "Ism, familiya, profil rasmi.",
            "Telefon raqami va elektron pochta.",
            "Tug'ilgan sana, jins, manzil, o'zingiz haqingizdagi matn, ijtimoiy tarmoq havolalari.",
            "Pasport nusxasi va selfi, agar tasdiqlashdan o'tgan bo'lsangiz.",
            "Push-bildirishnoma tokenlari — telefoningizga boshqa xabar kelmaydi.",
            "Saqlangan e'lonlar, bloklangan foydalanuvchilar, obunalar.",
            "Barcha ochiq seanslar.",
          ],
        },
      ],
    },
    {
      id: "kept",
      heading: "Nima saqlanib qoladi",
      blocks: [
        {
          kind: "p",
          text: "Quyidagilar o'chmaydi, lekin ular endi ismingiz, telefon raqamingiz yoki profilingiz bilan bog'lanmaydi:",
        },
        {
          kind: "ul",
          items: [
            "Yozishmalardagi xabarlaringiz.",
            "Izohlar va sharhlar.",
            "E'lonlaringiz — ular arxivga o'tadi, qidiruvdan va xaritadan yo'qoladi, lekin o'chirilmaydi.",
            "To'lov yozuvlari — buxgalteriya hisoboti uchun zarur.",
          ],
        },
        {
          kind: "note",
          text: "Xabarlar nega qoladi: suhbat ikki tomonlama. Faqat bir tomonning xabarlarini o'chirish ikkinchi tomonda tushunarsiz yozishmani qoldiradi. Shuning uchun xabarlar joyida qoladi, lekin kim yozgani ko'rinmaydi.",
        },
      ],
    },
    {
      id: "timing",
      heading: "Muddatlar",
      blocks: [
        {
          kind: "table",
          head: ["Ma'lumot", "Qachon o'chadi"],
          rows: [
            ["Profil, pasport nusxasi, tokenlar", "Darhol"],
            ["E'lonlar", "Darhol arxivga; fayllar saqlanadi"],
            ["Videolar fayllari", "30 kun ichida"],
            ["Bildirishnomalar", "60 kun ichida"],
            ["Xat orqali yuborilgan so'rov", "30 kun ichida"],
          ],
        },
      ],
    },
    {
      id: "restore",
      heading: "Qaytarib bo'ladimi",
      blocks: [
        {
          kind: "note",
          text: "Yo'q. Hisob o'chirilgach, uni tiklab bo'lmaydi. Xohlasangiz, o'sha telefon raqami bilan yangi hisob ochishingiz mumkin, lekin eski e'lonlar, yozishmalar va hamyon balansi qaytmaydi.",
        },
      ],
    },
  ],
};
