import { prisma } from "../config/db";
import { Platform } from "@prisma/client";

// --- Types ---

interface RawPost {
  postId?: string;
  caption?: string;
  mediaType?: string;
  likes?: number;
  commentsCount?: number;
  views?: number;
  postedAt?: Date;
}

interface IGMediaEdge {
  id: string;
  caption?: string;
  media_type?: string;
  like_count?: number;
  comments_count?: number;
  timestamp?: string;
  media_url?: string;
  permalink?: string;
}

interface IGBusinessDiscoveryResponse {
  business_discovery: {
    id: string;
    username: string;
    name?: string;
    biography?: string;
    followers_count?: number;
    follows_count?: number;
    media_count?: number;
    profile_picture_url?: string;
    media?: {
      data: IGMediaEdge[];
      paging?: { cursors?: { after?: string }; next?: string };
    };
  };
}

// --- Instagram Graph API ---

const IG_GRAPH_URL = "https://graph.facebook.com/v21.0";

function getIgAccessToken(): string {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) throw new Error("INSTAGRAM_ACCESS_TOKEN env var is not set");
  return token;
}

function getIgAccountId(): string {
  const id = process.env.INSTAGRAM_ACCOUNT_ID;
  if (!id) throw new Error("INSTAGRAM_ACCOUNT_ID env var is not set");
  return id;
}

/**
 * Fetch a creator's Instagram profile + recent media via Business Discovery API.
 * Requires a valid long-lived IG access token and the app's own IG account ID.
 */
async function fetchInstagramProfile(username: string): Promise<{
  profile: {
    username: string;
    name?: string;
    biography?: string;
    followersCount: number;
    followsCount: number;
    mediaCount: number;
    profilePictureUrl?: string;
  };
  posts: RawPost[];
}> {
  const token = getIgAccessToken();
  const accountId = getIgAccountId();

  const fields = [
    "username",
    "name",
    "biography",
    "followers_count",
    "follows_count",
    "media_count",
    "profile_picture_url",
    "media{id,caption,media_type,like_count,comments_count,timestamp,permalink}",
  ].join(",");

  const url = `${IG_GRAPH_URL}/${accountId}?fields=business_discovery.fields(${fields})&business_discovery.username=${username}&access_token=${token}`;

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const errorMsg = (body as any)?.error?.message || `HTTP ${res.status}`;
    throw new Error(`Instagram API error for @${username}: ${errorMsg}`);
  }

  const data = (await res.json()) as IGBusinessDiscoveryResponse;
  const bd = data.business_discovery;

  const posts: RawPost[] = (bd.media?.data || []).map((m) => ({
    postId: m.id,
    caption: m.caption || undefined,
    mediaType: m.media_type || undefined,
    likes: m.like_count ?? 0,
    commentsCount: m.comments_count ?? 0,
    views: 0, // IG Business Discovery doesn't return views for feed posts
    postedAt: m.timestamp ? new Date(m.timestamp) : undefined,
  }));

  return {
    profile: {
      username: bd.username,
      name: bd.name,
      biography: bd.biography,
      followersCount: bd.followers_count ?? 0,
      followsCount: bd.follows_count ?? 0,
      mediaCount: bd.media_count ?? 0,
      profilePictureUrl: bd.profile_picture_url,
    },
    posts,
  };
}

// --- Core Ingestion Functions ---

/**
 * Ingest Instagram data for a specific social account.
 * Fetches profile + posts from IG API, saves to DB, updates metrics.
 */
export async function ingestInstagram(accountId: string, username: string): Promise<{
  message: string;
  postsIngested: number;
  followersCount: number;
}> {
  console.log(`[ingestion] Instagram ingest started for @${username} (account: ${accountId})`);

  const { profile, posts } = await fetchInstagramProfile(username);

  // Update social account with latest follower count
  await prisma.socialAccount.update({
    where: { id: accountId },
    data: {
      followerCount: profile.followersCount,
      isConnected: true,
      lastIngestedAt: new Date(),
      profileUrl: `https://instagram.com/${profile.username}`,
    },
  });

  // Save posts
  const postsIngested = await saveContentPosts(accountId, posts);

  // Calculate account metrics from posts
  await calculateAndSaveMetrics(accountId, profile.followersCount);

  // Update creator's lastPostAt
  const account = await prisma.socialAccount.findUnique({
    where: { id: accountId },
    select: { creatorId: true },
  });
  if (account && posts.length > 0) {
    const latestPost = posts.reduce((latest, p) =>
      p.postedAt && (!latest.postedAt || p.postedAt > latest.postedAt) ? p : latest
    );
    if (latestPost.postedAt) {
      await prisma.creator.update({
        where: { id: account.creatorId },
        data: { lastPostAt: latestPost.postedAt },
      });
    }
  }

  console.log(`[ingestion] Instagram ingest completed for @${username}: ${postsIngested} posts`);

  return {
    message: `Successfully ingested @${username}: ${profile.followersCount} followers, ${postsIngested} new posts`,
    postsIngested,
    followersCount: profile.followersCount,
  };
}

export async function ingestTikTok(accountId: string, username: string): Promise<{
  message: string;
  postsIngested: number;
  followersCount: number;
}> {
  console.log(`[ingestion] TikTok ingest requested for @${username}`);
  // TikTok API integration placeholder
  throw new Error(`TikTok ingestion for @${username} is not yet implemented.`);
}

// --- Bulk Ingestion ---

export interface BulkIngestResult {
  total: number;
  success: number;
  failed: number;
  results: Array<{
    accountId: string;
    username: string;
    platform: string;
    status: "success" | "error";
    message: string;
  }>;
}

/**
 * Ingest data for all connected Instagram accounts.
 * Designed to be callable from both HTTP endpoints and cron jobs.
 */
export async function ingestAllConnected(platform?: Platform): Promise<BulkIngestResult> {
  const where: any = { isConnected: true };
  if (platform) where.platform = platform;

  const accounts = await prisma.socialAccount.findMany({
    where,
    select: { id: true, username: true, platform: true },
  });

  const results: BulkIngestResult["results"] = [];

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
          message: `${account.platform} ingestion not yet implemented`,
        });
      }
    } catch (err: any) {
      results.push({
        accountId: account.id,
        username: account.username,
        platform: account.platform,
        status: "error",
        message: err.message || "Unknown error",
      });
    }
  }

  return {
    total: accounts.length,
    success: results.filter((r) => r.status === "success").length,
    failed: results.filter((r) => r.status === "error").length,
    results,
  };
}

// --- Helpers ---

export async function saveContentPosts(accountId: string, posts: RawPost[]): Promise<number> {
  const data = posts.map((p) => ({
    accountId,
    postId: p.postId ?? null,
    caption: p.caption ?? null,
    mediaType: p.mediaType ?? null,
    likes: p.likes ?? 0,
    commentsCount: p.commentsCount ?? 0,
    views: p.views ?? 0,
    postedAt: p.postedAt ?? null,
  }));

  const result = await prisma.contentPost.createMany({ data, skipDuplicates: true });
  return result.count;
}

async function calculateAndSaveMetrics(accountId: string, followerCount: number): Promise<void> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentPosts = await prisma.contentPost.findMany({
    where: { accountId, postedAt: { gte: thirtyDaysAgo } },
    orderBy: { postedAt: "desc" },
  });

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
