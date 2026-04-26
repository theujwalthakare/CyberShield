'use client';

import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, FileText, Send, Save, CheckCircle2, 
  Cpu, ScrollText, AlertTriangle, Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { useComplaint } from '@/hooks/use-complaints';

export default function FIRDraftPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [draftContent, setDraftContent] = useState('');
  
  const { data: response, isLoading } = useComplaint(id);
  const complaint = response?.data;
  const draft = complaint?.firDrafts?.[0];

  useEffect(() => {
    if (!complaint) return;
    
    // Use real FIR draft if exists from AI, otherwise generate a structured template from live complaint facts
    const syntheticDraft = `IN THE COURT OF CHIEF METROPOLITAN MAGISTRATE, ${complaint.districtCode || 'MUMBAI'}
FIR NO: _____________________ (To be assigned)
DATE: ${new Date().toLocaleDateString('en-IN')}

1. COMPLAINANT DETAILS:
Name: ${complaint.citizens?.fullName || 'Not specificed'}
Phone: ${complaint.citizens?.phoneNumber || 'Not specificed'}
State: ${complaint.stateCode || 'Unknown'}

2. ACCUSED DETAILS (AS IDENTIFIED SO FAR):
Further computational investigation of threat graph entities required.

3. NATURE OF OFFENCE:
Crime Category: ${complaint.crimeCategory}
Financial Damage: ₹${complaint.financialLossAmount || 0}

4. BRIEF FACTS OF THE CASE:
${complaint.rawDescription}

5. CURRENT ACTION STATUS:
Incident Recorded At: ${new Date(complaint.submittedAt).toLocaleString()}
Current Freeze Status: ${complaint.freezeStatus}
`;

    if (draftContent === '') {
      setDraftContent(draft?.incidentDescription || syntheticDraft);
    }
  }, [complaint]);

  if (isLoading || !complaint) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              FIR Draft <Badge className="bg-slate-100 text-slate-600 border-none font-bold">CASE {id}</Badge>
            </h1>
            <p className="text-sm text-slate-500">Edit and refine AI-generated FIR before sending for SHO approval.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Save className="w-4 h-4" /> Save Draft
          </Button>
          <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
            <Send className="w-4 h-4" /> Send for Approval
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          <Card className="border-slate-200">
            <CardHeader className="bg-slate-50 border-b flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-500" /> Official FIR Document
                </CardTitle>
                <CardDescription>Editable legal document.</CardDescription>
              </div>
              <Badge className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100">
                <Cpu className="w-3 h-3 mr-1" /> {draft ? 'ARJUNA Generated' : 'Auto Templated'}
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <textarea 
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                className="w-full h-[600px] p-6 font-serif text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500 bg-white"
                spellCheck="false"
              />
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm flex items-center gap-2">
                <ScrollText className="w-4 h-4 text-slate-500" /> BNS / IT Act Sections
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {draft?.bnsSections ? draft.bnsSections.split(',').map((s: string) => (
                <div key={s} className="flex justify-between items-center bg-slate-50 p-2 rounded text-xs border border-slate-100">
                  <span className="font-bold text-slate-700">{s.trim()}</span>
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                </div>
              )) : (
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded text-xs border border-slate-100">
                  <span className="font-bold text-slate-700 text-center w-full">Sections pending ML classification</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-amber-200">
            <CardHeader className="pb-3 border-b border-amber-100 bg-amber-50">
              <CardTitle className="text-sm flex items-center gap-2 text-amber-800">
                <AlertTriangle className="w-4 h-4" /> Missing Evidence
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              <p className="text-xs text-amber-700 leading-relaxed">
                Bank statement for Victim A/C needs to be certified under Section 65B of Indian Evidence Act.
              </p>
              <Button variant="link" className="text-xs text-amber-800 h-auto p-0 font-bold">Request from Victim →</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
