"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Link2, MousePointerClick, ShoppingCart, DollarSign } from "lucide-react";

interface CampaignTracking {
  campaignId: string;
  campaignTitle: string;
  linkCount: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

interface TrackingOverview {
  totalLinks: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  byCampaign: CampaignTracking[];
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

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Tracking</h1>
        <p className="text-muted-foreground">No tracking data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tracking</h1>
        <p className="text-muted-foreground">Affiliate links, clicks, conversions, and revenue</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Links</p>
                <p className="text-2xl font-bold mt-1">{formatNumber(data.totalLinks)}</p>
              </div>
              <Link2 className="h-8 w-8 text-blue-600 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Clicks</p>
                <p className="text-2xl font-bold mt-1">{formatNumber(data.totalClicks)}</p>
              </div>
              <MousePointerClick className="h-8 w-8 text-orange-600 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Conversions</p>
                <p className="text-2xl font-bold mt-1">{formatNumber(data.totalConversions)}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-emerald-600 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(data.totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead className="text-right">Links</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead className="text-right">Conversions</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.byCampaign.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                    No tracking data yet
                  </TableCell>
                </TableRow>
              ) : (
                data.byCampaign.map((c) => (
                  <TableRow key={c.campaignId}>
                    <TableCell>
                      <Link href={`/campaigns/${c.campaignId}`} className="font-medium text-primary hover:underline">
                        {c.campaignTitle}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(c.linkCount)}</TableCell>
                    <TableCell className="text-right">{formatNumber(c.clicks)}</TableCell>
                    <TableCell className="text-right">{formatNumber(c.conversions)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(c.revenue)}</TableCell>
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
