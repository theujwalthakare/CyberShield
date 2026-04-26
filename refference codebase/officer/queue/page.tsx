'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Filter, Search, ArrowUpDown, ChevronDown, 
  MoreHorizontal, Eye, FileText, CheckCircle2, ShieldAlert,
  Loader2
} from 'lucide-react';
import { useCases } from '@/hooks/use-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';

export default function OfficerQueuePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: casesResponse, isLoading } = useCases();
  const cases = (casesResponse?.data as any[]) || [];

  const filteredCases = cases.filter(c => 
    c.complaintId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.crimeCategory.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Case Routing Queue</h1>
          <p className="text-sm text-slate-500 mt-1">AI-prioritized incoming cybercrime complaints.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2"><Filter className="w-4 h-4"/> Filter</Button>
          <Button className="bg-teal-600 hover:bg-teal-700">Auto-Assign Next</Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search by ID or Category..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Showing {filteredCases.length} of {cases.length} pending cases</span>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead className="w-[100px]">
                    <div className="flex items-center gap-1 cursor-pointer hover:text-slate-900">Score <ArrowUpDown className="w-3 h-3"/></div>
                  </TableHead>
                  <TableHead>Case ID</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Financial Risk</TableHead>
                  <TableHead>Wait Time</TableHead>
                  <TableHead>Action Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                      No cases found in the queue.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCases.map((row) => (
                    <TableRow key={row.complaintId} className="hover:bg-slate-50 group">
                      <TableCell>
                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded font-bold text-sm ${
                          row.priorityScore >= 80 ? 'bg-red-100 text-red-700' :
                          row.priorityScore >= 60 ? 'bg-orange-100 text-orange-700' :
                          row.priorityScore >= 40 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {row.priorityScore}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        <div className="flex flex-col">
                          <span>{row.complaintId}</span>
                          {row.organizedCrimeFlag && (
                            <span className="text-[10px] font-bold text-red-600 flex items-center gap-1 mt-0.5"><ShieldAlert className="w-3 h-3"/> ORGANIZED CRIME</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{row.crimeCategory.replace(/_/g, ' ')}</TableCell>
                      <TableCell>
                        {row.financialLossAmount ? `₹${row.financialLossAmount.toLocaleString('en-IN')}` : '—'}
                        {row.freezeStatus !== 'NOT_APPLICABLE' && (
                          <div className="mt-1">
                            <Badge variant="outline" className={`text-[10px] ${
                              row.freezeStatus === 'FROZEN' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' :
                              row.freezeStatus === 'PENDING' ? 'border-amber-200 text-amber-700 bg-amber-50' : 
                              'border-red-200 text-red-700 bg-red-50'
                            }`}>
                              {row.freezeStatus}
                            </Badge>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {new Date(row.submittedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-slate-100">
                          {row.status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2 text-slate-900">
                          <Link href={`/officer/complaint/${row.complaintId}`} className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-slate-100 transition-colors">
                            <Eye className="w-4 h-4 text-slate-500"/>
                          </Link>
                          <Button variant="outline" size="sm" className="hidden sm:flex text-slate-900">Assign to me</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
