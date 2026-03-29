"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

const AdminDashboard = dynamic(() => import("@/components/dashboard/admin-dashboard").then(m => m.AdminDashboard), { ssr: false });
const CreatorDashboard = dynamic(() => import("@/components/dashboard/creator-dashboard").then(m => m.CreatorDashboard), { ssr: false });

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Record<string, unknown>>("/me/dashboard")
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

  if (!data || !user) return null;

  if (user.role === "ADMIN") return <AdminDashboard data={data} />;
  if (user.role === "CREATOR") return <CreatorDashboard data={data} />;

  return <p className="text-muted-foreground">Dashboard coming soon for your role.</p>;
}
