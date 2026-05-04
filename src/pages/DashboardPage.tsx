import { useEffect, useState, useMemo } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  Timestamp,
  doc,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Incident, IncidentStatus } from '../types';
import { 
  ShieldAlert, 
  Clock, 
  Activity, 
  ExternalLink,
  Search,
  Filter,
  Zap,
  AlertTriangle,
  Brain,
  TrendingUp,
  BarChart3,
  RefreshCcw,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, subDays, startOfDay, isSameDay } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import axios from 'axios';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell
} from 'recharts';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const severityConfig = (score?: number) => {
  if (!score) return { color: 'text-slate-400', bg: 'bg-slate-800/50', border: 'border-slate-800', label: '??' };
  if (score >= 8) return { color: 'text-[#ff0055]', bg: 'bg-[#ff0055]/5', border: 'border-[#ff0055]/20', label: 'CRITICAL' };
  if (score >= 5) return { color: 'text-amber-500', bg: 'bg-amber-500/5', border: 'border-amber-500/20', label: 'HIGH' };
  if (score >= 3) return { color: 'text-indigo-400', bg: 'bg-indigo-400/5', border: 'border-indigo-400/20', label: 'MEDIUM' };
  return { color: 'text-emerald-400', bg: 'bg-emerald-400/5', border: 'border-emerald-400/20', label: 'LOW' };
};

