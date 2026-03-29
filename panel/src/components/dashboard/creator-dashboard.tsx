"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";
import { Megaphone, Wallet, Clock, FileText } from "lucide-react";

const STATUS_BADGE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "success" | "warning" | "outline"> = {
  AWAITING_CREATOR: "warning",
  AWAITING_BRAND: "warning",
  CONFIRMED: "success",
  LIVE: "success",
  COMPLETED: "default",
  CREATOR_DECLINED: "destructive",
  BRAND_DECLINED: "destructive",
  PENDING: "warning",
  APPROVED: "success",
  PAID: "success",
};

interface CreatorDashboardProps {
  data: Record<string, unknown>;
}

export function CreatorDashboard({ data }: CreatorDashboardProps) {
  const kpis = (data.kpis || {}) as Record<string, number>;
  const myPairings = (data.myPairings || []) as Array<{
    id: string;
    status: string;
    campaign: {
      id: string;
      title: string;
      budget: number;
      commissionRate: number;
      brand: { id: string; name: string };
    };
  }>;
  const recentTransactions = (data.recentTransactions || []) as Array<{
    id: string;
    type: string;
    amount: number;
    status: string;
    createdAt: string;
    campaignCreator: {
      campaign: { id: string; title: string };
    };
  }>;

  const kpiCards = [
    { label: "Active Campaigns", value: formatNumber(kpis.activeCampaigns || 0), icon: Megaphone, color: "text-emerald-600" },
    { label: "Total Campaigns", value: formatNumber(kpis.totalCampaigns || 0), icon: Megaphone, color: "text-blue-600" },
    { label: "Total Earnings", value: formatCurrency(kpis.totalEarnings || 0), icon: Wallet, color: "text-green-600" },
    { label: "Pending Payments", value: formatCurrency(kpis.pendingPayments || 0), icon: Clock, color: "text-amber-600" },
    { label: "Content Submitted", value: formatNumber(kpis.contentSubmittedCount || 0), icon: FileText, color: "text-purple-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Creator Dashboard</h1>
        <p className="text-muted-foreground">Your campaign activity and earnings</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                </div>
                <kpi.icon className={`h-8 w-8 ${kpi.color} opacity-80`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* My Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>My Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
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
              {myPairings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                    No campaigns yet
                  </TableCell>
                </TableRow>
              ) : (
                myPairings.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.campaign?.title}</TableCell>
                    <TableCell>{p.campaign?.brand?.name}</TableCell>
                    <TableCell>{formatCurrency(p.campaign?.budget || 0)}</TableCell>
                    <TableCell>
                      {p.campaign?.commissionRate ? `${p.campaign.commissionRate}%` : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE_VARIANT[p.status] || "outline"}>
                        {p.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                    No transactions yet
                  </TableCell>
                </TableRow>
              ) : (
                recentTransactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.campaignCreator?.campaign?.title}</TableCell>
                    <TableCell>{t.type}</TableCell>
                    <TableCell>{formatCurrency(t.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE_VARIANT[t.status] || "outline"}>{t.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{formatDate(t.createdAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
