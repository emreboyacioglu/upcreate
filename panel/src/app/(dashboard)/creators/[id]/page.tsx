"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatNumber, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  Eye,
  Activity,
  Users,
  Globe,
  Heart,
  MessageCircle,
  Instagram,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface CreatorDetail {
  id: string;
  name: string;
  email: string;
  bio: string;
  creatorScale: string;
  lastPostAt: string;
  categories: string[];
  topics: string[];
  accounts: Array<{
    id: string;
    platform: string;
    username: string;
    handle?: string;
    followerCount: number;
    isConnected: boolean;
    isVerified?: boolean;
    lastIngestedAt: string | null;
  }>;
  paymentInfo: {
    bankName: string;
    iban: string;
    accountHolder: string;
  } | null;
  commerceScore: { commerceScore: number } | null;
}

interface IntelligenceProfile {
  creatorId: string;
  commerceScore: {
    score: number;
    engagementScore: number;
    intentScore: number;
    byPlatform: Array<{
      platform: string;
      engagementScore: number;
      intentScore: number;
      platformScore: number;
    }>;
  };
  engagementQuality: { rate: number; label: string };
  reachPotential: { avgViews: number; normalized: number; label: string };
  creatorScale: string | null;
  creatorActivity: {
    lastPostAt: string | null;
    postsLast30d: number;
    avgDaysBetweenPosts: number | null;
    label: string;
  };
  recentContent: Array<{
    id: string;
    caption: string | null;
    likes: number;
    commentsCount: number;
    views: number;
    postedAt: string | null;
    mediaType: string | null;
    platform: string;
  }>;
  audienceOverview: {
    countries: Record<string, number>;
    ageRanges: Record<string, number>;
    genderSplit: Record<string, number>;
  } | null;
  commentInsights: {
    totalAnalyzed: number;
    overallSentiment: number;
    overallSentimentLabel: string;
    purchaseIntentRate: number;
    audienceEngagementDepth: number;
    uniqueCommenters: number;
    topCommenters: Array<{ username: string; count: number; avgSentiment: number }>;
  } | null;
  computedAt: string;
}

type Tab = "overview" | "intelligence";

const ENGAGEMENT_COLORS: Record<string, string> = {
  EXCELLENT: "bg-emerald-100 text-emerald-700",
  GOOD: "bg-blue-100 text-blue-700",
  AVERAGE: "bg-amber-100 text-amber-700",
  LOW: "bg-red-100 text-red-700",
};

const ACTIVITY_COLORS: Record<string, string> = {
  VERY_ACTIVE: "bg-emerald-100 text-emerald-700",
  ACTIVE: "bg-blue-100 text-blue-700",
  MODERATE: "bg-amber-100 text-amber-700",
  LOW: "bg-orange-100 text-orange-700",
  INACTIVE: "bg-red-100 text-red-700",
};

const REACH_COLORS: Record<string, string> = {
  HIGH: "bg-emerald-100 text-emerald-700",
  MEDIUM: "bg-blue-100 text-blue-700",
  LOW: "bg-amber-100 text-amber-700",
  MINIMAL: "bg-red-100 text-red-700",
};

const SENTIMENT_COLORS: Record<string, string> = {
  VERY_POSITIVE: "bg-emerald-100 text-emerald-700",
  POSITIVE: "bg-blue-100 text-blue-700",
  NEUTRAL: "bg-gray-100 text-gray-700",
  NEGATIVE: "bg-orange-100 text-orange-700",
  VERY_NEGATIVE: "bg-red-100 text-red-700",
};

const SENTIMENT_EMOJI: Record<string, string> = {
  VERY_POSITIVE: "😍",
  POSITIVE: "😊",
  NEUTRAL: "😐",
  NEGATIVE: "😕",
  VERY_NEGATIVE: "😡",
};

