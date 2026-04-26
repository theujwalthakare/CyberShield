'use client';

import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, CheckCircle2, XCircle, Clock, 
  ShieldCheck, FileSignature 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function FIRApprovalPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              SHO FIR Approval
            </h1>
            <p className="text-sm text-slate-500">Review drafted FIR for Case {id}.</p>
          </div>
        </div>
        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 uppercase px-3 py-1 font-bold text-xs border-amber-200">
          <Clock className="w-3 h-3 mr-1" /> Pending Approval
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="h-full border-slate-200">
            <CardHeader className="bg-slate-50 border-b pb-4">
              <CardTitle className="text-base flex items-center justify-between">
                <div>
                  <span className="text-slate-500 mr-2 text-sm font-normal">Drafted by:</span>
                  Insp. Kumar (Badge: #MH-1044)
                </div>
                <span className="text-xs font-normal text-slate-500">Submitted 2 hours ago</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="font-serif text-sm leading-relaxed text-slate-800 space-y-6 whitespace-pre-wrap">
                <p className="font-bold text-center">IN THE COURT OF CHIEF METROPOLITAN MAGISTRATE, MUMBAI<br/>FIR NO: _____________________</p>
                <p><strong>1. COMPLAINANT DETAILS:</strong><br/>Name: Rajesh Sharma<br/>Address: Andheri West, Mumbai, MH</p>
                <p><strong>2. ACCUSED DETAILS:</strong><br/>Phone Number: +91 87654 32109<br/>UPI ID: fraudster@ybl</p>
                <p><strong>3. NATURE OF OFFENCE:</strong><br/>Sec 420 IPC, Sec 66C & 66D IT Act</p>
                <p><strong>4. BRIEF FACTS:</strong><br/>The complainant received a VOIP call on 20/03/2026 from an individual posing as an HDFC Bank executive...</p>
                <div className="pt-8 flex justify-end">
                  <div className="text-center">
                    <div className="border-b border-slate-300 w-40 mb-2 h-8"></div>
                    <span className="text-xs text-slate-500">IO Signature</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Decision Panel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Approval Remarks (Optional)</label>
                <textarea 
                  placeholder="Enter remarks for the IO..."
                  className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 resize-none h-24 text-sm"
                />
              </div>
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow shadow-emerald-200">
                  <ShieldCheck className="w-4 h-4 mr-2" /> E-Sign & Approve FIR
                </Button>
                <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                  <XCircle className="w-4 h-4 mr-2" /> Send Back for Revisions
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="p-5 flex items-start gap-4">
              <FileSignature className="w-8 h-8 text-slate-400 shrink-0" />
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Aadhaar E-Sign Setup</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Approval requires your Aadhaar-based OTP signature to legally register the e-FIR with CCTNS.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
