"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Link2, MousePointerClick, ShoppingCart, DollarSign } from "lucide-react";
import Link from "next/link";

interface TrackingOverview {
  totalLinks: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  byCampaign: Array<{
    campaignId: string;
    campaignTitle: string;
    linkCount: number;
    clicks: number;
    conversions: number;
    revenue: number;
  }>;
}

export default function TrackingPage() {
  const [data, setData] = useState<TrackingOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<TrackingOverview>("/tracking/overview")
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!data) return <p className="text-muted-foreground">Failed to load tracking data</p>;

  const conversionRate = data.totalClicks > 0 ? (data.totalConversions / data.totalClicks) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tracking</h1>
        <p className="text-muted-foreground">Affiliate links, clicks, conversions and revenue</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Total Links</span>
            </div>
            <p className="text-3xl font-bold">{formatNumber(data.totalLinks)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <MousePointerClick className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Total Clicks</span>
            </div>
            <p className="text-3xl font-bold">{formatNumber(data.totalClicks)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Conversions</span>
            </div>
            <p className="text-3xl font-bold">{formatNumber(data.totalConversions)}</p>
            <p className="text-xs text-muted-foreground mt-1">{conversionRate.toFixed(1)}% conversion rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Total Revenue</span>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(data.totalRevenue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Campaign</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.byCampaign.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No affiliate data yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Campaign</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Links</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Clicks</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Conversions</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Revenue</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Conv. Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byCampaign.map((c) => {
                    const rate = c.clicks > 0 ? (c.conversions / c.clicks) * 100 : 0;
                    return (
                      <tr key={c.campaignId} className="border-b border-border last:border-0 hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <Link href={`/campaigns/${c.campaignId}`} className="font-medium text-primary hover:underline">
                            {c.campaignTitle}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-right">{c.linkCount}</td>
                        <td className="px-4 py-3 text-right">{formatNumber(c.clicks)}</td>
                        <td className="px-4 py-3 text-right">{formatNumber(c.conversions)}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(c.revenue)}</td>
                        <td className="px-4 py-3 text-right">{rate.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
