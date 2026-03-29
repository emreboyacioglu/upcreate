// Turkish copy for the website

export const HOME_CONTENT = {
  hero: {
    title: {
      line1: "Creator Marketing Değil.",
      line2: "Creator Commerce.",  // copy unchanged per spec
    },
    cta: {
      brands: "For Brands",
      creators: "For Creators",
    },
  },
  intro: {
    title: "Creator marketing'i satış kanalına dönüştürüyoruz.",
    body: "Creator economy büyüyor, ama çoğu kampanya hâlâ paylaşım metriklerine sıkışıyor. Biz creator iş birliklerini satış odaklı bir modele taşıyoruz.",
  },
  problem: {
    title: "Influencer marketing neden zor?",
    subtitle: "Çünkü sistem paylaşım üzerine kurulu: maliyet net, satış etkisi belirsiz.",
    cards: [
      {
        title: "Sabit ücret riski",
        description: "Markalar paylaşım için ödeme yapar, satış etkisi çoğu zaman belirsiz kalır.",
      },
      {
        title: "Yanlış metrikler",
        description: "Takipçi ve görüntülenme her zaman satış anlamına gelmez.",
      },
      {
        title: "Performans görünmez",
        description: "Bir paylaşımın kaç satış getirdiğini net görmek zordur.",
      },
    ],
  },
  solution: {
    title: "Upcreate Modeli",
    body: "Platformumuz markalar ile içerik üreticilerini satış bazlı iş birliklerinde buluşturur. Creator'lar ürünleri kendi kitlelerine tanıtır. Satış gerçekleştiğinde kazanır.",
  },
  platform: {
    title: "Markalar ve creator'lar için tek bir ekosistem",
    brands: {
      title: "Markalar",
      description: "Creator kampanyaları başlatır ve performansı ölçer.",
    },
    creators: {
      title: "Creator'lar",
      description: "Markalarla performans bazlı çalışır, satış getirdikçe kazanır.",
    },
  },
  splitCta: {
    brands: {
      title: "For Brands",
      description: "Creator kampanyalarını performans modeline taşı.",
      cta: "For Brands",
    },
    creators: {
      title: "For Creators",
      description: "İçerik üretmekten fazlasını yap. Satış getiren creator ol.",
      cta: "For Creators",
    },
  },
  finalStatement: {
    title: "Creator marketing'i yeniden düşünün.",
    cta: "For Brands",
  },
};

export const BRANDS_CONTENT = {
  hero: {
    title: "Creator Marketing'i Satış Kanalına Dönüştürün",
    body: "Performans odaklı creator kampanyalarıyla satış etkisini netleştirin.",
    cta: {
      primary: "Marka olarak başvur",
      secondary: "For Creators",
    },
  },
  value: {
    title: "Neden creator commerce?",
    cards: [
      {
        title: "Daha düşük risk",
        description: "Sabit ücret yerine performansa yakın bir model.",
      },
      {
        title: "Gerçek performans",
        description: "Kampanyanın satış etkisini daha net takip edebilme.",
      },
      {
        title: "Yeni satış kanalı",
        description: "Creator'lar, markalar için ölçeklenebilir bir dağıtım kanalına dönüşür.",
      },
    ],
  },
  howItWorks: {
    title: "Nasıl çalışır",
    steps: [
      {
        number: 1,
        title: "Kampanyanı başlat",
        description: "Ürünlerini creator kampanyalarına aç.",
      },
      {
        number: 2,
        title: "Creator içerik üretir",
        description: "Ürününü kendi kitlesine tanıtır.",
      },
      {
        number: 3,
        title: "Satıştan kazanılır",
        description: "Performans oluştuğunda model çalışır.",
      },
    ],
  },
  useCase: {
    title: "Kimler için?",
    items: [
      "D2C ve e-ticaret markaları",
      "Sosyal medya odaklı büyüme isteyen ekipler",
      "Ölçülebilir creator iş birlikleri arayan markalar",
    ],
  },
  form: {
    title: "Başvur",
    fields: {
      brandName: "Marka adı",
      website: "Website",
      category: "Kategori",
      email: "Email",
      notes: "Not",
    },
    categories: ["Fashion", "Beauty", "Tech", "Food", "Other"],
    submit: "Gönder",
    success: "Teşekkürler. En kısa sürede dönüş yapacağız.",
  },
};

export const CREATORS_CONTENT = {
  hero: {
    title: {
      line1: "İçerik üretmekten fazlasını yap.",
      line2: "Satış getiren creator ol.",
    },
    cta: "Başvur",
  },
  benefits: {
    title: "Creator'lar için neden farklı?",
    cards: [
      {
        title: "Satış bazlı kazanç",
        description: "İçeriğinden gelen satışlardan komisyon kazan.",
      },
      {
        title: "Marka iş birlikleri",
        description: "E-commerce markalarının kampanyalarına katıl.",
      },
      {
        title: "Kazanç takibi",
        description: "Performansını ve kazancını tek yerden takip et.",
      },
    ],
  },
  howItWorks: {
    title: "Nasıl katılabilirsin?",
    steps: [
      { number: 1, title: "Başvur" },
      { number: 2, title: "Onay al" },
      { number: 3, title: "Kampanyalara katıl" },
    ],
  },
  form: {
    title: "Creator başvurusu",
    fields: {
      name: "İsim",
      email: "Email",
      instagram: "Instagram link",
      tiktok: "TikTok link (opsiyonel)",
      category: "Kategori",
      followers: "Takipçi sayısı",
    },
    categories: ["Beauty", "Fashion", "Lifestyle", "Tech", "Food", "Other"],
    followerRanges: ["1K-10K", "10K-50K", "50K-100K", "100K+"],
    submit: "Creator olarak başvur",
    success: "Başvurun alındı. Uygun kampanyalar için seninle iletişime geçeceğiz.",
  },
  faq: {
    title: "Sıkça Sorulan Sorular",
    items: [
      {
        question: "Kaç takipçi gerekli?",
        answer: "Niş ve aktif hesaplar öncelikli.",
      },
      {
        question: "Nasıl kazanırım?",
        answer: "Satış getirdiğinde komisyon.",
      },
    ],
  },
};

export const NAVIGATION = {
  brands: "For Brands",
  creators: "For Creators",
  contact: "Contact",
};

export const FOOTER = {
  about: "Upcreate — Satış odaklı creator kampanyaları",
  email: "hello@upcreate.co",
  legal: {
    privacy: "Gizlilik Politikası",
    terms: "Kullanım Koşulları",
  },
};
