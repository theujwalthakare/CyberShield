"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Shield, LayoutDashboard, ListChecks, BarChart3,
  Search, LogOut, Menu, X, ChevronRight,
  UserCircle2, Settings, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { href: "/officer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/officer/queue", label: "Complaint Queue", icon: ListChecks },
  { href: "/officer/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/officer/suspect-lookup", label: "Suspect Lookup", icon: Search },
];

function useOfficerProfile() {
  const [name, setName] = useState<string>("Officer");
  const [initials, setInitials] = useState("OF");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: User | null } }) => {
      if (!user) return;
      supabase
        .from("user_profiles")
        .select("full_name")
        .eq("auth_subject", user.id)
        .maybeSingle()
        .then(({ data }: { data: { full_name: string | null } | null }) => {
          const n = data?.full_name ?? user.email ?? "Officer";
          setName(n);
          setInitials(
            n.split(" ").map((w: string) => w[0] ?? "").join("").slice(0, 2).toUpperCase() || "OF"
          );
        });
    });
  }, []);

  return { name, initials };
}

export default function OfficerLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { name, initials } = useOfficerProfile();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/sign-in");
  }

  const Sidebar = () => (
    <aside className="flex flex-col w-64 h-full bg-[#0a1929]  text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center">
          <Shield className="h-5 w-5 text-teal-400" />
        </div>
        <div>
          <div className="font-bold text-sm tracking-tight">CyberShield <span className="text-teal-400">Nexus</span></div>
          <div className="text-[9px] uppercase tracking-[0.2em] text-slate-500">Officer Portal</div>
        </div>
      </div>

      {/* Nav — scrollable if needed */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <p className="text-[9px] uppercase tracking-[0.2em] text-slate-600 px-3 pb-2 pt-1">Navigation</p>
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href) && item.href !== "/officer/profile";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all group",
                active
                  ? "bg-teal-500/15 text-white border border-teal-500/20"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className={cn("h-4 w-4 shrink-0 transition-colors", active ? "text-teal-400" : "text-slate-600 group-hover:text-slate-300")} />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="h-3 w-3 text-teal-400/60" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom — profile + signout, fixed at bottom */}
      <div className="shrink-0 border-t border-white/10 p-3 space-y-1">
        {/* Profile toggle */}
        <div ref={profileRef} className="relative">
          <div role="button" tabIndex={0} onClick={() => setProfileOpen(p => !p)} onKeyDown={e => e.key === "Enter" && setProfileOpen(p => !p)}
            className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 hover:bg-white/5 transition-all group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{name}</p>
              <p className="text-[10px] text-slate-500">Officer Account</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span onClick={e => e.stopPropagation()}>
                <ThemeToggle />
              </span>
              <ChevronRight className={cn("h-3.5 w-3.5 text-slate-600 transition-transform", profileOpen ? "rotate-90" : "")} />
            </div>
          </div>

          {/* Profile dropdown — pops upward */}
          {profileOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-[#0d2137] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-xs font-bold text-slate-300 truncate">{name}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Signed in as Officer</p>
              </div>
              <div className="p-1.5 space-y-0.5">
                <Link
                  href="/officer/profile"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-all"
                  onClick={() => setProfileOpen(false)}
                >
                  <UserCircle2 className="w-4 h-4 text-slate-500" /> View Profile
                </Link>
                <Link
                  href="/officer/profile"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-all"
                  onClick={() => setProfileOpen(false)}
                >
                  <Settings className="w-4 h-4 text-slate-500" /> Edit Profile
                </Link>
                <div className="border-t border-white/10 my-1" />
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Desktop sidebar — fixed height = full screen */}
      <div className="hidden lg:flex w-64 shrink-0 flex-col h-screen sticky top-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 flex flex-col">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#0a1929] border-b border-white/10 shrink-0">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-400" />
            <span className="text-sm font-bold text-white">CyberShield</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setProfileOpen(p => !p)}
              className="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 text-xs font-bold"
            >
              {initials}
            </button>
          </div>
        </header>

        {/* Page content — this is the scrollable area */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
