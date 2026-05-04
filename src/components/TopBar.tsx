import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { User, Activity, Bell, Search, ChevronDown, CheckCheck, Inbox, Zap, Webhook, Ticket } from 'lucide-react';
import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  updateDoc, 
  doc, 
  writeBatch,
  getDoc
} from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { AppNotification } from '../types';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

export default function TopBar() {
  const [health, setHealth] = useState<any>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [settings, setSettings] = useState<any>({ autopilotMode: 'autopilot', minSeverity: 7 });
  const [config, setConfig] = useState<any>({});
  const navigate = useNavigate();
  
  useEffect(() => {
    axios.get('/api/health').then(res => setHealth(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Fetch settings and config
    getDoc(doc(db, 'settings', auth.currentUser.uid)).then(snap => {
      if (snap.exists()) setSettings(snap.data());
    }).catch(e => handleFirestoreError(e, OperationType.GET, `settings/${auth.currentUser?.uid}`));

    getDoc(doc(db, 'integrations', auth.currentUser.uid)).then(snap => {
      if (snap.exists()) setConfig(snap.data());
    }).catch(e => handleFirestoreError(e, OperationType.GET, `integrations/${auth.currentUser?.uid}`));

    const q = query(
      collection(db, 'notifications', auth.currentUser.uid, 'items'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));
      setNotifications(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `notifications/${auth.currentUser?.uid}/items`);
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = async () => {
    if (!auth.currentUser) return;
    const path = `notifications/${auth.currentUser.uid}/items`;
    try {
      const batch = writeBatch(db);
      notifications.forEach(n => {
        if (!n.read) {
          const ref = doc(db, 'notifications', auth.currentUser!.uid, 'items', n.id);
          batch.update(ref, { read: true });
        }
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const markAsRead = async (id: string) => {
    if (!auth.currentUser) return;
    const path = `notifications/${auth.currentUser.uid}/items/${id}`;
    try {
      const ref = doc(db, 'notifications', auth.currentUser.uid, 'items', id);
      await updateDoc(ref, { read: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  return (
    <header className="h-16 border-b border-soc-border bg-soc-panel/50 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/app/settings')}>
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/20 transition-all">
            <Zap className={`w-4 h-4 ${settings.autopilotMode === 'autopilot' ? 'text-indigo-400' : 'text-slate-500'}`} />
          </div>
          <div className="text-xs">
             <div className="flex items-center gap-2">
                <p className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Autopilot</p>
                <span className="text-[9px] font-mono text-slate-600 bg-slate-900 px-1.5 py-0.5 rounded border border-white/5">
                   &ge;{settings.minSeverity}/10
                </span>
             </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${settings.autopilotMode === 'autopilot' ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
              <span className={`font-black tracking-tight text-[11px] ${settings.autopilotMode === 'autopilot' ? 'text-emerald-500' : 'text-slate-500'}`}>
                 {settings.autopilotMode === 'autopilot' ? 'ACTIVE' : 'ADVISORY ONLY'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="h-8 w-px bg-soc-border mx-2" />
        
        <div className="flex items-center gap-3" onClick={() => navigate('/app/integrations')}>
           <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${config.slackWebhook ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-900 border-white/5 text-slate-600'} cursor-pointer hover:bg-slate-800 transition-colors`}>
              <Webhook className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold tracking-widest uppercase">Slack</span>
           </div>
           <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${config.jiraConfig?.baseUrl ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-slate-900 border-white/5 text-slate-600'} cursor-pointer hover:bg-slate-800 transition-colors`}>
              <Ticket className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold tracking-widest uppercase">Jira</span>
           </div>
        </div>

        <div className="hidden lg:flex items-center gap-2 bg-slate-900/50 border border-soc-border rounded-lg px-3 py-1.5 w-64 group focus-within:border-indigo-500/50 transition-all ml-4">
          <Search className="w-3.5 h-3.5 text-slate-500 group-focus-within:text-indigo-400" />
          <input 
            type="text" 
            placeholder="Search incidents, IOCs..." 
            className="bg-transparent border-none outline-none text-[11px] text-slate-300 w-full placeholder:text-slate-600"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button 
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 transition-all group"
          >
            <Bell className={`w-4.5 h-4.5 transition-colors ${showNotifs ? 'text-indigo-400' : 'text-slate-400'}`} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-rose-500 text-[10px] font-black text-white rounded-full border-2 border-[#121626] flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute top-12 right-0 w-[400px] bg-soc-panel border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <h3 className="text-[11px] font-black uppercase tracking-widest italic text-slate-400">Signal Intelligence</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[9px] font-black uppercase text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors"
                  >
                    <CheckCheck className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-[480px] overflow-y-auto divide-y divide-white/[0.03] custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center gap-3">
                    <Inbox className="w-8 h-8 text-slate-700" />
                    <p className="text-[10px] font-black uppercase text-slate-600 tracking-widest italic">Static silence in the matrix.</p>
                  </div>
                ) : notifications.map(n => (
                  <div 
                    key={n.id} 
                    onClick={() => {
                      markAsRead(n.id);
                      if (n.incidentId) navigate(`/app/incidents/${n.incidentId}`);
                      setShowNotifs(false);
                    }}
                    className={`p-5 hover:bg-white/[0.04] transition-all cursor-pointer flex gap-4 ${!n.read ? 'bg-indigo-500/[0.03]' : ''}`}
                  >
                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!n.read ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-slate-800'}`} />
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className={`text-[11px] font-black uppercase tracking-tight ${!n.read ? 'text-white' : 'text-slate-500'}`}>{n.title}</p>
                        <p className="text-[9px] text-slate-600 font-mono italic">
                          {n.createdAt && formatDistanceToNow(n.createdAt.toDate(), { addSuffix: true })}
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-bold lowercase tracking-tight italic">
                        {n.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Link 
                to="/app/dashboard" 
                onClick={() => setShowNotifs(false)}
                className="block p-4 text-center border-t border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-400 hover:bg-white/[0.02] transition-all"
              >
                View Tactical Matrix
              </Link>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-soc-border mx-1" />

        <div className="flex items-center gap-3 pl-2 group cursor-pointer hover:bg-white/[0.02] p-1.5 rounded-xl transition-colors">
          <div className="text-right hidden sm:block">
            <p className="text-[11px] font-black text-slate-200 uppercase tracking-tight italic">{auth.currentUser?.email?.split('@')[0] || 'Operator'}</p>
            <p className="text-[10px] text-slate-600 lowercase font-mono">{auth.currentUser?.email || ''}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600/50 to-rose-500/50 p-px">
            <div className="w-full h-full rounded-[11px] bg-soc-panel flex items-center justify-center overflow-hidden">
               {auth.currentUser?.photoURL ? (
                 <img src={auth.currentUser.photoURL} alt="profile" />
               ) : (
                 <User className="w-4 h-4 text-white" />
               )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
