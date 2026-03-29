"use client";

import { Fragment, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ENTITY_TYPES = ["All", "Campaign", "Brand", "Creator", "AppUser", "WorkflowDefinition"] as const;

const ROLE_BADGE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ADMIN: "default",
  BRAND: "secondary",
  CREATOR: "outline",
};

interface AuditLog {
  id: string;
  createdAt: string;
  actorUserId: string | null;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: unknown;
  ipHash: string | null;
  requestId: string | null;
}

interface PaginatedAuditResponse {
  data: AuditLog[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

function truncateId(value: string | null | undefined, max = 10) {
  if (!value) return "—";
  if (value.length <= max) return value;
  return `${value.slice(0, max)}…`;
}

function buildQuery(page: number, entityType: string, dateFrom: string, dateTo: string) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", "25");
  if (entityType && entityType !== "All") params.set("entityType", entityType);
  if (dateFrom) params.set("from", dateFrom);
  if (dateTo) params.set("to", dateTo);
  return params.toString();
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [entityType, setEntityType] = useState<string>("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    setError(null);
    const qs = buildQuery(page, entityType, dateFrom, dateTo);
    api
      .get<PaginatedAuditResponse>(`/admin/audit-logs?${qs}`)
      .then((res) => {
        setLogs(res.data);
        setMeta(res.meta);
      })
      .catch((err: Error) => {
        setError(err.message || "Failed to load audit logs");
        setLogs([]);
      })
      .finally(() => setLoading(false));
  }, [page, entityType, dateFrom, dateTo]);

  return (
    <div className="space-y-6 text-foreground">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit log</h1>
        <p className="text-muted-foreground">Admin actions and changes across the platform</p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4 pt-0">
          <div className="flex min-w-[180px] flex-col gap-2">
            <label htmlFor="audit-entity-type" className="text-sm font-medium text-muted-foreground">
              Entity type
            </label>
            <select
              id="audit-entity-type"
              value={entityType}
              onChange={(e) => {
                setEntityType(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {ENTITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="flex min-w-[160px] flex-col gap-2">
            <label htmlFor="audit-from" className="text-sm font-medium text-muted-foreground">
              From
            </label>
            <input
              id="audit-from"
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex min-w-[160px] flex-col gap-2">
            <label htmlFor="audit-to" className="text-sm font-medium text-muted-foreground">
              To
            </label>
            <input
              id="audit-to"
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : error ? (
            <p className="p-6 text-sm text-destructive">{error}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-muted/50">
                  <TableHead className="text-muted-foreground">Time</TableHead>
                  <TableHead className="text-muted-foreground">Actor</TableHead>
                  <TableHead className="text-muted-foreground">Role</TableHead>
                  <TableHead className="text-muted-foreground">Action</TableHead>
                  <TableHead className="text-muted-foreground">Entity type</TableHead>
                  <TableHead className="text-muted-foreground">Entity ID</TableHead>
                  <TableHead className="w-[100px] text-muted-foreground" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow className="border-border">
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      No audit entries found
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <Fragment key={log.id}>
                      <TableRow className="border-border hover:bg-muted/50">
                        <TableCell className="whitespace-nowrap text-sm">{formatDate(log.createdAt)}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{truncateId(log.actorUserId)}</TableCell>
                        <TableCell>
                          <Badge variant={ROLE_BADGE[log.actorRole] ?? "outline"}>{log.actorRole}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm">{log.action}</TableCell>
                        <TableCell className="text-sm">{log.entityType}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{truncateId(log.entityId)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() =>
                              setExpanded((prev) => {
                                const next = new Set(prev);
                                if (next.has(log.id)) next.delete(log.id);
                                else next.add(log.id);
                                return next;
                              })
                            }
                          >
                            {expanded.has(log.id) ? "Collapse" : "Expand"}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expanded.has(log.id) && (
                        <TableRow className="border-border bg-muted/20 hover:bg-muted/20">
                          <TableCell colSpan={7} className="p-4">
                            <pre className="max-h-80 overflow-auto rounded-lg border border-border bg-background p-4 text-left text-xs text-foreground">
                              {JSON.stringify(log.metadata ?? null, null, 2)}
                            </pre>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-center gap-3 border-border">
        <Button variant="outline" size="sm" disabled={meta.page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {meta.page} of {Math.max(1, meta.totalPages)}
          {meta.total > 0 ? ` · ${meta.total} total` : null}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={meta.page >= meta.totalPages || loading || meta.totalPages === 0}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
