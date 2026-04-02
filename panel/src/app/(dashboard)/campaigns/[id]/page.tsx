"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, CheckCircle2, XCircle, Upload, Loader2 } from "lucide-react";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "success" | "warning" | "outline"> = {
  DRAFT: "secondary", ACTIVE: "success", PAUSED: "warning", COMPLETED: "default", CANCELLED: "destructive",
  AWAITING_CREATOR: "warning", AWAITING_BRAND: "warning", CONFIRMED: "success",
  LIVE: "success", CREATOR_DECLINED: "destructive", BRAND_DECLINED: "destructive",
};

interface CampaignDetail {
  id: string;
  title: string;
  brief: string;
  status: string;
  budget: number;
  commissionRate: number;
  productInfo: string;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  brand: { id: string; name: string };
  creators: Array<{
    id: string;
    status: string;
    creator: { id: string; name: string };
    contents?: Array<{ id: string; status: string; storageUrl: string | null; submittedAt: string | null }>;
  }>;
}

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{ creatorId: string; name: string; score: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [submitUrl, setSubmitUrl] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    api
      .get<CampaignDetail>(`/campaigns/${id}`)
      .then(setCampaign)
      .catch(console.error)
      .finally(() => setLoading(false));

    if (user?.role === "ADMIN") {
      api
        .get<{ suggestions: Array<{ creatorId: string; name: string; score: number }> }>(`/matching/suggestions?campaignId=${id}`)
        .then((r) => setSuggestions(r.suggestions || []))
        .catch(() => {});
    }
  }, [id, user?.role]);

  async function handleStatusChange(newStatus: string) {
    setActionLoading(newStatus);
    try {
      const updated = await api.patch<CampaignDetail>(`/campaigns/${id}`, { status: newStatus });
      setCampaign(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleInvite(creatorId: string) {
    setActionLoading(creatorId);
    try {
      await api.post(`/campaigns/${id}/recommend`, { creatorId });
      const updated = await api.get<CampaignDetail>(`/campaigns/${id}`);
      setCampaign(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCreatorResponse(pairingId: string, accept: boolean) {
    setActionLoading(pairingId);
    try {
      await api.patch(`/campaign-creators/${pairingId}/creator-response`, { accept });
      const updated = await api.get<CampaignDetail>(`/campaigns/${id}`);
      setCampaign(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSubmitContent(pairingId: string) {
    if (!submitUrl.trim()) return;
    setSubmitLoading(true);
    setSubmitResult(null);
    try {
      await api.post(`/campaign-creators/${pairingId}/contents`, { storageUrl: submitUrl.trim() });
      setSubmitResult({ success: true, message: "İçerik başarıyla gönderildi! İnceleme bekleniyor." });
      setSubmitUrl("");
      const updated = await api.get<CampaignDetail>(`/campaigns/${id}`);
      setCampaign(updated);
    } catch (err: any) {
      setSubmitResult({ success: false, message: err.message || "İçerik gönderilemedi" });
    } finally {
      setSubmitLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!campaign) return <p>Campaign not found</p>;

  const isAdmin = user?.role === "ADMIN";
  const isCreator = user?.role === "CREATOR";
  // Find this creator's pairing if they're a creator
  const myPairing = isCreator
    ? campaign?.creators?.find((cc) => cc.creator?.id === user?.creatorId)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{campaign.title}</h1>
            <Badge variant={STATUS_VARIANT[campaign.status] || "outline"}>{campaign.status}</Badge>
          </div>
          <p className="text-muted-foreground">
            {campaign.brand?.name} · Created {formatDate(campaign.createdAt)}
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            {campaign.status === "DRAFT" && (
              <Button onClick={() => handleStatusChange("ACTIVE")} disabled={!!actionLoading}>
                Activate
              </Button>
            )}
            {campaign.status === "ACTIVE" && (
              <>
                <Button variant="outline" onClick={() => handleStatusChange("PAUSED")} disabled={!!actionLoading}>
                  Pause
                </Button>
                <Button onClick={() => handleStatusChange("COMPLETED")} disabled={!!actionLoading}>
                  Complete
                </Button>
              </>
            )}
            {campaign.status === "PAUSED" && (
              <Button onClick={() => handleStatusChange("ACTIVE")} disabled={!!actionLoading}>
                Resume
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Budget</span>
              <span className="font-medium">{formatCurrency(campaign.budget || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Commission</span>
              <span className="font-medium">{campaign.commissionRate ? `${campaign.commissionRate}%` : "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Start</span>
              <span className="font-medium">{campaign.startsAt ? formatDate(campaign.startsAt) : "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">End</span>
              <span className="font-medium">{campaign.endsAt ? formatDate(campaign.endsAt) : "-"}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Brief & Product Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {campaign.brief && <p>{campaign.brief}</p>}
            {campaign.productInfo && (
              <div>
                <p className="font-medium mb-1">Product Info</p>
                <p className="text-muted-foreground">{campaign.productInfo}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Creator: Invitation Response & Content Submission */}
      {isCreator && myPairing && (
        <Card>
          <CardHeader>
            <CardTitle>Kampanya Durumun</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Durum</span>
              <Badge variant={STATUS_VARIANT[myPairing.status] || "outline"}>
                {myPairing.status.replace(/_/g, " ")}
              </Badge>
            </div>

            {/* Davet kabul/ret */}
            {myPairing.status === "AWAITING_CREATOR" && (
              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1 gap-2"
                  onClick={() => handleCreatorResponse(myPairing.id, true)}
                  disabled={!!actionLoading}
                >
                  {actionLoading === myPairing.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Daveti Kabul Et
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2 text-destructive hover:text-destructive"
                  onClick={() => handleCreatorResponse(myPairing.id, false)}
                  disabled={!!actionLoading}
                >
                  <XCircle className="h-4 w-4" />
                  Reddet
                </Button>
              </div>
            )}

            {/* İçerik gönderme */}
            {(myPairing.status === "CONFIRMED" || myPairing.status === "LIVE" || myPairing.status === "AWAITING_BRAND") && (
              <div className="space-y-3 border-t border-border pt-4">
                <p className="text-sm font-medium">İçerik Gönder</p>
                {submitResult && (
                  <div className={`flex items-center gap-2 rounded-lg p-3 text-sm ${submitResult.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                    {submitResult.success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    {submitResult.message}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Instagram/TikTok post URL veya drive linki..."
                    value={submitUrl}
                    onChange={(e) => setSubmitUrl(e.target.value)}
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <Button
                    onClick={() => handleSubmitContent(myPairing.id)}
                    disabled={submitLoading || !submitUrl.trim()}
                    className="gap-2"
                  >
                    {submitLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Gönder
                  </Button>
                </div>

                {/* Geçmiş içerikler */}
                {myPairing.contents && myPairing.contents.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs font-medium text-muted-foreground">Gönderilen İçerikler</p>
                    {myPairing.contents.map((c) => (
                      <div key={c.id} className="flex items-center justify-between rounded-lg border border-border p-2 text-xs">
                        <span className="truncate text-muted-foreground max-w-[250px]">{c.storageUrl || "—"}</span>
                        <Badge variant={c.status === "APPROVED" ? "success" : c.status === "REJECTED" ? "destructive" : "warning"} className="ml-2 shrink-0">
                          {c.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* WMS Timeline - Creators */}
      <Card>
        <CardHeader>
          <CardTitle>Creators ({campaign.creators?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Creator</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!campaign.creators || campaign.creators.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground py-6">
                    No creators assigned yet
                  </TableCell>
                </TableRow>
              ) : (
                campaign.creators.map((cc) => (
                  <TableRow key={cc.id}>
                    <TableCell className="font-medium">{cc.creator?.name}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[cc.status] || "outline"}>
                        {cc.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Matching Suggestions (Admin only) */}
      {isAdmin && suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Matching Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Creator</TableHead>
                  <TableHead>Fit Score</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suggestions.map((s) => (
                  <TableRow key={s.creatorId}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.score}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => handleInvite(s.creatorId)}
                        disabled={actionLoading === s.creatorId}
                      >
                        Invite
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
