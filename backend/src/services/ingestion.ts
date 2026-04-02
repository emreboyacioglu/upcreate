import { prisma } from "../config/db";
import { Platform } from "@prisma/client";

// --- Types ---

interface RawPost {
  postId: string;
  caption?: string;
  mediaType?: string;
  likes: number;
  commentsCount: number;
  views: number;
  postedAt?: Date;
}

interface IGMediaNode {
  id: string;
  caption?: string;
  media_type?: string;
  like_count?: number;
  comments_count?: number;
  timestamp?: string;
}

interface IGProfileData {
  id: string;
  name?: string;
  username?: string;
  biography?: string;
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
  profile_picture_url?: string;
}

interface IGMediaResponse {
  data: IGMediaNode[];
  paging?: { cursors?: { after?: string }; next?: string };
}

interface IGCommentNode {
  id: string;
  text: string;
  username: string;
  like_count?: number;
  timestamp?: string;
  replies?: { data: IGCommentNode[] };
}

export interface IngestResult {
  message: string;
  postsIngested: number;
  followersCount: number;
  tokenExpired?: boolean;
}

export interface BulkIngestResult {
  total: number;
  success: number;
  failed: number;
  tokenExpired: boolean;
  results: Array<{
    accountId: string;
    username: string;
    platform: string;
    status: "success" | "error";
    message: string;
  }>;
}

/** How many days of posts to keep per account (1 year — enough for seasonal analysis) */
const DATA_RETENTION_DAYS = 365;
/**
 * Only keep posts within the retention window.
 * Pagination continues until we run out of pages OR hit a post older than retention.
 * IG returns 25 per page; for 90-day retention a typical active creator has ~30-90 posts.
 * Hard safety cap to avoid runaway pagination (e.g. accounts with 10K+ posts).
 */
const MAX_POSTS_PER_INGEST = 500;

// --- Instagram Graph API ---

const IG_GRAPH_URL = "https://graph.facebook.com/v21.0";

function getIgAccessToken(): string {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) throw new IngestionError("INSTAGRAM_ACCESS_TOKEN env var is not set", "CONFIG_ERROR");
  return token;
}

function getIgAccountId(): string {
  const id = process.env.INSTAGRAM_ACCOUNT_ID;
  if (!id) throw new IngestionError("INSTAGRAM_ACCOUNT_ID env var is not set", "CONFIG_ERROR");
  return id;
}

// --- Error Types ---

export type IngestionErrorCode = "TOKEN_EXPIRED" | "TOKEN_INVALID" | "RATE_LIMITED" | "NOT_FOUND" | "API_ERROR" | "CONFIG_ERROR";

export class IngestionError extends Error {
  code: IngestionErrorCode;
  constructor(message: string, code: IngestionErrorCode) {
    super(message);
    this.name = "IngestionError";
    this.code = code;
  }
}

function classifyIGError(body: any): IngestionError {
  const error = body?.error;
  if (!error) return new IngestionError("Unknown Instagram API error", "API_ERROR");

  const code = error.code;
  const subcode = error.error_subcode;
  const msg = error.message || "Unknown error";

  // Token expired or invalid
  if (code === 190) {
    if (subcode === 463 || subcode === 467) {
      return new IngestionError(`Instagram token expired: ${msg}`, "TOKEN_EXPIRED");
    }
    return new IngestionError(`Instagram token invalid: ${msg}`, "TOKEN_INVALID");
  }

  // Rate limited
  if (code === 4 || code === 32) {
    return new IngestionError(`Instagram rate limited: ${msg}`, "RATE_LIMITED");
  }

  // User not found or not a business account
  if (code === 100) {
    return new IngestionError(`Instagram user not found or not a business account: ${msg}`, "NOT_FOUND");
  }

  return new IngestionError(`Instagram API error (${code}): ${msg}`, "API_ERROR");
}

// --- API Fetch Helpers ---

/**
 * Fetch IG profile data directly (for accounts we own/have token for).
 * Works with the current User Access Token.
 */
async function fetchIGProfileDirect(igAccountId: string, token: string): Promise<IGProfileData> {
  const fields = "id,name,username,biography,followers_count,follows_count,media_count,profile_picture_url";
  const url = `${IG_GRAPH_URL}/${igAccountId}?fields=${fields}&access_token=${encodeURIComponent(token)}`;

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw classifyIGError(body);
  }
  return (await res.json()) as IGProfileData;
}

