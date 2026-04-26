import Link from 'next/link';
import {
  Shield, LayoutDashboard, ListChecks, Search,
  FileText, Network, CheckSquare, BarChart3,
  Menu, Bell, LogOut, Settings,
} from 'lucide-react';

export default function OfficerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navItems = [
    { href: '/officer/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/officer/queue', icon: ListChecks, label: 'Complaint Queue' },
    { href: '/officer/suspect-lookup', icon: Search, label: 'Suspect Lookup' },
    { href: '/officer/analytics', icon: BarChart3, label: 'Analytics' },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-[#0a1929] text-white">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <Shield className="w-7 h-7 text-teal-400" />
          <div>
            <span className="font-bold text-sm block">CyberShield <span className="text-teal-400">Nexus</span></span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest">Officer Portal</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all group"
            >
              <item.icon className="w-4.5 h-4.5 text-slate-500 group-hover:text-teal-400 transition-colors" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-3 pb-4 space-y-1">
          <Link href="/officer/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/10 transition-all">
            <Settings className="w-4.5 h-4.5" /> Settings
          </Link>
          <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut className="w-4.5 h-4.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-6 py-3.5 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-lg hover:bg-slate-100">
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-slate-100">
              <Bell className="w-5 h-5 text-slate-500" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">7</span>
            </button>
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#0a1929] flex items-center justify-center text-white text-xs font-bold">
                RP
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-slate-700">Inspector R. Patel</p>
                <p className="text-[10px] text-slate-400">Badge: MH-CYB-2024-0891</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
