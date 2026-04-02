import { prisma } from "../config/db";

// --- Keyword Lists (Turkish + English) ---

const POSITIVE_KEYWORDS = [
  // Turkish
  "harika", "süper", "güzel", "muhteşem", "mükemmel", "bayıldım", "çok iyi",
  "tebrikler", "bravo", "sevdim", "aşk", "efsane", "olağanüstü", "şahane",
  // English
  "love", "amazing", "great", "perfect", "beautiful", "awesome", "fantastic",
  "wonderful", "incredible", "excellent", "gorgeous", "best", "brilliant",
  // Emoji
  "❤️", "🔥", "👏", "😍", "💕", "🙌", "💯", "✨", "😘", "💪", "👍", "🥰", "💖",
];

const NEGATIVE_KEYWORDS = [
  // Turkish
  "kötü", "berbat", "rezalet", "saçma", "beğenmedim", "hayal kırıklığı",
  "kötüydü", "olmamış", "vasat", "sıkıcı", "anlamsız",
  // English
  "bad", "terrible", "worst", "disappointing", "awful", "ugly", "horrible",
  "hate", "boring", "waste", "cheap", "fake", "scam",
  // Emoji
  "👎", "😡", "🤮", "💩", "😤",
];

const PURCHASE_INTENT_KEYWORDS = [
  // Turkish
  "nereden", "fiyat", "kaç tl", "kaç lira", "nasıl alırım", "satın",
  "sipariş", "almak istiyorum", "link", "linki", "indirim", "kod",
  "kupon", "kampanya", "stokta", "beden", "numara", "renk seçenekleri",
  "kargo", "teslimat", "iade", "garanti",
  // English
  "where", "price", "buy", "how much", "order", "purchase", "discount",
  "code", "coupon", "stock", "size", "color", "shipping", "delivery",
  "available", "cost", "deal", "sale", "shop",
];

// --- Types ---

export interface CommentSentimentResult {
  sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  purchaseIntent: boolean;
}

export interface PostCommentAnalysis {
  postId: string;
  totalComments: number;
  sentimentBreakdown: { positive: number; negative: number; neutral: number };
  sentimentScore: number; // -1 to +1
  purchaseIntentRate: number; // 0-1
  avgLikesPerComment: number;
}

export type SentimentLabel = "VERY_POSITIVE" | "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "VERY_NEGATIVE";

export interface CreatorCommentInsights {
  totalAnalyzed: number;
  overallSentiment: number; // -1 to +1
  overallSentimentLabel: SentimentLabel;
  purchaseIntentRate: number;
  audienceEngagementDepth: number; // avg comment length as engagement depth proxy
  uniqueCommenters: number;
  topCommenters: Array<{ username: string; count: number; avgSentiment: number }>;
}

// --- Analysis Functions ---

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[.,!?;:'"()\[\]{}]/g, " ");
}

/**
 * Analyze a single comment for sentiment and purchase intent.
 * Keyword-based MVP — fast, deterministic, no external API cost.
 */
export function analyzeComment(text: string): CommentSentimentResult {
  const normalized = normalizeText(text);

  let positiveHits = 0;
  let negativeHits = 0;
  let intentHit = false;

  for (const kw of POSITIVE_KEYWORDS) {
    if (normalized.includes(kw.toLowerCase())) positiveHits++;
  }

  for (const kw of NEGATIVE_KEYWORDS) {
    if (normalized.includes(kw.toLowerCase())) negativeHits++;
  }

  for (const kw of PURCHASE_INTENT_KEYWORDS) {
    if (normalized.includes(kw.toLowerCase())) {
      intentHit = true;
      break;
    }
  }

  let sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  if (positiveHits > negativeHits) {
    sentiment = "POSITIVE";
  } else if (negativeHits > positiveHits) {
    sentiment = "NEGATIVE";
  } else {
    sentiment = "NEUTRAL";
  }

  return { sentiment, purchaseIntent: intentHit };
}

function sentimentToNumber(s: "POSITIVE" | "NEGATIVE" | "NEUTRAL"): number {
  if (s === "POSITIVE") return 1;
  if (s === "NEGATIVE") return -1;
  return 0;
}

function sentimentLabel(score: number): SentimentLabel {
  if (score > 0.5) return "VERY_POSITIVE";
  if (score > 0.15) return "POSITIVE";
  if (score > -0.15) return "NEUTRAL";
  if (score > -0.5) return "NEGATIVE";
  return "VERY_NEGATIVE";
}

/**
 * Analyze all stored comments for a creator and persist sentiment/intent on each comment.
 * Returns aggregated insights.
 */
export async function analyzeCreatorComments(creatorId: string): Promise<CreatorCommentInsights> {
  // Get all comments for this creator's posts
  const comments = await prisma.postComment.findMany({
    where: {
      post: { account: { creatorId } },
    },
    select: {
      id: true,
      text: true,
      username: true,
      likeCount: true,
      sentiment: true,
      purchaseIntent: true,
    },
  });

  if (comments.length === 0) {
    return {
      totalAnalyzed: 0,
      overallSentiment: 0,
      overallSentimentLabel: "NEUTRAL",
      purchaseIntentRate: 0,
      audienceEngagementDepth: 0,
      uniqueCommenters: 0,
      topCommenters: [],
    };
  }

  // Analyze each comment and batch-update
  const analyses: Array<{ id: string; sentiment: string; purchaseIntent: boolean; username: string }> = [];

  for (const comment of comments) {
    const result = analyzeComment(comment.text);
    analyses.push({
      id: comment.id,
      sentiment: result.sentiment,
      purchaseIntent: result.purchaseIntent,
      username: comment.username,
    });
  }

  // Batch update comment records with analysis results
  for (const a of analyses) {
    await prisma.postComment.update({
      where: { id: a.id },
      data: { sentiment: a.sentiment, purchaseIntent: a.purchaseIntent },
    });
  }

  // Aggregate
  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;
  let intentCount = 0;
  let totalTextLength = 0;
  const commenterMap = new Map<string, { count: number; sentimentSum: number }>();

  for (const a of analyses) {
    const comment = comments.find((c) => c.id === a.id)!;

    if (a.sentiment === "POSITIVE") positiveCount++;
    else if (a.sentiment === "NEGATIVE") negativeCount++;
    else neutralCount++;

    if (a.purchaseIntent) intentCount++;
    totalTextLength += comment.text.length;

    const existing = commenterMap.get(a.username) ?? { count: 0, sentimentSum: 0 };
    existing.count++;
    existing.sentimentSum += sentimentToNumber(a.sentiment as "POSITIVE" | "NEGATIVE" | "NEUTRAL");
    commenterMap.set(a.username, existing);
  }

  const total = analyses.length;
  const overallSentiment = (positiveCount - negativeCount) / total;

  // Top commenters (sorted by count)
  const topCommenters = Array.from(commenterMap.entries())
    .map(([username, data]) => ({
      username,
      count: data.count,
      avgSentiment: Math.round((data.sentimentSum / data.count) * 100) / 100,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalAnalyzed: total,
    overallSentiment: Math.round(overallSentiment * 100) / 100,
    overallSentimentLabel: sentimentLabel(overallSentiment),
    purchaseIntentRate: Math.round((intentCount / total) * 100) / 100,
    audienceEngagementDepth: Math.round(totalTextLength / total),
    uniqueCommenters: commenterMap.size,
    topCommenters,
  };
}
