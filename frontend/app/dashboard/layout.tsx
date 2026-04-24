"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  Shield,
  LayoutDashboard,
  FileWarning,
  Upload,
  Activity,
  Map,
  BarChart3,
  Bell,
  BookOpen,
  Settings,
  Menu,
  Database, // Added Database import
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useState, type ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/report", label: "Report Incident", icon: FileWarning },
  { href: "/dashboard/cases", label: "My Cases", icon: Activity },
  { href: "/dashboard/evidence", label: "Evidence", icon: Upload },
  // { href: "/dashboard/map", label: "Threat Map", icon: Map },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/intelligence", label: "Data Intelligence", icon: Database }, // Added Data Intelligence route
  { href: "/dashboard/alerts", label: "Alerts", icon: Bell },
  { href: "/dashboard/knowledge", label: "Knowledge Base", icon: BookOpen },
  { href: "/dashboard/admin", label: "Admin", icon: Settings },
];

function NavLink({
  item,
  pathname,
  onClick,
}: {
  item: (typeof navItems)[0];
  pathname: string;
  onClick?: () => void;
}) {
  const active = pathname === item.href;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-100 relative group active:opacity-70",
        active
          ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30"
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-50"
      )}
    >
      <div className={cn(
        "p-1.5 rounded-lg transition-colors duration-100",
        active 
          ? "bg-white/20 text-white" 
          : "bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400"
      )}>
        <item.icon className="h-4 w-4" strokeWidth={active ? 2.5 : 2} />
      </div>
      <span className={cn(active ? "translate-x-1" : "group-hover:translate-x-1", "transition-transform duration-100")}>
        {item.label}
      </span>
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-md opacity-20" />
      )}
    </Link>
  );
}

function SidebarContent({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2 px-4 mt-2 mb-2">
        <Image src="/logo.png" alt="CyberShield" width={32} height={32} className="rounded-lg shadow-sm shadow-cyan-500/20" />
        <span className="text-lg font-bold tracking-tight">CyberShield</span>
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            pathname={pathname}
            onClick={onNavigate}
          />
        ))}
      </nav>
      <Separator />
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <UserButton />
          <span className="text-sm text-muted-foreground">Account</span>
        </div>
        <ThemeToggle />
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-card md:block">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <div className="flex h-14 items-center gap-2 border-b px-4 md:hidden">
          <SheetTrigger className="hover:bg-slate-100 dark:hover:bg-slate-800 h-10 w-10 inline-flex items-center justify-center rounded-xl cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-slate-700 dark:text-slate-300">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </SheetTrigger>
          <Image src="/logo.png" alt="CyberShield" width={28} height={28} className="rounded-md" />
          <span className="font-bold tracking-tight">CyberShield</span>
        </div>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent
            pathname={pathname}
            onNavigate={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
