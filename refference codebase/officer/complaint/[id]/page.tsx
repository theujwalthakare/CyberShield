'use client';

import { useParams, useRouter } from 'next/navigation';
import { useComplaint } from '@/hooks/use-complaints';
import { 
  ArrowLeft, ShieldAlert, Cpu, Network, Phone, 
  CheckCircle2, Clock, AlertTriangle, Scale, Loader2, IndianRupee 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

export default function ComplaintDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const { data: response, isLoading } = useComplaint(id);
  const complaint = response?.data;

  if (isLoading || !complaint) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  const victim = complaint.citizens;
  const analysis = complaint.aiDecisions?.[0] || null;
  const entities = complaint.complaintEntities || [];
  
  // Format properties correctly for the presentation layer
  const confidence = analysis?.outputValue?.confidence || complaint.classificationConfidence || 0;
  const aiSummary = analysis?.outputValue?.summary || "Pending automated ARJUNA insights.";

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              Case {complaint.complaintId}
              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none font-bold uppercase">
                {complaint.status?.replace(/_/g, ' ')}
              </Badge>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Received {new Date(complaint.submittedAt).toLocaleString()} • {complaint.crimeCategory?.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <Button 
            variant="outline" 
            className="text-teal-700 border-teal-200 bg-teal-50 hover:bg-teal-100 shrink-0"
            disabled={complaint.status === 'INVESTIGATION'}
            onClick={async () => {
              const { createClient } = await import('@/lib/supabase/client');
              const supabase = createClient();
              await supabase.from('complaints').update({ status: 'INVESTIGATION' }).eq('complaint_id', id);
              window.location.reload();
            }}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" /> 
            {complaint.status === 'INVESTIGATION' ? 'Currently Investigating' : 'Mark Investigating'}
          </Button>
          <Button className="bg-slate-900 hover:bg-slate-800 text-white shrink-0">
            <Scale className="w-4 h-4 mr-2" /> Generate FIR Draft
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Col - 2/3 */}
        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full bg-slate-100 border p-1 rounded-xl grid grid-cols-4 h-auto min-h-12 overflow-x-auto">
              <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow text-sm font-medium">Overview</TabsTrigger>
              <TabsTrigger value="evidence" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow text-sm font-medium">Evidence ({complaint.evidenceFiles?.length || 0})</TabsTrigger>
              <TabsTrigger value="actions" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow text-sm font-medium">Actions</TabsTrigger>
              <TabsTrigger value="timeline" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow text-sm font-medium">Timeline</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-6 space-y-6">
              {/* AI Insight Card */}
              <Card className="border-teal-200 shadow-sm overflow-hidden">
                <div className="bg-teal-50 border-b border-teal-100 px-6 py-3 flex items-center justify-between">
                  <h3 className="text-teal-900 font-bold flex items-center gap-2"><Cpu className="w-4 h-4"/> ARJUNA AI Analysis</h3>
                  {confidence > 0 && (
                     <Badge className="bg-teal-600 justify-center text-white border-0 hover:bg-teal-600">
                       {confidence}% Confidence
                     </Badge>
                  )}
                </div>
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-700 leading-relaxed font-medium">
                    {aiSummary}
                  </p>
                  
                  {entities.length > 0 && (
                    <div className="mt-6 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Extracted Threat Entities</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {entities.map((ent: any, i: number) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                            <div className={`p-2 rounded-md ${ent.mhaFraudFlag ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                              {ent.entityType === 'PHONE' ? <Phone className="w-4 h-4"/> : <ShieldAlert className="w-4 h-4"/>}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-bold text-slate-900">{ent.entityValue}</span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5 max-w-[150px] truncate">{ent.entityType}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Victim Statement */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Victim Statement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg text-sm text-slate-700 leading-relaxed font-serif whitespace-pre-wrap">
                    "{complaint.rawDescription}"
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="evidence">
              <Card>
                <CardContent className="pt-6 flex flex-col items-center justify-center h-48 text-slate-500 text-sm">
                  {complaint.evidenceFiles?.length === 0 ? "No evidence files attached." : "Evidence grid view pending UI rollout."}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="actions">
              <Card>
                <CardContent className="pt-6 flex flex-col items-center justify-center h-48 text-slate-500 text-sm">
                   CFCFRMS Quick-Actions pending rollout
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline">
              <Card>
                <CardContent className="pt-6 text-sm text-slate-600 space-y-4">
                  {complaint.caseLifecycle?.map((cl: any) => (
                    <div key={cl.lifecycleId} className="flex justify-between items-center border-b pb-2">
                       <div>
                         <p className="font-bold">{cl.statusTo}</p>
                         <p className="text-xs">{cl.notes}</p>
                       </div>
                       <p className="text-xs font-mono">{new Date(cl.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Col - Side Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Financial Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Disputed Amount</p>
                <h3 className="text-2xl font-bold text-slate-900 flex items-center">
                  ₹{(complaint.financialLossAmount || 0).toLocaleString('en-IN')}
                </h3>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-1">CFCFRMS Freeze Status</p>
                <Badge variant="outline" className={`font-semibold tracking-wide flex items-center gap-1 w-fit ${
                  complaint.freezeStatus === 'FROZEN' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  complaint.freezeStatus === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-slate-50 text-slate-600 border-slate-200'
                }`}>
                  <Clock className="w-3 h-3" /> {(complaint.freezeStatus || 'NOT_APPLICABLE').replace(/_/g, ' ')}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Victim Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold uppercase">
                  {victim?.fullName?.substring(0,2) || 'VI'}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{victim?.fullName || 'Unknown'}</p>
                  <p className="text-xs text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Aadhaar KYC Verified
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Phone</span>
                  <span className="font-medium text-slate-900">{victim?.phoneNumber || '—'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Location</span>
                  <span className="font-medium text-slate-900">{complaint.stateCode || '—'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Link href={`/officer/graph`} className="inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium w-full bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 shadow-sm transition-colors">
            <Network className="w-4 h-4 mr-2" /> View Suspect Graph
          </Link>
        </div>
      </div>
    </div>
  );
}