/**
 * Fetch media for an IG account directly.
 * Paginates through all pages, stopping when:
 * - Posts are older than the retention window (90 days)
 * - Safety cap reached (MAX_POSTS_PER_INGEST)
 * - No more pages
 */
async function fetchIGMediaDirect(igAccountId: string, token: string): Promise<RawPost[]> {
  const fields = "id,caption,media_type,like_count,comments_count,timestamp";
  let url: string | null = `${IG_GRAPH_URL}/${igAccountId}/media?fields=${fields}&limit=25&access_token=${encodeURIComponent(token)}`;
  const allPosts: RawPost[] = [];
  const retentionCutoff = new Date();
  retentionCutoff.setDate(retentionCutoff.getDate() - DATA_RETENTION_DAYS);
  let hitRetentionLimit = false;

  while (url && allPosts.length < MAX_POSTS_PER_INGEST && !hitRetentionLimit) {
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw classifyIGError(body);
    }
    const data = (await res.json()) as IGMediaResponse;

    for (const m of data.data) {
      const postedAt = m.timestamp ? new Date(m.timestamp) : undefined;
      // Stop if post is older than retention window
      if (postedAt && postedAt < retentionCutoff) {
        hitRetentionLimit = true;
        break;
      }
      allPosts.push({
        postId: m.id,
        caption: m.caption || undefined,
        mediaType: m.media_type || undefined,
        likes: m.like_count ?? 0,
        commentsCount: m.comments_count ?? 0,
        views: 0,
        postedAt,
      });
    }

    url = hitRetentionLimit ? null : (data.paging?.next || null);
  }

  return allPosts;
}

/**
 * Fetch a creator's profile + media via Business Discovery API.
 * Requires a Page Access Token with instagram_basic permission.
 * Falls back to direct fetch if business_discovery fails.
 */
async function fetchIGProfileViaBusinessDiscovery(
  ownIgAccountId: string,
  targetUsername: string,
  token: string
): Promise<{ profile: IGProfileData; posts: RawPost[] }> {
  const mediaFields = "id,caption,media_type,like_count,comments_count,timestamp";
  const profileFields = `username,name,biography,followers_count,follows_count,media_count,profile_picture_url,media{${mediaFields}}`;

  const url = `${IG_GRAPH_URL}/${ownIgAccountId}?fields=business_discovery.fields(${encodeURIComponent(profileFields)})&business_discovery.username=${encodeURIComponent(targetUsername)}&access_token=${encodeURIComponent(token)}`;

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw classifyIGError(body);
  }

  const data = (await res.json()) as { business_discovery: IGProfileData & { media?: IGMediaResponse } };
  const bd = data.business_discovery;

  const posts: RawPost[] = (bd.media?.data || []).map((m) => ({
    postId: m.id,
    caption: m.caption || undefined,
    mediaType: m.media_type || undefined,
    likes: m.like_count ?? 0,
    commentsCount: m.comments_count ?? 0,
    views: 0,
    postedAt: m.timestamp ? new Date(m.timestamp) : undefined,
  }));

  return { profile: bd, posts };
}

// --- Comment Fetching ---

/** Max comments to fetch per post */
const MAX_COMMENTS_PER_POST = 50;
/** How many recent posts to fetch comments for during ingest */
const COMMENT_FETCH_POST_LIMIT = 20;

/**
 * Fetch comments for a single IG media item.
 * Only works for media owned by the authenticated account.
 */
async function fetchIGComments(mediaId: string, token: string): Promise<IGCommentNode[]> {
  const fields = "id,text,username,like_count,timestamp,replies{id,text,username,like_count,timestamp}";
  const url = `${IG_GRAPH_URL}/${mediaId}/comments?fields=${fields}&limit=${MAX_COMMENTS_PER_POST}&access_token=${encodeURIComponent(token)}`;

  const res = await fetch(url);
  if (!res.ok) {
    // Comments might not be available for all media types — skip gracefully
    const body = await res.json().catch(() => ({} as any));
    const errCode = (body as any)?.error?.code;
    if (errCode === 100 || errCode === 10) {
      // 100 = unsupported get for this media, 10 = permission issue
      return [];
    }
    throw classifyIGError(body);
  }

  const data = (await res.json()) as { data: IGCommentNode[] };
  return data.data || [];
}

