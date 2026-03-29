"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { TrendingUp, Users, Megaphone, MousePointerClick } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#6d28d9", "#22c55e", "#f59e0b", "#ef4444", "#6366f1", "#94a3b8"];

interface OverviewData {
  totals: { creators: number; brands: number; campaigns: number; socialAccounts: number };
  campaignsByStatus: Array<{ status: string; count: number }>;
  transactions: {
    totalAmount: number;
    totalCount: number;
    byStatus: Array<{ status: string; amount: number; count: number }>;
  };
}

interface EarningsData {
  totalEarnings: number;
  earningsByCampaign: Array<{ campaignId: string; campaignTitle: string; earnings: number }>;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    const promises: Promise<void>[] = [];

    if (isAdmin) {
      promises.push(
        api.get<OverviewData>("/analytics/overview").then(setOverview).catch(console.error)
      );
    }

    if (user?.role === "CREATOR" && user.creatorId) {
      promises.push(
        api
          .get<EarningsData>(`/analytics/creator-earnings/${user.creatorId}`)
          .then(setEarnings)
          .catch(console.error)
      );
    }

    Promise.all(promises).finally(() => setLoading(false));
  }, [isAdmin, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isAdmin && overview) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Platform-wide analytics and performance metrics</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Creators</p>
                  <p className="text-2xl font-bold mt-1">{formatNumber(overview.totals.creators)}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Campaigns</p>
                  <p className="text-2xl font-bold mt-1">{formatNumber(overview.totals.campaigns)}</p>
                </div>
                <Megaphone className="h-8 w-8 text-emerald-600 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Transaction Vol</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(overview.transactions.totalAmount)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Social Accounts</p>
                  <p className="text-2xl font-bold mt-1">{formatNumber(overview.totals.socialAccounts)}</p>
                </div>
                <MousePointerClick className="h-8 w-8 text-orange-600 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Campaigns by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={overview.campaignsByStatus}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6d28d9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transaction Volume by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={overview.transactions.byStatus}
                    dataKey="amount"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, value }: any) => `${name}: ${formatCurrency(value)}`}
                  >
                    {overview.transactions.byStatus.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (user?.role === "CREATOR" && earnings) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Analytics</h1>
          <p className="text-muted-foreground">Your earnings and campaign performance</p>
        </div>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(earnings.totalEarnings)}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-green-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Earnings by Campaign</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={earnings.earningsByCampaign}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="campaignTitle" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                <Bar dataKey="earnings" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>
      <p className="text-muted-foreground">No analytics data available.</p>
    </div>
  );
}
