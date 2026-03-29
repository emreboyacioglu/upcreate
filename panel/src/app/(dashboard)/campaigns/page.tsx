"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus } from "lucide-react";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "success" | "warning" | "outline"> = {
  DRAFT: "secondary",
  ACTIVE: "success",
  PAUSED: "warning",
  COMPLETED: "default",
  CANCELLED: "destructive",
};

interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

interface Campaign {
  id: string;
  title: string;
  status: string;
  budget: number;
  commissionRate: number;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  brand?: { id: string; name: string };
  _count?: { creators: number };
}

interface CampaignCreatorPairing {
  id: string;
  status: string;
  campaign: {
    id: string;
    title: string;
    budget: number;
    commissionRate: number;
    status: string;
    brand: { id: string; name: string };
  };
}

export default function CampaignsPage() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [pairings, setPairings] = useState<CampaignCreatorPairing[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });

  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    api
      .get<PaginatedResponse<Campaign | CampaignCreatorPairing>>(`/me/campaigns?page=${meta.page}`)
      .then((res) => {
        if (isAdmin) {
          setCampaigns(res.data as Campaign[]);
        } else {
          setPairings(res.data as CampaignCreatorPairing[]);
        }
        setMeta({ page: res.meta.page, totalPages: res.meta.totalPages });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [meta.page, isAdmin]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">
            {isAdmin ? "Manage all campaigns" : "Your campaign invitations"}
          </p>
        </div>
        {isAdmin && (
          <Link href="/campaigns/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Campaign
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {isAdmin ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Creators</TableHead>
                  <TableHead>Period</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                      No campaigns found
                    </TableCell>
                  </TableRow>
                ) : (
                  campaigns.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Link href={`/campaigns/${c.id}`} className="font-medium text-primary hover:underline">
                          {c.title}
                        </Link>
                      </TableCell>
                      <TableCell>{c.brand?.name}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[c.status] || "outline"}>{c.status}</Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(c.budget || 0)}</TableCell>
                      <TableCell>{c._count?.creators || 0}</TableCell>
                      <TableCell className="text-xs">
                        {c.startsAt ? formatDate(c.startsAt) : "?"} — {c.endsAt ? formatDate(c.endsAt) : "?"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pairings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                      No campaign invitations yet
                    </TableCell>
                  </TableRow>
                ) : (
                  pairings.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link href={`/campaigns/${p.campaign.id}`} className="font-medium text-primary hover:underline">
                          {p.campaign.title}
                        </Link>
                      </TableCell>
                      <TableCell>{p.campaign.brand?.name}</TableCell>
                      <TableCell>{formatCurrency(p.campaign.budget || 0)}</TableCell>
                      <TableCell>{p.campaign.commissionRate ? `${p.campaign.commissionRate}%` : "-"}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[p.status] || "outline"}>
                          {p.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={meta.page <= 1}
            onClick={() => setMeta((m) => ({ ...m, page: m.page - 1 }))}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {meta.page} of {meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={meta.page >= meta.totalPages}
            onClick={() => setMeta((m) => ({ ...m, page: m.page + 1 }))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
