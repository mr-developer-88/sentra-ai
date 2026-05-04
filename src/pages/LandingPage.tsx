import { 
  Shield, 
  Zap, 
  Activity, 
  Globe, 
  Lock, 
  CheckCircle, 
  ArrowRight, 
  Cpu, 
  Target, 
  Database, 
  Network,
  Instagram,
  Linkedin,
  Github,
  Mail,
  ZapOff,
  Scale,
  Rocket
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export default function LandingPage() {
  return (
    <div className="bg-soc-bg text-slate-100 min-h-screen font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/[0.03] bg-soc-bg/80 backdrop-blur-xl px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tighter leading-none">SentraAI</span>
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none mt-1">Autonomous Systems</span>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-10 text-[11px] font-black uppercase tracking-widest text-slate-500">
          <a href="#product" className="hover:text-indigo-400 transition-colors">The Problem</a>
          <a href="#how" className="hover:text-amber-400 transition-colors">Our Protocol</a>
          <a href="#roadmap" className="hover:text-emerald-400 transition-colors">Future roadmap</a>
          <a href="#compliance" className="hover:text-rose-400 transition-colors">Security</a>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Login</Link>
          <Link to="/login" className="bg-white text-black px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all shadow-xl shadow-white/5">
            Deploy SOC
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 md:pt-44 md:pb-32 px-4 md:px-8 overflow-hidden border-b border-white/[0.03]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_40%,rgba(79,70,229,0.15),transparent_50%)] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative">
          <div className="flex flex-col items-center text-center space-y-8 md:space-y-12">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 rounded-full"
            >
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Next-Gen SOC Autopilot v2.0 Live</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "circOut" }}
              className="text-4xl md:text-6xl lg:text-8xl font-black tracking-[-0.04em] leading-[0.9] uppercase"
            >
              The AI <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 italic">Autopilot</span> <br />
              for SOC.
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-base md:text-xl text-slate-500 max-w-2xl mx-auto font-medium px-4"
            >
              Kill alert fatigue. Automate your security analysis pipeline with our agentic SOC autopilot. Detect, triage, and respond in sub-second cycles.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center gap-6 pt-8"
            >
              <Link to="/login" className="px-10 py-5 bg-indigo-600 rounded-2xl flex items-center gap-4 group hover:bg-indigo-500 transition-all shadow-2xl shadow-indigo-600/20">
                <span className="text-[13px] font-black uppercase tracking-widest">Initiate Deployment</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <div className="flex -space-x-3 items-center">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-soc-bg bg-slate-800 flex items-center justify-center text-[10px] font-bold overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i+10}`} alt="avatar" />
                  </div>
                ))}
                <span className="pl-6 text-xs text-slate-500 font-bold tracking-tight">Joined by 400+ SecOps Engineers</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="py-12 border-b border-white/[0.03] bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { label: 'Alerts Processed', val: '4.2M+' },
            { label: 'MTTR Reduction', val: '92%' },
            { label: 'Autopilot Actions', val: '1.8M+' },
            { label: 'Critical Saved', val: '12k' }
          ].map((s, i) => (
            <div key={i} className="flex flex-col items-center lg:items-start">
              <span className="text-3xl font-black font-mono tracking-tighter text-white">{s.val}</span>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-1">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* The Problem Section */}
      <section id="product" className="py-32 px-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
          <div className="space-y-12">
            <div className="space-y-4">
              <span className="text-rose-500 text-xs font-black uppercase tracking-[0.3em]">The Crisis</span>
              <h2 className="text-5xl font-black uppercase tracking-tight leading-none">Alert Fatigue <br /> is Killing SOC.</h2>
              <p className="text-slate-500 text-lg">Traditional SOC tools just throw more noise at humans. We built the missing layer of autonomous logic.</p>
            </div>
            
            <div className="grid gap-6">
              {[
                { title: '10,000+ Daily Alerts', desc: 'Humans cannot scale at the speed of modern threat actors.', icon: ZapOff },
                { title: '4.5hr Triage Time', desc: 'Manual investigation is the bottleneck of your security posture.', icon: Scale },
                { title: '44% Alerts Ignored', desc: 'Critical indicators are buried under thousands of false positives.', icon: Activity }
              ].map((item, i) => (
                <div key={i} className="flex gap-6 items-start group">
                  <div className="w-12 h-12 rounded-xl bg-rose-500/5 flex items-center justify-center border border-rose-500/10 group-hover:bg-rose-500/10 transition-colors">
                    <item.icon className="w-5 h-5 text-rose-500" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black uppercase tracking-tight text-sm text-slate-200">{item.title}</h4>
                    <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative group">
            <div className="absolute -inset-4 bg-indigo-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-soc-panel border border-soc-border rounded-3xl p-8 shadow-2xl overflow-hidden">
               <div className="flex items-center justify-between mb-6">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500/30" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/30" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/30" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-700">security_protocol_v4.py</span>
               </div>
               <pre className="font-mono text-xs text-slate-400 space-y-2 leading-relaxed">
                 <code className="block text-indigo-400"># Initiating Autonomous Analysis...</code>
                 <code className="block text-emerald-400">GET /api/alerts/wazuh_39921_beta</code>
                 <code className="block text-white">TRIAGE_SCORE: 9.8 [CRITICAL]</code>
                 <code className="block text-rose-500">THREAT: Brute force detected on ::8821</code>
                 <code className="block text-white">REMEDIATION: Initiating Firewall Block...</code>
                 <code className="block text-emerald-500">STATUS: INCIDENT_RESOLVED_BY_AI</code>
               </pre>
               <div className="mt-8 pt-8 border-t border-white/[0.03]">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                       <Cpu className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Confidence Level</p>
                       <div className="h-1.5 w-44 bg-slate-800 rounded-full mt-2 overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            whileInView={{ width: '98%' }}
                            className="h-full bg-indigo-500" 
                          />
                       </div>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how" className="py-32 px-8 bg-white/[0.01] border-y border-white/[0.03]">
        <div className="max-w-7xl mx-auto text-center mb-24 space-y-6">
          <span className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-500">The Sentra Protocol</span>
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic">From Detection to Resolution.</h2>
        </div>

        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-1">
          {[
            { title: 'Detect', desc: 'Securely ingest signals from Wazuh, Cloudflare, EDR, or any webhook.', icon: Network, color: 'bg-indigo-500' },
            { title: 'Analyze', desc: 'Gemini reasoning models extract IOCs and map MITRE techniques in real-time.', icon: Target, color: 'bg-amber-500' },
            { title: 'Act', desc: 'Autopilot executes resolution workflows (Slack, Jira, Firewall, SSO).', icon: Zap, color: 'bg-rose-500' },
            { title: 'Audit', desc: 'Every AI deliberation is logged for full compliance and SOC oversight.', icon: Database, color: 'bg-emerald-500' }
          ].map((item, i) => (
            <div key={i} className="group relative bg-soc-panel p-10 border border-soc-border hover:bg-slate-900/50 transition-all overflow-hidden lg:h-[400px] flex flex-col justify-end">
              <div className={`absolute top-10 left-10 w-12 h-12 rounded-2xl ${item.color}/10 flex items-center justify-center border border-${item.color}/20 group-hover:scale-110 transition-transform`}>
                 <item.icon className={`w-6 h-6 ${item.color.replace('bg-', 'text-')}`} />
              </div>
              <div className="space-y-4 relative z-10">
                <span className="text-[10px] font-black font-mono text-slate-700">STEP 0{i+1}</span>
                <h3 className="text-2xl font-black uppercase tracking-tight">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Future Roadmap Section */}
      <section id="roadmap" className="py-32 px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-16 items-start">
            <div className="lg:w-1/3 space-y-6 lg:sticky lg:top-32">
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                <Rocket className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Future Protocol</span>
              </div>
              <h2 className="text-5xl font-black uppercase tracking-tight italic">The Sentra Roadmap.</h2>
              <p className="text-slate-500 text-lg leading-relaxed">We are building the future of autonomous defense. Here is where the platform is headed in 2026.</p>
              <button className="px-8 py-4 border border-white/10 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-white/[0.03] transition-colors">Download Roadmap PDF</button>
            </div>
            
            <div className="lg:w-2/3 grid sm:grid-cols-2 gap-4">
              {[
                { title: 'Automated IP Blocking', desc: 'Direct integration with Cloudflare and AWS WAF for sub-second containment.', icon: Shield },
                { title: 'Threat Intel Sync', desc: 'Auto-enrichment via VirusTotal, AbuseIPDB, and private TI feeds.', icon: Activity },
                { title: 'SOAR Playbooks', desc: 'Custom visual workflow builder for complex enterprise response logic.', icon: Cpu },
                { title: 'Multi-Org SOC', desc: 'Unified dashboard for MSSPs managing thousands of diverse environments.', icon: Globe },
                { title: 'Automated Reporting', desc: 'One-click ISO 27001 / SOC2 compliant incident reporting PDFs.', icon: Database }
              ].map((r, i) => (
                <div key={i} className="p-8 bg-soc-panel border border-soc-border rounded-2xl hover:border-indigo-500/30 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-white/[0.02] flex items-center justify-center mb-6 group-hover:bg-indigo-500/10 transition-colors">
                    <r.icon className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                  </div>
                  <h4 className="font-black uppercase tracking-tight text-sm text-slate-200 mb-2">{r.title}</h4>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{r.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="compliance" className="py-24 border-t border-white/[0.03] bg-indigo-600">
        <div className="max-w-7xl mx-auto px-8 flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="text-center lg:text-left space-y-4">
             <h3 className="text-3xl font-black uppercase tracking-tight text-white italic">Enterprise Grade Security & Compliance.</h3>
             <p className="text-indigo-100 font-medium">Your data stays your data. We support SOC2 Type II, ISO 27001, and HIPAA compliance.</p>
          </div>
          <div className="flex gap-8 items-center flex-wrap justify-center">
             {['SOC2 Type II', 'ISO 27001', 'HIPAA', 'GDPR'].map(c => (
               <div key={c} className="px-6 py-2 border border-white/20 rounded-full text-[11px] font-black uppercase tracking-widest text-white">{c}</div>
             ))}
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-32 px-8 text-center bg-soc-bg border-t border-white/[0.03]">
        <div className="max-w-4xl mx-auto space-y-12">
           <h3 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-[0.95]">Ready to <br /> Upgrade your <br /> Security Posture?</h3>
           <Link to="/login" className="inline-flex px-12 py-6 bg-white text-black rounded-2xl text-lg font-black uppercase tracking-widest shadow-2xl shadow-indigo-500/10 hover:scale-105 active:scale-95 transition-transform">Get Started for Free</Link>
           <p className="text-slate-500 text-xs font-bold tracking-widest uppercase">No Credit Card Required | Unlimited Ingestion</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/[0.03] px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-500" />
              <span className="font-black tracking-tighter uppercase">SentraAI</span>
            </div>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Autonomous Defense Systems</p>
          </div>
          
          <div className="flex items-center gap-8">
             <a href="https://www.github.com/mr-developer-88" target="_blank" className="text-slate-600 hover:text-white transition-colors" rel="noreferrer"><Github className="w-5 h-5" /></a>
             <a href="https://www.linkedin.com/in/mrasim88" target="_blank" className="text-slate-600 hover:text-white transition-colors" rel="noreferrer"><Linkedin className="w-5 h-5" /></a>
             <a href="https://instagram.com/mrasim884" target="_blank" className="text-slate-600 hover:text-white transition-colors" rel="noreferrer"><Instagram className="w-5 h-5" /></a>
             <a href="mailto:understood776@gmail.com" className="text-slate-600 hover:text-white transition-colors"><Mail className="w-5 h-5" /></a>
          </div>

          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Made by <span className="text-slate-400">MRASIM88</span> Core Engineering</p>
        </div>
        <div className="text-center mt-12 opacity-20 flex items-center justify-center gap-2">
           <div className="w-1 h-1 bg-white rounded-full" />
           <p className="text-[9px] font-black uppercase tracking-[0.5em]">Global Defense Mesh Active</p>
           <div className="w-1 h-1 bg-white rounded-full" />
        </div>
      </footer>
    </div>
  );
}