/**
 * Save comments for a post. Upserts by igId to avoid duplicates.
 * Also flattens replies into the same table with isReply=true.
 */
async function upsertPostComments(
  dbPostId: string,
  comments: IGCommentNode[],
): Promise<number> {
  let count = 0;

  for (const c of comments) {
    if (!c.id || !c.text) continue;

    await prisma.postComment.upsert({
      where: { igId: c.id },
      update: {
        text: c.text,
        likeCount: c.like_count ?? 0,
      },
      create: {
        postId: dbPostId,
        igId: c.id,
        username: c.username || "unknown",
        text: c.text,
        likeCount: c.like_count ?? 0,
        postedAt: c.timestamp ? new Date(c.timestamp) : null,
        isReply: false,
      },
    });
    count++;

    // Flatten replies
    if (c.replies?.data) {
      for (const r of c.replies.data) {
        if (!r.id || !r.text) continue;
        await prisma.postComment.upsert({
          where: { igId: r.id },
          update: {
            text: r.text,
            likeCount: r.like_count ?? 0,
          },
          create: {
            postId: dbPostId,
            igId: r.id,
            username: r.username || "unknown",
            text: r.text,
            likeCount: r.like_count ?? 0,
            postedAt: r.timestamp ? new Date(r.timestamp) : null,
            isReply: true,
          },
        });
        count++;
      }
    }
  }

  return count;
}

/**
 * Fetch and save comments for the most recent posts of an account.
 * Only works for directly connected accounts (own media).
 */
async function ingestCommentsForAccount(accountId: string, token: string): Promise<number> {
  // Get the most recent posts that have an IG post ID
  const recentPosts = await prisma.contentPost.findMany({
    where: { accountId, postId: { not: null } },
    orderBy: { postedAt: "desc" },
    take: COMMENT_FETCH_POST_LIMIT,
    select: { id: true, postId: true },
  });

  let totalComments = 0;

  for (const post of recentPosts) {
    if (!post.postId) continue;
    try {
      const comments = await fetchIGComments(post.postId, token);
      if (comments.length > 0) {
        const saved = await upsertPostComments(post.id, comments);
        totalComments += saved;
      }
    } catch (err) {
      if (err instanceof IngestionError && (err.code === "TOKEN_EXPIRED" || err.code === "TOKEN_INVALID")) {
        throw err; // Bubble up token errors
      }
      // Skip individual post comment errors (rate limit, unsupported media, etc.)
      console.warn(`[ingestion] Could not fetch comments for post ${post.postId}: ${(err as Error).message}`);
    }
  }

  return totalComments;
}

// --- Core Ingestion ---

/**
 * Ingest Instagram data for a specific social account.
 *
 * Strategy:
 * 1. If the account's IG ID matches our own IG account → direct API access
 * 2. Try Business Discovery for other accounts
 * 3. If Business Discovery fails (no page token) → try direct if we have the IG user ID
 */
