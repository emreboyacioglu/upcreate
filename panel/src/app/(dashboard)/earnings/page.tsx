"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Transaction {
  id: string;
  type: string;
  status: string;
  amount: number;
  currency: string;
  description: string | null;
  paidAt: string | null;
  createdAt: string;
  campaignCreator: {
    campaign: { title: string };
    creator: { name: string };
  };
}

interface PaginatedResponse {
  data: Transaction[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "outline",
  APPROVED: "secondary",
  PAID: "default",
  CANCELLED: "destructive",
};

export default function EarningsPage() {
  const [data, setData] = useState<Transaction[]>([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = (page: number) => {
    setLoading(true);
    api
      .get<PaginatedResponse>(`/transactions?page=${page}`)
      .then((res) => {
        setData(res.data);
        setMeta(res.meta);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData(1);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Earnings</h1>
        <p className="text-muted-foreground">Commission earnings and payment tracking</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : data.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No transactions found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Campaign</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Creator</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((tx) => (
                    <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{tx.campaignCreator?.campaign?.title ?? "—"}</td>
                      <td className="px-4 py-3">{tx.campaignCreator?.creator?.name ?? "—"}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{tx.type}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(tx.amount, tx.currency)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[tx.status] || "outline"}>{tx.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(tx.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {meta.page} of {meta.totalPages} ({meta.total} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={loading || meta.page <= 1}
              onClick={() => fetchData(meta.page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={loading || meta.page >= meta.totalPages}
              onClick={() => fetchData(meta.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
