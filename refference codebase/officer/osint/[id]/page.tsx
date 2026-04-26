'use client';

import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Search, Globe, Instagram, Facebook, 
  Linkedin, Twitter, AlertTriangle, ShieldCheck, Database, 
  ExternalLink, Maximize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useComplaint } from '@/hooks/use-complaints';

// Mock OSINT Target Data
const MOCK_OSINT = {
  id: 'REQ-2026-9921',
  target: '+91 87654 32109',
  entityType: 'PHONE',
  confidence: 88,
  status: 'COMPLETED',
  requestedAt: '2026-03-22T08:30:00Z',
  summary: 'Phone number resolves to prepaid SIM issued in Jamtara, Jharkhand. Strong correlation found with Telegram fraud channels and Truecaller reports tagging it as "Bank KYC Scam". No official LinkedIn or verified social media presence.',
  accounts: [
    { platform: 'WhatsApp', exists: true, name: 'Customer Care', lastSeen: 'Today 10:45 AM', avatar: true },
    { platform: 'Telegram', exists: true, username: '@HDFC_HelpDesk_Official_01', joined: 'Oct 2025' },
    { platform: 'Truecaller', exists: true, name: 'Spam KYC Fraud', spamScore: '92%', carrier: 'Jio' },
    { platform: 'UPI IDs', exists: true, count: 4, banks: ['Paytm Payments Bank', 'Yes Bank'] }
  ],
  breaches: [
    { name: 'Domino\'s India Leak', year: 2021, data: ['Phone', 'Location', 'Name'] },
    { name: 'Unknown Telegram Dump', year: 2024, data: ['Phone', 'Aadhaar (partial)'] }
  ]
};

export default function OSINTBriefPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data: response } = useComplaint(id);
  const complaint = response?.data;
  const entity = complaint?.complaintEntities?.[0];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              OSINT Intelligence Brief
            </h1>
            <p className="text-sm text-slate-500">Target: <strong className="text-slate-900">{entity?.entityValue || MOCK_OSINT.target}</strong> ({entity?.entityType || MOCK_OSINT.entityType})</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Search className="w-4 h-4" /> Re-scan Target
          </Button>
          <Button className="bg-slate-900 hover:bg-slate-800 text-white gap-2">
            <ExternalLink className="w-4 h-4" /> Export Report (PDF)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Main Analysis - 3 cols */}
        <div className="md:col-span-3 space-y-6">
          <Card className="border-indigo-200 shadow-sm overflow-hidden">
            <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-4 flex items-center justify-between">
              <h3 className="text-indigo-900 font-bold flex items-center gap-2"><Globe className="w-4 h-4"/> Nexus Digital Footprint Analysis</h3>
              <Badge className="bg-indigo-600 text-white hover:bg-indigo-700">Confidence: {MOCK_OSINT.confidence}%</Badge>
            </div>
            <CardContent className="pt-6">
              <p className="text-sm text-slate-800 leading-relaxed font-medium bg-white p-4 rounded border border-slate-100 shadow-sm">
                {MOCK_OSINT.summary}
              </p>
              
              <div className="mt-8">
                <h4 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Identified Platforms</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {MOCK_OSINT.accounts.map((acc, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <div>
                        <p className="font-semibold text-slate-900 flex items-center gap-2">
                          {acc.platform}
                          {acc.exists ? (
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Badge variant="outline" className="text-[10px]">Not Found</Badge>
                          )}
                        </p>
                        {acc.exists && (
                          <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                            {acc.name && <p>Name: <span className="text-slate-900 font-medium">{acc.name}</span></p>}
                            {acc.username && <p>Username: <span className="text-slate-900 font-medium">{acc.username}</span></p>}
                            {acc.spamScore && <p className="text-red-600 font-medium">Spam Score: {acc.spamScore}</p>}
                            {acc.count && <p>{acc.count} linked IDs ({acc.banks?.join(', ')})</p>}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="w-5 h-5 text-slate-500" /> Deep Web & Breach Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              {MOCK_OSINT.breaches.length > 0 ? (
                <div className="space-y-4">
                  {MOCK_OSINT.breaches.map((breach, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 border border-red-100 bg-red-50/50 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-bold text-red-900 text-sm">{breach.name} ({breach.year})</h5>
                        <p className="text-xs text-red-700 mt-1">Compromised fields: {breach.data.join(', ')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">No associated database breaches found.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Panel - 1 col */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Linked Investigations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-red-50 rounded border border-red-100">
                <p className="text-xs font-bold text-red-800 mb-1">CYB-2026-0045102</p>
                <p className="text-[10px] text-red-600">UPI Fraud • Same phone number • FIR Registered</p>
              </div>
              <div className="p-3 bg-orange-50 rounded border border-orange-100">
                <p className="text-xs font-bold text-orange-800 mb-1">CYB-2026-0038991</p>
                <p className="text-[10px] text-orange-600">Digital Arrest • Connected IP • Investigation</p>
              </div>
              <Button variant="outline" className="w-full text-xs" size="sm">
                View Network Graph
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Target Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full bg-slate-900 border border-slate-700 hover:bg-slate-800" size="sm">
                Request CDR (TAFCOP)
              </Button>
              <Button variant="outline" className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200" size="sm">
                Flag to TSP for Blocking
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
