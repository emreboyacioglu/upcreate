"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatNumber, formatDate } from "@/lib/utils";
import { Save, Instagram, RefreshCw } from "lucide-react";

interface CreatorProfile {
  id: string;
  name: string;
  email: string;
  bio: string;
  creatorScale: string;
  lastPostAt: string;
  categories: string[];
  topics: string[];
  accounts: Array<{
    id: string;
    platform: string;
    handle: string;
    followerCount: number;
    isVerified: boolean;
    connectedAt: string;
  }>;
  paymentInfo: {
    id: string;
    bankName: string;
    iban: string;
    accountHolder: string;
  } | null;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [bankName, setBankName] = useState("");
  const [iban, setIban] = useState("");
  const [accountHolder, setAccountHolder] = useState("");

  useEffect(() => {
    if (!user?.creatorId && user?.role !== "ADMIN") {
      setLoading(false);
      return;
    }

    const endpoint = user?.role === "ADMIN"
      ? `/auth/me`
      : `/creators/${user?.creatorId}`;

    api
      .get<CreatorProfile>(endpoint)
      .then((data) => {
        setProfile(data);
        setName(data.name || "");
        setBio(data.bio || "");
        setBankName(data.paymentInfo?.bankName || "");
        setIban(data.paymentInfo?.iban || "");
        setAccountHolder(data.paymentInfo?.accountHolder || "");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  async function handleSave() {
    if (!user?.creatorId) return;
    setSaving(true);
    try {
      await api.put(`/creators/${user.creatorId}`, { name, bio });
      // TODO: update payment info endpoint
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user?.role === "ADMIN") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Admin Profile</h1>
        <Card>
          <CardContent className="p-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role</span>
              <Badge>{user.role}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground">No creator profile linked to your account.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">Manage your creator profile and payment info</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Basic Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Bio</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Scale: </span>
                <Badge variant="outline">{profile.creatorScale || "N/A"}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Last Post: </span>
                <span>{profile.lastPostAt ? formatDate(profile.lastPostAt) : "-"}</span>
              </div>
            </div>
            <div>
              <span className="text-sm font-medium">Categories</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {(profile.categories || []).map((c) => (
                  <Badge key={c} variant="secondary">{c}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Info</CardTitle>
            <CardDescription>Your bank account for receiving payments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Bank Name</label>
              <Input value={bankName} onChange={(e) => setBankName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">IBAN</label>
              <Input value={iban} onChange={(e) => setIban(e.target.value)} placeholder="TR..." className="font-mono" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Account Holder</label>
              <Input value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Social Accounts */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>Your social media accounts linked to Upcreate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(profile.accounts || []).map((acc) => (
              <div key={acc.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Instagram className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{acc.handle}</p>
                    <p className="text-xs text-muted-foreground">
                      {acc.platform} · {formatNumber(acc.followerCount)} followers
                    </p>
                  </div>
                </div>
                {acc.isVerified && <Badge variant="success">Verified</Badge>}
              </div>
            ))}
            <button className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-4 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
              <RefreshCw className="h-4 w-4" />
              Connect Instagram
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
