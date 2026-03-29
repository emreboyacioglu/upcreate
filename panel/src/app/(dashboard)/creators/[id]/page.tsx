"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatNumber, formatDate } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

interface CreatorDetail {
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
  }>;
  paymentInfo: {
    bankName: string;
    iban: string;
    accountHolder: string;
  } | null;
  commerceScore: { commerceScore: number } | null;
}

export default function CreatorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [creator, setCreator] = useState<CreatorDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<CreatorDetail>(`/creators/${id}`)
      .then(setCreator)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!creator) return <p>Creator not found</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{creator.name}</h1>
          <p className="text-muted-foreground">{creator.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Scale</span>
              <Badge variant="outline">{creator.creatorScale || "N/A"}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Commerce Score</span>
              <span className="font-medium">{creator.commerceScore?.commerceScore ?? "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Post</span>
              <span className="font-medium">{creator.lastPostAt ? formatDate(creator.lastPostAt) : "-"}</span>
            </div>
            {creator.bio && <p className="pt-2 text-muted-foreground">{creator.bio}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Categories & Topics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-1">
              {(creator.categories || []).map((c) => (
                <Badge key={c} variant="default">{c}</Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {(creator.topics || []).map((t) => (
                <Badge key={t} variant="secondary">{t}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bank Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {creator.paymentInfo ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bank</span>
                  <span className="font-medium">{creator.paymentInfo.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IBAN</span>
                  <span className="font-medium font-mono text-xs">{creator.paymentInfo.iban}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Holder</span>
                  <span className="font-medium">{creator.paymentInfo.accountHolder}</span>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">No bank info provided</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Social Accounts */}
      <Card>
        <CardHeader>
          <CardTitle>Social Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(creator.accounts || []).map((acc) => (
              <div key={acc.id} className="flex items-center gap-3 rounded-lg border border-border p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                  {acc.platform[0]}
                </div>
                <div>
                  <p className="font-medium">{acc.handle}</p>
                  <p className="text-xs text-muted-foreground">
                    {acc.platform} · {formatNumber(acc.followerCount)} followers
                    {acc.isVerified && " · Verified"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
