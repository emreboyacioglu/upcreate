"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type UserRole = "ADMIN" | "CREATOR" | "BRAND";

interface AppUserRow {
  id: string;
  email: string;
  role: UserRole;
  brandId: string | null;
  creatorId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ListResponse {
  data: AppUserRow[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

function roleBadgeVariant(role: UserRole): "default" | "secondary" | "destructive" | "warning" | "outline" {
  switch (role) {
    case "ADMIN":
      return "destructive";
    case "CREATOR":
      return "default";
    case "BRAND":
      return "warning";
    default:
      return "outline";
  }
}

function normalizeOptionalUrl(raw: string): string | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  try {
    return new URL(t).href;
  } catch {
    try {
      return new URL(`https://${t}`).href;
    } catch {
      return undefined;
    }
  }
}

const PAGE_LIMIT = 20;

export default function UsersPage() {
  const [users, setUsers] = useState<AppUserRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("CREATOR");
  const [brandName, setBrandName] = useState("");
  const [brandWebsite, setBrandWebsite] = useState("");
  const [brandCategory, setBrandCategory] = useState("");
  const [brandIndustry, setBrandIndustry] = useState("");
  const [brandCountry, setBrandCountry] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [creatorBio, setCreatorBio] = useState("");
  const [creatorPhone, setCreatorPhone] = useState("");
  const [creatorCountry, setCreatorCountry] = useState("");

  const [passwordResetId, setPasswordResetId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const loadUsers = () => {
    setLoading(true);
    setListError(null);
    api
      .get<ListResponse>(`/admin/app-users?page=${page}&limit=${PAGE_LIMIT}`)
      .then((res) => {
        setUsers(res.data);
        setTotalPages(res.meta.totalPages);
      })
      .catch((e: Error) => setListError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch when page changes only
  }, [page]);

  function resetCreateForm() {
    setEmail("");
    setPassword("");
    setRole("CREATOR");
    setBrandName("");
    setBrandWebsite("");
    setBrandCategory("");
    setBrandIndustry("");
    setBrandCountry("");
    setCreatorName("");
    setCreatorBio("");
    setCreatorPhone("");
    setCreatorCountry("");
    setCreateError(null);
  }

  function closeCreate() {
    setCreateOpen(false);
    resetCreateForm();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);

    if (!email.trim()) {
      setCreateError("Email is required.");
      return;
    }
    if (password.length < 8) {
      setCreateError("Password must be at least 8 characters.");
      return;
    }
    if (role === "BRAND" && !brandName.trim()) {
      setCreateError("Brand name is required for BRAND users.");
      return;
    }
    if (role === "CREATOR" && !creatorName.trim()) {
      setCreateError("Creator name is required for CREATOR users.");
      return;
    }

    let website: string | undefined;
    if (role === "BRAND" && brandWebsite.trim()) {
      website = normalizeOptionalUrl(brandWebsite);
      if (!website) {
        setCreateError("Enter a valid website URL or leave it empty.");
        return;
      }
    }

    const body: Record<string, unknown> = {
      email: email.trim(),
      password,
      role,
    };

    if (role === "BRAND") {
      body.brandName = brandName.trim();
      const extras: Record<string, string> = {};
      if (website) extras.website = website;
      if (brandCategory.trim()) extras.category = brandCategory.trim();
      if (brandIndustry.trim()) extras.industry = brandIndustry.trim();
      if (brandCountry.trim()) extras.country = brandCountry.trim();
      if (Object.keys(extras).length) body.brandExtras = extras;
    } else if (role === "CREATOR") {
      body.creatorName = creatorName.trim();
      const extras: Record<string, string> = {};
      if (creatorBio.trim()) extras.bio = creatorBio.trim();
      if (creatorPhone.trim()) extras.phone = creatorPhone.trim();
      if (creatorCountry.trim()) extras.country = creatorCountry.trim();
      if (Object.keys(extras).length) body.creatorExtras = extras;
    }

    setCreateSubmitting(true);
    try {
      await api.post("/admin/app-users", body);
      closeCreate();
      if (page === 1) loadUsers();
      else setPage(1);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setCreateSubmitting(false);
    }
  }

  async function submitPasswordReset(userId: string) {
    setResetError(null);
    if (resetPassword.length < 8) {
      setResetError("Password must be at least 8 characters.");
      return;
    }
    setResetSubmitting(true);
    try {
      await api.patch(`/admin/app-users/${userId}/password`, { password: resetPassword });
      setPasswordResetId(null);
      setResetPassword("");
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setResetSubmitting(false);
    }
  }

  const brandCreatorCell = (u: AppUserRow) => {
    if (u.brandId) return u.brandId;
    if (u.creatorId) return u.creatorId;
    return "—";
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground">Create and manage app users (admin, creators, brands)</p>
        </div>
        <Button type="button" className="bg-primary text-primary-foreground shadow hover:bg-primary/90" onClick={() => setCreateOpen(true)}>
          Create User
        </Button>
      </div>

      {listError && (
        <p className="text-sm text-destructive" role="alert">
          {listError}
        </p>
      )}

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="create-user-title">
          <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto border-border bg-card text-card-foreground shadow-lg">
            <CardHeader className="border-b border-border">
              <CardTitle id="create-user-title" className="text-foreground">
                Create user
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form className="space-y-4" onSubmit={handleCreate}>
                {createError && (
                  <p className="text-sm text-destructive" role="alert">
                    {createError}
                  </p>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="create-email">
                    Email
                  </label>
                  <Input id="create-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="border-border bg-background" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="create-password">
                    Password
                  </label>
                  <Input
                    id="create-password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="border-border bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="create-role">
                    Role
                  </label>
                  <select
                    id="create-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="flex h-9 w-full rounded-md border border-input border-border bg-background px-3 py-1 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="CREATOR">CREATOR</option>
                    <option value="BRAND">BRAND</option>
                  </select>
                </div>

                {role === "BRAND" && (
                  <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
                    <p className="text-sm font-medium text-foreground">Brand</p>
                    <div className="space-y-2">
                      <label className="text-sm text-foreground" htmlFor="brand-name">
                        Brand name <span className="text-destructive">*</span>
                      </label>
                      <Input id="brand-name" value={brandName} onChange={(e) => setBrandName(e.target.value)} required className="border-border bg-background" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-foreground" htmlFor="brand-website">
                        Website
                      </label>
                      <Input id="brand-website" type="text" placeholder="https://…" value={brandWebsite} onChange={(e) => setBrandWebsite(e.target.value)} className="border-border bg-background" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm text-foreground" htmlFor="brand-category">
                          Category
                        </label>
                        <Input id="brand-category" value={brandCategory} onChange={(e) => setBrandCategory(e.target.value)} className="border-border bg-background" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-foreground" htmlFor="brand-industry">
                          Industry
                        </label>
                        <Input id="brand-industry" value={brandIndustry} onChange={(e) => setBrandIndustry(e.target.value)} className="border-border bg-background" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-foreground" htmlFor="brand-country">
                        Country
                      </label>
                      <Input id="brand-country" value={brandCountry} onChange={(e) => setBrandCountry(e.target.value)} className="border-border bg-background" />
                    </div>
                  </div>
                )}

                {role === "CREATOR" && (
                  <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
                    <p className="text-sm font-medium text-foreground">Creator</p>
                    <div className="space-y-2">
                      <label className="text-sm text-foreground" htmlFor="creator-name">
                        Creator name <span className="text-destructive">*</span>
                      </label>
                      <Input id="creator-name" value={creatorName} onChange={(e) => setCreatorName(e.target.value)} required className="border-border bg-background" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-foreground" htmlFor="creator-bio">
                        Bio
                      </label>
                      <Input id="creator-bio" value={creatorBio} onChange={(e) => setCreatorBio(e.target.value)} className="border-border bg-background" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm text-foreground" htmlFor="creator-phone">
                          Phone
                        </label>
                        <Input id="creator-phone" type="tel" value={creatorPhone} onChange={(e) => setCreatorPhone(e.target.value)} className="border-border bg-background" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-foreground" htmlFor="creator-country">
                          Country
                        </label>
                        <Input id="creator-country" value={creatorCountry} onChange={(e) => setCreatorCountry(e.target.value)} className="border-border bg-background" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" className="border-border" onClick={closeCreate} disabled={createSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-primary text-primary-foreground shadow hover:bg-primary/90" disabled={createSubmitting}>
                    {createSubmitting ? "Creating…" : "Create"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-muted/50">
                <TableHead className="text-foreground">Email</TableHead>
                <TableHead className="text-foreground">Role</TableHead>
                <TableHead className="text-foreground">Brand / Creator ID</TableHead>
                <TableHead className="text-foreground">Created At</TableHead>
                <TableHead className="text-right text-foreground">Password</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id} className="border-border">
                    <TableCell className="font-medium text-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={roleBadgeVariant(u.role)}>{u.role}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{brandCreatorCell(u)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(u.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      {passwordResetId === u.id ? (
                        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:justify-end">
                          <Input
                            type="password"
                            autoComplete="new-password"
                            placeholder="New password (min 8)"
                            minLength={8}
                            value={resetPassword}
                            onChange={(e) => setResetPassword(e.target.value)}
                            className="h-8 w-full min-w-[10rem] border-border bg-background sm:max-w-[12rem]"
                          />
                          {resetError && (
                            <span className="block w-full text-left text-xs text-destructive sm:text-right" role="alert">
                              {resetError}
                            </span>
                          )}
                          <div className="flex gap-1">
                            <Button type="button" size="sm" variant="outline" className="border-border" disabled={resetSubmitting} onClick={() => { setPasswordResetId(null); setResetPassword(""); setResetError(null); }}>
                              Cancel
                            </Button>
                            <Button type="button" size="sm" className="bg-primary text-primary-foreground" disabled={resetSubmitting} onClick={() => submitPasswordReset(u.id)}>
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button type="button" size="sm" variant="ghost" className="text-primary hover:text-primary" onClick={() => { setPasswordResetId(u.id); setResetPassword(""); setResetError(null); }}>
                          Reset
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" className="border-border" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" size="sm" className="border-border" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
