'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { 
  ArrowLeft, CheckSquare, Square, Save, 
  MapPin, Clock, UploadCloud, Building2, Smartphone 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useComplaint } from '@/hooks/use-complaints';

const MOCK_CHECKLIST = [
  { id: '1', task: 'Visit Victim Residence for statement recording under Sec 161 CrPC', category: 'evidence', icon: <MapPin/>, required: true, completed: true },
  { id: '2', task: 'Seize compromised primary device (Phone/Laptop)', category: 'evidence', icon: <Smartphone/>, required: true, completed: false },
  { id: '3', task: 'Serve Notice under Sec 91 CrPC to Destination Bank Nodal Officer', category: 'legal', icon: <Building2/>, required: true, completed: true },
  { id: '4', task: 'Retrieve ATM CCTV footage for physical withdrawal (if any)', category: 'investigation', icon: <Clock/>, required: false, completed: false },
  { id: '5', task: 'Upload seized device hash & imaging logs to case file', category: 'digital', icon: <UploadCloud/>, required: true, completed: false },
];

export default function FieldInvestigationChecklist() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [tasks, setTasks] = useState(MOCK_CHECKLIST);
  const { data: response } = useComplaint(id);
  const complaint = response?.data;

  const toggleTask = (taskId: string) => {
    setTasks(tasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    ));
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = Math.round((completedCount / tasks.length) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              Investigation Guide
            </h1>
            <p className="text-sm text-slate-500">Standard Operating Procedure for Case {id}</p>
          </div>
        </div>
        <Button className="bg-slate-900 hover:bg-slate-800 text-white gap-2">
          <Save className="w-4 h-4" /> Save Progress
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-end mb-2">
            <div>
              <h2 className="text-lg font-bold text-slate-800">SOP Completion Status</h2>
              <p className="text-sm text-slate-500">Category: {complaint?.crimeCategory || '...'} • Priority: High</p>
            </div>
            <div className="text-2xl font-bold text-teal-600">{progress}%</div>
          </div>
          <Progress value={progress} className="h-2 mb-8 bg-slate-100" />

          <div className="space-y-3">
            {tasks.map((task) => (
              <div 
                key={task.id} 
                onClick={() => toggleTask(task.id)}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer shadow-sm ${
                  task.completed 
                    ? 'bg-slate-50 border-slate-200' 
                    : 'bg-white border-slate-200 hover:border-teal-400 hover:shadow-md'
                }`}
              >
                <div className="mt-0.5">
                  {task.completed 
                    ? <CheckSquare className="w-6 h-6 text-teal-500" />
                    : <Square className="w-6 h-6 text-slate-300" />
                  }
                </div>
                <div className="flex-1">
                  <p className={`text-base font-semibold ${task.completed ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                    {task.task}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="bg-slate-100 text-[10px] uppercase font-bold text-slate-500">
                      {task.category}
                    </Badge>
                    {task.required && !task.completed && (
                      <Badge className="bg-red-50 text-red-600 border-none text-[10px] uppercase font-bold hover:bg-red-50">
                        Mandatory
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
