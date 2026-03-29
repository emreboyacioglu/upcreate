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
import { ArrowLeft } from "lucide-react";

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!campaign) return <p>Campaign not found</p>;

  const isAdmin = user?.role === "ADMIN";

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
