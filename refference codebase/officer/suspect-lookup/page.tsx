'use client';

import { useState } from 'react';
import { 
  Search, UserMinus, Phone, Mail, FileDigit, 
  MapPin, AlertTriangle, Fingerprint, ShieldCheck 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';

export default function SuspectLookupPage() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('phone');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    setResult(null);
    setNotFound(false);
    
    try {
      const supabase = createClient();
      
      const typeMapping: any = {
        'phone': 'PHONE',
        'upi': 'UPI_ID',
        'account': 'BANK_ACCOUNT',
        'ip': 'IP_ADDRESS',
        'email': 'EMAIL'
      };
      
      const { data, error } = await supabase
        .from('complaint_entities')
        .select(`
          *,
          complaints (
             status,
             financial_loss_amount,
             state_code
          )
        `)
        .eq('entity_value', query)
        .eq('entity_type', typeMapping[type]);

      if (error) throw error;
      
      if (!data || data.length === 0) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Aggregate data from the cases
      const isMHA = data.some(d => d.mha_fraud_flag);
      const totalLoss = data.reduce((acc, d) => acc + ((d.complaints as any)?.financial_loss_amount || 0), 0);
      const states = Array.from(new Set(data.map(d => (d.complaints as any)?.state_code).filter(Boolean)));

      setResult({
        identifier: query,
        type: type,
        riskScore: isMHA ? 95 : (data.length > 2 ? 75 : 40),
        status: isMHA ? 'MHA_FLAGGED_OFFENDER' : (data.length > 2 ? 'REPEATED_SUSPECT' : 'UNDER_INVESTIGATION'),
        totalLossAssociated: totalLoss,
        linkedFIRs: data.length, // approximation: linked complaints
        locations: states.length > 0 ? states : ['UNKNOWN'],
        matches: [
          { database: 'NCRP (Cyber Portal)', match: true, note: `Reported in ${data.length} complaints in DB` },
          { database: 'MHA Fraud DB', match: isMHA, note: isMHA ? 'Entity verified as fraudulent by ML/MHA' : 'Not currently flagged.' },
        ]
      });
    } catch (e) {
      console.error(e);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in py-8 px-4">
      <div className="text-center max-w-2xl mx-auto">
        <Fingerprint className="w-12 h-12 text-slate-800 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-slate-900">National Suspect Database</h1>
        <p className="text-slate-500 mt-2">Cross-reference identifiers across CCTNS, NCRP, and telecom blacklists.</p>
      </div>

      <Card className="border-2 border-slate-200 shadow-xl max-w-3xl mx-auto">
        <CardContent className="p-2 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={type} onValueChange={(val) => setType(val || 'phone')}>
              <SelectTrigger className="w-full sm:w-[180px] bg-slate-50 border-slate-200">
                <SelectValue placeholder="Identifier Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phone">Phone Number</SelectItem>
                <SelectItem value="upi">UPI ID</SelectItem>
                <SelectItem value="account">Bank Account</SelectItem>
                <SelectItem value="ip">IP Address</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1">
              <Input 
                placeholder={`Enter ${type} to search...`} 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-4 h-10 w-full"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={loading || !query}
              className="bg-slate-900 hover:bg-slate-800 text-white w-full sm:w-auto"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Search className="w-4 h-4 mr-2" /> Search</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {notFound && !loading && (
        <Card className="max-w-3xl mx-auto border-dashed border-red-200 bg-red-50 text-center py-10 shadow-sm animate-in fade-in duration-500">
           <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3 opacity-50" />
           <p className="font-semibold text-red-800">No matching threat actors found.</p>
           <p className="text-sm text-red-600 mt-1">This identifier is not currently tracked across linked systems.</p>
        </Card>
      )}

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="md:col-span-1 space-y-6">
            <Card className="border-red-200 bg-red-50/50 shadow-sm">
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm">
                  <UserMinus className="w-8 h-8 text-red-600" />
                </div>
                <Badge className="bg-red-600 text-white border-0 px-3 py-1 mb-2 hover:bg-red-700">
                  {result.status.replace(/_/g, ' ')}
                </Badge>
                <h2 className="text-xl font-mono font-bold text-slate-900 break-all">{result.identifier}</h2>
                <p className="text-sm text-slate-500 capitalize">{result.type} Record</p>
                
                <div className="mt-6 w-full space-y-3">
                  <div className="bg-white p-3 rounded-lg border border-red-100 text-left flex justify-between items-center">
                    <p className="text-xs font-bold text-slate-500 uppercase">Risk Score</p>
                    <p className="text-xl font-black text-red-600">{result.riskScore}/100</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-red-100 text-left">
                    <p className="text-xs font-bold text-slate-500 uppercase">Financial Impact</p>
                    <p className="text-lg font-bold text-slate-900">₹{(result.totalLossAssociated || 0).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2 space-y-6">
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="border-b bg-slate-50 pb-4">
                <CardTitle className="text-lg">Federated Search Results</CardTitle>
                <CardDescription>Records extracted dynamically from live tables.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-3 border-b pb-2">Active Linkages</h4>
                  <div className="flex gap-4 mb-4">
                    <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <p className="text-2xl font-bold text-slate-900">{result.linkedFIRs}</p>
                      <p className="text-xs text-slate-500 font-semibold uppercase mt-1">Found in active Cases</p>
                    </div>
                    <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <p className="text-lg font-bold text-slate-900 truncate" title={result.locations.join(', ')}>
                        {result.locations[0]}
                      </p>
                      <p className="text-xs text-slate-500 font-semibold uppercase mt-1">Primary State Hub</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-3 border-b pb-2">Database Activity</h4>
                  <div className="space-y-3">
                    {result.matches.map((match: any, i: number) => (
                      <div key={i} className="flex items-start gap-4 p-3 bg-white border border-slate-200 rounded-lg">
                        {match.match ? (
                          <ShieldCheck className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-200 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className={`text-sm font-bold ${match.match ? 'text-slate-900' : 'text-slate-500'}`}>
                            {match.database}
                          </p>
                          <p className="text-xs text-slate-600 mt-1">{match.note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
