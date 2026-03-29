import { prisma } from "../config/db";

interface RawPost {
  postId?: string;
  caption?: string;
  mediaType?: string;
  likes?: number;
  commentsCount?: number;
  views?: number;
  postedAt?: Date;
}

export async function ingestInstagram(username: string): Promise<string> {
  console.log(`[ingestion] Instagram ingest requested for @${username}`);
  // TODO: Integrate Instagram Graph API / scraping service
  return `Instagram ingestion for @${username} is not yet implemented. Connect the IG API in Phase 2.`;
}

export async function ingestTikTok(username: string): Promise<string> {
  console.log(`[ingestion] TikTok ingest requested for @${username}`);
  // TODO: Integrate TikTok Research API
  return `TikTok ingestion for @${username} is not yet implemented. Connect the TikTok API in Phase 2.`;
}

export async function saveContentPosts(
  accountId: string,
  posts: RawPost[]
): Promise<number> {
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
