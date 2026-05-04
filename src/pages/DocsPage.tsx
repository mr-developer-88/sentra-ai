import { FileText, Terminal, Zap, Shield, Plug, ArrowLeft, Github, Linkedin, Instagram, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DocsPage() {
  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen">
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
           <Link to="/" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-bold text-slate-400">Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            <span className="text-lg font-bold tracking-tight">SentraAI Documentation</span>
          </div>
          <div className="text-xs font-mono text-slate-600">v2.0.4 - STABLE</div>
        </div>
      </nav>

      <main className="pt-24 pb-20 px-6 max-w-4xl mx-auto space-y-16">
        <section className="space-y-4">
           <h1 className="text-4xl font-bold tracking-tight">Getting Started</h1>
           <p className="text-slate-400 leading-relaxed">
             SentraAI is an autonomous SOC autopilot designed to augment security teams by handling the heavy lifting of incident triage and response.
           </p>
        </section>

        <section className="space-y-6">
           <div className="flex items-center gap-3">
             <Terminal className="w-6 h-6 text-indigo-500" />
             <h2 className="text-2xl font-bold">Webhook Integration</h2>
           </div>
           <p className="text-slate-400">
             Connect your SIEM or EDR by sending raw alerts to your unique intake endpoint.
           </p>
           <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Endpoint Structure</h4>
              <code className="block bg-slate-950 p-4 rounded-xl text-indigo-400 font-mono text-sm break-all">
                POST https://your-instance.run.app/api/alerts/generic
              </code>
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 pt-4">Sample Wazuh JSON Payload</h4>
              <pre className="bg-slate-950 p-4 rounded-xl text-emerald-500 font-mono text-xs overflow-x-auto leading-relaxed">
{`{
  "timestamp": "2024-05-01T12:00:00Z",
  "rule": {
    "level": 12,
    "description": "SSH Brute Force Attempt",
    "mitre": { "id": ["T1110"] }
  },
  "agent": { "name": "prod-server-01" },
  "data": { "srcip": "1.2.3.4" }
}`}
              </pre>
           </div>
        </section>

        <section className="space-y-6">
           <div className="flex items-center gap-3">
             <Zap className="w-6 h-6 text-amber-500" />
             <h2 className="text-2xl font-bold">How Autopilot Works</h2>
           </div>
           <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-3">
                 <h4 className="font-bold text-slate-200">1. Real-time Triage</h4>
                 <p className="text-sm text-slate-500 leading-relaxed">
                   When an alert hits our endpoint, Gemini AI analyzes the raw logs, context, and historical data to categorize the threat.
                 </p>
              </div>
              <div className="space-y-3">
                 <h4 className="font-bold text-slate-200">2. Severity Scoring</h4>
                 <p className="text-sm text-slate-500 leading-relaxed">
                   AI assigns a score (1-10) based on impact and likelihood. Critical events ({'>'}8) trigger immediate escalation.
                 </p>
              </div>
              <div className="space-y-3">
                 <h4 className="font-bold text-slate-200">3. Decision Engine</h4>
                 <p className="text-sm text-slate-500 leading-relaxed">
                   If "Autopilot Mode" is active, SentraAI executes pre-configured actions like blocking IPs or notifying on-call analysts.
                 </p>
              </div>
              <div className="space-y-3">
                 <h4 className="font-bold text-slate-200">4. Human in the Loop</h4>
                 <p className="text-sm text-slate-500 leading-relaxed">
                   Every decision is logged. Analysts can override autopilot at any time, and the AI learns from these corrections.
                 </p>
              </div>
           </div>
        </section>

         <section className="space-y-6">
           <div className="flex items-center gap-3">
             <Shield className="w-6 h-6 text-emerald-500" />
             <h2 className="text-2xl font-bold">Deployment Checklist</h2>
           </div>
           <p className="text-slate-400">
             Before going into production, ensure the following systems are configured and verified:
           </p>
           <ul className="bg-slate-900 border border-white/5 rounded-2xl p-6 space-y-4">
             <li className="flex items-center gap-3">
               <input type="checkbox" checked readOnly className="w-4 h-4 accent-emerald-500" />
               <span className="text-sm text-slate-300">Firebase Firestore enabled and connected</span>
             </li>
             <li className="flex items-center gap-3">
               <input type="checkbox" checked readOnly className="w-4 h-4 accent-emerald-500" />
               <span className="text-sm text-slate-300">Gemini Cloud API credentials configured under Settings</span>
             </li>
             <li className="flex items-center gap-3">
               <input type="checkbox" className="w-4 h-4" disabled />
               <span className="text-sm text-slate-300 w-full flex justify-between">Slack Webhook URL configured <Link to="/app/integrations" className="text-indigo-400 hover:underline">Configure</Link></span>
             </li>
             <li className="flex items-center gap-3">
               <input type="checkbox" className="w-4 h-4" disabled />
               <span className="text-sm text-slate-300 w-full flex justify-between">Jira Cloud API Token & Email configured <Link to="/app/integrations" className="text-indigo-400 hover:underline">Configure</Link></span>
             </li>
             <li className="flex items-center gap-3">
               <input type="checkbox" className="w-4 h-4" disabled />
               <span className="text-sm text-slate-300 w-full flex justify-between">Wazuh Manager `ossec.conf` updated with Webhook URL <Link to="/app/integrations" className="text-indigo-400 hover:underline">Configure</Link></span>
             </li>
           </ul>
        </section>

        <section className="bg-indigo-600 rounded-3xl p-12 text-center space-y-6">
           <Shield className="w-12 h-12 text-white mx-auto" />
           <h2 className="text-3xl font-bold text-white">Ready to secure your stack?</h2>
           <p className="text-indigo-100 max-w-lg mx-auto">
             Join 500+ enterprises using SentraAI to reduce their MTTR by 92%.
           </p>
           <Link to="/login" className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-xl font-bold hover:bg-slate-100 transition-all">
             Start Free Trial
           </Link>
        </section>

        <footer className="pt-20 border-t border-white/5 text-center text-slate-600 text-xs flex flex-col items-center gap-4">
          <div className="flex items-center gap-6">
             <a href="https://www.github.com/mr-developer-88" target="_blank" className="hover:text-white transition-colors" rel="noreferrer"><Github className="w-4 h-4" /></a>
             <a href="https://www.linkedin.com/in/mrasim88" target="_blank" className="hover:text-white transition-colors" rel="noreferrer"><Linkedin className="w-4 h-4" /></a>
             <a href="https://instagram.com/mrasim884" target="_blank" className="hover:text-white transition-colors" rel="noreferrer"><Instagram className="w-4 h-4" /></a>
             <a href="mailto:understood776@gmail.com" className="hover:text-white transition-colors"><Mail className="w-4 h-4" /></a>
          </div>
          <p>© 2026 SentraAI Security. Designed for mission-critical operations.</p>
        </footer>
      </main>
    </div>
  );
}
