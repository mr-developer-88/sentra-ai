import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShieldAlert, 
  Settings, 
  Plug, 
  FileText, 
  LogOut,
  ShieldCheck,
  Terminal,
  Activity,
  History,
  Github,
  Linkedin,
  Instagram,
  Mail
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/app/dashboard' },
  { icon: ShieldAlert, label: 'All Incidents', path: '/app/dashboard' }, 
  { icon: Terminal, label: 'Signal Simulation', path: '/app/simulator' },
];

const configItems = [
  { icon: Plug, label: 'Integrations', path: '/app/integrations' },
  { icon: FileText, label: 'Docs', path: '/docs' },
  { icon: Settings, label: 'Settings', path: '/app/settings' },
];

export default function Sidebar() {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <aside className="w-64 border-r border-soc-border bg-soc-panel flex flex-col z-50">
      <div className="h-16 px-6 flex items-center gap-3 border-b border-soc-border">
        <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-base tracking-tight text-white">SentraAI</h1>
          <p className="text-[9px] uppercase tracking-widest text-indigo-400 font-black -mt-1">SOC AUTOPILOT</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-8">
        <div>
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Core Monitor</p>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.path}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 text-xs font-semibold group relative overflow-hidden",
                  isActive 
                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] hover:translate-x-1"
                )}
              >
                {({ isActive }) => (
                  <>
                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-indigo-500 rounded-r-full" />}
                    <item.icon className={cn(
                      "w-4 h-4 transition-all duration-300",
                      isActive ? "text-indigo-400 scale-110" : "group-hover:text-indigo-400 group-hover:scale-110"
                    )} />
                    {item.label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        <div>
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">System Logic</p>
          <nav className="space-y-1">
            {configItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.path}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 text-xs font-semibold group relative overflow-hidden",
                  isActive 
                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)] ml-0" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] hover:translate-x-1"
                )}
              >
                {({ isActive }) => (
                  <>
                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-indigo-500 rounded-r-full" />}
                    <item.icon className={cn(
                      "w-4 h-4 transition-all duration-300",
                      isActive ? "text-indigo-400 scale-110" : "group-hover:text-indigo-400 group-hover:scale-110"
                    )} />
                    {item.label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-soc-border space-y-4">
        <div className="flex items-center justify-center gap-4 py-2 opacity-50 hover:opacity-100 transition-opacity">
          <a href="https://www.github.com/mr-developer-88" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
            <Github className="w-4 h-4" />
          </a>
          <a href="https://www.linkedin.com/in/mrasim88" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
            <Linkedin className="w-4 h-4" />
          </a>
          <a href="https://instagram.com/mrasim884" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
            <Instagram className="w-4 h-4" />
          </a>
          <a href="mailto:understood776@gmail.com" className="text-slate-400 hover:text-white transition-colors">
            <Mail className="w-4 h-4" />
          </a>
        </div>

        <div className="bg-slate-900/50 rounded-xl p-3 border border-soc-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider italic">Org Cluster</span>
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
          </div>
          <p className="text-[11px] font-mono text-indigo-300 font-bold tracking-tight truncate">SENTRA-CLOUD-ALPHA</p>
        </div>

        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:text-rose-400 hover:bg-rose-400/5 transition-all group"
        >
          <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          Terminate Session
        </button>
      </div>
    </aside>
  );
}
