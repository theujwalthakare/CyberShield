import {
  FileText, AlertTriangle, Clock, Shield, TrendingUp,
  ChevronRight, Flame, IndianRupee, Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useCases } from '@/hooks/use-data';

export default function OfficerDashboard() {
  const { data: casesResponse, isLoading } = useCases();
  const cases = (casesResponse?.data as any[]) || [];

  const topPriorityCases = cases
    .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))
    .slice(0, 5);

  const pendingFIRs = cases.filter(c => c.status === 'INVESTIGATION' || c.status === 'ASSIGNED').length;
  const criticalCount = cases.filter(c => (c.priorityScore || 0) >= 80).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Officer Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Real-time overview of your assigned cases.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={<FileText className="w-5 h-5 text-blue-500" />}
          label="Total Assigned"
          value={cases.length.toString()}
          trend="+3 today"
          bg="bg-blue-50"
        />
        <KPICard
          icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
          label="Critical (80+)"
          value={criticalCount.toString()}
          trend={criticalCount > 0 ? "Needs attention" : "All good"}
          bg="bg-red-50"
          highlight={criticalCount > 0}
        />
        <KPICard
          icon={<Shield className="w-5 h-5 text-teal-500" />}
          label="Pending action"
          value={pendingFIRs.toString()}
          trend="In queue"
          bg="bg-teal-50"
        />
        <KPICard
          icon={<Clock className="w-5 h-5 text-amber-500" />}
          label="Oldest Complaint"
          value="18h"
          trend="UPI Fraud"
          bg="bg-amber-50"
        />
      </div>

      {/* Priority Queue */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-slate-900">Priority Queue</h2>
            <span className="text-xs bg-teal-100 text-teal-700 font-semibold px-2 py-0.5 rounded-full">
              AI-Ranked
            </span>
          </div>
          <Link
            href="/officer/queue"
            className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
          >
            Full Queue <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
            </div>
          ) : topPriorityCases.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No cases currently assigned.</div>
          ) : topPriorityCases.map((item) => (
            <Link
              key={item.complaintId}
              href={`/officer/complaint/${item.complaintId}`}
              className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group"
            >
              <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center text-xs font-bold shrink-0 ${
                (item.priorityScore || 0) >= 80 ? 'bg-red-100 text-red-700' :
                (item.priorityScore || 0) >= 60 ? 'bg-orange-100 text-orange-700' :
                (item.priorityScore || 0) >= 40 ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                <span className="text-base leading-none">{item.priorityScore || 0}</span>
                <span className="text-[8px] uppercase mt-0.5">Score</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">{item.complaintId}</p>
                  {item.organizedCrimeFlag && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-full">
                      <Flame className="w-3 h-3" /> ORGANIZED
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{item.crimeCategory?.replace(/_/g, ' ')} • {new Date(item.submittedAt).toLocaleDateString()}</p>
              </div>

              <div className="text-right shrink-0 hidden sm:block">
                <p className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                  <IndianRupee className="w-3.5 h-3.5" />
                  {(item.financialLossAmount || 0).toLocaleString('en-IN')}
                </p>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  item.freezeStatus === 'FROZEN' ? 'bg-emerald-100 text-emerald-700' :
                  item.freezeStatus === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                  item.freezeStatus === 'MOVED' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {(item.freezeStatus || 'NOT_APPLICABLE').replace(/_/g, ' ')}
                </span>
              </div>

              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 shrink-0" />
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickAction href="/officer/queue" icon={<TrendingUp className="w-5 h-5" />} title="Full Queue" desc="View all ranked complaints" />
        <QuickAction href="/officer/suspect-lookup" icon={<Shield className="w-5 h-5" />} title="Suspect Lookup" desc="Search by phone, UPI, email" />
        <QuickAction href="/officer/analytics" icon={<FileText className="w-5 h-5" />} title="Analytics" desc="State & national crime data" />
      </div>
    </div>
  );
}

function KPICard({
  icon, label, value, trend, bg, highlight,
}: {
  icon: React.ReactNode; label: string; value: string; trend: string; bg: string; highlight?: boolean;
}) {
  return (
    <div className={`bg-white rounded-2xl border ${highlight ? 'border-red-200' : 'border-slate-200'} shadow-sm p-5 hover:shadow-md transition-shadow ${highlight ? 'ring-1 ring-red-100' : ''}`}>
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${bg} mb-3`}>{icon}</div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 font-medium mt-1">{label}</p>
      <p className={`text-[10px] mt-1 ${highlight ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>{trend}</p>
    </div>
  );
}

function QuickAction({ href, icon, title, desc }: { href: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link href={href} className="group flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
      <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-teal-50 flex items-center justify-center text-slate-500 group-hover:text-teal-600 transition-colors shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
      </div>
    </Link>
  );
}
