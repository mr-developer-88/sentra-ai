import { useState, useEffect } from 'react';
import axios from 'axios';
import { auth } from '../lib/firebase';
import { 
  Zap, 
  ShieldAlert, 
  Terminal, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  Activity,
  Server,
  Fingerprint
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ATTACK_SCENARIOS = [
  { 
    id: 'brute_force',
    label: 'Brute Force SSH', 
    description: 'Simulates high-velocity authentication failures targeted at edge infrastructure.',
    payload: { source: 'demo', attackType: 'Brute Force Authentication', severity: 4, ip: '192.168.1.100', service: 'ssh' },
    icon: Terminal
  },
  { 
    id: 'sql_injection',
    label: 'SQL Injection', 
    description: 'Anomalous URI patterns detected containing potential SQL escape sequences.',
    payload: { source: 'demo', attackType: 'SQL Injection Attempt', severity: 7, url: '/api/v1/auth?user=\' OR 1=1' },
    icon: Activity
  },
  { 
    id: 'ransomware',
    label: 'Ransomware Canary', 
    description: 'High entropy file modification detected in critical system directories.',
    payload: { source: 'demo', attackType: 'Possible Ransomware Encryption', severity: 9, file: 'id_rsa.enc', entropy: 0.99 },
    icon: ShieldAlert
  },
  { 
    id: 'exfiltration',
    label: 'Data Exfiltration', 
    description: 'Large outbound DNS tunneling activity detected from application servers.',
    payload: { source: 'demo', attackType: 'Data Exfiltration DNS Tunnel', severity: 10, target: 'ext-server.xyz', volume: '4.2GB' },
    icon: Zap
  }
];

export default function SimulatorPage() {
  const [simulating, setSimulating] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  const runSimulation = async (scenario: any) => {
    setSimulating(scenario.id);
    const logId = Math.random().toString(36).substring(7);
    const newLog = { id: logId, scenario: scenario.label, status: 'sending', timestamp: new Date() };
    setHistory(prev => [newLog, ...prev]);

    try {
      // Step 1: Alert Sent (Wait 500ms)
      await new Promise(r => setTimeout(r, 800));
      setHistory(prev => prev.map(l => l.id === logId ? { ...l, status: 'alert_sent' } : l));

      // Step 2: Incident Created (Call API)
      const response = await axios.post('/api/alerts/generic', {
        ...scenario.payload,
        userId: auth.currentUser?.uid
      });
      setHistory(prev => prev.map(l => l.id === logId ? { ...l, status: 'incident_created', remoteId: response.data.id } : l));

      // Step 3: Autopilot Check (Simulated UI state)
      await new Promise(r => setTimeout(r, 1200));
      setHistory(prev => prev.map(l => l.id === logId ? { ...l, status: 'autopilot_triggered' } : l));

    } catch (err) {
      setHistory(prev => prev.map(l => l.id === logId ? { ...l, status: 'failed' } : l));
    } finally {
      setSimulating(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-10">
      <div className="space-y-4 text-center max-w-3xl mx-auto">
        <h1 className="text-5xl font-black uppercase tracking-tighter italic">Attack <span className="text-rose-500">Forge</span> Simulator.</h1>
        <p className="text-slate-400 font-medium leading-relaxed">
          The Attack Forge allows security teams to simulate realistic threat vectors against the SentraAI pipeline. 
          All simulations use the <span className="text-indigo-400 font-black">PROD Pipeline</span> but are tagged as <span className="text-rose-500 font-black">DEMO</span>.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {ATTACK_SCENARIOS.map((scenario) => {
          const Icon = scenario.icon;
          return (
            <div 
              key={scenario.id} 
              className="bg-soc-panel border border-soc-border p-8 rounded-3xl space-y-6 hover:border-rose-500/30 transition-all group flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 bg-white/[0.02] border border-white/[0.05] rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-rose-500 transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-black uppercase tracking-tight text-white">{scenario.label}</h3>
                  <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase tracking-tighter">
                    {scenario.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => runSimulation(scenario)}
                disabled={!!simulating}
                className="w-full h-14 bg-[#020617] border border-rose-500/20 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50 disabled:grayscale"
              >
                {simulating === scenario.id ? 'Injecting Payload...' : 'Fire Handshake'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Fingerprint className="w-5 h-5 text-slate-500" />
          <h2 className="text-lg font-black uppercase tracking-tight italic">Forge History</h2>
        </div>

        <div className="bg-soc-panel border border-soc-border rounded-[32px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#020617]/80 border-b border-white/[0.05] text-slate-500 font-black text-[10px] uppercase tracking-[0.3em]">
                <tr>
                  <th className="px-10 py-6">Scenario</th>
                  <th className="px-10 py-6">Alert Sent</th>
                  <th className="px-10 py-6">Incident Rooted</th>
                  <th className="px-10 py-6">Autopilot Feedback</th>
                  <th className="px-10 py-6 text-right">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-10 py-20 text-center text-slate-700 text-xs font-black uppercase tracking-widest italic">
                      Forge is cold. No simulations logged.
                    </td>
                  </tr>
                ) : history.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-all">
                    <td className="px-10 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-white uppercase tracking-tight">{log.scenario}</span>
                        <span className="text-[9px] text-slate-600 font-mono font-bold tracking-widest">{log.timestamp.toLocaleTimeString()}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      {log.status === 'sending' ? (
                        <div className="w-4 h-4 border-2 border-t-rose-500 border-white/10 rounded-full animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      )}
                    </td>
                    <td className="px-10 py-6">
                      {['sending', 'alert_sent'].includes(log.status) ? (
                        <span className="text-[10px] font-black text-slate-700 animate-pulse tracking-widest uppercase italic">Injecting...</span>
                      ) : log.status === 'failed' ? (
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                      ) : (
                        <div className="flex items-center gap-2">
                           <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                           <span className="text-[10px] font-mono font-black text-slate-500">{log.remoteId?.substring(0, 10).toUpperCase()}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-10 py-6">
                       {log.status === 'autopilot_triggered' ? (
                         <div className="flex items-center gap-2">
                            <Zap className="w-3 h-3 text-amber-400" />
                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Active</span>
                         </div>
                       ) : log.status === 'failed' ? (
                         <span className="text-[10px] text-rose-500 font-bold uppercase">Aborted</span>
                       ) : (
                         <span className="text-[10px] text-slate-700 font-bold uppercase tracking-widest animate-pulse">Waiting...</span>
                       )}
                    </td>
                    <td className="px-10 py-6 text-right">
                       {log.remoteId && (
                         <a 
                           href={`/app/incidents/${log.remoteId}`}
                           className="text-[10px] font-black uppercase tracking-widest text-[#ff0055] hover:underline"
                         >
                           View Payload
                         </a>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
