import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Incident, IncidentStatus } from '../types';
import { 
  ArrowLeft, 
  Zap, 
  Terminal, 
  Bug, 
  CheckCircle,
  Clock,
  History,
  Slack,
  Ticket,
  Ban,
  ShieldCheck,
  ShieldAlert,
  Layout,
  Code,
  RefreshCcw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import axios from 'axios';

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

export default function IncidentDetailsPage() {
  const { id } = useParams();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'report' | 'raw' | 'timeline'>('report');

  useEffect(() => {
    if (!id) return;
    const unsubscribe = onSnapshot(doc(db, 'incidents', id), (doc) => {
      if (doc.exists()) {
        setIncident({ id: doc.id, ...doc.data() } as Incident);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `incidents/${id}`);
    });
    return () => unsubscribe();
  }, [id]);

  const executeAction = async (action: string) => {
    if (!id) return;
    setExecuting(action);
    try {
      await axios.post(`/api/incidents/${id}/action`, { action, actor: 'SOC Command' });
    } catch (err) {
      console.error('Action failed', err);
    } finally {
      setTimeout(() => setExecuting(null), 1000);
    }
  };

  const retryTriage = async () => {
    if (!id) return;
    setExecuting('triage');
    try {
      await axios.post(`/api/incidents/${id}/retry-triage`);
    } catch (err) {
      console.error('Retry triage failed', err);
    } finally {
      setTimeout(() => setExecuting(null), 1000);
    }
  };

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
       <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-t-indigo-500 border-white/5 rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">Reconstructing Forensics...</p>
       </div>
    </div>
  );
  
  if (!incident) return (
    <div className="flex h-[80vh] items-center justify-center">
       <div className="text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-[#ff0055] mx-auto opacity-50" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Incident Matrix Refused Session</p>
       </div>
    </div>
  );

  const sev = severityConfig(incident.severity);

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/[0.03] pb-8">
        <div className="flex items-center gap-6">
          <Link to="/app/dashboard" className="w-10 h-10 rounded-xl bg-soc-panel border border-soc-border flex items-center justify-center hover:border-slate-500 transition-all">
            <ArrowLeft className="w-4 h-4 text-slate-400" />
          </Link>
          <div className="space-y-1">
             <div className="flex items-center gap-3">
                {incident.source === 'demo' ? (
                  <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-2">
                    <Zap className="w-3 h-3" /> Demo Incident
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3" /> Production Incident
                  </span>
                )}
                {incident.isPriority && (
                  <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-2">
                    <Zap className="w-3 h-3" /> Priority Target
                  </span>
                )}
                <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border", sev.bg, sev.color, sev.border)}>
                   {sev.label}
                </span>
                <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">INC-{id?.substring(0, 8).toUpperCase()}</span>
             </div>
             <h1 className="text-4xl font-black uppercase tracking-tighter leading-none italic">{incident.attackType || 'Investigating...'}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <button 
            disabled={!!executing}
            onClick={() => executeAction('Mark Resolved')}
            className={cn(
              "px-6 py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all shadow-xl shadow-white/5 disabled:opacity-50",
              incident.status === 'resolved' && "bg-emerald-600 border border-emerald-500 text-white"
            )}
           >
            {incident.status === 'resolved' ? 'Case Closed' : 'Resolve Case'}
           </button>
        </div>
      </header>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Summary & Metadata */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-soc-panel border border-soc-border rounded-2xl p-8 space-y-8">
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 italic">Threat profile</h3>
                    {incident.aiStatus === 'quota_exceeded' && (
                       <span className="text-[9px] font-black uppercase text-rose-500 animate-pulse">Quota Exceeded</span>
                    )}
                    {incident.aiStatus === 'pending' && (
                       <span className="text-[9px] font-black uppercase text-indigo-400 animate-pulse">Analysis in progress</span>
                    )}
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-[#020617]/50 border border-white/[0.03] rounded-xl space-y-1">
                       <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Confidence</p>
                       <p className="text-xl font-black font-mono text-emerald-400">{Math.round((incident.confidence || 0.9) * 100)}%</p>
                    </div>
                    <div className="p-4 bg-[#020617]/50 border border-white/[0.03] rounded-xl space-y-1">
                       <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Severity</p>
                       <p className={cn("text-xl font-black font-mono", sev.color)}>{incident.severity || '??'}/10</p>
                    </div>
                 </div>

                 {(incident.aiStatus === 'quota_exceeded' || incident.aiStatus === 'failed') && (
                   <button 
                     onClick={retryTriage}
                     disabled={executing === 'triage'}
                     className="w-full py-3 bg-[#020617] border border-rose-500/30 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2 group shadow-lg shadow-rose-500/5"
                   >
                     {executing === 'triage' ? 'Fired Handshake...' : <><RefreshCcw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" /> Force AI Re-Triage</>}
                   </button>
                 )}
              </div>

              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 italic">Network Indicators</h3>
                    <Bug className="w-3 h-3 text-slate-700" />
                 </div>
                 <div className="flex flex-wrap gap-2">
                    {incident.iocs?.map((ioc, i) => (
                      <div key={i} className="px-3 py-1.5 bg-[#020617] border border-white/[0.05] rounded-lg text-[11px] font-mono text-indigo-300">
                        {ioc}
                      </div>
                    )) || <p className="text-[10px] text-slate-700 uppercase font-black tracking-widest leading-relaxed">No IOCs detected</p>}
                 </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/[0.03]">
                 <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 italic">MITRE Mapping</h3>
                    <Terminal className="w-3 h-3 text-slate-700" />
                 </div>
                 <div className="space-y-3">
                    {incident.mitreTechniques?.map((m, i) => (
                      <div key={i} className="flex items-center gap-3 group">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50 group-hover:bg-amber-500 transition-colors" />
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-tight">{m}</span>
                      </div>
                    )) || <p className="text-[10px] text-slate-700 uppercase font-black tracking-widest leading-relaxed italic">Matrix analysis pending</p>}
                 </div>
              </div>

              <div className="pt-6">
                 <div className="bg-indigo-600/5 border border-indigo-600/10 rounded-xl p-4 flex items-start gap-4">
                    <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
                    <div>
                       <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-1">Source Truth</p>
                       <p className="text-[11px] text-slate-400 leading-relaxed">This incident originated via <span className="text-white font-bold">{incident.source?.toUpperCase() || 'EXTERNAL'}</span> and was indexed by the Cortex Engine.</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Right Column: Tabbed Detailed Analysis */}
        <div className="lg:col-span-8 flex flex-col min-h-[600px]">
           {/* Tab Navigation */}
           <div className="flex border-b border-white/[0.03] space-x-8 mb-8">
              {[
                { id: 'report', label: 'AI Forensics', icon: Layout },
                { id: 'raw', label: 'Alert Source', icon: Code },
                { id: 'timeline', label: 'Audit Trail', icon: History }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "pb-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-2 border-b-2",
                    activeTab === tab.id 
                      ? "text-indigo-400 border-indigo-500" 
                      : "text-slate-600 border-transparent hover:text-slate-400"
                  )}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
           </div>

           {/* Tab Content */}
           <div className="flex-1">
              {activeTab === 'report' && (
                 <div className="space-y-12 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-6">
                       <span className="text-[12px] font-black uppercase tracking-[0.5em] text-emerald-400">Executive Analysis Matrix</span>
                       <div className="p-10 bg-soc-panel border border-soc-border rounded-[2.5rem] relative overflow-hidden group shadow-2xl">
                          <Zap className="absolute top-10 right-10 w-16 h-16 text-indigo-600/5 group-hover:text-indigo-600/20 transition-all" />
                          <p className="text-2xl font-black text-white leading-normal tracking-tight">
                             {incident.aiSummary || 'Automating forensic cross-correlation...'}
                          </p>
                       </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-10">
                       <div className="space-y-8">
                          <span className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-500">Remediation Plan</span>
                          <div className="space-y-5">
                             {incident.recommendedActions?.map((act, i) => (
                               <div key={i} className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-start gap-5 hover:border-emerald-500/30 transition-all">
                                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-inner">
                                     <CheckCircle className="w-4 h-4 text-emerald-500" />
                                  </div>
                                  <p className="text-[13px] font-bold text-slate-200 leading-relaxed uppercase tracking-tight italic">{act}</p>
                               </div>
                             )) || <p className="text-[11px] text-slate-700 font-black uppercase tracking-widest italic">Calculating response matrix...</p>}
                          </div>
                       </div>
                       
                       <div className="space-y-8">
                          <span className="text-[11px] font-black uppercase tracking-[0.4em] text-amber-500">Autopilot Response</span>
                          <div className="space-y-4">
                             {[
                               { label: 'Slack Notification', icon: Slack, status: incident.slackNotified ? 'Delivered' : 'pending' },
                               { label: 'Jira Integration', icon: Ticket, status: incident.jiraTicketId ? 'created' : 'awaiting' },
                               { label: 'Asset Isolation', icon: Ban, status: 'locked' }
                             ].map((action, i) => (
                               <div key={i} className="flex items-center justify-between p-5 bg-soc-panel border border-soc-border rounded-2xl group hover:border-slate-500 transition-all cursor-pointer shadow-lg shadow-black/10">
                                  <div className="flex items-center gap-4">
                                     <action.icon className="w-5 h-5 text-slate-500 group-hover:text-amber-500 transition-colors" />
                                     <span className="text-[13px] font-black uppercase tracking-tight text-slate-300 group-hover:text-white">{action.label}</span>
                                  </div>
                                  <span className={cn(
                                    "text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg",
                                    action.status === 'Delivered' || action.status === 'created' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-slate-700'
                                  )}>
                                     {action.status}
                                  </span>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                 </div>
              )}

              {activeTab === 'raw' && (
                 <div className="animate-in slide-in-from-bottom-2 duration-300 group">
                    <div className="flex items-center justify-between mb-4">
                       <span className="text-[11px] font-black uppercase tracking-[0.5em] text-indigo-400">Forensic Raw Matrix</span>
                       <button className="text-[10px] font-black text-slate-600 hover:text-white transition-colors uppercase tracking-widest">Download .JSON</button>
                    </div>
                    <div className="bg-[#020617] border border-white/[0.03] rounded-3xl p-8 relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-8 opacity-5">
                          <Terminal className="w-32 h-32 text-indigo-600" />
                       </div>
                       <pre className="text-[11px] font-mono text-indigo-400 overflow-x-auto leading-relaxed custom-scrollbar relative z-10 max-h-[600px]">
                          <code>{JSON.stringify(incident.rawAlert || { _error: "Payload unavailable" }, null, 3)}</code>
                       </pre>
                    </div>
                 </div>
              )}

              {activeTab === 'timeline' && (
                 <div className="animate-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center justify-between mb-8">
                       <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500">Logic Flow Audit</span>
                       <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Total Events: {incident.auditTrail?.length || 0}</span>
                    </div>
                    <div className="bg-soc-panel border border-soc-border rounded-3xl p-8 relative">
                       <div className="absolute left-[47px] top-[40px] bottom-[40px] w-px bg-indigo-500/10" />
                       <div className="space-y-12">
                          {(incident.auditTrail || []).map((log, i) => (
                             <div key={i} className="flex gap-10 relative group">
                                <div className="w-10 h-10 rounded-xl bg-[#020617] border border-white/[0.05] flex items-center justify-center shrink-0 z-10 group-hover:border-indigo-500 transition-colors">
                                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                </div>
                                <div className="flex-1 pt-1 space-y-2">
                                   <div className="flex items-center justify-between">
                                      <h4 className="text-sm font-black uppercase tracking-tighter text-slate-200">{log.action}</h4>
                                      <div className="flex items-center gap-2 text-slate-600">
                                         <Clock className="w-3 h-3" />
                                         <span className="text-[10px] font-mono font-bold">{log.timestamp}</span>
                                      </div>
                                   </div>
                                   <div className="flex items-center gap-3">
                                      <div className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                                         {log.actor}
                                      </div>
                                      <span className="text-[10px] text-slate-600 font-bold tracking-tight italic">Protocol session active</span>
                                   </div>
                                </div>
                             </div>
                          ))}
                          {(!incident.auditTrail || incident.auditTrail.length === 0) && (
                             <div className="py-12 text-center">
                                <p className="text-[10px] text-slate-700 font-black uppercase tracking-widest italic">Timeline reconstruction failure: No activity indexed</p>
                             </div>
                          )}
                       </div>
                    </div>
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}

function ArrowRight(props: any) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
    </svg>
  );
}