function ScoreBar({ value, max = 1 }: { value: number; max?: number }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="h-2 w-full rounded-full bg-muted">
      <div
        className="h-2 rounded-full bg-primary transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function CreatorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [creator, setCreator] = useState<CreatorDetail | null>(null);
  const [intel, setIntel] = useState<IntelligenceProfile | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [ingestingAccount, setIngestingAccount] = useState<string | null>(null);
  const [ingestResult, setIngestResult] = useState<{ accountId: string; success: boolean; message: string } | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<CreatorDetail>(`/creators/${id}`),
      api.get<IntelligenceProfile>(`/intelligence/${id}/profile`).catch(() => null),
    ])
      .then(([c, i]) => {
        setCreator(c);
        setIntel(i);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const refreshIntelligence = async () => {
    setComputing(true);
    try {
      const profile = await api.post<IntelligenceProfile>(`/intelligence/${id}/compute`);
      setIntel(profile);
    } catch (err) {
      console.error(err);
    } finally {
      setComputing(false);
    }
  };

  const ingestAccount = async (accountId: string) => {
    setIngestingAccount(accountId);
    setIngestResult(null);
    try {
      const result = await api.post<{ message: string }>(`/creators/${id}/accounts/${accountId}/ingest`);
      setIngestResult({ accountId, success: true, message: result.message });
      // Refresh creator data to get updated follower counts
      const updated = await api.get<CreatorDetail>(`/creators/${id}`);
      setCreator(updated);
    } catch (err: any) {
      setIngestResult({ accountId, success: false, message: err.message || "Veri cekimi basarisiz" });
    } finally {
      setIngestingAccount(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!creator) return <p>Creator not found</p>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{creator.name}</h1>
            <p className="text-muted-foreground">{creator.email}</p>
          </div>
        </div>
        {tab === "intelligence" && (
          <Button onClick={refreshIntelligence} disabled={computing} size="sm">
            <RefreshCw className={`mr-2 h-4 w-4 ${computing ? "animate-spin" : ""}`} />
            {computing ? "Computing..." : "Refresh Intelligence"}
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        <button
          onClick={() => setTab("overview")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === "overview" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setTab("intelligence")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === "intelligence" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Intelligence
        </button>
      </div>

      {tab === "overview" && (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Scale</span>
                  <Badge variant="outline">{creator.creatorScale || "N/A"}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Commerce Score</span>
                  <span className="font-medium">
                    {creator.commerceScore?.commerceScore?.toFixed(3) ?? "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Post</span>
                  <span className="font-medium">
                    {creator.lastPostAt ? formatDate(creator.lastPostAt) : "-"}
                  </span>
                </div>
                {creator.bio && <p className="pt-2 text-muted-foreground">{creator.bio}</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Categories & Topics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  {(creator.categories || []).map((c) => (
                    <Badge key={c} variant="default">{c}</Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {(creator.topics || []).map((t) => (
                    <Badge key={t} variant="secondary">{t}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bank Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {creator.paymentInfo ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bank</span>
                      <span className="font-medium">{creator.paymentInfo.bankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IBAN</span>
                      <span className="font-medium font-mono text-xs">{creator.paymentInfo.iban}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Holder</span>
                      <span className="font-medium">{creator.paymentInfo.accountHolder}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">No bank info provided</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sosyal Hesaplar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ingestResult && (
                <div className={`flex items-center gap-2 rounded-lg p-3 text-sm ${ingestResult.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                  {ingestResult.success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  {ingestResult.message}
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(creator.accounts || []).map((acc) => (
                  <div key={acc.id} className="rounded-lg border border-border p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        {acc.platform === "INSTAGRAM" ? (
                          <Instagram className={`h-5 w-5 ${acc.isConnected ? "text-pink-500" : ""}`} />
                        ) : (
                          <span className="font-bold text-sm">{acc.platform[0]}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">@{acc.username || acc.handle}</p>
                        <p className="text-xs text-muted-foreground">
                          {acc.platform} · {formatNumber(acc.followerCount)} takipci
                          {acc.isConnected && (
                            <span className="text-emerald-600"> · Bagli</span>
                          )}
                        </p>
                      </div>
                    </div>
                    {acc.lastIngestedAt && (
                      <p className="text-xs text-muted-foreground">
                        Son veri: {formatDate(acc.lastIngestedAt)}
                      </p>
                    )}
                    {acc.platform === "INSTAGRAM" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2"
                        disabled={ingestingAccount === acc.id}
                        onClick={() => ingestAccount(acc.id)}
                      >
                        {ingestingAccount === acc.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        {ingestingAccount === acc.id ? "Veriler cekiliyor..." : "Instagram Verilerini Cek"}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {tab === "intelligence" && (
        <>
          {!intel ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">No intelligence data computed yet.</p>
                <Button onClick={refreshIntelligence} disabled={computing}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${computing ? "animate-spin" : ""}`} />
                  Compute Intelligence
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Score Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Commerce Score */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-muted-foreground">Commerce Score</span>
                    </div>
                    <p className="text-3xl font-bold">{(intel.commerceScore.score * 100).toFixed(1)}%</p>
                    <ScoreBar value={intel.commerceScore.score} />
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>
                        <span>Engagement</span>
                        <p className="font-medium text-foreground">
                          {(intel.commerceScore.engagementScore * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <span>Intent</span>
                        <p className="font-medium text-foreground">
                          {(intel.commerceScore.intentScore * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Engagement Quality */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Heart className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-muted-foreground">Engagement Quality</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-3xl font-bold">{(intel.engagementQuality.rate * 100).toFixed(2)}%</p>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ENGAGEMENT_COLORS[intel.engagementQuality.label] || ""}`}>
                        {intel.engagementQuality.label}
                      </span>
                    </div>
                    <ScoreBar value={intel.engagementQuality.rate} max={0.1} />
                  </CardContent>
                </Card>

                {/* Reach Potential */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Eye className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-muted-foreground">Reach Potential</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-3xl font-bold">{formatNumber(Math.round(intel.reachPotential.avgViews))}</p>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${REACH_COLORS[intel.reachPotential.label] || ""}`}>
                        {intel.reachPotential.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">avg views / post</p>
                  </CardContent>
                </Card>

                {/* Creator Scale */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-muted-foreground">Creator Scale</span>
                    </div>
                    <p className="text-3xl font-bold">{intel.creatorScale ?? "N/A"}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatNumber(creator.accounts?.reduce((s, a) => s + a.followerCount, 0) || 0)} total followers
                    </p>
                  </CardContent>
                </Card>

                {/* Activity */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-muted-foreground">Creator Activity</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-3xl font-bold">{intel.creatorActivity.postsLast30d}</p>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ACTIVITY_COLORS[intel.creatorActivity.label] || ""}`}>
                        {intel.creatorActivity.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      posts / 30 days
                      {intel.creatorActivity.avgDaysBetweenPosts != null &&
                        ` · avg ${intel.creatorActivity.avgDaysBetweenPosts}d between posts`}
                    </p>
                  </CardContent>
                </Card>

                {/* Audience Overview */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Globe className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-muted-foreground">Audience Overview</span>
                    </div>
                    {intel.audienceOverview ? (
                      <div className="space-y-2 text-xs">
                        {Object.entries(intel.audienceOverview.countries).slice(0, 3).map(([country, pct]) => (
                          <div key={country} className="flex justify-between">
                            <span>{country}</span>
                            <span className="font-medium">{(Number(pct) * 100).toFixed(0)}%</span>
                          </div>
                        ))}
                        {Object.entries(intel.audienceOverview.genderSplit).map(([gender, pct]) => (
                          <div key={gender} className="flex justify-between">
                            <span className="capitalize">{gender}</span>
                            <span className="font-medium">{(Number(pct) * 100).toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No audience data</p>
                    )}
                  </CardContent>
                </Card>

                {/* Sentiment Score */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-muted-foreground">Yorum Duygusu</span>
                    </div>
                    {intel.commentInsights && intel.commentInsights.totalAnalyzed > 0 ? (
                      <>
                        <div className="flex items-center gap-3">
                          <p className="text-3xl font-bold">
                            {SENTIMENT_EMOJI[intel.commentInsights.overallSentimentLabel] || "😐"}{" "}
                            {intel.commentInsights.overallSentiment > 0 ? "+" : ""}
                            {intel.commentInsights.overallSentiment.toFixed(2)}
                          </p>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${SENTIMENT_COLORS[intel.commentInsights.overallSentimentLabel] || ""}`}>
                            {intel.commentInsights.overallSentimentLabel}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {intel.commentInsights.totalAnalyzed} yorum analiz edildi · {intel.commentInsights.uniqueCommenters} benzersiz yorumcu
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Yorum verisi yok</p>
                    )}
                  </CardContent>
                </Card>

                {/* Purchase Intent */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-muted-foreground">Satin Alma Niyeti</span>
                    </div>
                    {intel.commentInsights && intel.commentInsights.totalAnalyzed > 0 ? (
                      <>
                        <p className="text-3xl font-bold">
                          {(intel.commentInsights.purchaseIntentRate * 100).toFixed(1)}%
                        </p>
                        <ScoreBar value={intel.commentInsights.purchaseIntentRate} />
                        <p className="text-xs text-muted-foreground mt-1">
                          yorumlarda satin alma niyeti orani
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Yorum verisi yok</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Platform Breakdown */}
              {intel.commerceScore.byPlatform.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Platform Scores</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {intel.commerceScore.byPlatform.map((p) => (
                        <div key={p.platform} className="rounded-lg border border-border p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                              {p.platform[0]}
                            </div>
                            <span className="font-medium">{p.platform}</span>
                            <span className="ml-auto text-lg font-bold">{(p.platformScore * 100).toFixed(1)}%</span>
                          </div>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Engagement Score</span>
                              <span className="font-medium">{(p.engagementScore * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Intent Score</span>
                              <span className="font-medium">{(p.intentScore * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Formula</span>
                              <span className="font-mono text-muted-foreground">0.6 × eng + 0.4 × intent</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Top Commenters */}
              {intel.commentInsights && intel.commentInsights.topCommenters.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>En Aktif Yorumcular</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {intel.commentInsights.topCommenters.map((c, i) => (
                        <div key={c.username} className="flex items-center gap-3 rounded-lg border border-border p-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {i + 1}
                          </span>
                          <span className="font-medium text-sm">@{c.username}</span>
                          <span className="text-xs text-muted-foreground">{c.count} yorum</span>
                          <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${
                            c.avgSentiment > 0.3 ? "bg-emerald-100 text-emerald-700" :
                            c.avgSentiment < -0.3 ? "bg-red-100 text-red-700" :
                            "bg-gray-100 text-gray-700"
                          }`}>
                            {c.avgSentiment > 0 ? "+" : ""}{c.avgSentiment.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Content */}
              {intel.recentContent.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {intel.recentContent.map((post) => (
                        <div key={post.id} className="flex items-center gap-4 rounded-lg border border-border p-3">
                          <Badge variant="outline" className="shrink-0">{post.platform}</Badge>
                          <p className="flex-1 truncate text-sm">{post.caption || "No caption"}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" /> {formatNumber(post.likes)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" /> {formatNumber(post.commentsCount)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" /> {formatNumber(post.views)}
                            </span>
                          </div>
                          {post.postedAt && (
                            <span className="text-xs text-muted-foreground shrink-0">{formatDate(post.postedAt)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Computation Info */}
              <p className="text-xs text-muted-foreground text-right">
                Last computed: {formatDate(intel.computedAt)}
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}