export async function ingestInstagram(accountId: string, username: string): Promise<IngestResult> {
  console.log(`[ingestion] Instagram ingest started for @${username} (account: ${accountId})`);

  const token = getIgAccessToken();
  const ownIgAccountId = getIgAccountId();

  let profile: IGProfileData;
  let posts: RawPost[];

  // Check if this account has a stored IG user ID (from previous ingestion or manual entry)
  const socialAccount = await prisma.socialAccount.findUnique({ where: { id: accountId } });
  const storedIgUserId = socialAccount?.metadata
    ? (socialAccount.metadata as any)?.igUserId
    : null;

  // Strategy: try direct fetch first (works for our own account), then business discovery
  const igUserIdToTry = storedIgUserId || (username === "vahaaco" ? ownIgAccountId : null);

  if (igUserIdToTry) {
    // Direct API access
    try {
      profile = await fetchIGProfileDirect(igUserIdToTry, token);
      posts = await fetchIGMediaDirect(igUserIdToTry, token);
    } catch (err) {
      if (err instanceof IngestionError && (err.code === "TOKEN_EXPIRED" || err.code === "TOKEN_INVALID")) {
        throw err; // Bubble up token errors
      }
      // Fallback to Business Discovery
      const result = await fetchIGProfileViaBusinessDiscovery(ownIgAccountId, username, token);
      profile = result.profile;
      posts = result.posts;
    }
  } else {
    // Try Business Discovery
    try {
      const result = await fetchIGProfileViaBusinessDiscovery(ownIgAccountId, username, token);
      profile = result.profile;
      posts = result.posts;
    } catch (err) {
      if (err instanceof IngestionError && err.code === "NOT_FOUND") {
        // Business Discovery failed — account may not be a business account
        throw new IngestionError(
          `@${username} bulunamadi. Hesap Business/Creator modunda olmali veya direkt baglanti gerekli.`,
          "NOT_FOUND"
        );
      }
      throw err;
    }
  }

  const followersCount = profile.followers_count ?? 0;

  // Update social account
  await prisma.socialAccount.update({
    where: { id: accountId },
    data: {
      followerCount: followersCount,
      isConnected: true,
      lastIngestedAt: new Date(),
      profileUrl: `https://instagram.com/${profile.username || username}`,
    },
  });

  // Clean old posts (retention policy) then save new ones
  await cleanOldPosts(accountId);
  const postsIngested = await upsertContentPosts(accountId, posts);

  // Calculate metrics
  await calculateAndSaveMetrics(accountId, followersCount);

  // Fetch comments for recent posts (only for direct API — we have token access)
  let commentsIngested = 0;
  if (igUserIdToTry) {
    try {
      commentsIngested = await ingestCommentsForAccount(accountId, token);
      if (commentsIngested > 0) {
        console.log(`[ingestion] Ingested ${commentsIngested} comments for @${username}`);
      }
    } catch (err) {
      if (err instanceof IngestionError && (err.code === "TOKEN_EXPIRED" || err.code === "TOKEN_INVALID")) {
        throw err;
      }
      console.warn(`[ingestion] Comment ingestion failed for @${username}: ${(err as Error).message}`);
    }
  }

  // Update creator profile
  const account = await prisma.socialAccount.findUnique({
    where: { id: accountId },
    select: { creatorId: true },
  });
  if (account) {
    const updateData: any = {};
    if (profile.biography) updateData.bio = profile.biography;
    if (profile.profile_picture_url) updateData.avatarUrl = profile.profile_picture_url;
    if (posts.length > 0) {
      const latestPost = posts.reduce((latest, p) =>
        p.postedAt && (!latest.postedAt || p.postedAt > latest.postedAt) ? p : latest
      );
      if (latestPost.postedAt) updateData.lastPostAt = latestPost.postedAt;
    }
    if (Object.keys(updateData).length > 0) {
      await prisma.creator.update({ where: { id: account.creatorId }, data: updateData });
    }
  }

  console.log(`[ingestion] Instagram ingest completed for @${username}: ${postsIngested} posts, ${followersCount} followers`);

  return {
    message: `@${username} basariyla guncellendi: ${followersCount} takipci, ${postsIngested} yeni post`,
    postsIngested,
    followersCount,
  };
}

export async function ingestTikTok(accountId: string, username: string): Promise<IngestResult> {
  throw new IngestionError(`TikTok entegrasyonu henuz aktif degil (@${username}).`, "CONFIG_ERROR");
}

// --- Bulk Ingestion (cron-compatible) ---

export async function ingestAllConnected(platform?: Platform): Promise<BulkIngestResult> {
  const where: any = { isConnected: true };
  if (platform) where.platform = platform;

  const accounts = await prisma.socialAccount.findMany({
    where,
    select: { id: true, username: true, platform: true },
  });

  const results: BulkIngestResult["results"] = [];
  let tokenExpired = false;

  for (const account of accounts) {
    try {
      if (account.platform === "INSTAGRAM") {
        const result = await ingestInstagram(account.id, account.username);
        results.push({
          accountId: account.id,
          username: account.username,
          platform: account.platform,
          status: "success",
          message: result.message,
        });
      } else {
        results.push({
          accountId: account.id,
          username: account.username,
          platform: account.platform,
          status: "error",
          message: `${account.platform} entegrasyonu henuz aktif degil`,
        });
      }
    } catch (err: any) {
      const isTokenError = err instanceof IngestionError &&
        (err.code === "TOKEN_EXPIRED" || err.code === "TOKEN_INVALID");
      if (isTokenError) tokenExpired = true;

      results.push({
        accountId: account.id,
        username: account.username,
        platform: account.platform,
        status: "error",
        message: err.message || "Bilinmeyen hata",
      });

      // If token expired, stop processing — all subsequent requests will fail too
      if (isTokenError) break;
    }
  }

  return {
    total: accounts.length,
    success: results.filter((r) => r.status === "success").length,
    failed: results.filter((r) => r.status === "error").length,
    tokenExpired,
    results,
  };
}

