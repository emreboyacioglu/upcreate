"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";
import {
  Users,
  Building2,
  Megaphone,
  TrendingUp,
  MousePointerClick,
  FileCheck,
  CreditCard,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#94a3b8",
  ACTIVE: "#22c55e",
  PAUSED: "#f59e0b",
  COMPLETED: "#6366f1",
  CANCELLED: "#ef4444",
};

const STATUS_BADGE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "success" | "warning" | "outline"> = {
  DRAFT: "secondary",
  ACTIVE: "success",
  PAUSED: "warning",
  COMPLETED: "default",
  CANCELLED: "destructive",
  AWAITING_CREATOR: "warning",
  AWAITING_BRAND: "warning",
  CONFIRMED: "success",
  PENDING: "warning",
  PAID: "success",
  PENDING_BRAND_REVIEW: "warning",
  APPROVED: "success",
  REVISION_REQUESTED: "destructive",
};

interface AdminDashboardProps {
  data: Record<string, unknown>;
}

export function AdminDashboard({ data }: AdminDashboardProps) {
  const kpis = (data.kpis || {}) as Record<string, number>;
  const campaignsByStatus = (data.campaignsByStatus || []) as Array<{ status: string; count: number }>;
  const topCreators = (data.topCreators || []) as Array<{
    id: string;
    name: string;
    commerceScore: number;
    totalFollowers: number;
    scale: string;
  }>;
  const activeCampaignsList = (data.activeCampaignsList || []) as Array<{
    id: string;
    title: string;
    brand: { id: string; name: string };
    budget: number;
    commissionRate: number;
    creatorsCount: number;
    startsAt: string;
    endsAt: string;
  }>;
  const pendingPairings = (data.pendingPairings || []) as Array<{
    id: string;
    status: string;
    campaign: { id: string; title: string };
    creator: { id: string; name: string };
  }>;
  const recentContents = (data.recentContents || []) as Array<{
    id: string;
    status: string;
    submittedAt: string;
    campaignCreator: {
      campaign: { id: string; title: string };
      creator: { id: string; name: string };
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
      creator: { id: string; name: string };
    };
  }>;

  const kpiCards = [
    { label: "Total Creators", value: formatNumber(kpis.totalCreators || 0), icon: Users, color: "text-blue-600" },
    { label: "Total Brands", value: formatNumber(kpis.totalBrands || 0), icon: Building2, color: "text-purple-600" },
    { label: "Active Campaigns", value: formatNumber(kpis.activeCampaigns || 0), icon: Megaphone, color: "text-emerald-600" },
    { label: "Total Revenue", value: formatCurrency(kpis.totalRevenue || 0), icon: TrendingUp, color: "text-green-600" },
    { label: "Total Paid", value: formatCurrency(kpis.totalPaid || 0), icon: CreditCard, color: "text-indigo-600" },
    { label: "Total Clicks", value: formatNumber(kpis.totalClicks || 0), icon: MousePointerClick, color: "text-orange-600" },
    { label: "Pending Reviews", value: formatNumber(kpis.pendingReviewCount || 0), icon: FileCheck, color: "text-amber-600" },
    { label: "Pending Transactions", value: formatNumber(kpis.pendingTransactionCount || 0), icon: Activity, color: "text-red-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of the entire platform</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Campaigns by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={campaignsByStatus}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {campaignsByStatus.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#6d28d9"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Campaign Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={campaignsByStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, value }: any) => `${name}: ${value}`}
                >
                  {campaignsByStatus.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#6d28d9"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Active Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Active Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Creators</TableHead>
                <TableHead>Period</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeCampaignsList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                    No active campaigns
                  </TableCell>
                </TableRow>
              ) : (
                activeCampaignsList.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.title}</TableCell>
                    <TableCell>{c.brand?.name}</TableCell>
                    <TableCell>{formatCurrency(c.budget || 0)}</TableCell>
                    <TableCell>{c.commissionRate ? `${c.commissionRate}%` : "-"}</TableCell>
                    <TableCell>{c.creatorsCount}</TableCell>
                    <TableCell className="text-xs">
                      {c.startsAt ? formatDate(c.startsAt) : "?"} — {c.endsAt ? formatDate(c.endsAt) : "?"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Top Creators */}
      <Card>
        <CardHeader>
          <CardTitle>Top Creators</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Scale</TableHead>
                <TableHead>Commerce Score</TableHead>
                <TableHead>Followers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topCreators.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{c.scale || "N/A"}</Badge>
                  </TableCell>
                  <TableCell>{c.commerceScore}</TableCell>
                  <TableCell>{formatNumber(c.totalFollowers)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pending Pairings */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Pairings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingPairings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pending pairings</p>
              ) : (
                pendingPairings.slice(0, 10).map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="text-sm font-medium">{p.campaign?.title}</p>
                      <p className="text-xs text-muted-foreground">{p.creator?.name}</p>
                    </div>
                    <Badge variant={STATUS_BADGE_VARIANT[p.status] || "outline"}>
                      {p.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Content Submissions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Content Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentContents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent content</p>
              ) : (
                recentContents.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="text-sm font-medium">{c.campaignCreator?.campaign?.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.campaignCreator?.creator?.name} · {formatDate(c.submittedAt)}
                      </p>
                    </div>
                    <Badge variant={STATUS_BADGE_VARIANT[c.status] || "outline"}>
                      {c.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
                <TableHead>Creator</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                    No transactions yet
                  </TableCell>
                </TableRow>
              ) : (
                recentTransactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.campaignCreator?.campaign?.title}</TableCell>
                    <TableCell>{t.campaignCreator?.creator?.name}</TableCell>
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
