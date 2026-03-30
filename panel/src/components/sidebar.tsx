"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Megaphone,
  Users,
  BarChart3,
  FileText,
  Wallet,
  UserCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Target,
  UserPlus,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Array<"ADMIN" | "CREATOR" | "BRAND">;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["ADMIN", "CREATOR"] },
  { label: "Campaigns", href: "/campaigns", icon: Megaphone, roles: ["ADMIN", "CREATOR"] },
  { label: "Creators", href: "/creators", icon: Users, roles: ["ADMIN"] },
  { label: "Brands", href: "/brands", icon: Users, roles: ["ADMIN"] },
  { label: "Matching", href: "/matching", icon: Shuffle, roles: ["ADMIN"] },
  { label: "Users", href: "/users", icon: UserPlus, roles: ["ADMIN"] },
  { label: "Content", href: "/content", icon: FileText, roles: ["ADMIN", "CREATOR"] },
  { label: "Tracking", href: "/tracking", icon: Target, roles: ["ADMIN"] },
  { label: "Earnings", href: "/earnings", icon: Wallet, roles: ["ADMIN", "CREATOR"] },
  { label: "Analytics", href: "/analytics", icon: BarChart3, roles: ["ADMIN", "CREATOR"] },
  { label: "Profile", href: "/profile", icon: UserCircle, roles: ["ADMIN", "CREATOR"] },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  const items = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-card transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              U
            </div>
            <span className="font-semibold text-lg">Upcreate</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md p-1.5 hover:bg-muted transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-2">
        {!collapsed && (
          <div className="mb-2 px-3 py-1">
            <p className="text-sm font-medium truncate">{user.email}</p>
            <p className="text-xs text-muted-foreground">{user.role}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
