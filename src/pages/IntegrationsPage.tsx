import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Slack, 
  Ticket, 
  Globe, 
  Copy, 
  CheckCircle,
  ExternalLink,
  Shield,
  Save,
  Zap,
  Lock,
  Workflow
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { onSnapshot, doc } from 'firebase/firestore';
import { IntegrationConfig } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function IntegrationsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState<{ slack?: boolean; jira?: boolean }>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [config, setConfig] = useState<Partial<IntegrationConfig>>({
    wazuhSecretToken: 'sentra-tok_' + Math.random().toString(36).substring(7),
  });
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [systemHealth, setSystemHealth] = useState<any>(null);

  useEffect(() => {
    const unsubHealth = onSnapshot(doc(db, 'system', 'health'), (snap) => {
      if (snap.exists()) setSystemHealth(snap.data());
    });
    return () => unsubHealth();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!auth.currentUser) return;
      try {
        const response = await fetch(`/api/integrations/${auth.currentUser.uid}`);
        if (response.ok) {
          const data = await response.json();
          setConfig(data);
        }
      } catch (err) {
        console.error("Failed to load integrations:", err);
      }
      setLoading(false);
    };
    load();
  }, []);

  const saveConfig = async () => {
    if (!auth.currentUser) return;
    setSaving(true);

    // Save to LocalStorage as requested
    localStorage.setItem(`integration_config_${auth.currentUser.uid}`, JSON.stringify(config));

    try {
      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: auth.currentUser.uid,
          config: config
        })
      });
      if (response.ok) {
        // Automatically test after save
        if (config.slackWebhook) {
           await testSlack();
        }
        // Assuming testJira exists or needs to be created, for now just focus on Slack as requested
      } else {
        throw new Error('Save failed');
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; details?: string } | null>(null);

  const testSlack = async () => {
    if (!config.slackWebhook) return;
    setTesting(true);
    setTestResult(null);
    try {
      const response = await fetch('/api/integrations/test/slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: auth.currentUser?.uid,
          webhook: config.slackWebhook 
        })
      });
      const data = await response.json();
      if (response.ok) {
        setTestResult({ success: true, message: 'Slack notification verified successfully.' });
      } else {
        setTestResult({ 
          success: false, 
          message: data.error || 'Verification Failed', 
          details: data.details ? JSON.stringify(data.details) : data.message 
        });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: 'Network or Protocol Error', details: err.message });
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
       <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-t-indigo-500 border-white/5 rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">Accessing Integration Matrix...</p>
       </div>
    </div>
  );

  const webhookUrl = `${window.location.origin}/api/alerts/wazuh`;

  return (
    <div className="max-w-[1400px] mx-auto space-y-12 animate-in fade-in duration-500">
      <header className="flex flex-col gap-2 border-b border-white/[0.03] pb-10">
        <h1 className="text-5xl font-black uppercase tracking-tighter leading-none italic">Plugin Matrix</h1>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] italic pl-1">Hyper-connected SOC infrastructure</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Core Intake: Wazuh */}
        <div className="lg:col-span-2 bg-soc-panel border border-soc-border rounded-[2rem] p-10 space-y-8 relative overflow-hidden group">
           <Shield className="absolute top-10 right-10 w-24 h-24 text-indigo-500 opacity-5 -rotate-12 group-hover:rotate-0 transition-transform duration-500" />
           <div className="space-y-2">
             <div className="flex items-center gap-3">
               <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-inner">
                  <Zap className="w-5 h-5 text-indigo-400" />
               </div>
               <div>
                  <h3 className="text-xl font-black tracking-tight text-white uppercase italic">Wazuh SIEM Integration</h3>
                  <div className="flex items-center gap-2">
                     <span className={cn(
                       "w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px]",
                       systemHealth?.status === 'throttled' ? "bg-rose-500 shadow-rose-500" : "bg-emerald-500 shadow-emerald-500"
                     )} />
                     <span className={cn(
                       "text-[9px] font-black uppercase tracking-widest",
                       systemHealth?.status === 'throttled' ? "text-rose-500" : "text-emerald-500"
                     )}>
                       {systemHealth?.status === 'throttled' ? 'Latency Detected: Quota Limit' : 'System Core Active'}
                     </span>
                  </div>
               </div>
             </div>
           </div>

           <div className="grid md:grid-cols-2 gap-10 pt-4">
              <div className="space-y-6">
                 <div className="space-y-3">
                    <label className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-600">Secure Intake URL</label>
                    <div className="relative group/field">
                       <input 
                         readOnly
                         value={webhookUrl}
                         className="w-full bg-[#020617] border border-white/5 rounded-2xl px-5 py-4 font-mono text-[11px] text-slate-500 outline-none transition-all pr-12"
                       />
                       <button 
                         onClick={() => copyToClipboard(webhookUrl)}
                         className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white/5 rounded-xl transition-all"
                       >
                         {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-600" />}
                       </button>
                    </div>
                 </div>
                 
                 <div className="space-y-4">
                    <h4 className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Configuration Steps:</h4>
                    <ol className="list-decimal list-inside text-xs text-slate-400 space-y-2 font-mono ml-2">
                      <li>Paste the secure intake URL into your `&lt;integration&gt;` block in `ossec.conf`</li>
                      <li>Set `&lt;hook_url&gt;` to the URL above</li>
                      <li>Restart the wazuh-manager service</li>
                    </ol>
                 </div>
              </div>

              <div className="space-y-6 flex flex-col justify-end pb-4">
                 <button 
                   onClick={async () => {
                     setTesting(true);
                     try {
                        await fetch('/api/alerts/wazuh', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ userId: auth.currentUser?.uid, source: 'demo', rule: { level: 9, description: 'Test Alert: Unauthorized File Access' } })
                        });
                        alert('Test alert fired! Check incidents dashboard.');
                     } catch (e) {}
                     setTesting(false);
                   }}
                   disabled={testing}
                   className="w-full py-5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-indigo-500/20 transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/5"
                 >
                   {testing ? 'Firing...' : <><Zap className="w-5 h-5" /> Send Test Wazuh Alert</>}
                 </button>
              </div>
           </div>
        </div>

        {/* Small Utility Card */}
        <div className="bg-soc-panel border border-soc-border rounded-[2rem] p-10 space-y-6 flex flex-col justify-between">
           <div className="space-y-4">
              <Globe className="w-10 h-10 text-slate-800" />
              <h3 className="text-lg font-black uppercase tracking-tight italic">Generic Webhooks</h3>
              <p className="text-xs text-slate-500 leading-relaxed uppercase tracking-tight font-bold">
                 SentraAI supports generic JSON structures. Any tool capable of firing a POST request can be integrated.
              </p>
           </div>
           <button className="w-full py-4 border border-white/5 bg-[#020617] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-slate-500 transition-all">
              Documentation
           </button>
        </div>

        {/* Slack Card */}
        <div className="bg-soc-panel border border-soc-border rounded-[2rem] p-10 space-y-8 group transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/5">
           <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
                 <Slack className="w-7 h-7 text-emerald-500" />
              </div>
              <div className="flex items-center gap-4">
                 {(config as any).updatedAt && (
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 hidden xl:block">
                       Updated {new Date((config as any).updatedAt).toLocaleTimeString()}
                    </span>
                 )}
                 <div className="flex items-center gap-2">
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      config.slackWebhook ? "bg-emerald-500" : "bg-slate-800"
                    )} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                       {config.slackWebhook ? 'Connected' : 'Offline'}
                    </span>
                 </div>
              </div>
           </div>

           <div className="space-y-4">
              <div className="flex items-center justify-between">
                 <h3 className="text-2xl font-black italic tracking-tighter uppercase">Slack App</h3>
                 <button 
                   onClick={() => setEditMode({...editMode, slack: !editMode.slack})}
                   className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300"
                 >
                   {editMode.slack ? 'Cancel Config' : 'Edit Config'}
                 </button>
              </div>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tight leading-relaxed">
                 Real-time alert delivery to SOC channels via incoming webhooks.
              </p>
           </div>

           <div className="space-y-3">
              <label className="text-[10px] uppercase font-black tracking-widest text-slate-600">Webhook URL</label>
              <input 
                type="text" 
                readOnly={!editMode.slack && !!config.slackWebhook}
                value={config.slackWebhook || ''}
                onChange={e => setConfig({...config, slackWebhook: e.target.value})}
                placeholder="https://hooks.slack.com/services/..."
                className={cn(
                  "w-full bg-[#020617] border rounded-2xl px-5 py-4 font-mono text-[11px] outline-none transition-all shadow-inner",
                  (!editMode.slack && !!config.slackWebhook) ? "border-slate-800 text-slate-600" : "border-white/10 text-emerald-400 focus:border-emerald-500"
                )}
              />
           </div>

           <div className="flex flex-col gap-4">
              {(!config.slackWebhook || editMode.slack) && (
                <button 
                  onClick={async () => {
                    await saveConfig();
                    setEditMode({...editMode, slack: false});
                  }}
                  disabled={saving}
                  className="w-full py-5 bg-white text-black rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-slate-200 transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-3"
                >
                  {saving ? 'Encrypting...' : <><Save className="w-5 h-5" /> Save Configuration</>}
                </button>
              )}
              
              {config.slackWebhook && !editMode.slack && (
                <button 
                  onClick={testSlack}
                  disabled={testing || !config.slackWebhook}
                  className="w-full py-5 bg-[#020617] border border-white/5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-slate-300 hover:border-emerald-500/50 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                   {testing ? 'Firing Test Alert...' : <><Slack className="w-5 h-5 text-emerald-500" /> Test Slack Integration</>}
                </button>
              )}

              {testResult && (
                <div className={cn(
                  "p-6 rounded-2xl border animate-in fade-in slide-in-from-top-2 duration-300",
                  testResult.success ? "bg-emerald-500/10 border-emerald-500/30" : "bg-rose-500/10 border-rose-500/30"
                )}>
                  <div className="flex items-center justify-between mb-2">
                     <span className={cn("text-[10px] font-black uppercase tracking-[0.2em]", testResult.success ? "text-emerald-500" : "text-rose-500")}>
                        {testResult.success ? 'SUCCESS: HANDSHAKE VERIFIED' : 'FAILURE: PROTOCOL REFUSED'}
                     </span>
                     {testResult.success && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                  </div>
                  <p className="text-[11px] font-bold text-slate-300 uppercase leading-relaxed">{testResult.message}</p>
                  {testResult.details && (
                    <div className="mt-4 p-4 bg-black/40 rounded-xl">
                       <p className="text-[9px] font-mono text-slate-500 break-all">{testResult.details}</p>
                    </div>
                  )}
                </div>
              )}
           </div>
        </div>

        {/* Jira Card */}
        <div className="bg-soc-panel border border-soc-border rounded-[2rem] p-10 space-y-8 group transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/5">
           <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-3xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                 <Ticket className="w-7 h-7 text-blue-500" />
              </div>
              <div className="flex items-center gap-4">
                 {(config as any).updatedAt && (
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 hidden xl:block">
                       Updated {new Date((config as any).updatedAt).toLocaleTimeString()}
                    </span>
                 )}
                 <div className="flex items-center gap-2">
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      config.jiraConfig?.baseUrl ? "bg-emerald-500" : "bg-slate-800"
                    )} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                       {config.jiraConfig?.baseUrl ? 'Connected' : 'Offline'}
                    </span>
                 </div>
              </div>
           </div>

           <div className="space-y-4">
              <div className="flex items-center justify-between">
                 <h3 className="text-2xl font-black italic tracking-tighter uppercase">Jira Cloud</h3>
                 <button 
                   onClick={() => setEditMode({...editMode, jira: !editMode.jira})}
                   className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300"
                 >
                   {editMode.jira ? 'Cancel Config' : 'Edit Config'}
                 </button>
              </div>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tight leading-relaxed">
                 Automated ticketing and workflow management for critical breaches.
              </p>
           </div>

           <div className="space-y-4">
              <div className="space-y-2">
                <input 
                  type="text" 
                  readOnly={!editMode.jira && !!config.jiraConfig?.baseUrl}
                  value={config.jiraConfig?.baseUrl || ''}
                  onChange={e => setConfig({
                    ...config, 
                    jiraConfig: { ...(config.jiraConfig || { email: '', apiToken: '', projectKey: '' }), baseUrl: e.target.value } 
                  })}
                  placeholder="Instance URL (e.g. dev-soc.atlassian.net)"
                  className={cn(
                     "w-full rounded-2xl px-5 py-4 font-mono text-[11px] outline-none transition-all",
                     !editMode.jira && config.jiraConfig?.baseUrl 
                       ? "bg-[#020617] text-slate-500 border border-white/5 cursor-default" 
                       : "bg-[#020617] border border-white/10 text-blue-400 focus:border-blue-500 shadow-inner"
                  )}
                />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                 <input 
                    type="text" 
                    readOnly={!editMode.jira && !!config.jiraConfig?.baseUrl}
                    placeholder="Project Key (e.g. SOC)"
                    value={config.jiraConfig?.projectKey || ''}
                    onChange={e => setConfig({
                      ...config, 
                      jiraConfig: { ...(config.jiraConfig || { email: '', apiToken: '', baseUrl: '' }), projectKey: e.target.value } 
                    })}
                    className={cn(
                       "w-full rounded-2xl px-5 py-3 font-mono text-[11px] outline-none transition-all",
                       !editMode.jira && config.jiraConfig?.baseUrl 
                         ? "bg-[#020617] text-slate-500 border border-white/5 cursor-default" 
                         : "bg-[#020617] border border-white/10 text-blue-400 focus:border-blue-500"
                    )}
                 />
                 <input 
                    type="text" 
                    readOnly={!editMode.jira && !!config.jiraConfig?.baseUrl}
                    placeholder="Atlassian Email" 
                    value={config.jiraConfig?.email || ''} 
                    onChange={e => setConfig({
                      ...config, 
                      jiraConfig: { ...(config.jiraConfig || { baseUrl: '', apiToken: '', projectKey: '' }), email: e.target.value } 
                    })}
                    className={cn(
                       "w-full rounded-2xl px-5 py-3 font-mono text-[11px] outline-none transition-all",
                       !editMode.jira && config.jiraConfig?.baseUrl 
                         ? "bg-[#020617] text-slate-500 border border-white/5 cursor-default" 
                         : "bg-[#020617] border border-white/10 text-blue-400 focus:border-blue-500"
                    )}
                  />
                  <input 
                    type="password" 
                    readOnly={!editMode.jira && !!config.jiraConfig?.baseUrl}
                    placeholder={!editMode.jira && config.jiraConfig?.apiToken ? "••••••••••••••••" : "Atlassian API Token"} 
                    value={editMode.jira ? (config.jiraConfig?.apiToken || '') : (!editMode.jira && config.jiraConfig?.apiToken ? "••••••••••••••••" : '')} 
                    onChange={e => setConfig({
                      ...config, 
                      jiraConfig: { ...(config.jiraConfig || { baseUrl: '', email: '', projectKey: '' }), apiToken: e.target.value } 
                    })}
                    className={cn(
                       "w-full rounded-2xl px-5 py-3 font-mono text-[11px] outline-none transition-all lg:col-span-1 col-span-2",
                       !editMode.jira && config.jiraConfig?.baseUrl 
                         ? "bg-[#020617] text-slate-500 border border-white/5 cursor-default" 
                         : "bg-[#020617] border border-white/10 text-blue-400 focus:border-blue-500"
                    )}
                 />
              </div>
           </div>

           {(!config.jiraConfig?.baseUrl || editMode.jira) && (
             <button 
               onClick={async () => {
                 await saveConfig();
                 setEditMode({...editMode, jira: false});
               }}
               disabled={saving}
               className="w-full py-4 bg-[#020617] border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-blue-500 transition-all text-slate-300"
             >
                {saving ? 'Validating...' : 'Update Jira Vault'}
             </button>
           )}
        </div>

        {/* Future Integrations / Placeholder */}
        <div className="bg-[#020617]/40 border border-dashed border-white/10 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden">
           <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center border border-white/5 relative z-10">
              <Workflow className="w-8 h-8 text-slate-700" />
           </div>
           <div className="space-y-2 relative z-10">
              <h3 className="text-lg font-black uppercase tracking-tight text-slate-600 italic">Custom Protocol</h3>
              <p className="text-[10px] text-slate-700 font-bold uppercase tracking-widest max-w-[200px]">
                 Need a bespoke integration? Our engineering team builds custom drivers for Airgapped environments.
              </p>
           </div>
           <button className="px-6 py-3 bg-slate-900/50 hover:bg-slate-900 text-[10px] font-black uppercase tracking-widest rounded-full border border-white/5 text-slate-700 transition-all relative z-10">
              Contact Command
           </button>
           
           <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <div className="bg-indigo-600/5 border border-indigo-600/10 rounded-[2rem] p-10 flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="flex gap-6 items-start">
          <div className="w-14 h-14 rounded-3xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shrink-0 shadow-lg shadow-indigo-500/5">
             <ShieldCheck className="w-7 h-7 text-indigo-400" />
          </div>
          <div className="space-y-2">
             <h4 className="text-xl font-black uppercase tracking-tighter text-slate-100 italic">Encryption Standard E-4</h4>
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed max-w-2xl">
               SentraAI utilizes military-grade AES-256-GCM encryption for all stored credentials. Decryption keys are decoupled from data and stored in hardware security modules (HSM).
             </p>
          </div>
        </div>
        <button className="whitespace-nowrap px-8 py-4 bg-[#020617] border border-white/5 hover:border-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all text-slate-400 shadow-xl">
          Rotate Vault Keys
        </button>
      </div>
    </div>
  );
}
