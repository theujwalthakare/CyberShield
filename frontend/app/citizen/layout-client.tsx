"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Shield, LayoutDashboard, FileWarning, ListChecks,
  LogOut, Menu, ChevronRight, UserCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useUserProfile } from "@/lib/use-user-profile";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { href: "/citizen/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/citizen/file-complaint", label: "File Complaint", icon: FileWarning },
  { href: "/citizen/my-complaints", label: "My Complaints", icon: ListChecks },
];

export default function CitizenLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { name, email, initials } = useUserProfile();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  async function handleSignOut() {
    await getSupabaseBrowserClient().auth.signOut();
    router.push("/sign-in");
  }

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-r border-slate-200 dark:border-white/10">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-200 dark:border-white/10 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 dark:bg-cyan-500/20 flex items-center justify-center">
          <Shield className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
        </div>
        <div>
          <div className="font-bold text-sm tracking-tight">CyberShield <span className="text-cyan-600 dark:text-cyan-400">Citizen</span></div>
          <div className="text-[9px] uppercase tracking-[0.2em] text-slate-400">Public Portal</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 px-3 pb-2 pt-1">Navigation</p>
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all group",
                active
                  ? "bg-cyan-500/10 dark:bg-cyan-500/15 text-cyan-700 dark:text-white border border-cyan-500/20"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-cyan-600 dark:text-cyan-400" : "text-slate-400 dark:text-slate-600")} />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="h-3 w-3 text-cyan-500/60" />}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-slate-200 dark:border-white/10 p-3 space-y-1">
        <div ref={profileRef} className="relative">
          <div role="button" tabIndex={0} onClick={() => setProfileOpen(p => !p)} onKeyDown={e => e.key === "Enter" && setProfileOpen(p => !p)}
            className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-white/5 transition-all group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-cyan-500/10 dark:bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-600 dark:text-cyan-300 text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{name}</p>
              <p className="text-[10px] text-slate-400">Citizen Account</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span onClick={e => e.stopPropagation()}><ThemeToggle /></span>
              <ChevronRight className={cn("h-3.5 w-3.5 text-slate-400 transition-transform", profileOpen ? "rotate-90" : "")} />
            </div>
          </div>

          {profileOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-white/10">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">{email}</p>
              </div>
              <div className="p-1.5 space-y-0.5">
                <Link href="/citizen/profile" onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
                  <UserCircle2 className="w-4 h-4 text-slate-400" /> View Profile
                </Link>
                <div className="border-t border-slate-100 dark:border-white/10 my-1" />
                <button onClick={handleSignOut}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
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
      <div className="hidden lg:flex w-64 shrink-0 flex-col h-screen sticky top-0"><Sidebar /></div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 flex flex-col"><Sidebar /></div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 h-screen">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-white/10 shrink-0">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <span className="text-sm font-bold text-slate-900 dark:text-white">CyberShield</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-600 dark:text-cyan-300 text-xs font-bold">
              {initials}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
