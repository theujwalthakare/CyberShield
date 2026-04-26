'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Network, Search, X, ShieldAlert, Cpu, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

const getColor = (group: string) => {
  switch (group) {
    case 'victim': return '#3b82f6'; // blue
    case 'suspect': return '#ef4444'; // red
    case 'bank': return '#eab308'; // yellow
    case 'location': return '#a855f7'; // purple
    case 'social': return '#06b6d4'; // cyan
    case 'case': return '#9ca3af'; // gray
    default: return '#9ca3af'; 
  }
};

export default function SuspectGraphPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  const { data: graphData, isLoading } = useQuery({
    queryKey: ['global-network-graph'],
    queryFn: async () => {
      const supabase = createClient();
      
      // Pull recent complaints and their extracted entities to build the graph
      const { data: complaints, error: compErr } = await supabase
        .from('complaints')
        .select(`
           complaint_id,
           crime_category,
           complaint_entities (
             entity_id,
             entity_value,
             entity_type,
             mha_fraud_flag
           )
        `)
        .order('submitted_at', { ascending: false })
        .limit(10);
        
      if (compErr || !complaints?.length) return { nodes: [], links: [] };

      const nodesMap = new Map();
      const links: any[] = [];
      
      // Build Nodes & Links
      complaints.forEach((c: any) => {
        // Create case node
        nodesMap.set(c.complaint_id, {
          id: c.complaint_id,
          label: `CASE-${c.complaint_id.substring(0,4).toUpperCase()}`,
          group: 'case',
          size: 20
        });

        // Loop over entities to create entity nodes and link to the case
        c.complaint_entities?.forEach((ent: any) => {
          if (!nodesMap.has(ent.entity_value)) {
             nodesMap.set(ent.entity_value, {
               id: ent.entity_value,
               label: ent.entity_value,
               group: ent.mha_fraud_flag ? 'suspect' : (ent.entity_type === 'PHONE' ? 'social' : 'bank'),
               size: ent.mha_fraud_flag ? 30 : 15,
               rawType: ent.entity_type,
               isFraud: ent.mha_fraud_flag
             });
          }
          
          links.push({
             source: c.complaint_id,
             target: ent.entity_value,
             value: ent.mha_fraud_flag ? 4 : 1
          });
        });
      });

      return {
        nodes: Array.from(nodesMap.values()),
        links
      };
    }
  });

  useEffect(() => {
    if (!graphData || !containerRef.current || graphData.nodes.length === 0) return;
    
    // Clear previous SVG
    d3.select(containerRef.current).selectAll('*').remove();

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const svg = d3.select(containerRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .call(d3.zoom().on('zoom', (e) => {
        svg.select('g').attr('transform', e.transform);
      }) as any)
      .append('g');

    // Add arrow markers for links
    svg.append('defs').append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('fill', '#94a3b8')
      .attr('d', 'M0,-5L10,0L0,5');

    // Make deep copies because D3 mutates arrays
    const nodesData = graphData.nodes.map(d => ({...d}));
    const linksData = graphData.links.map(d => ({...d}));

    const simulation = d3.forceSimulation(nodesData as any)
      .force('link', d3.forceLink(linksData).id((d: any) => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius((d: any) => d.size + 15));

    const link = svg.append('g')
      .selectAll('line')
      .data(linksData)
      .join('line')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', (d) => Math.sqrt(d.value))
      .attr('marker-end', 'url(#arrow)');

    const node = svg.append('g')
      .selectAll('g')
      .data(nodesData)
      .join('g')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any)
      .on('click', (event, d) => {
        setSelectedNode(d);
      });

    node.append('circle')
      .attr('r', (d) => d.size)
      .attr('fill', (d) => getColor(d.group))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('class', 'cursor-pointer transition-all hover:stroke-slate-300 hover:stroke-[3px]');

    node.append('text')
      .text((d) => d.label)
      .attr('x', (d) => d.size + 5)
      .attr('y', 5)
      .attr('font-size', '12px')
      .attr('font-weight', '500')
      .attr('fill', '#334155');

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [graphData]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between z-10 w-full">
        <div className="flex items-center gap-3 shrink-0">
          <Network className="w-5 h-5 text-slate-700" />
          <h1 className="text-xl font-bold text-slate-900 hidden sm:block">ARJUNA Suspect Network</h1>
          <Badge className="bg-teal-50 text-teal-700 hover:bg-teal-100 border-none ml-2">Live Graph</Badge>
        </div>
      </div>

      <div className="flex-1 relative bg-slate-50 overflow-hidden w-full">
        {/* D3 Graph Container */}
        {(!graphData || graphData.nodes.length === 0) ? (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500">
             No relational entity data available yet.
          </div>
        ) : (
          <div ref={containerRef} className="w-full h-full" />
        )}

        {/* Floating Legend */}
        {graphData && graphData.nodes.length > 0 && (
          <Card className="absolute hidden sm:block bottom-6 left-6 shadow-lg border-slate-200 w-48">
            <CardContent className="p-4 space-y-2">
              <h4 className="text-sm font-bold text-slate-900 mb-3 border-b pb-2">Legend</h4>
              {[
                { label: 'High Risk Entity', color: 'bg-red-500' },
                { label: 'Bank / Domain', color: 'bg-yellow-500' },
                { label: 'Case Number', color: 'bg-gray-400' },
                { label: 'Social / Phone', color: 'bg-cyan-500' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} /> {item.label}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Selected Node Details Panel */}
        {selectedNode && (
          <Card className="absolute top-6 right-6 w-80 shadow-2xl border-slate-200 animate-in slide-in-from-right-8 duration-300">
            <div className={`h-2 w-full rounded-t-xl ${
              selectedNode.group === 'suspect' ? 'bg-red-500' : 
              selectedNode.group === 'case' ? 'bg-slate-500' : 'bg-blue-500'
            }`} />
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="min-w-0 pr-4">
                  <h3 className="font-bold text-lg text-slate-900 truncate">{selectedNode.label}</h3>
                  <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mt-1 border border-slate-200 w-fit px-1.5 py-0.5 rounded">
                    {selectedNode.rawType || selectedNode.group} Node
                  </p>
                </div>
                <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full p-1 shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {selectedNode.group === 'suspect' && (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-100 p-3 rounded-md">
                    <p className="text-xs font-bold text-red-800 flex items-center gap-1 mb-1">
                      <ShieldAlert className="w-3 h-3" /> HIGH RISK MHA ENTITY
                    </p>
                    <p className="text-[10px] text-red-700">This entity is actively flagged in the MHA registry.</p>
                  </div>
                </div>
              )}

              {selectedNode.group !== 'suspect' && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600">Dynamic node properties loaded directly from active DB state.</p>
                  <Button variant="outline" className="w-full text-xs" size="sm">
                    <Cpu className="w-4 h-4 mr-2" /> Run Trace Analysis
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
