import { prisma } from "../config/db";

export function normalizeValue(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

// --- Content Topic Extraction ---

const TOPIC_KEYWORDS: Record<string, string[]> = {
  yemek: ["yemek", "tarif", "mutfak", "lezzetli", "food", "recipe", "cook", "restoran", "kahvaltı", "yiyecek", "tatlı", "içecek", "smoothie", "vegan", "gluten"],
  moda: ["moda", "kıyafet", "stil", "outfit", "fashion", "giyim", "elbise", "aksesuar", "trend", "tasarım", "şık"],
  güzellik: ["güzellik", "makyaj", "cilt", "saç", "beauty", "makeup", "skincare", "parfüm", "kozmetik", "bakım"],
  spor: ["spor", "fitness", "egzersiz", "antrenman", "koşu", "gym", "workout", "sağlıklı", "yoga", "pilates"],
  seyahat: ["seyahat", "gezi", "tur", "tatil", "travel", "destination", "keşfet", "yolculuk", "otel", "şehir"],
  teknoloji: ["teknoloji", "tech", "gadget", "telefon", "bilgisayar", "uygulama", "yazılım", "dijital", "ai", "yapay zeka"],
  ev: ["ev", "dekorasyon", "interior", "home", "tasarım", "mobilya", "yaşam", "dekor"],
  "anne-bebek": ["anne", "bebek", "çocuk", "aile", "doğum", "hamile", "mama", "oyuncak"],
  doğa: ["doğa", "bitki", "bahçe", "nature", "çiçek", "yeşil", "çevre", "sürdürülebilir", "organik", "ekoloji"],
  sanat: ["sanat", "art", "resim", "çizim", "müzik", "dans", "tiyatro", "yaratıcı", "fotoğraf", "tasarım"],
  spor_otomotiv: ["araba", "motor", "otomobil", "araç", "car", "motorsport"],
  finans: ["finans", "yatırım", "borsa", "kripto", "para", "finance", "investment"],
  eğitim: ["eğitim", "öğrenci", "üniversite", "kurs", "öğrenmek", "education", "bilgi"],
};

/**
 * Extract content topics from an array of captions using keyword matching.
 * Returns a deduplicated array of detected topic labels.
 */
export function extractTopicsFromCaptions(captions: (string | null)[]): string[] {
  const topicHits = new Map<string, number>();

  for (const caption of captions) {
    if (!caption) continue;
    const lower = caption.toLowerCase();

    for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
      for (const kw of keywords) {
        if (lower.includes(kw)) {
          topicHits.set(topic, (topicHits.get(topic) ?? 0) + 1);
          break; // Count topic once per caption
        }
      }
    }
  }

  // Return topics that appear in at least 2 posts (or once if very few posts)
  const minHits = captions.length >= 5 ? 2 : 1;
  return Array.from(topicHits.entries())
    .filter(([, hits]) => hits >= minHits)
    .sort((a, b) => b[1] - a[1])
    .map(([topic]) => topic);
}

export async function calculateAccountMetrics(accountId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const account = await prisma.socialAccount.findUniqueOrThrow({
    where: { id: accountId },
  });

  let posts = await prisma.contentPost.findMany({
    where: { accountId, postedAt: { gte: thirtyDaysAgo } },
  });

  // Fallback: if no recent posts, use the most recent 20 overall
  if (posts.length === 0) {
    posts = await prisma.contentPost.findMany({
      where: { accountId },
      orderBy: { postedAt: "desc" },
      take: 20,
    });
  }

  if (posts.length === 0) {
    return prisma.accountMetrics.upsert({
      where: { accountId },
      update: {
        avgLikes30d: 0,
        avgComments30d: 0,
        avgViews30d: 0,
        engagementRate: 0,
        calculatedAt: new Date(),
      },
      create: {
        accountId,
        avgLikes30d: 0,
        avgComments30d: 0,
        avgViews30d: 0,
        engagementRate: 0,
      },
    });
  }

  const totalLikes = posts.reduce((sum, p) => sum + p.likes, 0);
  const totalComments = posts.reduce((sum, p) => sum + p.commentsCount, 0);
  const totalViews = posts.reduce((sum, p) => sum + p.views, 0);

  const avgLikes30d = totalLikes / posts.length;
  const avgComments30d = totalComments / posts.length;
  const avgViews30d = totalViews / posts.length;

  const engagementRate =
    account.followerCount > 0 ? (avgLikes30d + avgComments30d) / account.followerCount : 0;

  // Extract content topics from ALL stored captions (not just recent 30-day window)
  const allPosts = await prisma.contentPost.findMany({
    where: { accountId },
    select: { caption: true },
    orderBy: { postedAt: "desc" },
    take: 100,
  });
  const contentTopics = extractTopicsFromCaptions(allPosts.map((p) => p.caption));

  return prisma.accountMetrics.upsert({
    where: { accountId },
    update: {
      avgLikes30d,
      avgComments30d,
      avgViews30d,
      engagementRate,
      contentTopics,
      calculatedAt: new Date(),
    },
    create: {
      accountId,
      avgLikes30d,
      avgComments30d,
      avgViews30d,
      engagementRate,
      contentTopics,
    },
  });
}

export async function calculateCommerceScore(creatorId: string) {
  const accounts = await prisma.socialAccount.findMany({
    where: { creatorId },
  });

  for (const account of accounts) {
    await calculateAccountMetrics(account.id);
  }

  const accountsWithMetrics = await prisma.socialAccount.findMany({
    where: { creatorId },
    include: { metrics: true },
  });

  const totalFollowers = accountsWithMetrics.reduce((sum, a) => sum + a.followerCount, 0);

  let weightedEngagement = 0;
  if (totalFollowers > 0) {
    for (const a of accountsWithMetrics) {
      const rate = a.metrics?.engagementRate ?? 0;
      weightedEngagement += rate * a.followerCount;
    }
    weightedEngagement /= totalFollowers;
  }

  const allMetrics = await prisma.accountMetrics.findMany({
    select: { avgViews30d: true },
  });
  const allViews = allMetrics.map((m) => m.avgViews30d);
  const minViews = Math.min(...allViews, 0);
  const maxViews = Math.max(...allViews, 1);

  const totalAvgViews = accountsWithMetrics.reduce(
    (sum, a) => sum + (a.metrics?.avgViews30d ?? 0),
    0
  );
  const normalizedViews = normalizeValue(totalAvgViews, minViews, maxViews);

  const engagementScore = 0.5 * weightedEngagement + 0.5 * normalizedViews;

  let intentScore = 0;
  const connectedAccounts = accountsWithMetrics.filter((a) => a.isConnected);
  if (connectedAccounts.length > 0) {
    const connectedIds = connectedAccounts.map((a) => a.id);
    const posts = await prisma.contentPost.findMany({
      where: { accountId: { in: connectedIds } },
    });
    const totalComments = posts.reduce((sum, p) => sum + p.commentsCount, 0);
    const totalLikes = posts.reduce((sum, p) => sum + p.likes, 0);
    const totalEngagement = totalComments + totalLikes;
    intentScore = totalEngagement > 0 ? totalComments / totalEngagement : 0;
  }

  const commerceScore = 0.6 * engagementScore + 0.4 * intentScore;

  return prisma.commerceScore.upsert({
    where: { creatorId },
    update: {
      engagementScore,
      intentScore,
      commerceScore,
      calculatedAt: new Date(),
    },
    create: {
      creatorId,
      engagementScore,
      intentScore,
      commerceScore,
    },
  });
}
