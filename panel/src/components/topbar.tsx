"use client";

import { useAuth } from "@/lib/auth";
import { Bell } from "lucide-react";

export function Topbar() {
  const { user } = useAuth();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
      <div />
      <div className="flex items-center gap-4">
        <button className="relative rounded-md p-2 hover:bg-muted transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground" />
        </button>
        {user && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
              {user.email?.[0]?.toUpperCase() || "?"}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
