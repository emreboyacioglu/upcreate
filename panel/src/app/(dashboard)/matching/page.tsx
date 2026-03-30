"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

interface MatchingItem {
  id: string;
  status: string;
  invitedAt: string;
  respondedAt: string | null;
  campaign: { id: string; title: string; status: string };
  creator: { id: string; name: string; creatorScale: string | null };
  fitScore: number | null;
}

interface MatchingResponse {
  data: MatchingItem[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  AWAITING_CREATOR: "outline",
  AWAITING_BRAND: "outline",
  CREATOR_DECLINED: "destructive",
  BRAND_DECLINED: "destructive",
  MATCHED: "default",
  CONTENT_SUBMITTED: "secondary",
  CONTENT_APPROVED: "default",
  CONTENT_REVISION_REQUESTED: "outline",
  PUBLISHED: "default",
  COMPLETED: "secondary",
};

function ScoreBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value * 100));
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-16 rounded-full bg-muted">
        <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium">{pct.toFixed(0)}%</span>
    </div>
  );
}

export default function MatchingPage() {
  const [data, setData] = useState<MatchingItem[]>([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchData = (page: number, status: string) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (status) params.set("status", status);
    api
      .get<MatchingResponse>(`/matching/overview?${params}`)
      .then((res) => {
        setData(res.data);
        setMeta(res.meta);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData(1, statusFilter);
  }, [statusFilter]);

  const statuses = [
    "",
    "AWAITING_CREATOR",
    "AWAITING_BRAND",
    "MATCHED",
    "CREATOR_DECLINED",
    "BRAND_DECLINED",
    "CONTENT_SUBMITTED",
    "PUBLISHED",
    "COMPLETED",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Matching</h1>
        <p className="text-muted-foreground">Campaign-creator matchings and invitation status</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <Button
            key={s || "all"}
            variant={statusFilter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(s)}
          >
            {s ? s.replace(/_/g, " ") : "All"}
          </Button>
        ))}
      </div>

      {/* How Matching Works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">How Matching Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6 text-xs text-muted-foreground">
            <div>
              <span className="font-medium text-foreground">Fit Score</span> = 50% topic overlap + 50% commerce score
            </div>
            <div>
              <span className="font-medium text-foreground">Commerce Score</span> = avg(platform scores) where platform = 0.6 x engagement + 0.4 x intent
            </div>
            <div>
              <span className="font-medium text-foreground">Ranking</span> = 60% fit + 40% commerce
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : data.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No matchings found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Campaign</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Creator</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fit Score</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Scale</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Invited</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Responded</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item) => (
                    <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <Link
                          href={`/campaigns/${item.campaign.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {item.campaign.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/creators/${item.creator.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {item.creator.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[item.status] || "outline"}>
                          {item.status.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {item.fitScore != null ? <ScoreBar value={item.fitScore} /> : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {item.creator.creatorScale ? (
                          <Badge variant="outline">{item.creator.creatorScale}</Badge>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(item.invitedAt)}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {item.respondedAt ? formatDate(item.respondedAt) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {meta.page} of {meta.totalPages} ({meta.total} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => fetchData(meta.page - 1, statusFilter)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page >= meta.totalPages}
              onClick={() => fetchData(meta.page + 1, statusFilter)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
