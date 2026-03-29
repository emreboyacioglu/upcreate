"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";

interface Creator {
  id: string;
  name: string;
  email: string;
  creatorScale: string;
  categories: string[];
  accounts: Array<{ platform: string; followerCount: number }>;
}

interface PaginatedResponse {
  data: Creator[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export default function CreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });

  useEffect(() => {
    api
      .get<PaginatedResponse>(`/creators?page=${meta.page}`)
      .then((res) => {
        setCreators(res.data);
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
        <h1 className="text-2xl font-bold">Creators</h1>
        <p className="text-muted-foreground">All registered creators on the platform</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Scale</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead>Followers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creators.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                    No creators found
                  </TableCell>
                </TableRow>
              ) : (
                creators.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link href={`/creators/${c.id}`} className="font-medium text-primary hover:underline">
                        {c.name}
                      </Link>
                    </TableCell>
                    <TableCell>{c.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{c.creatorScale || "N/A"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(c.categories || []).map((cat) => (
                          <Badge key={cat} variant="secondary" className="text-xs">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatNumber(
                        (c.accounts || []).reduce((s, a) => s + a.followerCount, 0)
                      )}
                    </TableCell>
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
