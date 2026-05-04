import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  Timestamp,
  where,
  limit
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Incident, IncidentStatus } from '../types';
import { 
  Search, 
  Filter, 
  ArrowRight, 
  ShieldAlert, 
  Clock, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Zap,
  Activity
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const severityConfig = (score?: number) => {
  if (!score) return { color: 'text-slate-400', bg: 'bg-slate-800/50', border: 'border-slate-800', label: '??' };
  if (score >= 8) return { color: 'text-[#ff0055]', bg: 'bg-[#ff0055]/10', border: 'border-[#ff0055]/30', label: 'CRITICAL' };
  if (score >= 5) return { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: 'HIGH' };
  if (score >= 3) return { color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/30', label: 'MEDIUM' };
  return { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30', label: 'LOW' };
};

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  useEffect(() => {
    let q = query(collection(db, 'incidents'), orderBy('createdAt', 'desc'), limit(100));
    
    // Note: Complex filtering in Firestore requires composite indexes. 
    // We'll filter client-side for simplicity in this demo environment
    // unless we strictly need server-side where/orderBy combinations.

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Incident));
      setIncidents(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'incidents');
    });

    return () => unsubscribe();
  }, []);

  const filteredIncidents = incidents.filter(inc => {
    const matchesSearch = inc.attackType?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         inc.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inc.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || 
                           (severityFilter === 'critical' && (inc.severity || 0) >= 8) ||
                           (severityFilter === 'high' && (inc.severity || 0) >= 5 && (inc.severity || 0) < 8) ||
                           (severityFilter === 'medium' && (inc.severity || 0) >= 3 && (inc.severity || 0) < 5) ||
                           (severityFilter === 'low' && (inc.severity || 0) < 3);
    
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  return (
    <div className="space-y-12 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      <header className="flex flex-col gap-2 border-b border-white/[0.03] pb-10">
        <h1 className="text-5xl font-black uppercase tracking-tighter leading-none italic text-white">Incident Archive</h1>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] italic pl-1">Historical forensic registry & audit</p>
      </header>

      {/* Filter Bar */}
      <div className="bg-soc-panel border border-soc-border rounded-[2rem] p-4 flex flex-wrap items-center gap-4 shadow-2xl shadow-black/20">
         <div className="flex-1 min-w-[300px] relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 transition-colors group-focus-within:text-indigo-400" />
            <input 
              type="text" 
              placeholder="Filter by Attack Type or CID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#020617] border border-white/5 rounded-2xl pl-12 pr-6 py-4 text-[10px] uppercase font-black tracking-widest text-white outline-none focus:border-indigo-500 transition-all shadow-inner"
            />
         </div>

         <div className="flex items-center gap-2">
            <div className="px-5 py-4 bg-[#020617] border border-white/5 rounded-2xl flex items-center gap-4">
               <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 italic">Severity</span>
               <select 
                 value={severityFilter}
                 onChange={(e) => setSeverityFilter(e.target.value)}
                 className="bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-400 outline-none"
               >
                  <option value="all">ALL TIERS</option>
                  <option value="critical">CRITICAL</option>
                  <option value="high">HIGH</option>
                  <option value="medium">MEDIUM</option>
                  <option value="low">LOW</option>
               </select>
            </div>

            <div className="px-5 py-4 bg-[#020617] border border-white/5 rounded-2xl flex items-center gap-4">
               <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 italic">Status</span>
               <select 
                 value={statusFilter}
                 onChange={(e) => setStatusFilter(e.target.value)}
                 className="bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-400 outline-none"
               >
                  <option value="all">ANY STATUS</option>
                  {Object.values(IncidentStatus).map(s => (
                    <option key={s} value={s}>{s.toUpperCase()}</option>
                  ))}
               </select>
            </div>
         </div>
      </div>

      {/* Main Table */}
      <div className="bg-soc-panel border border-soc-border rounded-[3rem] overflow-hidden shadow-2xl shadow-indigo-500/5">
         <div className="overflow-x-auto">
            <table className="w-full border-collapse">
               <thead>
                  <tr className="border-b border-white/[0.03]">
                     <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 italic">Identification</th>
                     <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 italic">Classification</th>
                     <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 italic">Timestamp</th>
                     <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 italic">Status</th>
                     <th className="px-10 py-8 text-right text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 italic">Forensics</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/[0.02]">
                  {filteredIncidents.map((inc) => {
                    const sev = severityConfig(inc.severity);
                    return (
                      <tr key={inc.id} className="group hover:bg-white/[0.01] transition-colors relative">
                          <td className="px-10 py-6">
                            <div className="space-y-2">
                               <div className="flex items-center gap-2">
                                  {inc.source === 'demo' ? (
                                    <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[8px] font-black uppercase tracking-widest rounded-md">Demo</span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase tracking-widest rounded-md">Prod</span>
                                  )}
                                  {inc.isPriority && (
                                    <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[8px] font-black uppercase tracking-widest rounded-md flex items-center gap-1">
                                       <Zap className="w-2 h-2" /> Priority
                                    </span>
                                  )}
                                  <span className="text-xs font-black uppercase tracking-tighter text-slate-200 group-hover:text-indigo-400 transition-colors">
                                     {inc.attackType || 'Unclassified Threat'}
                                  </span>
                                  <Link to={`/app/incidents/${inc.id}`} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                     <ExternalLink className="w-3 h-3 text-slate-600 hover:text-white" />
                                  </Link>
                               </div>
                               <p className="text-[9px] font-mono font-bold text-slate-700 uppercase tracking-widest leading-none">{inc.id.substring(0, 12)}</p>
                            </div>
                         </td>
                         <td className="px-10 py-6">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                              sev.bg, sev.color, sev.border
                            )}>
                               {sev.label} {inc.severity}
                            </span>
                         </td>
                         <td className="px-10 py-6">
                            <div className="flex items-center gap-3 text-slate-500">
                               <Clock className="w-3.5 h-3.5" />
                               <span className="text-[10px] font-black uppercase tracking-widest">
                                  {inc.createdAt ? formatDistanceToNow((inc.createdAt as Timestamp).toDate(), { addSuffix: true }) : 'Just now'}
                               </span>
                            </div>
                         </td>
                         <td className="px-10 py-6">
                            <div className="flex items-center gap-2">
                               <div className={cn(
                                 "w-1.5 h-1.5 rounded-full",
                                 inc.status === IncidentStatus.RESOLVED ? "bg-emerald-500" : "bg-indigo-500"
                               )} />
                               <span className={cn(
                                 "text-[10px] font-black uppercase tracking-widest",
                                 inc.status === IncidentStatus.RESOLVED ? "text-emerald-500" : "text-slate-400"
                               )}>
                                  {inc.status}
                               </span>
                            </div>
                         </td>
                         <td className="px-10 py-6 text-right">
                            <Link 
                              to={`/app/incidents/${inc.id}`}
                              className="inline-flex items-center gap-3 px-5 py-3 bg-[#020617] border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-slate-500 transition-all shadow-xl"
                            >
                               View Matrix <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </Link>
                         </td>
                      </tr>
                    );
                  })}
                  {filteredIncidents.length === 0 && !loading && (
                    <tr>
                      <td colSpan={5} className="py-24 text-center">
                         <div className="flex flex-col items-center gap-4 opacity-20">
                            <ShieldAlert className="w-12 h-12 text-slate-400" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">No forensic matches in local registry</p>
                         </div>
                      </td>
                    </tr>
                  )}
                  {loading && (
                    <tr>
                      <td colSpan={5} className="py-24 text-center">
                         <div className="flex flex-col items-center gap-4">
                            <div className="w-8 h-8 border-2 border-t-indigo-500 border-white/5 rounded-full animate-spin" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">Accessing Indexing Cluster...</p>
                         </div>
                      </td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>

         {/* Pagination Mock Footer */}
         <div className="px-10 py-8 bg-black/20 border-t border-white/[0.03] flex items-center justify-between">
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 italic">Telemetry Synced</span>
               </div>
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Displaying {filteredIncidents.length} Records</span>
            </div>

            <div className="flex items-center gap-2">
               <button className="p-3 bg-[#020617] border border-white/5 rounded-xl text-slate-700 cursor-not-allowed">
                  <ChevronLeft className="w-4 h-4" />
               </button>
               <div className="px-4 text-[10px] font-black text-white">01</div>
               <button className="p-3 bg-[#020617] border border-white/5 rounded-xl text-slate-500 hover:border-slate-400 transition-all">
                  <ChevronRight className="w-4 h-4" />
               </button>
            </div>
         </div>
      </div>

      {/* Decorative Guard Card */}
      <div className="bg-indigo-600/5 border border-indigo-600/10 rounded-[2rem] p-10 flex items-center justify-between gap-10">
         <div className="flex gap-6 items-start">
            <div className="w-14 h-14 rounded-3xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shrink-0">
               <Zap className="w-7 h-7 text-indigo-400" />
            </div>
            <div className="space-y-1">
               <h4 className="text-xl font-black uppercase italic tracking-tighter text-white">Neural Pattern Search</h4>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed max-w-2xl">
                  SentraAI's global indexing engine processes 45k+ security events per second. Filters applied on this page utilize edge-cached results for <span className="text-white">sub-50ms</span> latency.
               </p>
            </div>
         </div>
         <div className="hidden md:block">
            <div className="px-6 py-3 bg-[#020617] border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500">
               Cluster: <span className="text-emerald-500">US-EAST-01-A</span>
            </div>
         </div>
      </div>
    </div>
  );
}