// --- Token Health Check ---

export async function checkTokenHealth(): Promise<{
  valid: boolean;
  expiresAt?: Date;
  error?: string;
  code?: IngestionErrorCode;
}> {
  try {
    const token = getIgAccessToken();
    // Use debug_token endpoint
    const url = `${IG_GRAPH_URL}/debug_token?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(token)}`;
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const err = classifyIGError(body);
      return { valid: false, error: err.message, code: err.code };
    }
    const data = (await res.json()) as any;
    const tokenData = data.data;

    if (!tokenData.is_valid) {
      return { valid: false, error: "Token gecersiz veya suresi dolmus", code: "TOKEN_EXPIRED" };
    }

    return {
      valid: true,
      expiresAt: tokenData.expires_at ? new Date(tokenData.expires_at * 1000) : undefined,
    };
  } catch (err: any) {
    if (err instanceof IngestionError) {
      return { valid: false, error: err.message, code: err.code };
    }
    return { valid: false, error: err.message };
  }
}

// --- Data Retention ---

async function cleanOldPosts(accountId: string): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - DATA_RETENTION_DAYS);

  const result = await prisma.contentPost.deleteMany({
    where: {
      accountId,
      postedAt: { lt: cutoff },
    },
  });

  if (result.count > 0) {
    console.log(`[ingestion] Cleaned ${result.count} posts older than ${DATA_RETENTION_DAYS} days for account ${accountId}`);
  }
  return result.count;
}

// --- Helpers ---

/**
 * Upsert posts: update existing (by postId), insert new ones.
 * This prevents duplicates and keeps data fresh on each ingest.
 */
async function upsertContentPosts(accountId: string, posts: RawPost[]): Promise<number> {
  let inserted = 0;

  for (const p of posts) {
    if (!p.postId) continue;

    const existing = await prisma.contentPost.findFirst({
      where: { accountId, postId: p.postId },
    });

    if (existing) {
      // Update engagement metrics
      await prisma.contentPost.update({
        where: { id: existing.id },
        data: {
          likes: p.likes,
          commentsCount: p.commentsCount,
          views: p.views,
          caption: p.caption ?? existing.caption,
        },
      });
    } else {
      await prisma.contentPost.create({
        data: {
          accountId,
          postId: p.postId,
          caption: p.caption ?? null,
          mediaType: p.mediaType ?? null,
          likes: p.likes,
          commentsCount: p.commentsCount,
          views: p.views,
          postedAt: p.postedAt ?? null,
        },
      });
      inserted++;
    }
  }

  return inserted;
}

async function calculateAndSaveMetrics(accountId: string, followerCount: number): Promise<void> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let recentPosts = await prisma.contentPost.findMany({
    where: { accountId, postedAt: { gte: thirtyDaysAgo } },
    orderBy: { postedAt: "desc" },
  });

  // If no posts in last 30 days, fall back to most recent 20 posts overall.
  // This ensures creators with older content still get scored (e.g. vahaaco).
  if (recentPosts.length === 0) {
    recentPosts = await prisma.contentPost.findMany({
      where: { accountId },
      orderBy: { postedAt: "desc" },
      take: 20,
    });
  }

  if (recentPosts.length === 0) return;

  const avgLikes30d = recentPosts.reduce((s, p) => s + p.likes, 0) / recentPosts.length;
  const avgComments30d = recentPosts.reduce((s, p) => s + p.commentsCount, 0) / recentPosts.length;
  const avgViews30d = recentPosts.reduce((s, p) => s + p.views, 0) / recentPosts.length;

  const engagementRate =
    followerCount > 0
      ? (avgLikes30d + avgComments30d) / followerCount
      : 0;

  await prisma.accountMetrics.upsert({
    where: { accountId },
    update: {
      avgLikes30d,
      avgComments30d,
      avgViews30d,
      engagementRate,
      calculatedAt: new Date(),
    },
    create: {
      accountId,
      avgLikes30d,
      avgComments30d,
      avgViews30d,
      engagementRate,
    },
  });
}
