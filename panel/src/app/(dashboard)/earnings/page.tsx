"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "success" | "warning" | "outline"> = {
  PENDING: "warning",
  APPROVED: "default",
  PAID: "success",
  CANCELLED: "destructive",
};

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  note: string;
  createdAt: string;
  campaignCreator?: {
    campaign: { id: string; title: string };
    creator: { id: string; name: string };
  };
}

interface PaginatedResponse {
  data: Transaction[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export default function EarningsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });

  useEffect(() => {
    api
      .get<PaginatedResponse>(`/transactions?page=${meta.page}`)
      .then((res) => {
        setTransactions(res.data);
        setMeta({ page: res.meta.page, totalPages: res.meta.totalPages });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [meta.page]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Earnings</h1>
        <p className="text-muted-foreground">Commission earnings and payment tracking</p>
      </div>

      <Card>
        <CardContent className="p-0">
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
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                    No earnings found
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.campaignCreator?.campaign?.title || "-"}</TableCell>
                    <TableCell>{t.campaignCreator?.creator?.name || "-"}</TableCell>
                    <TableCell>{t.type}</TableCell>
                    <TableCell>{formatCurrency(t.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[t.status] || "outline"}>{t.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{formatDate(t.createdAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => setMeta((m) => ({ ...m, page: m.page - 1 }))}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {meta.page} of {meta.totalPages}</span>
          <Button variant="outline" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => setMeta((m) => ({ ...m, page: m.page + 1 }))}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
