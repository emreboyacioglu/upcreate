"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";
import { Instagram, RefreshCw, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";

interface SocialAccount {
  platform: string;
  username: string;
  followerCount: number;
  isConnected: boolean;
  lastIngestedAt: string | null;
}

interface Creator {
  id: string;
  name: string;
  email: string;
  creatorScale: string;
  categories: string[];
  accounts: SocialAccount[];
  commerceScore?: { commerceScore: number } | null;
}

interface PaginatedResponse {
  data: Creator[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

interface BulkIngestResult {
  total: number;
  success: number;
  failed: number;
  tokenExpired?: boolean;
  results: Array<{ accountId: string; username: string; status: string; message: string }>;
}

export default function CreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [bulkIngesting, setBulkIngesting] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkIngestResult | null>(null);
  const [tokenStatus, setTokenStatus] = useState<{ valid: boolean; expiresAt?: string; error?: string } | null>(null);

  const fetchCreators = useCallback((page: number) => {
    setLoading(true);
    api
      .get<PaginatedResponse>(`/creators?page=${page}`)
      .then((res) => {
        setCreators(res.data);
        setMeta({ page: res.meta.page, totalPages: res.meta.totalPages, total: res.meta.total });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchCreators(meta.page);
  }, [meta.page, fetchCreators]);

  useEffect(() => {
    api.get<{ valid: boolean; expiresAt?: string; error?: string }>("/creators/ig-token-status")
      .then(setTokenStatus)
      .catch(() => setTokenStatus({ valid: false, error: "Token durumu alinamadi" }));
  }, []);

  const handleBulkIngest = async () => {
    setBulkIngesting(true);
    setBulkResult(null);
    try {
      const result = await api.post<BulkIngestResult>("/creators/ingest-all-connected?platform=INSTAGRAM");
      setBulkResult(result);
      // Refresh the list to show updated data
      fetchCreators(meta.page);
    } catch (err) {
      console.error(err);
    } finally {
      setBulkIngesting(false);
    }
  };

  const hasConnectedIG = (c: Creator) =>
    c.accounts?.some((a) => a.platform === "INSTAGRAM" && a.isConnected);

  const getIGAccount = (c: Creator) =>
    c.accounts?.find((a) => a.platform === "INSTAGRAM");

  const connectedCount = creators.filter(hasConnectedIG).length;

  if (loading && creators.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const daysUntilExpiry = tokenStatus?.expiresAt
    ? Math.ceil((new Date(tokenStatus.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="space-y-6">
      {tokenStatus && !tokenStatus.valid && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-amber-800">Instagram Token Gecersiz</p>
            <p className="text-sm text-amber-700">{tokenStatus.error || "Token suresi dolmus. Yeni token gerekli."}</p>
          </div>
        </div>
      )}
      {tokenStatus?.valid && daysUntilExpiry !== null && daysUntilExpiry <= 7 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-amber-800">Instagram Token {daysUntilExpiry} Gun Icinde Dolacak</p>
            <p className="text-sm text-amber-700">Veri cekimi durmasin diye tokeni yenileyin.</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Creators</h1>
          <p className="text-muted-foreground">
            {meta.total} creator &middot; {connectedCount} Instagram bagli
          </p>
        </div>
        <Button
          onClick={handleBulkIngest}
          disabled={bulkIngesting}
          size="sm"
          className="gap-2"
        >
          {bulkIngesting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {bulkIngesting ? "Veriler cekiliyor..." : "Tum IG Verilerini Cek"}
        </Button>
      </div>

      {bulkResult && (
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center gap-4 text-sm">
              <span className="font-medium">Toplu Veri Cekimi Sonucu:</span>
              <Badge variant="default">{bulkResult.success} basarili</Badge>
              {bulkResult.failed > 0 && (
                <Badge variant="destructive">{bulkResult.failed} hatali</Badge>
              )}
              {bulkResult.tokenExpired && (
                <Badge variant="destructive">Token Suresi Dolmus!</Badge>
              )}
              <span className="text-muted-foreground">/ {bulkResult.total} toplam</span>
              <Button variant="ghost" size="sm" onClick={() => setBulkResult(null)} className="ml-auto text-xs">
                Kapat
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Olcek</TableHead>
                <TableHead>Kategoriler</TableHead>
                <TableHead className="text-right">Takipci</TableHead>
                <TableHead>Commerce</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creators.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                    Creator bulunamadi
                  </TableCell>
                </TableRow>
              ) : (
                creators.map((c) => {
                  const igAccount = getIGAccount(c);
                  const isConnected = hasConnectedIG(c);
                  const totalFollowers = (c.accounts || []).reduce((s, a) => s + a.followerCount, 0);
                  const commerceScore = c.commerceScore?.commerceScore;

                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Link href={`/creators/${c.id}`} className="font-medium text-primary hover:underline">
                          {c.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {igAccount && (
                            <div className="flex items-center gap-1">
                              <Instagram
                                className={`h-4 w-4 ${isConnected ? "text-pink-500" : "text-muted-foreground/40"}`}
                              />
                              {isConnected && (
                                <span className="text-xs text-muted-foreground">@{igAccount.username}</span>
                              )}
                            </div>
                          )}
                          {c.accounts?.some((a) => a.platform === "TIKTOK") && (
                            <Badge variant="outline" className="text-xs px-1.5">TT</Badge>
                          )}
                          {!c.accounts?.length && (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{c.creatorScale || "N/A"}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(c.categories || []).slice(0, 3).map((cat) => (
                            <Badge key={cat} variant="secondary" className="text-xs">
                              {cat}
                            </Badge>
                          ))}
                          {(c.categories || []).length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{c.categories.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatNumber(totalFollowers)}
                      </TableCell>
                      <TableCell>
                        {commerceScore != null ? (
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-12 rounded-full bg-muted">
                              <div
                                className="h-2 rounded-full bg-primary"
                                style={{ width: `${Math.min(100, commerceScore * 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium">
                              {(commerceScore * 100).toFixed(0)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Sayfa {meta.page} / {meta.totalPages} ({meta.total} toplam)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => setMeta((m) => ({ ...m, page: m.page - 1 }))}
            >
              Onceki
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page >= meta.totalPages}
              onClick={() => setMeta((m) => ({ ...m, page: m.page + 1 }))}
            >
              Sonraki
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
