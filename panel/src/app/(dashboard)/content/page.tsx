"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "success" | "warning" | "outline"> = {
  PENDING_BRAND_REVIEW: "warning",
  APPROVED: "success",
  REVISION_REQUESTED: "destructive",
  REJECTED: "destructive",
};

interface ContentItem {
  id: string;
  status: string;
  contentUrl: string;
  caption: string;
  notes: string;
  submittedAt: string;
  reviewedAt: string;
  campaignCreator: {
    id: string;
    campaign: { id: string; title: string };
    creator: { id: string; name: string };
  };
}

export default function ContentPage() {
  const { user } = useAuth();
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewLoading, setReviewLoading] = useState<string | null>(null);

  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    loadContents();
  }, []);

  function loadContents() {
    setLoading(true);
    api
      .get<{ data: ContentItem[] }>("/me/campaign-creators")
      .then(async (res) => {
        const allContents: ContentItem[] = [];
        for (const pairing of res.data) {
          try {
            const cc = pairing as unknown as { id: string; contents: ContentItem[]; campaign: { id: string; title: string }; creator: { id: string; name: string } };
            if (cc.contents) {
              for (const c of cc.contents) {
                allContents.push({
                  ...c,
                  campaignCreator: { id: cc.id, campaign: cc.campaign, creator: cc.creator },
                } as ContentItem);
              }
            }
          } catch {}
        }
        setContents(allContents);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  async function handleReview(contentId: string, action: "approve" | "revision") {
    setReviewLoading(contentId);
    try {
      await api.post(`/campaign-contents/${contentId}/review`, {
        decision: action === "approve" ? "approve" : "revision",
        reviewNotes: action === "revision" ? "Please revise and resubmit." : undefined,
      });
      loadContents();
    } catch (err) {
      console.error(err);
    } finally {
      setReviewLoading(null);
    }
  }

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
        <h1 className="text-2xl font-bold">Content Submissions</h1>
        <p className="text-muted-foreground">Review and manage creator content</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Creator</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>URL</TableHead>
                {isAdmin && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {contents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 6 : 5} className="text-center text-muted-foreground py-6">
                    No content submissions found
                  </TableCell>
                </TableRow>
              ) : (
                contents.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.campaignCreator?.campaign?.title}</TableCell>
                    <TableCell>{c.campaignCreator?.creator?.name}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[c.status] || "outline"}>
                        {c.status?.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{c.submittedAt ? formatDate(c.submittedAt) : "-"}</TableCell>
                    <TableCell>
                      {c.contentUrl ? (
                        <a href={c.contentUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">
                          View
                        </a>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        {c.status === "PENDING_BRAND_REVIEW" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              disabled={reviewLoading === c.id}
                              onClick={() => handleReview(c.id, "approve")}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={reviewLoading === c.id}
                              onClick={() => handleReview(c.id, "revision")}
                            >
                              Revise
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    )}
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