export default function DashboardPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewFilter, setViewFilter] = useState<'all' | 'prod' | 'demo'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [integrations, setIntegrations] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);

  useEffect(() => {
    const unsubHealth = onSnapshot(doc(db, 'system', 'health'), (snap) => {
      if (snap.exists()) setSystemHealth(snap.data());
    });
    return () => unsubHealth();
  }, []);

  useEffect(() => {
    if (auth.currentUser) {
      axios.get(`/api/integrations/${auth.currentUser.uid}`)
        .then(res => setIntegrations(res.data))
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'incidents'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Incident));
      setIncidents(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'incidents');
    });
    return () => unsubscribe();
  }, []);

  const filteredIncidents = useMemo(() => {
    let result = incidents;
    if (viewFilter === 'prod') result = result.filter(i => i.source !== 'demo');
    if (viewFilter === 'demo') result = result.filter(i => i.source === 'demo');

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => 
        i.attackType?.toLowerCase().includes(q) || 
        i.source?.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q)
      );
    }
    return result;
  }, [incidents, viewFilter, searchQuery]);

  // KPI Calculations based on filtered view
  const criticalCount = filteredIncidents.filter(i => (i.severity || 0) >= 8).length;
  const autoActions = filteredIncidents.filter(i => i.slackNotified || i.jiraTicketId).length;
  
  // Charts Data
  const severityData = useMemo(() => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    filteredIncidents.forEach(i => {
      const s = i.severity || 0;
      if (s >= 8) counts.Critical++;
      else if (s >= 5) counts.High++;
      else if (s >= 3) counts.Medium++;
      else counts.Low++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredIncidents]);

  const trendsData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));
    return last7Days.map(day => {
      const count = filteredIncidents.filter(inc => {
        const date = (inc.createdAt as Timestamp)?.toDate();
        return date && isSameDay(date, day);
      }).length;
      return {
        date: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count
      };
    });
  }, [filteredIncidents]);

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto">
      {/* Header Overlay Style */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={cn(
              "w-2 h-2 rounded-full shadow-[0_0_10px]",
              systemHealth?.status === 'throttled' ? "bg-rose-500 animate-pulse shadow-rose-500" : "bg-emerald-500 shadow-emerald-500 animate-pulse"
            )}></span>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
              {systemHealth?.status === 'throttled' ? 'SYSTEM ADVISORY: AI CAPACITY REACHED' : 'Sector 7-G Command Center'}
            </span>
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter leading-none italic">Monitor <span className="text-indigo-400">Dash</span>.</h1>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-soc-panel/50 p-1.5 border border-soc-border rounded-[20px]">
          {[
            { id: 'all', label: 'All Signals' },
            { id: 'prod', label: 'Production' },
            { id: 'demo', label: 'Demo Only' }
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setViewFilter(btn.id as any)}
              className={cn(
                "px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                viewFilter === btn.id 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]"
              )}
            >
              {btn.label}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-3">
           <div className="flex flex-col items-end pr-4 border-r border-white/5">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest leading-none">Net Throughput</span>
              <span className="text-sm font-mono font-bold text-slate-300">142.8 GB/s</span>
           </div>
           <button className="h-12 px-6 bg-soc-panel border border-soc-border hover:border-indigo-500/50 rounded-2xl transition-all flex items-center gap-2 group">
              <RefreshCcw className="w-4 h-4 text-slate-500 group-hover:rotate-180 transition-transform duration-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Sync</span>
           </button>
        </div>
      </div>

      {/* KPI Section */}
      {systemHealth?.status === 'throttled' && (
        <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-[2rem] flex items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-500">
           <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
                 <AlertTriangle className="w-7 h-7 text-rose-500" />
              </div>
              <div className="space-y-1">
                 <h3 className="text-lg font-black uppercase tracking-tight text-white italic">AI Ingress Throttled (429 Rate Limit)</h3>
                 <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                   The SentraAI matrix has reached its current processing quota. AI analysis is being deferred to fallback protocols. 
                   <span className="text-rose-400 ml-2 italic underline decoration-rose-500/30">{systemHealth.recommendation}</span>
                 </p>
              </div>
           </div>
           <button 
             onClick={() => setSystemHealth(null)}
             className="px-6 py-3 bg-rose-500/10 hover:bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
           >
              Acknowledge
           </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Incidents Ingested', val: filteredIncidents.length, sub: 'Filtered Traffic', icon: Activity, color: 'text-indigo-400' },
          { label: 'Critical Breaches', val: criticalCount, sub: 'Immediate attention', icon: ShieldAlert, color: 'text-[#ff0055]' },
          { label: 'Autopilot Executed', val: autoActions, sub: 'Zero human touch', icon: Zap, color: 'text-amber-400' },
          { label: 'Avg Triage Speed', val: filteredIncidents.length > 0 ? '42s' : '0s', sub: 'Optimized by AI', icon: Clock, color: 'text-emerald-400' }
        ].map((kpi, i) => (
          <div key={i} className="bg-soc-panel border border-soc-border p-6 rounded-3xl relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity`}>
               <kpi.icon className="w-16 h-16" />
            </div>
            <div className="flex items-center gap-3 mb-4">
               <div className={cn("w-10 h-10 rounded-xl bg-white/[0.02] border border-white/[0.03] flex items-center justify-center", kpi.color)}>
                  <kpi.icon className="w-5 h-5" />
               </div>
               <div>
                  <p className="text-xs font-black uppercase text-slate-400 tracking-wider leading-none">{kpi.label}</p>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight mt-1">{kpi.sub}</p>
               </div>
            </div>
            <div className="flex items-end gap-2">
               <span className="text-4xl font-black font-mono tracking-tighter text-white leading-none">{kpi.val}</span>
               <div className="flex items-center gap-1 text-emerald-400 mb-1">
                  <TrendingUp className="w-3 h-3" />
                  <span className="text-[10px] font-bold">12%</span>
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-soc-panel border border-soc-border rounded-2xl p-6">
           <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                 </div>
                 <h3 className="text-sm font-black uppercase tracking-widest italic">Incident Trend <span className="text-slate-600 font-bold tracking-tight text-[10px] not-italic ml-2">(Last 7 Days)</span></h3>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    Ingress
                 </div>
              </div>
           </div>
           <div className="h-[300px] min-h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={trendsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                       <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#020617', border: '1px solid #ffffff10', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                    />
                    <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorTrend)" animationDuration={1000} />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-soc-panel border border-soc-border rounded-2xl p-6">
           <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                 <BarChart3 className="w-4 h-4 text-amber-500" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest italic">By Severity</h3>
           </div>
           <div className="h-[300px] min-h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={severityData} layout="vertical" margin={{ left: -25, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={false} stroke="#ffffff05" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                      contentStyle={{ backgroundColor: '#020617', border: '1px solid #ffffff10', borderRadius: '12px' }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20} animationDuration={1000}>
                       {severityData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.name === 'Critical' ? '#ff0055' : entry.name === 'High' ? '#f59e0b' : '#6366f1'} 
                          />
                       ))}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* Main Feed Content */}
      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
               <ShieldAlert className="w-5 h-5 text-indigo-400" />
               <h2 className="text-lg font-black uppercase tracking-tight italic">Active Threat Matrix</h2>
            </div>
            <div className="flex items-center gap-3">
               <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                  <input 
                    type="text" 
                    placeholder="Search payload..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-soc-panel border border-soc-border rounded-xl py-2 pl-9 pr-4 text-[10px] font-bold uppercase tracking-widest focus:border-indigo-500 outline-none w-48 transition-all"
                  />
               </div>
               <button className="p-2.5 bg-soc-panel border border-soc-border rounded-xl hover:bg-slate-800 transition-colors">
                 <Filter className="w-4 h-4 text-slate-500" />
               </button>
            </div>
          </div>

          <div className="bg-soc-panel border border-soc-border rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#020617]/80 border-b border-white/[0.05] text-slate-300 font-black text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-10 py-6">Timestamp</th>
                    <th className="px-10 py-6">Entity / Vector</th>
                    <th className="px-10 py-6">Severity</th>
                    <th className="px-10 py-6">Source</th>
                    <th className="px-10 py-6">Status</th>
                    <th className="px-10 py-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-24 text-center">
                         <div className="flex flex-col items-center gap-6">
                            <div className="w-10 h-10 border-2 border-t-indigo-500 border-white/10 rounded-full animate-spin" />
                            <p className="text-[12px] font-black uppercase text-slate-500 tracking-widest italic">Synchronizing with Mainframe Matrix...</p>
                         </div>
                      </td>
                    </tr>
                  ) : filteredIncidents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-24 text-center text-slate-600 font-black text-[11px] uppercase tracking-widest italic">Operational Silence. No threats detected.</td>
                    </tr>
                  ) : filteredIncidents.map((incident) => {
                    const config = severityConfig(incident.severity);
                    const isDemo = incident.source === 'demo';
                    return (
                      <tr key={incident.id} className="hover:bg-white/[0.04] transition-all group border-b border-white/[0.02] last:border-0">
                        <td className="px-10 py-7 font-mono text-xs text-slate-300 whitespace-nowrap">
                          {incident.createdAt ? formatDistanceToNow((incident.createdAt as Timestamp).toDate(), { addSuffix: true }) : 'Real-time'}
                        </td>
                        <td className="px-10 py-7">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                               {isDemo ? (
                                 <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[8px] font-black uppercase tracking-widest rounded-md">Demo</span>
                               ) : (
                                 <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase tracking-widest rounded-md">Prod</span>
                               )}
                               <span className="font-black text-[15px] uppercase tracking-tight text-white group-hover:text-indigo-400 transition-colors">
                                 {incident.attackType || 'Protocol Extraction Failure'}
                               </span>
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono font-bold tracking-widest uppercase italic">ID: {incident.id.substring(0, 12).toUpperCase()}</span>
                          </div>
                        </td>
                        <td className="px-10 py-7">
                          <span className={cn(
                            "px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border shadow-2xl", 
                            config.bg, config.color, config.border
                          )}>
                            {config.label} {incident.severity}
                          </span>
                        </td>
                        <td className="px-10 py-7">
                           <div className="flex items-center gap-3">
                              <div className={cn("w-2 h-2 rounded-full", isDemo ? "bg-purple-500" : "bg-slate-700")} />
                              <span className="text-xs font-black uppercase text-slate-300 tracking-widest">{incident.source?.toUpperCase() || 'EXTERNAL'}</span>
                           </div>
                        </td>
                        <td className="px-10 py-7">
                           <div className="flex items-center gap-3">
                             <div className={cn("w-2 h-2 rounded-full shadow-[0_0_12px]", incident.status === IncidentStatus.NEW ? 'bg-indigo-500 animate-pulse' : 'bg-slate-700 shadow-none')}></div>
                             <span className={cn(
                               "text-xs font-black uppercase tracking-wider",
                               incident.status === IncidentStatus.NEW ? "text-indigo-400" : "text-slate-400"
                             )}>
                               {incident.status.toUpperCase()}
                             </span>
                           </div>
                        </td>
                        <td className="px-10 py-7 text-right">
                          <Link 
                            to={`/app/incidents/${incident.id}`}
                            className="inline-flex items-center gap-3 px-5 py-3 bg-[#020617] border border-white/5 rounded-xl text-[11px] font-black uppercase tracking-widest text-[#ff0055] hover:bg-[#ff0055] hover:text-white transition-all shadow-xl"
                          >
                            Investigate <ExternalLink className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar panels */}
        <div className="space-y-6">
          <div className="bg-soc-panel border border-soc-border rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4">
              <Brain className="w-4 h-4 text-indigo-400 animate-pulse" />
            </div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mb-6 italic">Autopilot Activity</h2>
            <div className="space-y-6 relative">
              <div className="absolute left-1.5 top-2 bottom-2 w-px bg-white/[0.03]" />
              {incidents.filter((i: any) => i.status === 'triaged' || i.slackNotified).slice(0, 5).map((i: any) => (
                <div key={i.id} className="relative pl-6">
                  <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-indigo-600 border-4 border-soc-bg" />
                  <p className="text-[9px] text-amber-400 font-black uppercase tracking-widest mb-1">Response Initiated</p>
                  <p className="text-[11px] text-slate-200 font-bold leading-tight">{i.attackType}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[9px] text-slate-600 font-black uppercase">SLACK_OUTCOMING</span>
                    <span className="text-[9px] text-emerald-500 font-black uppercase">Confirmed</span>
                  </div>
                </div>
              ))}
              {incidents.filter((i: any) => i.status === 'triaged' || i.slackNotified).length === 0 && (
                <div className="py-8 text-center">
                   <p className="text-[10px] text-slate-700 font-black uppercase tracking-widest italic">Awaiting AI Logic...</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-soc-panel border border-soc-border rounded-2xl p-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mb-6 flex items-center justify-between">
               Attack Forge
               <span className="text-[8px] font-black tracking-widest px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 animate-pulse">Ready</span>
            </h2>
            <div className="space-y-4">
               <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase">
                 Simulate realistic cyber-attack scenarios to verify Autopilot detection and resolution pipelines.
               </p>
               <Link
                 to="/app/simulator"
                 className="w-full h-12 bg-indigo-600 text-white rounded-xl px-4 flex items-center justify-center gap-2 hover:bg-indigo-500 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/10"
               >
                 <Zap className="w-3 h-3" />
                 Launch Forge
               </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
