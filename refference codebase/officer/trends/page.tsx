'use client';

import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TREND_DATA = [
  { month: 'Sep', digitalArrest: 45, ransomware: 12, upiFraud: 240 },
  { month: 'Oct', digitalArrest: 52, ransomware: 15, upiFraud: 260 },
  { month: 'Nov', digitalArrest: 78, ransomware: 14, upiFraud: 210 },
  { month: 'Dec', digitalArrest: 140, ransomware: 22, upiFraud: 280 },
  { month: 'Jan', digitalArrest: 185, ransomware: 45, upiFraud: 310 },
  { month: 'Feb', digitalArrest: 220, ransomware: 80, upiFraud: 290 },
  { month: 'Mar', digitalArrest: 310, ransomware: 150, upiFraud: 300 },
];

export default function TrendAnalysisPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in py-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Emerging Threat Vectors</h1>
        <p className="text-sm text-slate-500 mt-1">Predictive analysis powered by ARJUNA ML Engine.</p>
      </div>

      {/* AI Insight Alert */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-xl p-6 text-white flex items-start gap-4 shadow-lg">
        <TrendingUp className="w-8 h-8 text-red-200 shrink-0 mt-1" />
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-lg font-bold">CRITICAL TREND DETECTED: Digital Arrest Scams</h2>
            <Badge variant="outline" className="border-red-300 text-red-100 uppercase tracking-widest text-[10px]">
              +588% Increase (6 Months)
            </Badge>
          </div>
          <p className="text-red-100 text-sm leading-relaxed max-w-4xl">
            Syndicates impersonating law enforcement (CBI, Customs, Narcotics) are targeting elderly citizens via Skype/WhatsApp video calls. Actors use forged Supreme Court notices and utilize mule accounts predominantly located in Tier-2 cities to launder extortion money.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Modus Operandi Trajectory</CardTitle>
            <CardDescription>Incident growth over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={TREND_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorArrest" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#be123c" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#be123c" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRansom" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c026d3" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#c026d3" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorUPI" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f766e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0f766e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="digitalArrest" name="Digital Arrest" stroke="#be123c" strokeWidth={3} fillOpacity={1} fill="url(#colorArrest)" />
                <Area type="monotone" dataKey="ransomware" name="Ransomware (SMEs)" stroke="#c026d3" strokeWidth={2} fillOpacity={1} fill="url(#colorRansom)" />
                <Area type="monotone" dataKey="upiFraud" name="UPI Fraud" stroke="#0f766e" strokeWidth={2} fillOpacity={1} fill="url(#colorUPI)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" /> Watchlist Vectors
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 text-sm">Deepfake Extortion</span>
                  <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200">+124%</Badge>
                </div>
                <p className="text-xs text-slate-500">Video manipulation of public profiles for sextortion.</p>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 text-sm">Stock Market Tips Groups</span>
                  <Badge variant="outline" className="text-orange-600 bg-orange-50 border-orange-200">+89%</Badge>
                </div>
                <p className="text-xs text-slate-500">Fake WhatsApp groups pushing pump-and-dump apps.</p>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 text-sm">AI Voice Clone Fraud</span>
                  <Badge variant="outline" className="text-yellow-600 bg-yellow-50 border-yellow-200">+42%</Badge>
                </div>
                <p className="text-xs text-slate-500">Cloning relative's voice to demand emergency funds.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 text-white border-0">
            <CardContent className="p-6">
              <ShieldAlert className="w-8 h-8 text-teal-400 mb-4" />
              <h3 className="font-bold text-lg mb-2">Generate Advisory</h3>
              <p className="text-sm text-slate-400 mb-6">Create an automatic SOP and public advisory draft based on emerging threat indicators to push to regional stations.</p>
              <Button className="w-full bg-teal-500 hover:bg-teal-600 text-slate-900 font-bold">
                Synthesize Advisory Docs
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
