"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "success" | "warning" | "outline"> = {
  INVITED: "secondary",
  AWAITING_CREATOR: "warning",
  AWAITING_BRAND: "warning",
  MATCHED: "success",
  CREATOR_DECLINED: "destructive",
  BRAND_DECLINED: "destructive",
  ACTIVE: "success",
  COMPLETED: "default",
  CANCELLED: "destructive",
};

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

export default function MatchingPage() {
  const [items, setItems] = useState<MatchingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });

  useEffect(() => {
    api
      .get<MatchingResponse>(`/matching/overview?page=${meta.page}`)
      .then((res) => {
        setItems(res.data);
        setMeta({ page: res.meta.page, totalPages: res.meta.totalPages, total: res.meta.total });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [meta.page]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Matching</h1>
        <p className="text-muted-foreground">
          Campaign-creator matchings and invitation status ({meta.total} total)
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Creator</TableHead>
                <TableHead>Scale</TableHead>
                <TableHead>Fit Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Invited</TableHead>
                <TableHead>Responded</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                    No matchings found
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Link href={`/campaigns/${item.campaign.id}`} className="font-medium text-primary hover:underline">
                        {item.campaign.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/creators/${item.creator.id}`} className="font-medium text-primary hover:underline">
                        {item.creator.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {item.creator.creatorScale && (
                        <Badge variant="outline">{item.creator.creatorScale}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.fitScore !== null ? (
                        <span className="font-mono text-sm">{(item.fitScore * 100).toFixed(0)}%</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[item.status] || "outline"}>
                        {item.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{formatDate(item.invitedAt)}</TableCell>
                    <TableCell className="text-xs">
                      {item.respondedAt ? formatDate(item.respondedAt) : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => setMeta((m) => ({ ...m, page: m.page - 1 }))}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {meta.page} of {meta.totalPages}</span>
          <Button variant="outline" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => setMeta((m) => ({ ...m, page: m.page + 1 }))}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
