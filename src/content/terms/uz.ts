import type { LegalDocument } from "../types";

export const termsUz: LegalDocument = {
  title: "Foydalanish shartlari",
  summary:
    "Growen City ilovasidan foydalanish qoidalari: kim e'lon joylashi mumkin, nima taqiqlanadi va javobgarlik qanday taqsimlanadi.",
  sections: [
    {
      id: "service",
      heading: "Xizmat haqida",
      blocks: [
        {
          kind: "p",
          text: "Growen City — ko'chmas mulk e'lonlari uchun maydon. Biz e'lon joylashtiruvchi va uni o'qiyotgan odamni bog'laymiz; mulkni o'zimiz sotmaymiz, sotib olmaymiz va bitimning tomoni bo'lmaymiz.",
        },
        {
          kind: "note",
          text: "Bitim siz bilan ikkinchi tomon o'rtasida tuziladi. Hujjatlarni tekshirish, to'lov va mulkni topshirish — sizning mas'uliyatingizda.",
        },
      ],
    },
    {
      id: "account",
      heading: "Hisob",
      blocks: [
        {
          kind: "ul",
          items: [
            "Ro'yxatdan o'tish uchun 18 yosh to'lgan bo'lishingiz kerak.",
            "Telefon raqamingiz — kirish kaliti. Uni boshqa birovga bermang.",
            "Bitta odam uchun bitta hisob. Qoidabuzarlikdan so'ng yangi hisob ochish — qoidabuzarlikning davomi.",
            "Hisobingizdan amalga oshirilgan barcha harakatlar uchun siz javobgarsiz.",
          ],
        },
      ],
    },
    {
      id: "listings",
      heading: "E'lonlar",
      blocks: [
        {
          kind: "p",
          text: "E'lon joylashda quyidagilarga rozilik bildirasiz:",
        },
        {
          kind: "ul",
          items: [
            "E'londagi ma'lumot haqiqiy: narx, maydon, joylashuv va holat haqiqatga mos.",
            "Rasmlar — o'sha mulkniki. Boshqa e'londan olingan yoki tahrirlab chiroyli qilingan rasm — aldov.",
            "Mulkni sotish yoki ijaraga berish huquqiga egasiz.",
            "Bitta mulk uchun bitta e'lon. Qidiruvni to'ldirish uchun takroriy e'lonlar o'chiriladi.",
          ],
        },
      ],
    },
    {
      id: "prohibited",
      heading: "Taqiqlanadi",
      blocks: [
        {
          kind: "ul",
          items: [
            "Yolg'on ma'lumot, mavjud bo'lmagan mulk, haqiqiy bo'lmagan narx.",
            "Boshqa odamning rasmlari, matni yoki shaxsiy ma'lumotlari.",
            "Haqorat, tahdid, kamsitish — e'londa ham, yozishmada ham.",
            "Ko'chmas mulkka aloqasi yo'q reklama va spam.",
            "Ilovani avtomatik vositalar bilan qirqib olish yoki yuklama berish.",
            "Qonunga zid har qanday faoliyat.",
          ],
        },
      ],
    },
    {
      id: "payments",
      heading: "To'lovlar",
      blocks: [
        {
          kind: "ul",
          items: [
            "E'lon joylash bepul. Pulli xizmatlar — TOP joylashuv va shunga o'xshash imkoniyatlar.",
            "To'lov hisobingizdagi mablag'dan yechiladi; hisobni Payme, Paynet yoki Click orqali to'ldirasiz.",
            "Ko'rsatilgan xizmat uchun to'langan mablag' qaytarilmaydi. Xizmat bizning aybimiz bilan ko'rsatilmasa — qaytaramiz.",
            "Narxlar o'zgarishi mumkin; o'zgarish faqat yangi to'lovlarga tegishli.",
          ],
        },
      ],
    },
    {
      id: "moderation",
      heading: "Nazorat",
      blocks: [
        {
          kind: "p",
          text: "Qoidabuzarlik haqida xabar berilgan yoki o'zimiz aniqlagan e'lonni ko'rib chiqamiz. Zarur bo'lsa e'lonni yashiramiz, hisobni cheklaymiz yoki bloklaymiz. Jiddiy bo'lmagan hollarda avval ogohlantiramiz.",
        },
        {
          kind: "p",
          text: "Qaroridan norozi bo'lsangiz, yordam xizmatiga yozing — qayta ko'rib chiqamiz.",
        },
      ],
    },
    {
      id: "liability",
      heading: "Javobgarlik",
      blocks: [
        {
          kind: "p",
          text: "Ilova «qanday bo'lsa, shunday» taqdim etiladi. E'lonlardagi ma'lumotning to'g'riligiga, bitimning amalga oshishiga yoki tomonlarning halolligiga kafolat bermaymiz.",
        },
        {
          kind: "p",
          text: "Qonun ruxsat bergan doirada, ilovadan foydalanish natijasida yuzaga kelgan zarar uchun javobgar emasmiz. Bu band sizning iste'molchi sifatidagi qonuniy huquqlaringizni cheklamaydi.",
        },
      ],
    },
    {
      id: "termination",
      heading: "Tugatish",
      blocks: [
        {
          kind: "p",
          text: "Hisobingizni istalgan vaqtda o'zingiz o'chirishingiz mumkin. Biz ushbu shartlar jiddiy buzilgan taqdirda hisobni bloklashimiz mumkin.",
        },
      ],
    },
    {
      id: "changes",
      heading: "O'zgarishlar",
      blocks: [
        {
          kind: "p",
          text: "Shartlar o'zgarsa, yangilangan sana shu sahifada ko'rsatiladi. Muhim o'zgarishlardan keyin ilovadan foydalanishda davom etish — yangi shartlarga rozilik.",
        },
      ],
    },
  ],
};
