import { useState, useEffect } from 'react';
import { 
  User, 
  Building, 
  Zap, 
  Lock,
  Save,
  Database,
  Shield,
  Activity,
  Cpu,
  Target,
  Monitor
} from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserSettings } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'system' | 'organization' | 'security' | 'intelligence'>('system');
  const [settings, setSettings] = useState<Partial<UserSettings>>({
    autopilotMode: 'autopilot',
    orgName: 'Global Cyber Ops',
    minSeverity: 7
  });

  useEffect(() => {
    const load = async () => {
      if (!auth.currentUser) return;
      const path = `settings/${auth.currentUser.uid}`;
      try {
        const docRef = doc(db, 'settings', auth.currentUser.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setSettings(snap.data() as UserSettings);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, path);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const saveSettings = async () => {
    if (!auth.currentUser) return;
    const path = `settings/${auth.currentUser.uid}`;
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', auth.currentUser.uid), {
        ...settings,
        userId: auth.currentUser.uid,
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
       <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-t-indigo-500 border-white/5 rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">Synchronizing Global Preferences...</p>
       </div>
    </div>
  );

  const tabs = [
    { id: 'system', label: 'Cortex System', icon: Monitor },
    { id: 'intelligence', label: 'AI Intelligence', icon: Cpu },
    { id: 'organization', label: 'Organization', icon: Building },
    { id: 'security', label: 'Shield & IAM', icon: Lock },
  ];

  return (
    <div className="max-w-[1400px] mx-auto space-y-12 animate-in fade-in duration-500">
      <header className="flex flex-col gap-2 border-b border-white/[0.03] pb-10">
        <h1 className="text-5xl font-black uppercase tracking-tighter leading-none italic text-white flex items-center gap-4">
           Central Command
        </h1>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] italic pl-1">Operational parameters & system logic</p>
      </header>

      <div className="grid lg:grid-cols-12 gap-12">
        {/* Sidebar Nav */}
        <div className="lg:col-span-3 space-y-2">
           <div className="bg-soc-panel border border-soc-border rounded-[2rem] p-6 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all group",
                    activeTab === tab.id 
                      ? "bg-white text-black shadow-xl shadow-white/5" 
                      : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                  )}
                >
                  <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-black" : "text-slate-500 group-hover:text-slate-300")} />
                  {tab.label}
                </button>
              ))}
           </div>

           <div className="p-8 bg-[#020617]/40 border border-white/5 rounded-[2rem] space-y-4">
              <div className="flex items-center gap-2">
                 <Shield className="w-3.5 h-3.5 text-slate-700" />
                 <span className="text-[9px] font-black uppercase tracking-widest text-slate-700 italic">Security Status</span>
              </div>
              <div className="space-y-3">
                 <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <span>Protocol Tier</span>
                    <span className="text-indigo-400 font-mono">GOLD-E</span>
                 </div>
                 <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full w-[85%]" />
                 </div>
              </div>
           </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9">
           <div className="bg-soc-panel border border-soc-border rounded-[3rem] p-12 space-y-12">
              
              {activeTab === 'system' && (
                 <div className="space-y-10 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-4">
                       <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">System Core</h2>
                       <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest max-w-xl leading-relaxed">
                          Define the operational boundaries for the SentraAI engine. These settings affect real-time processing of inbound telemetry.
                       </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                       <div className="p-8 bg-[#020617] border border-white/5 rounded-3xl space-y-6 group hover:border-slate-500 transition-all">
                          <Activity className="w-8 h-8 text-indigo-400 opacity-20 group-hover:opacity-100 transition-opacity" />
                          <div className="space-y-2">
                             <h3 className="font-black uppercase text-sm tracking-tight">Threshold Logic</h3>
                             <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest leading-relaxed">
                                Ignore signals below this severity floor to reduce analyst fatigue.
                             </p>
                          </div>
                          <div className="space-y-4 pt-4">
                             <div className="flex justify-between text-[11px] font-black font-mono text-slate-400">
                                <span>MIN DEPTH</span>
                                <span className="text-indigo-400">SEV {settings.minSeverity || 3}+</span>
                             </div>
                             <input 
                                type="range" 
                                min="1" max="10" 
                                value={settings.minSeverity || 3}
                                onChange={(e) => setSettings({...settings, minSeverity: parseInt(e.target.value)})}
                                className="w-full h-1 bg-[#020617] accent-indigo-500 cursor-pointer"
                             />
                          </div>
                       </div>

                       <div className="p-8 bg-[#020617] border border-white/5 rounded-3xl space-y-6 md:col-span-2 group hover:border-slate-500 transition-all">
                          <Target className="w-8 h-8 text-amber-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                          <div className="space-y-2">
                             <h3 className="font-black uppercase text-sm tracking-tight text-white">Custom Prioritization</h3>
                             <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest leading-relaxed">
                                Flag specific alerts as high priority automatically based on attributes.
                             </p>
                          </div>
                          <div className="space-y-4">
                             {settings.prioritizationRules?.map((rule, idx) => (
                               <div key={rule.id} className="flex flex-col sm:flex-row gap-3 sm:items-center bg-white/5 p-4 rounded-xl border border-white/5">
                                 <select 
                                   value={rule.field}
                                   onChange={e => {
                                     const newRules = [...(settings.prioritizationRules || [])];
                                     newRules[idx].field = e.target.value as any;
                                     setSettings({...settings, prioritizationRules: newRules});
                                   }}
                                   className="bg-black text-[10px] font-black uppercase tracking-widest text-slate-300 px-3 py-2 rounded-lg outline-none cursor-pointer border border-white/10 focus:border-indigo-500"
                                 >
                                    <option value="severity">Severity</option>
                                    <option value="source">Source</option>
                                    <option value="mitre">MITRE Tech/T-Code</option>
                                 </select>
                                 <select 
                                   value={rule.operator}
                                   onChange={e => {
                                     const newRules = [...(settings.prioritizationRules || [])];
                                     newRules[idx].operator = e.target.value as any;
                                     setSettings({...settings, prioritizationRules: newRules});
                                   }}
                                   className="bg-black text-[10px] font-black uppercase tracking-widest text-slate-300 px-3 py-2 rounded-lg outline-none cursor-pointer border border-white/10 focus:border-indigo-500"
                                 >
                                    <option value="equals">Equals</option>
                                    <option value="greater_than">Greater Than</option>
                                    <option value="contains">Contains / Includes</option>
                                 </select>
                                 <input 
                                   type="text"
                                   placeholder="Value (e.g. 8, wazuh, T1059)"
                                   value={rule.value}
                                   onChange={e => {
                                     const newRules = [...(settings.prioritizationRules || [])];
                                     newRules[idx].value = e.target.value;
                                     setSettings({...settings, prioritizationRules: newRules});
                                   }}
                                   className="flex-1 bg-black text-[10px] font-black uppercase tracking-widest text-white px-3 py-2 rounded-lg outline-none border border-white/10 focus:border-indigo-500"
                                 />
                                 <button 
                                   onClick={() => {
                                     const newRules = settings.prioritizationRules?.filter((_, i) => i !== idx);
                                     setSettings({...settings, prioritizationRules: newRules});
                                   }}
                                   className="w-full sm:w-auto px-4 py-2 bg-rose-500/10 text-rose-500 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/20 transition-colors"
                                 >
                                   Remove
                                 </button>
                               </div>
                             ))}
                             
                             <button
                               onClick={() => {
                                 const newRule = { id: Math.random().toString(36).substr(2, 9), field: 'severity', operator: 'greater_than', value: '7' };
                                 setSettings({...settings, prioritizationRules: [...(settings.prioritizationRules || []), newRule as any]});
                               }}
                               className="px-4 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500/20 transition-colors border border-indigo-500/20"
                             >
                               + Add Prioritization Rule
                             </button>
                          </div>
                       </div>
                    </div>
                 </div>
              )}

              {activeTab === 'intelligence' && (
                 <div className="space-y-10 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-4">
                       <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">AI Engine Logic</h2>
                       <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">Autopilot & Decision Matrix Configuration</p>
                    </div>

                    <div className="space-y-6">
                       {[
                         { 
                           id: 'recommend', 
                           title: 'Advisory Mode', 
                           desc: 'AI provides playbooks and forensic analysis but requires manual execution for all remediation actions.',
                           btn: 'Select Advisory',
                           accent: 'bg-emerald-500'
                         },
                         { 
                           id: 'autopilot', 
                           title: 'Full Autopilot', 
                           desc: 'AI autonomously executes firewall blocks, isolations, and notifications for high-confidence threats.',
                           btn: 'Activate Autopilot',
                           accent: 'bg-amber-500'
                         }
                       ].map((mode) => (
                         <div 
                           key={mode.id}
                           className={cn(
                             "relative p-8 rounded-[2rem] border transition-all overflow-hidden group",
                             settings.autopilotMode === mode.id 
                               ? "bg-white border-white shadow-2xl shadow-white/5" 
                               : "bg-[#020617] border-white/5 hover:border-slate-500"
                           )}
                         >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                               <div className="space-y-2">
                                  <div className="flex items-center gap-3">
                                     <div className={cn("w-2 h-2 rounded-full", mode.accent)} />
                                     <h3 className={cn("text-xl font-black uppercase italic tracking-tight", settings.autopilotMode === mode.id ? "text-black" : "text-white")}>
                                        {mode.title}
                                     </h3>
                                  </div>
                                  <p className={cn("text-[11px] font-bold uppercase tracking-tight max-w-lg leading-relaxed", settings.autopilotMode === mode.id ? "text-slate-600" : "text-slate-500")}>
                                     {mode.desc}
                                  </p>
                               </div>
                               <button 
                                 onClick={() => setSettings({...settings, autopilotMode: mode.id as any})}
                                 className={cn(
                                   "px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                                   settings.autopilotMode === mode.id 
                                     ? "bg-black text-white" 
                                     : "bg-white/5 text-slate-400 hover:bg-white/10"
                                 )}
                               >
                                  {settings.autopilotMode === mode.id ? 'Mode Active' : mode.btn}
                               </button>
                            </div>
                            
                            {settings.autopilotMode === mode.id && (
                               <div className="absolute top-0 right-0 p-8">
                                  <Zap className="w-24 h-24 text-black opacity-5 -rotate-12" />
                               </div>
                            )}
                         </div>
                       ))}
                    </div>
                 </div>
              )}

              {activeTab === 'organization' && (
                 <div className="space-y-10 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-4">
                       <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Identity & Nexus</h2>
                       <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic leading-relaxed">
                          Define how your organization is represented in secure telemetry and executive reports.
                       </p>
                    </div>

                    <div className="space-y-8 max-w-xl">
                       <div className="space-y-3">
                          <label className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-600">Company Name</label>
                          <input 
                            type="text" 
                            value={settings.orgName || ''}
                            onChange={e => setSettings({...settings, orgName: e.target.value})}
                            className="w-full bg-[#020617] border border-white/5 rounded-2xl px-6 py-5 font-black uppercase tracking-widest text-white outline-none focus:border-white transition-all shadow-inner"
                          />
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                          <div className="space-y-3">
                             <label className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-600">Command Center Location</label>
                             <div className="p-4 bg-white/5 rounded-2xl text-[11px] font-black text-slate-400 uppercase tracking-widest">Global Terminal 01</div>
                          </div>
                          <div className="space-y-3">
                             <label className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-600">Reporting Frequency</label>
                             <div className="p-4 bg-white/5 rounded-2xl text-[11px] font-black text-slate-400 uppercase tracking-widest italic">REAL-TIME SYNC</div>
                          </div>
                       </div>
                    </div>
                 </div>
              )}

              {activeTab === 'security' && (
                 <div className="space-y-10 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-4">
                       <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Advanced Protection</h2>
                       <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic leading-relaxed">
                          Manage security parameters and authentication logic for the command center.
                       </p>
                    </div>

                    <div className="bg-[#020617] border border-white/5 rounded-[2rem] p-10 space-y-8">
                       <div className="flex gap-6 items-start">
                          <div className="w-14 h-14 rounded-3xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shrink-0">
                             <Lock className="w-7 h-7 text-rose-500" />
                          </div>
                          <div className="space-y-3 flex-1">
                             <h4 className="text-lg font-black uppercase text-white italic">Hardened Session Logic</h4>
                             <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tight leading-relaxed">
                                Sessions are automatically rotated every 12 hours. Multi-factor authentication (MFA) is strictly required for destructive actions.
                             </p>
                          </div>
                       </div>

                       <div className="grid md:grid-cols-2 gap-8 pt-4">
                          <div className="p-6 bg-white/5 rounded-2xl space-y-3">
                             <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Current Operator</p>
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                                   <User className="w-4 h-4 text-indigo-400" />
                                </div>
                                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase truncate">{auth.currentUser?.email || 'Unauthorized'}</span>
                             </div>
                          </div>
                          <div className="p-6 bg-white/5 rounded-2xl space-y-3">
                             <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Clearance Level</p>
                             <div className="flex items-center gap-3">
                                <Shield className="w-4 h-4 text-emerald-500" />
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Global Architect</span>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              )}

              <footer className="pt-12 mt-12 border-t border-white/[0.03] flex flex-col md:flex-row items-center justify-between gap-8">
                 <div className="flex items-center gap-4">
                    <Shield className="w-8 h-8 text-slate-800" />
                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em] leading-relaxed max-w-xs italic">
                       Settings are replicated across all cortex nodes in real-time.
                    </p>
                 </div>
                 <button
                   onClick={saveSettings}
                   disabled={saving}
                   className="w-full md:w-auto px-10 py-5 bg-white text-black font-black uppercase text-[11px] tracking-[0.3em] rounded-2xl hover:bg-slate-200 transition-all shadow-2xl shadow-white/5 flex items-center justify-center gap-3"
                 >
                    {saving ? 'Synchronizing...' : <><Save className="w-4 h-4" /> Save Preferences</>}
                 </button>
              </footer>
           </div>
        </div>
      </div>
    </div>
  );
}
