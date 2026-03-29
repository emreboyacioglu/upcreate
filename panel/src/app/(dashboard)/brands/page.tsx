"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface Brand {
  id: string;
  name: string;
  website: string;
  contactEmail: string;
  _count?: { campaigns: number };
}

interface PaginatedResponse {
  data: Brand[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });

  useEffect(() => {
    api
      .get<PaginatedResponse>(`/brands?page=${meta.page}`)
      .then((res) => {
        setBrands(res.data);
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
        <h1 className="text-2xl font-bold">Brands</h1>
        <p className="text-muted-foreground">All registered brands on the platform</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Campaigns</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brands.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                    No brands found
                  </TableCell>
                </TableRow>
              ) : (
                brands.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <Link href={`/brands/${b.id}`} className="font-medium text-primary hover:underline">
                        {b.name}
                      </Link>
                    </TableCell>
                    <TableCell>{b.website || "-"}</TableCell>
                    <TableCell>{b.contactEmail}</TableCell>
                    <TableCell>{b._count?.campaigns ?? "-"}</TableCell>
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
